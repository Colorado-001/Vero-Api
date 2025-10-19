import winston from "winston";
import { encodeFunctionData, formatEther, Hash } from "viem";

import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { BlockchainAddress } from "../../types/blockchain";
import { WalletTransferService } from "./transfer-service";
import {
  SAVINGS_CONTRACT_ADDRESS,
  SAVINGS_VAULT_ABI,
} from "../../utils/constants";
import { uuidToBigInt } from "../../utils/helpers";

export class SavingsBlockchainService {
  private readonly logger: winston.Logger;

  constructor(
    config: Env,
    private readonly walletTransferService: WalletTransferService
  ) {
    this.logger = createLogger(SavingsBlockchainService.name, config);
  }

  async setSavingsGoal(
    goalAmount: number,
    goalId: string,
    userAddress: BlockchainAddress,
    userPrivateKey: Hash
  ): Promise<void> {
    const formattedAmount = formatEther(BigInt(goalAmount));
    await this.executeWithPaymaster(
      {
        to: SAVINGS_CONTRACT_ADDRESS,
        value: BigInt(0),
        data: this.encodeSetSavingsGoalData(formattedAmount, goalId),
        from: userAddress,
      },
      userPrivateKey
    );
    this.logger.info(
      `Savings goal ${goalId} and Target = ${goalAmount} created successfully.`
    );
  }

  encodeSetSavingsGoalData(goalAmount: string, id: string): `0x${string}` {
    return encodeFunctionData({
      abi: SAVINGS_VAULT_ABI,
      functionName: "setSavingsGoal",
      args: [BigInt(goalAmount), uuidToBigInt(id)],
    });
  }

  private async executeWithPaymaster(
    transaction: {
      to: BlockchainAddress;
      value: bigint;
      data: `0x${string}`;
      from: BlockchainAddress;
    },
    privateKey: Hash
  ): Promise<Hash> {
    try {
      const { txHash } = await this.walletTransferService.sponsorTransaction({
        amount: transaction.value,
        to: transaction.to,
        data: transaction.data,
        walletData: {
          address: transaction.from,
          privateKey,
        },
      });

      this.logger.info(`Paymaster transaction successful: ${txHash}`);
      return txHash;
    } catch (error: any) {
      this.logger.error(`Paymaster transaction failed: ${error.message}`);
      throw error;
    }
  }
}
