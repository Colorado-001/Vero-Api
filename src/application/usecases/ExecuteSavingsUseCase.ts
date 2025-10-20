import winston from "winston";
import {
  ITimeBasedSavingRepository,
  IUserRepository,
} from "../../domain/repositories";
import { Env } from "../../config/env";
import createLogger from "../../logging/logger.config";
import { ISavingExecutionRepository } from "../../domain/repositories/savings-execution";
import { SavingsBlockchainService } from "../services";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import {
  SavingExecution,
  TimeBasedSaving,
  UserEntity,
} from "../../domain/entities";
import { ExecutionStatus } from "../../utils/enums";
import { BlockchainAddress } from "../../types/blockchain";

export class ExecuteSavingUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly savingsRepo: ITimeBasedSavingRepository,
    private readonly userRepo: IUserRepository,
    private readonly executionRepo: ISavingExecutionRepository,
    private readonly savingBlockchainService: SavingsBlockchainService,
    config: Env
  ) {
    this.logger = createLogger(ExecuteSavingUseCase.name, config);
  }

  async execute(savingsId: number) {
    const saving = await this.savingsRepo.findById(savingsId);

    if (!saving.isActive) {
      throw new BadRequestError(`Saving plan ${savingsId} is not active`);
    }

    const user = await this.userRepo.findById(saving.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const execution = SavingExecution.createPending(
      saving.id,
      new Date(),
      saving.amountToSave
    );

    this.validateExecution(execution, false);

    this.logger.log(`Executing saving ${saving.id} for user ${saving.userId}`, {
      savingId: saving.id,
      executionId: execution.id,
      amount: saving.amountToSave,
      token: saving.tokenToSave,
    });

    const transactionResult = await this.executeBlockchainTransaction(
      saving,
      execution,
      user
    );

    // 6. Update execution as successful
    execution.markAsSuccess(transactionResult.txHash);
    saving.recordSuccessfulSave(saving.amountToSave);

    // 7. Save changes
    await this.saveChanges(saving, execution);

    this.logger.info({
      message: `Successfully executed saving ${saving.id}`,
      data: {
        executionId: execution.id,
        transactionHash: transactionResult.txHash,
        amount: saving.amountToSave,
      },
    });
  }

  private async saveChanges(
    saving: TimeBasedSaving,
    execution: SavingExecution
  ): Promise<void> {
    try {
      await Promise.all([
        this.savingsRepo.save(saving),
        this.executionRepo.save(execution),
      ]);
    } catch (error: any) {
      this.logger.error(`Failed to save execution results: ${error.message}`, {
        savingId: saving.id,
        executionId: execution.id,
      });
      throw new Error(`Failed to save execution results: ${error.message}`);
    }
  }

  private async executeBlockchainTransaction(
    saving: TimeBasedSaving,
    execution: SavingExecution,
    user: UserEntity
  ): Promise<{ txHash: string }> {
    try {
      this.logger.debug("Executing blockchain transaction", {
        savingId: saving.id,
        executionId: execution.id,
        amount: saving.amountToSave,
        token: saving.tokenToSave,
      });

      // Execute deposit on blockchain
      const { txHash } =
        await this.savingBlockchainService.depositToSavingsGoal(
          execution.amount,
          saving.id,
          user.smartAccountAddress,
          user.privateKey as BlockchainAddress
        );

      return { txHash };
    } catch (error: any) {
      this.logger.error(`Blockchain transaction failed: ${error.message}`, {
        savingId: saving.id,
        executionId: execution.id,
        error: error.stack,
      });
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  private validateExecution(
    execution: SavingExecution,
    forceRetry: boolean = false
  ): void {
    // Check if already executed
    if (execution.status === ExecutionStatus.SUCCESS) {
      throw new Error(
        `Execution ${execution.id} has already been successfully processed`
      );
    }

    if (execution.status === ExecutionStatus.SKIPPED) {
      throw new Error(
        `Execution ${execution.id} has been skipped and cannot be processed`
      );
    }

    // Check retry limits
    if (execution.status === ExecutionStatus.FAILED) {
      if (!execution.canRetry() && !forceRetry) {
        throw new Error(
          `Execution ${execution.id} has exceeded maximum retry attempts`
        );
      }

      if (forceRetry) {
        this.logger.warn(
          `Forcing retry for execution ${execution.id} beyond normal limits`
        );
      }
    }

    // Check if execution is overdue (for scheduled executions)
    if (execution.isOverdue()) {
      this.logger.warn(
        `Execution ${
          execution.id
        } is overdue by ${execution.getDaysOverdue()} days`
      );
    }
  }
}
