import { Hash } from "viem";
import { TimeBasedSaving } from "../../domain/entities";
import {
  ITimeBasedSavingRepository,
  IUserRepository,
} from "../../domain/repositories";
import { CreateSavingRequest, SavingDto } from "../dto";
import { SavingsBlockchainService } from "../services";
import { IWorker } from "../../domain/ports";
import { TriggerSaveWebhook } from "../../types/worker";
import { Env } from "../../config/env";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { NotFoundError } from "../../utils/errors";

export class CreateSavingUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly savingRepository: ITimeBasedSavingRepository,
    private readonly userRepository: IUserRepository,
    private readonly savingsBlockchainService: SavingsBlockchainService,
    private readonly worker: IWorker,
    private readonly config: Env
  ) {
    this.logger = createLogger(CreateSavingUseCase.name, config);
  }

  async execute(request: CreateSavingRequest): Promise<SavingDto> {
    this.logger.info({
      message: "Received create saving request",
      data: { userId: request.userId, name: request.name },
    });

    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      this.logger.warn({
        message: "User not found",
        data: { userId: request.userId },
      });
      throw new NotFoundError("User not found");
    }

    this.logger.debug({
      message: "Fetched user successfully",
      data: { userId: user.id, smartAccount: user.smartAccountAddress },
    });

    const activeSavings = await this.savingRepository.findByUserIdAndActive(
      request.userId
    );

    this.logger.debug({
      message: "Fetched active savings for user",
      data: {
        userId: request.userId,
        activeSavingsCount: activeSavings.length,
      },
    });

    if (activeSavings.length >= 10) {
      this.logger.warn({
        message: "User reached maximum active savings limit",
        data: { userId: request.userId, count: activeSavings.length },
      });
      throw new Error("Maximum number of active flows (10) reached");
    }

    // Create entity
    const saving = this.createSavingEntity(request);
    const cronExpr = saving.getCronExpression();

    this.logger.debug({
      message: "Created new saving entity",
      data: {
        id: saving.id,
        userId: saving.userId,
        cronExpr,
        amount: saving.amountToSave,
      },
    });

    // Save to repository
    const newSaving = await this.savingRepository.save(saving);

    this.logger.info({
      message: "Saving entity persisted to repository",
      data: { id: newSaving.id, userId: newSaving.userId },
    });

    // Register operation in worker
    await this.worker.registerOperation<TriggerSaveWebhook>(
      cronExpr,
      user.id,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.config.WORKER_API_KEY,
        },
        body: {
          savingsId: newSaving.id.toString(),
        },
        id: `rule_${newSaving.id}`,
        method: "POST",
        timeout: 120,
        url: `${this.config.APP_URL}/v1/savings/autoflow/trigger`,
      },
      {
        name: newSaving.name,
        asset: newSaving.tokenToSave,
      }
    );

    this.logger.info({
      message: "Worker operation registered successfully",
      data: { ruleId: `rule_${newSaving.id}`, cronExpr },
    });

    // Set goal on blockchain
    this.logger.info({
      message: "Calling blockchain setSavingsGoal",
      data: {
        goalId: newSaving.id,
        amount: newSaving.amountToSave.toString(),
        userAddress: user.smartAccountAddress,
      },
    });

    await this.savingsBlockchainService.setSavingsGoal(
      newSaving.amountToSave,
      newSaving.id,
      user.smartAccountAddress,
      user.privateKey as Hash
    );

    this.logger.info({
      message: "Blockchain goal set successfully",
      data: { goalId: newSaving.id },
    });

    // Return response
    const response: SavingDto = {
      id: newSaving.id.toString(),
      name: newSaving.name,
      frequency: newSaving.frequency,
      dayOfMonth: newSaving.dayOfMonth,
      amountToSave: newSaving.amountToSave,
      tokenToSave: newSaving.tokenToSave,
      userId: newSaving.userId,
      isActive: newSaving.isActive,
      progress: newSaving.getProgress(),
      nextScheduledDate: newSaving.getProgress().nextScheduledDate,
      createdAt: newSaving.createdAt,
    };

    this.logger.info({
      message: "Create saving use case completed successfully",
      data: { savingId: newSaving.id, userId: newSaving.userId },
    });

    return response;
  }

  private createSavingEntity(data: CreateSavingRequest): TimeBasedSaving {
    this.logger.debug({
      message: "Instantiating TimeBasedSaving entity",
      data: { name: data.name, userId: data.userId },
    });

    return new TimeBasedSaving({
      frequency: data.frequency,
      name: data.name,
      dayOfMonth: data.dayOfMonth,
      amountToSave: data.amountToSave,
      tokenToSave: data.tokenToSave,
      userId: data.userId,
      isActive: true,
    });
  }
}
