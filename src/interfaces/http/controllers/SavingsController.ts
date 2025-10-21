import winston from "winston";
import { CoreDependencies } from "../../../config/factory";
import { Env } from "../../../config/env";
import createLogger from "../../../logging/logger.config";
import { AuthRequest } from "../express";
import {
  createTimeBasedSchema,
  triggerSavingsSchema,
} from "../schemas/savings";
import { validateJsonPayload } from "../../../utils/helpers";
import { EntityManager } from "typeorm";
import {
  CreateSavingUseCase,
  ExecuteSavingUseCase,
  ListUserAutoFlowsUseCase,
} from "../../../application/usecases";
import {
  SavingExecutionRepository,
  TimeBasedSavingRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import { Request, Response } from "express";

export class SavingsController {
  private readonly logger: winston.Logger;
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {
    this.logger = createLogger(SavingsController.name, config);
  }

  createAutoflow = async (req: AuthRequest, res: Response) => {
    const payload = validateJsonPayload(
      req.body,
      createTimeBasedSchema,
      this.logger
    );

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const savingsRepo = new TimeBasedSavingRepository(manager);
        const userRepo = new UserRepository(manager);

        const useCase = new CreateSavingUseCase(
          savingsRepo,
          userRepo,
          this.coreDeps.savingsBlockchainService,
          this.coreDeps.worker,
          this.config
        );

        const result = await useCase.execute({
          ...payload,
          userId: req.user.sub,
        });

        res.json(result);
      }
    );
  };

  listUserAutoflow = async (req: AuthRequest, res: Response) => {
    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const savingsRepo = new TimeBasedSavingRepository(manager);
        const userRepo = new UserRepository(manager);

        const useCase = new ListUserAutoFlowsUseCase(
          savingsRepo,
          userRepo,
          this.config
        );

        const result = await useCase.execute(req.user.sub);

        res.json(result);
      }
    );
  };

  triggerSavings = async (req: Request, res: Response) => {
    const { savingsId } = validateJsonPayload(
      req.body,
      triggerSavingsSchema,
      this.logger
    );

    let error;

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const savingsRepo = new TimeBasedSavingRepository(manager);
        const userRepo = new UserRepository(manager);
        const executionRepo = new SavingExecutionRepository(manager);

        const useCase = new ExecuteSavingUseCase(
          savingsRepo,
          userRepo,
          executionRepo,
          this.coreDeps.savingsBlockchainService,
          this.coreDeps.domainEventBus,
          this.config
        );

        error = await useCase.execute(savingsId);
      }
    );

    if (error) {
      throw error;
    }

    res.json({
      success: true,
    });
  };
}
