import {
  parseEther,
  encodeFunctionData,
  parseUnits,
  http,
  PublicClient,
  formatEther,
  parseGwei,
  Hash,
  decodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createExecution, ExecutionMode } from "@metamask/delegation-toolkit";
import { DelegationManager } from "@metamask/delegation-toolkit/contracts";
import { zeroAddress } from "viem";

import {
  BlockchainAddress,
  SmartAccountImplementation,
} from "../../types/blockchain";
import { decryptValue } from "../../utils/encryption";
import { TokenBalanceService } from "./token-balance-service";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import {
  Implementation,
  toMetaMaskSmartAccount,
  ToMetaMaskSmartAccountReturnType,
} from "@metamask/delegation-toolkit";
import {
  BundlerClient,
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { IDelegationRepository } from "../../domain/repositories";

export interface SponsoredTransferConfig {
  gasPolicy?: {
    maxGasLimit?: string;
    gasLimit?: string;
  };
}

interface TransferParams {
  to: string;
  amount: string | bigint; // user-readable
  data?: Hash;
  delegation?: any;
  tokenAddress?: BlockchainAddress; // optional for ERC20
  decimals?: number; // ERC20 decimals, default 18
  walletData: {
    privateKey: string;
    address: BlockchainAddress;
  };
}

export class WalletTransferService {
  private readonly logger: winston.Logger;

  constructor(
    private readonly config: Env,
    private readonly publicClient: PublicClient,
    private readonly bundlerClient: BundlerClient,
    private readonly paymasterClient: ReturnType<typeof createPaymasterClient>,
    private readonly balanceService: TokenBalanceService
  ) {
    this.logger = createLogger("WalletTransferService", config);
  }

  private async deployWallet(
    account: ToMetaMaskSmartAccountReturnType<Implementation.Hybrid>
  ) {
    this.logger.info(`Deploy wallet: ${account.address}`);

    const { maxFeePerGas, maxPriorityFeePerGas } =
      await this.getPimlicoGasPrices();

    this.logger.info({
      message: "💰 Gas fees will be sponsored by paymaster",
      data: { maxFeePerGas, maxPriorityFeePerGas },
    });

    const userOpHash = await this.bundlerClient.sendUserOperation({
      account,
      calls: [
        {
          to: account.address, // Send to self
          value: BigInt(0),
          data: "0x", // Empty data
        },
      ],
      paymaster: this.paymasterClient,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    console.log("User Operation Hash:", userOpHash);
    console.log("⏳ Waiting for user operation to be mined...");

    // Wait for the user operation to be included in a block
    const receipt = await this.bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    this.logger.debug({
      message: "✅ Transaction Hash",
      data: receipt.receipt,
    });

    this.logger.info("✅ Smart wallet deployed successfully!");
    this.logger.info(`💰 Gas paid by paymaster: ${receipt.receipt.from}`);
  }

  private async checkOnChainDeployment(address: string): Promise<boolean> {
    try {
      const code = await this.publicClient.getCode({
        address: address as `0x${string}`,
      });
      const isDeployed = Boolean(code && code !== "0x");

      this.logger.debug(
        `On-chain deployment check: ${isDeployed}, code length: ${code?.length}`
      );
      return isDeployed;
    } catch (error) {
      this.logger.error("Error checking on-chain deployment:", error);
      return false;
    }
  }

  async getSmartAccount(privateKey: string, address: BlockchainAddress) {
    this.logger.debug("getSmartAccount");
    const userPrivateKey = decryptValue(this.config.ENCRYPTION_KEY, privateKey);

    const eoaAccount = privateKeyToAccount(userPrivateKey as `0x${string}`);

    // Recreate MetaMask smart account
    const smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [eoaAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: eoaAccount },
    });

    this.logger.debug("check is deployed");

    const isDeployed = await this.checkOnChainDeployment(address);

    this.logger.info(`Is deployed: ${isDeployed}`);

    if (!isDeployed) {
      await this.deployWallet(smartAccount);
    }

    return smartAccount;
  }

  async sponsorTransaction(
    transferParams: TransferParams
  ): Promise<{ txHash: Hash; userOpHash: string }> {
    // TODO: Check delegation balance
    if (!transferParams.delegation) await this.confirmBalance(transferParams);

    const smartAccount = await this.getSmartAccount(
      transferParams.walletData.privateKey,
      transferParams.walletData.address
    );

    this.logger.debug(`Smart account: ${smartAccount.address.toString()}`);

    const bundlerClient = createBundlerClient({
      transport: http(this.config.RPC_URL),
      client: this.publicClient,
    });

    const paymasterClient = createPaymasterClient({
      transport: http(this.config.RPC_URL),
    });

    const gasPrices = await this.getPimlicoGasPrices();

    const { maxFeePerGas, maxPriorityFeePerGas } = gasPrices;

    const calls = [
      {
        to: transferParams.to as BlockchainAddress,
        value:
          typeof transferParams.amount === "string"
            ? parseEther(transferParams.amount)
            : transferParams.amount,
        data: transferParams.data || "0x",
      },
    ];

    let userOpHash;

    if (transferParams.delegation) {
      const delegations = [[transferParams.delegation]];

      const transaction = calls[0];

      const executions = createExecution({
        target: transaction.to,
        callData: transaction.data,
        value: transaction.value,
      });

      const redeemDelegationCalldata =
        DelegationManager.encode.redeemDelegations({
          delegations,
          modes: [ExecutionMode.SingleDefault],
          executions: [[executions]],
        });

      userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: smartAccount.address,
            data: redeemDelegationCalldata,
            value: BigInt(0),
          },
        ],
        paymaster: paymasterClient,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    } else {
      userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls,
        paymaster: paymasterClient,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });
    }

    this.logger.info("UserOperation sent with sponsored gas:", userOpHash);

    // Wait for the transaction to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    this.logger.info(`✅ Transaction Hash: ${receipt.receipt.transactionHash}`);
    this.logger.info(`💰 Gas paid by paymaster: ${receipt.receipt.from}`);

    return {
      txHash: receipt.receipt.transactionHash,
      userOpHash,
    };
  }

  async estimateSponsoredGas(transferParams: TransferParams) {
    const smartAccount = await this.getSmartAccount(
      transferParams.walletData.privateKey,
      transferParams.walletData.address
    );

    const gasPrices = await this.getPimlicoGasPrices();

    const isNative = !transferParams.tokenAddress;

    if (!isNative) {
      throw new BadRequestError(
        "Only native transactions are supported at this time"
      );
    }

    // Prepare the call
    const transaction = {
      to: transferParams.to as `0x${string}`,
      value:
        typeof transferParams.amount === "string"
          ? parseEther(transferParams.amount)
          : transferParams.amount,
      data: transferParams.data || "0x",
    };

    // Create bundler client for submitting user operations
    const bundlerClient = createBundlerClient({
      transport: http(this.config.RPC_URL),
      client: this.publicClient,
    });

    // Create paymaster client for gas sponsorship
    const paymasterClient = createPaymasterClient({
      transport: http(this.config.RPC_URL),
    });

    let userOp;

    if (transferParams.delegation) {
      const delegations = [[transferParams.delegation]];

      const executions = createExecution({
        target: transaction.to,
        callData: transaction.data,
        value: transaction.value,
      });

      const redeemDelegationCalldata =
        DelegationManager.encode.redeemDelegations({
          delegations,
          modes: [ExecutionMode.SingleDefault],
          executions: [[executions]],
        });

      userOp = await bundlerClient.prepareUserOperation({
        account: smartAccount,
        calls: [
          {
            to: smartAccount.address,
            data: redeemDelegationCalldata,
            value: BigInt(0),
          },
        ],
        paymaster: paymasterClient,
      });
    } else {
      userOp = await bundlerClient.prepareUserOperation({
        account: smartAccount,
        calls: [transaction],
        paymaster: paymasterClient,
      });
    }

    const gasLimits = {
      callGasLimit: userOp.callGasLimit,
      verificationGasLimit: userOp.verificationGasLimit,
      preVerificationGas: userOp.preVerificationGas,
    };

    const gasEstimate = this.calculateGasCost(gasLimits, gasPrices);

    const estimatedCostInMON = gasEstimate.likelyCostEth;

    this.logger.info("Calculated Gas Estimate", {
      ...gasPrices,
      ...gasLimits,
      ...gasEstimate,
    });

    // Calculate cost in USD
    const monPriceUSD = await this.getETHPrice();
    const estimatedCostUSD = (
      parseFloat(estimatedCostInMON) * monPriceUSD
    ).toFixed(6);

    return {
      estimatedCostMON: estimatedCostInMON,
      estimatedCostUSD,
      maxFeePerGas: gasPrices.maxFeePerGas.toString(),
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas.toString(),
    };
  }

  private calculateGasCost(gasLimits: any, gasPrices: any) {
    const totalGasLimit =
      gasLimits.callGasLimit +
      gasLimits.verificationGasLimit +
      gasLimits.preVerificationGas;

    const maxCost = totalGasLimit * gasPrices.maxFeePerGas;
    const likelyCost = totalGasLimit * gasPrices.maxPriorityFeePerGas;

    return {
      totalGasLimit,
      maxCostWei: maxCost,
      maxCostEth: formatEther(BigInt(maxCost)),
      likelyCostWei: likelyCost,
      likelyCostEth: formatEther(BigInt(likelyCost)),
    };
  }

  private async getPimlicoGasPrices() {
    try {
      const response = await fetch(this.config.RPC_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "pimlico_getUserOperationGasPrice",
          params: [],
        }),
      });

      const data = await response.json();

      if (data.result) {
        return {
          maxFeePerGas: BigInt(data.result.standard.maxFeePerGas),
          maxPriorityFeePerGas: BigInt(
            data.result.standard.maxPriorityFeePerGas
          ),
        };
      }
    } catch (error) {
      console.log("Pimlico gas price endpoint not available, using defaults");
    }

    // Fallback to Monad defaults
    return {
      maxFeePerGas: parseGwei("3"),
      maxPriorityFeePerGas: parseGwei("2.5"),
    };
  }

  private async confirmBalance(params: TransferParams) {
    const { amount, tokenAddress, decimals = 18, walletData } = params;

    if (tokenAddress) {
      const balance = await this.balanceService.getTokenBalance(
        walletData.address,
        tokenAddress,
        decimals
      );

      this.logger.info(
        `Token ${tokenAddress} balance is ${balance.formatted}`,
        balance
      );

      if (Number(balance.formatted) < Number(amount)) {
        throw new BadRequestError("Insufficient funds to complete transfer");
      }
    } else {
      const balance = await this.balanceService.getNativeBalance(
        walletData.address
      );

      this.logger.info(
        `Native balance is ${balance.formattedBalance}`,
        balance
      );

      if (Number(balance.formattedBalance) < Number(amount)) {
        throw new BadRequestError("Insufficient funds to complete transfer");
      }
    }
  }

  private async getETHPrice(): Promise<number> {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      {
        headers: { "x-cg-demo-api-key": this.config.ALCHEMY_API_KEY },
      }
    );
    const data = await response.json();
    return data.ethereum.usd || 0;
  }

  private async validateDelegationTiming(signedDelegation: any): Promise<void> {
    try {
      // Decode the delegation to check caveats/enforcers
      const delegation = signedDelegation;

      // Check if there are time-based enforcers
      if (delegation.caveats && delegation.caveats.length > 0) {
        for (const caveat of delegation.caveats) {
          // Look for NativeTokenPeriodTransferEnforcer
          if (caveat.enforcer) {
            const enforcerTerms = caveat.terms;

            // Decode enforcer terms to get start/end times
            // Format: [uint256 allowance, uint256 period, uint128 start, uint128 end]
            if (enforcerTerms && enforcerTerms.length >= 96) {
              // Parse start time (bytes 64-95)
              const startHex = "0x" + enforcerTerms.slice(64, 96);
              const startTime = BigInt(startHex);

              // Parse end time (bytes 96-127)
              const endHex = "0x" + enforcerTerms.slice(96, 128);
              const endTime = BigInt(endHex);

              const currentTime = BigInt(Math.floor(Date.now() / 1000));

              this.logger.debug({
                message: "Delegation time validation",
                data: {
                  startTime: startTime.toString(),
                  endTime: endTime.toString(),
                  currentTime: currentTime.toString(),
                  notStarted: currentTime < startTime,
                  expired: currentTime > endTime,
                },
              });

              if (currentTime < startTime) {
                const timeUntilStart = Number(startTime - currentTime);
                throw new BadRequestError(
                  `Delegation period has not started yet. Starts in ${timeUntilStart} seconds`
                );
              }

              if (currentTime > endTime) {
                throw new BadRequestError("Delegation period has expired");
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      this.logger.warn({
        message: "Could not validate delegation timing",
        error: error.message,
      });
    }
  }

  private decodeRevertReason(errorData: string): string {
    try {
      if (errorData.startsWith("0x08c379a0")) {
        // Standard Error(string) selector
        const reasonHex = errorData.slice(10); // Remove selector
        const decoded = decodeFunctionData({
          abi: [
            {
              name: "Error",
              type: "function",
              inputs: [{ name: "reason", type: "string" }],
            },
          ],
          data: `0x${reasonHex}`,
        });
        if (decoded.args) return decoded.args[0] as string;
      }
      return "Unknown error";
    } catch {
      return "Could not decode error";
    }
  }
}
