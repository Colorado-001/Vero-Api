import {
  PublicClient,
  WatchBlocksReturnType,
  Withdrawal,
  formatEther,
} from "viem";
import util from "util";
import { BlockchainAddress } from "../../types/blockchain";
import winston from "winston";
import { Env } from "../../config/env";
import createLogger from "../../logging/logger.config";

interface IWallet {
  address: BlockchainAddress;
  lastBalance: bigint;
  lastChecked: bigint;
}

interface IBlock {
  number: bigint;
  nonce: `0x${string}`;
  hash: `0x${string}`;
  logsBloom: `0x${string}`;
  baseFeePerGas: bigint | null;
  blobGasUsed: bigint;
  difficulty: bigint;
  excessBlobGas: bigint;
  extraData: `0x${string}`;
  gasLimit: bigint;
  gasUsed: bigint;
  miner: `0x${string}`;
  mixHash: `0x${string}`;
  parentBeaconBlockRoot?: `0x${string}` | undefined;
  parentHash: `0x${string}`;
  receiptsRoot: `0x${string}`;
  sealFields: `0x${string}`[];
  sha3Uncles: `0x${string}`;
  size: bigint;
  stateRoot: `0x${string}`;
  timestamp: bigint;
  totalDifficulty: bigint | null;
  transactionsRoot: `0x${string}`;
  uncles: `0x${string}`[];
  withdrawals?: Withdrawal[] | undefined;
  withdrawalsRoot?: `0x${string}` | undefined;
  transactions: `0x${string}`[];
}

class RateLimiter {
  private readonly logger: winston.Logger;
  private maxRequests: number;
  private perSeconds: number;
  private requests: number[];

  constructor(config: Env, maxRequests = 20, perSeconds = 1) {
    this.logger = createLogger("RateLimiter", config);
    this.maxRequests = maxRequests; // Stay under 25/sec limit
    this.perSeconds = perSeconds;
    this.requests = [];
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.perSeconds * 1000;

    // Remove old requests outside the window
    this.requests = this.requests.filter((time) => time > windowStart);

    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + this.perSeconds * 1000 - now + 100; // +100ms buffer

      if (waitTime > 0) {
        // this.logger.debug(`⏱️  Rate limit: waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }

    // Record this request
    this.requests.push(now);
  }
}

class BalanceChangeListener {
  private readonly logger: winston.Logger;
  private wallets: Map<BlockchainAddress, IWallet>;
  private isRunning: boolean;
  private unwatch: WatchBlocksReturnType | undefined = undefined;

  constructor(
    private readonly publicClient: PublicClient,
    private readonly rateLimiter: RateLimiter,
    config: Env,
    userWalletAddresses: BlockchainAddress[]
  ) {
    this.wallets = new Map();
    this.logger = createLogger("BalanceChangeListener", config);

    // Initialize with wallet addresses and their last known balances
    userWalletAddresses.forEach((addr) => {
      this.wallets.set(addr, {
        address: addr,
        lastBalance: BigInt(0),
        lastChecked: BigInt(0),
      });
    });

    this.isRunning = false;
  }

  addWallet(address: BlockchainAddress) {
    this.wallets.set(address, {
      address,
      lastBalance: BigInt(0),
      lastChecked: BigInt(0),
    });
    this.logger.info(`✅ Now monitoring: ${address}`);
  }

  removeWallet(address: BlockchainAddress) {
    this.wallets.delete(address);
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initialize balances
    await this.initializeBalances();

    console.log("🎧 Started monitoring balance changes...");

    // Watch for new blocks
    this.unwatch = this.publicClient.watchBlocks({
      onBlock: async (block) => {
        await this.checkBalanceChanges(block);
      },
      pollingInterval: 10000,
    });
  }

  stop() {
    if (this.unwatch) {
      this.unwatch();
      this.isRunning = false;
      console.log("⏹️  Stopped monitoring");
    }
  }

