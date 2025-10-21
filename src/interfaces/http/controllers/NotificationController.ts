import winston from "winston";
import { CoreDependencies } from "../../../config/factory";
import { Env } from "../../../config/env";
import createLogger from "../../../logging/logger.config";
import { AuthRequest } from "../express";
import {
  createTimeBasedSchema,
  deleteTimeBasedSchema,
  triggerSavingsSchema,
} from "../schemas/savings";
import { validateJsonPayload } from "../../../utils/helpers";
import { EntityManager } from "typeorm";
import {
  CreateSavingUseCase,
  DeleteSavingUseCase,
  ExecuteSavingUseCase,
  ListNotificationUseCase,
  ListUserAutoFlowsUseCase,
} from "../../../application/usecases";
import {
  NotificationRepository,
  SavingExecutionRepository,
  TimeBasedSavingRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import { Request, Response } from "express";
import { paginationSchema } from "../schemas/common";

export class NotificationController {
  private readonly logger: winston.Logger;
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {
    this.logger = createLogger(NotificationController.name, config);
  }

  listNotifications = async (req: AuthRequest, res: Response) => {
    const payload = validateJsonPayload(
      req.query,
      paginationSchema,
      this.logger
    );

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const notificationRepo = new NotificationRepository(manager);

        const useCase = new ListNotificationUseCase(notificationRepo);

        const result = await useCase.listByUser(req.user.sub, payload);

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

  deleteAutoFlow = async (req: AuthRequest, res: Response) => {
    const { id } = validateJsonPayload(
      req.query,
      deleteTimeBasedSchema,
      this.logger
    );

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const savingsRepo = new TimeBasedSavingRepository(manager);

        const useCase = new DeleteSavingUseCase(
          savingsRepo,
          this.coreDeps.worker,
          this.config
        );

        await useCase.execute(id);

        res.json({
          success: true,
        });
      }
    );
  };
}
