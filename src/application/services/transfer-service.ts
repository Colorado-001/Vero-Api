import {
  parseEther,
  encodeFunctionData,
  parseUnits,
  createWalletClient,
  http,
  PublicClient,
  formatEther,
  toHex,
  parseAbi,
  parseGwei,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { alchemy, AlchemyTransport, monadTestnet } from "@account-kit/infra";
import { LocalAccountSigner } from "@aa-sdk/core";
import { monadTestnet as chain } from "viem/chains";

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
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { serializeUserOp } from "../../utils/helpers";

const ALCHEMY_ENTRYPOINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // EntryPoint v0.7
const ALCHEMY_ENTRYPOINT_V06 = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"; // EntryPoint v0.6

export interface SponsoredTransferConfig {
  gasPolicy?: {
    maxGasLimit?: string;
    gasLimit?: string;
  };
}

interface TransferParams {
  to: string;
  amount: string; // user-readable
  tokenAddress?: BlockchainAddress; // optional for ERC20
  decimals?: number; // ERC20 decimals, default 18
  walletData: {
    privateKey: string;
    implementation: SmartAccountImplementation;
    address: BlockchainAddress;
  };
}

export class WalletTransferService {
  private readonly logger: winston.Logger;
  private readonly alchemy: AlchemyTransport;

  constructor(
    private readonly config: Env,
    private readonly publicClient: PublicClient,
    private readonly balanceService: TokenBalanceService
  ) {
    this.logger = createLogger("WalletTransferService", config);
    this.alchemy = alchemy({ apiKey: this.config.ALCHEMY_API_KEY });
  }

  // async deployWallet(
  //   smartAccount: ToMetaMaskSmartAccountReturnType<Implementation.Hybrid>
  // ) {
  //   this.logger.info("Deploying account...");

  //   const { factory, factoryData } = await smartAccount.getFactoryArgs();

  //   const txHash = await this.publicClient.sendTransaction({
  //     account: owner,
  //     to: factoryAddress,
  //     data: initCode,
  //     value: 0n,
  //   });

  //   const bundlerClientDeploy = createBundlerClient({
  //     client: this.publicClient,
  //     transport: http(this.config.RPC_URL),
  //   });

  //   const factoryBalance = await this.publicClient.getBalance({
  //     address: smartAccount.address,
  //   });

  //   this.logger.debug(`Factory balance: ${factoryBalance.toString()}`);

  //   const deployHash = await bundlerClientDeploy.sendUserOperation({
  //     account: smartAccount,
  //     calls: [
  //       {
  //         to: smartAccount.address, // Self-call
  //         value: parseEther("0.1"),
  //         data: "0x",
  //       },
  //     ],
  //   });

  //   this.logger.debug("Deployment UserOp sent:", deployHash.toString());

  //   await bundlerClientDeploy.waitForUserOperationReceipt({
  //     hash: deployHash,
  //   });

  //   this.logger.info("Account deployed successfully");
  // }

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

  async sponsorNativeTransfer(
    transferParams: TransferParams
  ): Promise<{ txHash: string; userOpHash: string }> {
    await this.confirmBalance(transferParams);

    const userPrivateKey = decryptValue(
      this.config.ENCRYPTION_KEY,
      transferParams.walletData.privateKey
    );

    this.logger.debug(`privKey: ${userPrivateKey}`);

    const eoaAccount = privateKeyToAccount(userPrivateKey as `0x${string}`);

    // Recreate MetaMask smart account
    const smartAccount = await toMetaMaskSmartAccount({
      client: this.publicClient,
      implementation: Implementation.Hybrid,
      deployParams: [eoaAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: eoaAccount },
    });

    let isDeployed = await this.checkOnChainDeployment(smartAccount.address);

    // if (!isDeployed) {
    //   await this.deployWallet(smartAccount);
    // }

    // isDeployed = await smartAccount.isDeployed();

    this.logger.debug(
      `Smart account: ${smartAccount.address.toString()} ${isDeployed}`
    );

    const paymasterClient = createPaymasterClient({
      transport: http(this.config.RPC_URL),
    });

    const bundlerClient = createBundlerClient({
      transport: http(this.config.RPC_URL),
      // paymaster: paymasterClient,
      chain,
    });

    // Create bundler client with Alchemy's paymaster
    // const bundlerClient = createBundlerClient({
    //   account: smartAccount,
    //   client: this.publicClient,
    //   transport: http(this.config.RPC_URL),
    //   paymaster: {
    //     // This function gets paymaster data from Alchemy
    //     getPaymasterData: async (userOperation) => {
    //       this.logger.debug("Requesting paymaster sponsorship");

    //       if (!userOperation.sender || !userOperation.callData) {
    //         this.logger.error(
    //           "Invalid userOperation structure:",
    //           userOperation
    //         );
    //         throw new Error("UserOperation missing required fields");
    //       }

    //       const serializedUserOp = {
    //         sender: userOperation.sender,
    //         nonce: toHex(userOperation.nonce),
    //         callData: userOperation.callData,
    //         // callGasLimit: toHex(userOperation.callGasLimit || BigInt(100000)),
    //         // verificationGasLimit: toHex(
    //         //   userOperation.verificationGasLimit || BigInt(100000)
    //         // ),
    //         // preVerificationGas: toHex(
    //         //   userOperation.preVerificationGas || BigInt(50000)
    //         // ),
    //         // maxFeePerGas: toHex(userOperation.maxFeePerGas || parseGwei("100")),
    //         // maxPriorityFeePerGas: toHex(
    //         //   userOperation.maxPriorityFeePerGas || parseGwei("1")
    //         // ),
    //       };

    //       this.logger.debug(JSON.stringify(serializedUserOp, null, 2));

    //       // Convert BigInt fields to hex strings
    //       const dummySignature = `0x${"0".repeat(130)}` as `0x${string}`;

    //       try {
    //         // Call Alchemy's Gas Manager API
    //         const response = await fetch(this.config.RPC_URL, {
    //           method: "POST",
    //           headers: { "Content-Type": "application/json" },
    //           body: JSON.stringify({
    //             jsonrpc: "2.0",
    //             id: 1,
    //             method: "alchemy_requestGasAndPaymasterAndData",
    //             params: [
    //               {
    //                 policyId: this.config.ALCHEMY_GAS_POLICY_ID,
    //                 entryPoint: smartAccount.entryPoint.address,
    //                 dummySignature,
    //                 userOperation: serializedUserOp,
    //               },
    //             ],
    //           }),
    //         });

    //         const result = await response.json();

    //         if (result.error) {
    //           this.logger.error("Paymaster error:", result.error);
    //           throw new Error(`Paymaster error: ${result.error.message}`);
    //         }

    //         this.logger.debug("Paymaster response received");

    //         // Return the paymaster data
    //         return result.result;
    //         // return {
    //         //   paymaster: result.result.paymaster,
    //         //   paymasterData: result.result.paymasterData,
    //         //   paymasterVerificationGasLimit: BigInt(
    //         //     result.result.paymasterVerificationGasLimit || 0
    //         //   ),
    //         //   paymasterPostOpGasLimit: BigInt(
    //         //     result.result.paymasterPostOpGasLimit || 0
    //         //   ),
    //         //   callGasLimit: BigInt(result.result.callGasLimit),
    //         //   verificationGasLimit: BigInt(result.result.verificationGasLimit),
    //         //   preVerificationGas: BigInt(result.result.preVerificationGas),
    //         //   maxFeePerGas: BigInt(
    //         //     result.result.maxFeePerGas || userOperation.maxFeePerGas
    //         //   ),
    //         //   maxPriorityFeePerGas: BigInt(
    //         //     result.result.maxPriorityFeePerGas ||
    //         //       userOperation.maxPriorityFeePerGas
    //         //   ),
    //         // };
    //       } catch (error) {
    //         this.logger.error("Failed to get paymaster data:", error);
    //         throw error;
    //       }
    //     },
    //   },
    // });

    // const { maxFeePerGas, maxPriorityFeePerGas } =
    //   await this.estimateSponsoredGas(transferParams);

    // Send the UserOperation with gas sponsorship
    const hash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: transferParams.to as `0x${string}`,
          value: parseEther(transferParams.amount),
          data: "0x",
        },
      ],
      maxFeePerGas: BigInt(152500000000),
      maxPriorityFeePerGas: BigInt(2500000000),
    });

    this.logger.info("UserOperation sent with sponsored gas:", hash);

    // Wait for the transaction to be mined
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash,
    });

    return {
      txHash: receipt.receipt.transactionHash,
      userOpHash: hash,
    };
  }

  async estimateSponsoredGas(transferParams: TransferParams) {
    const isNative = !transferParams.tokenAddress;

    const isDeployed = await this.checkOnChainDeployment(
      transferParams.walletData.address
    );

    this.logger.info(`is deployed: ${isDeployed}`);

    // Prepare the call
    const transaction = isNative
      ? {
          account: transferParams.walletData.address as `0x${string}`,
          to: transferParams.to as `0x${string}`,
          value: parseEther(transferParams.amount),
        }
      : {
          account: transferParams.walletData.address as `0x${string}`,
          to: transferParams.tokenAddress as `0x${string}`,
          data: this.encodeERC20Transfer(
            transferParams.to,
            transferParams.amount,
            transferParams.decimals || 18
          ) as `0x${string}`,
        };

    // Get gas estimate from Alchemy RPC
    const [gasEstimate, block, gasPrice, feeHistory] = await Promise.all([
      this.publicClient.estimateGas(transaction),
      this.publicClient.getBlock({ blockTag: "latest" }),
      this.publicClient.getGasPrice(),
      // Get fee history for better EIP-1559 estimation
      this.publicClient.request({
        method: "eth_feeHistory",
        params: [
          "0x4", // Last 4 blocks
          "latest",
          [25, 50, 75], // Percentiles for priority fees
        ],
      }),
    ]);

    // Calculate EIP-1559 fees using fee history
    const baseFeePerGas = block.baseFeePerGas || gasPrice;

    // Get median priority fee from recent blocks
    const recentPriorityFees =
      feeHistory.reward?.map(
        (fees: any[]) => BigInt(fees[1]) // Use 50th percentile
      ) || [];

    const medianPriorityFee =
      recentPriorityFees.length > 0
        ? recentPriorityFees.reduce(
            (a: bigint, b: bigint) => a + b,
            BigInt(0)
          ) / BigInt(recentPriorityFees.length)
        : gasPrice / BigInt(10);

    // Add 10% buffer to base fee for price volatility
    const maxFeePerGas =
      (baseFeePerGas * BigInt(110)) / BigInt(100) + medianPriorityFee;
    const maxPriorityFeePerGas = medianPriorityFee;

    const estimatedCostInWei = gasEstimate * maxFeePerGas;
    const estimatedCostInMON = formatEther(estimatedCostInWei);

    this.logger.info("Calculated Gas Estimate", {
      gasLimit: gasEstimate.toString(),
      baseFeePerGas: baseFeePerGas.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      estimatedCostInMON,
      feeHistoryBlocks: feeHistory.reward?.length || 0,
    });

    // Calculate cost in USD
    const monPriceUSD = await this.getETHPrice();
    const estimatedCostUSD = (
      parseFloat(estimatedCostInMON) * monPriceUSD
    ).toFixed(6);

    return {
      estimatedCostMON: estimatedCostInMON,
      estimatedCostUSD,
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
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