  async initializeBalances() {
    this.logger.info("📊 Initializing wallet balances...");

    for (const [address, wallet] of this.wallets) {
      await this.rateLimiter.waitForSlot();

      const balance = await this.publicClient.getBalance({
        address: wallet.address,
      });

      wallet.lastBalance = balance;
      wallet.lastChecked = await this.publicClient.getBlockNumber();

      this.logger.debug(`  ${address}: ${formatEther(balance)} MON`);
    }
  }

  async checkBalanceChanges(block: IBlock) {
    for (const [address, wallet] of this.wallets) {
      try {
        await this.rateLimiter.waitForSlot();

        const currentBalance = await this.publicClient.getBalance({
          address: wallet.address,
          blockNumber: block.number,
        });

        // Check if balance increased (incoming transfer)
        if (currentBalance > wallet.lastBalance) {
          const amountReceived = currentBalance - wallet.lastBalance;

          this.logger.debug("💰 Incoming transfer detected!", {
            wallet: address,
            amount: formatEther(amountReceived),
            previousBalance: formatEther(wallet.lastBalance),
            newBalance: formatEther(currentBalance),
            blockNumber: block.number.toString(),
          });

          // Try to find the transaction that caused this change
          await this.findTransferTransaction(
            wallet.address,
            block,
            amountReceived
          );

          // Update last balance
          wallet.lastBalance = currentBalance;
        } else if (currentBalance !== wallet.lastBalance) {
          // Balance decreased (outgoing transfer)
          wallet.lastBalance = currentBalance;
        }

        wallet.lastChecked = block.number;
      } catch (error: any) {
        this.logger.error(
          `Error checking balance for ${address}:`,
          error.message
        );
      }
    }
  }

  async findTransferTransaction(
    walletAddress: BlockchainAddress,
    block: IBlock,
    expectedAmount: bigint
  ) {
    try {
      await this.rateLimiter.waitForSlot();

      // Get all transactions in the block
      const blockData = await this.publicClient.getBlock({
        blockNumber: block.number,
        includeTransactions: true,
      });

      // Look for transactions TO this wallet
      for (const tx of blockData.transactions) {
        if (tx.to && tx.to.toLowerCase() === walletAddress.toLowerCase()) {
          // Check if the value matches
          if (tx.value === expectedAmount) {
            this.logger.debug("📍 Found transaction:", {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: formatEther(tx.value),
            });

            await this.notifyIncomingTransfer({
              transactionHash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              valueEth: formatEther(tx.value),
              blockNumber: block.number.toString(),
              timestamp: block.timestamp.toString(),
              type: "direct",
            });

            return;
          }
        }
      }

      // If we didn't find a direct transaction, it's likely internal
      this.logger.info(
        "📍 Transfer likely internal (no direct transaction found)"
      );

      await this.notifyIncomingTransfer({
        transactionHash: null, // Unknown which tx caused it
        from: "unknown",
        to: walletAddress,
        value: expectedAmount.toString(),
        valueEth: formatEther(expectedAmount),
        blockNumber: block.number.toString(),
        timestamp: block.timestamp.toString(),
        type: "internal",
      });
    } catch (error: any) {
      console.error("Error finding transaction:", error.message);
    }
  }

  async notifyIncomingTransfer(transfer: any) {
    this.logger.info(`Incoming Transfer ${util.inspect(transfer, false, 5)}`);
    // try {
    //   await fetch("http://localhost:3000/api/internal/transfer-received", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({
    //       event: "incoming_transfer",
    //       ...transfer,
    //     }),
    //   });
    // } catch (error) {
    //   console.error("Failed to notify system:", error);
    // }
  }
}

class TransactionMonitor {
  private readonly logger: winston.Logger;
  private wallets: Set<BlockchainAddress>;
  private processedTxs: Set<string>;
  private isRunning: boolean;
  private unwatch: WatchBlocksReturnType | undefined = undefined;

  constructor(
    private readonly publicClient: PublicClient,
    private readonly rateLimiter: RateLimiter,
    config: Env,
    userWalletAddresses: BlockchainAddress[]
  ) {
    this.wallets = new Set(userWalletAddresses);
    this.logger = createLogger("TransactionMonitor", config);

    this.processedTxs = new Set();
    this.isRunning = false;
  }

