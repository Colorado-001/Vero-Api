import {
  parseEther,
  encodeFunctionData,
  parseUnits,
  http,
  PublicClient,
  formatEther,
  toHex,
  parseAbi,
  parseGwei,
  Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { alchemy, AlchemyTransport } from "@account-kit/infra";
import { LocalAccountSigner } from "@aa-sdk/core";

import { WalletClientSigner } from "@aa-sdk/core";
import { createSmartWalletClient } from "@account-kit/wallet-client";

import {
  BlockchainAddress,
  SmartAccountImplementation,
} from "../../types/blockchain";
import { decryptValue } from "../../utils/encryption";
import { TokenBalanceService } from "./token-balance-service";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { BadRequestError } from "../../utils/errors";
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

  private async getSmartAccount(transferParams: TransferParams) {
    const userPrivateKey = decryptValue(
      this.config.ENCRYPTION_KEY,
      transferParams.walletData.privateKey
    );

    const eoaAccount = privateKeyToAccount(userPrivateKey as `0x${string}`);

    // Recreate MetaMask smart account
    const smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [eoaAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: eoaAccount },
    });

    const isDeployed = await this.checkOnChainDeployment(
      transferParams.walletData.address
    );

    this.logger.info(`Is deployed: ${isDeployed}`);

    if (!isDeployed) {
      await this.deployWallet(smartAccount);
    }

    return smartAccount;
  }

  async sponsorTransaction(
    transferParams: TransferParams
  ): Promise<{ txHash: Hash; userOpHash: string }> {
    await this.confirmBalance(transferParams);

    const smartAccount = await this.getSmartAccount(transferParams);

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

    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls,
      paymaster: paymasterClient,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

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

  async estimateSponsoredGas(transferParams: TransferParams) {
    const smartAccount = await this.getSmartAccount(transferParams);

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
      data: "0x",
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

    const userOp = await bundlerClient.prepareUserOperation({
      account: smartAccount,
      calls: [transaction],
      paymaster: paymasterClient,
    });

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

  private encodeERC20Transfer(
    to: string,
    amount: string,
    decimal: number
  ): `0x${string}` {
    // ERC20 transfer function ABI
    const transferAbi = [
      {
        name: "transfer",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ] as const;

    // Encode the transfer function call
    return encodeFunctionData({
      abi: transferAbi,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, decimal)],
    });
  }

  private async confirmBalance(params: TransferParams) {
    const { to, amount, tokenAddress, decimals = 18, walletData } = params;

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
}
