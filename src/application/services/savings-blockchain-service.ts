import winston from "winston";
import { encodeFunctionData, Hash, parseEther } from "viem";

import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { BlockchainAddress } from "../../types/blockchain";
import { WalletTransferService } from "./transfer-service";
import {
  SAVINGS_CONTRACT_ADDRESS,
  SAVINGS_VAULT_ABI,
} from "../../utils/constants";

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
    goalId: number,
    userAddress: BlockchainAddress,
    userPrivateKey: Hash
  ): Promise<void> {
    this.logger.debug({
      message: "Input parameters",
      data: {
        goalAmount,
        goalId,
        goalAmountType: typeof goalAmount,
        goalIdType: typeof goalId,
      },
    });

    // Convert goalAmount to wei
    const formattedAmount = parseEther(goalAmount.toString());

    // Convert goalId to BigInt - CRITICAL STEP
    const goalIdBigInt = BigInt(goalId);

    // DEBUG: Log converted values
    this.logger.debug({
      message: "Converted parameters",
      data: {
        formattedAmount: formattedAmount.toString(),
        goalIdBigInt: goalIdBigInt.toString(),
        formattedAmountHex: formattedAmount.toString(16),
        goalIdBigIntHex: goalIdBigInt.toString(16),
      },
    });

    // Encode the function call
    const encodedData = this.encodeSetSavingsGoalData(
      formattedAmount,
      goalIdBigInt
    );

    await this.executeWithPaymaster(
      {
        to: SAVINGS_CONTRACT_ADDRESS,
        value: BigInt(0),
        data: encodedData,
        from: userAddress,
      },
      userPrivateKey
    );

    this.logger.info(
      `Savings goal ${goalId} and Target = ${goalAmount} created successfully.`
    );
  }

  private encodeSetSavingsGoalData(
    goalAmount: bigint,
    id: bigint
  ): `0x${string}` {
    return encodeFunctionData({
      abi: SAVINGS_VAULT_ABI,
      functionName: "setSavingsGoal",
      args: [goalAmount, id],
    });
  }

  async depositToSavingsGoal(
    amount: number,
    goalId: number,
    userAddress: BlockchainAddress,
    userPrivateKey: Hash
  ) {
    this.logger.debug({
      message: "Input parameters",
      data: {
        amount,
        goalId,
        goalAmountType: typeof amount,
        goalIdType: typeof goalId,
      },
    });

    // Convert goalAmount to wei
    const formattedAmount = parseEther(amount.toString());

    // Convert goalId to BigInt - CRITICAL STEP
    const goalIdBigInt = BigInt(goalId);

    // DEBUG: Log converted values
    this.logger.debug({
      message: "Converted parameters",
      data: {
        formattedAmount: formattedAmount.toString(),
        goalIdBigInt: goalIdBigInt.toString(),
        formattedAmountHex: formattedAmount.toString(16),
        goalIdBigIntHex: goalIdBigInt.toString(16),
      },
    });

    // Encode the function call
    const encodedData = this.encodeDepositToSavingsGoalData(goalIdBigInt);

    const txHash = await this.executeWithPaymaster(
      {
        to: SAVINGS_CONTRACT_ADDRESS,
        value: formattedAmount,
        data: encodedData,
        from: userAddress,
      },
      userPrivateKey
    );

    this.logger.info(`Deposit to goal ${goalId} completed successfully.`);

    return { txHash };
  }

  private encodeDepositToSavingsGoalData(id: bigint): `0x${string}` {
    return encodeFunctionData({
      abi: SAVINGS_VAULT_ABI,
      functionName: "deposit",
      args: [id],
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
      this.logger.error({
        message: `Paymaster transaction failed: ${error.message}`,
        data: transaction,
      });
      throw error;
    }
  }
}