  addWallet(address: BlockchainAddress) {
    this.wallets.add(address);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.logger.info("🎧 Started monitoring transactions...");

    this.unwatch = this.publicClient.watchBlocks({
      onBlock: async (block) => {
        await this.processBlock(block);
      },
      pollingInterval: 10000,
    });
  }

  stop() {
    if (this.unwatch) {
      this.unwatch();
      this.isRunning = false;
    }
  }

  async processBlock(block: IBlock) {
    try {
      await this.rateLimiter.waitForSlot();

      const blockData = await this.publicClient.getBlock({
        blockNumber: block.number,
        includeTransactions: true,
      });

      for (const tx of blockData.transactions) {
        // Skip if already processed
        if (this.processedTxs.has(tx.hash)) continue;

        // Check if transaction involves any of our wallets
        const toAddress = tx.to;

        if (toAddress && this.wallets.has(toAddress)) {
          // Direct transfer to our wallet
          await this.handleDirectTransfer(tx, block);
          this.processedTxs.add(tx.hash);
        } else {
          // Check if this transaction might have internal transfers
          // by looking at receipts and balance changes
          await this.checkForInternalTransfers(tx, block);
          this.processedTxs.add(tx.hash);
        }
      }

      // Clean up old processed txs (keep last 1000)
      if (this.processedTxs.size > 1000) {
        const txsArray = Array.from(this.processedTxs);
        this.processedTxs = new Set(txsArray.slice(-1000));
      }
    } catch (error: any) {
      this.logger.error("Error processing block:", error);
      console.log(error);
    }
  }

  async handleDirectTransfer(tx: any, block: IBlock) {
    if (tx.value > BigInt(0)) {
      this.logger.debug(
        `💰 Direct transfer received:", ${util.inspect(
          {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: formatEther(tx.value),
          },
          false,
          5
        )}`
      );

      await this.notify({
        transactionHash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        valueEth: formatEther(tx.value),
        blockNumber: block.number.toString(),
        type: "direct",
      });
    }
  }

  async checkForInternalTransfers(tx: any, block: IBlock) {
    await this.rateLimiter.waitForSlot();

    // Get transaction receipt
    const receipt = await this.publicClient.getTransactionReceipt({
      hash: tx.hash,
    });

    // If transaction succeeded and involved contracts
    if (receipt.status === "success" && receipt.contractAddress) {
      // Check balance changes for all our wallets after this transaction
      for (const walletAddress of this.wallets) {
        // Compare balance before and after
        // This is approximate since we can't get exact block balance easily
        const currentBalance = await this.publicClient.getBalance({
          address: walletAddress,
          blockNumber: block.number,
        });

        // Store and compare in next iteration
        // (This is simplified - in production, store previous balances)
      }
    }
  }

  async notify(data: any) {
    this.logger.debug(`Notify: ${util.inspect(data, false, 2)}`);
    // await fetch("http://localhost:3000/api/internal/transfer-received", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // });
  }
}

export class MonadTransferDetector {
  private readonly balanceListener: BalanceChangeListener;
  private readonly txMonitor: TransactionMonitor;

  constructor(
    publicClient: PublicClient,
    config: Env,
    userWalletAddresses: BlockchainAddress[]
  ) {
    const rateLimiter = new RateLimiter(config, 20, 1);

    this.balanceListener = new BalanceChangeListener(
      publicClient,
      rateLimiter,
      config,
      userWalletAddresses
    );
    this.txMonitor = new TransactionMonitor(
      publicClient,
      rateLimiter,
      config,
      userWalletAddresses
    );
  }

  async start() {
    console.log("🚀 Starting Monad transfer detector...");
    await this.balanceListener.start();
    this.txMonitor.start();
  }

  stop() {
    this.balanceListener.stop();
    this.txMonitor.stop();
  }

  addWallet(address: BlockchainAddress) {
    this.balanceListener.addWallet(address);
    this.txMonitor.addWallet(address);
  }
}
