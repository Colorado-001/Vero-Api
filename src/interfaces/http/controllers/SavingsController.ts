import winston from "winston";
import { CoreDependencies } from "../../../config/factory";
import { Env } from "../../../config/env";
import createLogger from "../../../logging/logger.config";
import { AuthRequest } from "../express";
import { createTimeBasedSchema } from "../schemas/savings";
import { validateJsonPayload } from "../../../utils/helpers";
import { EntityManager } from "typeorm";
import { CreateSavingUseCase } from "../../../application/usecases";
import {
  TimeBasedSavingRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import { Response } from "express";

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
}
