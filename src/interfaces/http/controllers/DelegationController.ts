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
  CreateDelegationUseCase,
  CreateSavingUseCase,
  ExecuteSavingUseCase,
  ListDelegationsUseCase,
  ListUserAutoFlowsUseCase,
} from "../../../application/usecases";
import {
  DelegateRepository,
  SavingExecutionRepository,
  TimeBasedSavingRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import { Request, Response } from "express";
import { createDelegationSchema } from "../schemas";
import { BadRequestError, NotFoundError } from "../../../utils/errors";
import { AllowanceFrequency, DelegationType } from "../../../domain/entities";

export class DelegationController {
  private readonly logger: winston.Logger;
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {
    this.logger = createLogger(DelegationController.name, config);
  }

  createDelegation = async (req: AuthRequest, res: Response) => {
    const payload = validateJsonPayload(
      req.body,
      createDelegationSchema,
      this.logger
    );

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const delegateRepo = new DelegateRepository(manager);
        const userRepo = new UserRepository(manager);

        const useCase = new CreateDelegationUseCase(
          delegateRepo,
          this.coreDeps.blockchainDelegationService,
          userRepo,
          this.config
        );

        if (payload.type === "group_wallet") {
          throw new BadRequestError("Group wallet not supported at this time");
        }

        const result = await useCase.execute({
          amountLimit: payload.amountLimit,
          name: payload.name,
          type: DelegationType.ALLOWANCE,
          fromUserId: req.user.sub,
          frequency: AllowanceFrequency.DAILY,
          startDate: payload.startDate,
          walletAddress: payload.walletAddress,
        });

        res.json(result);
      }
    );
  };

  listDelegation = async (req: AuthRequest, res: Response) => {
    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const delegateRepo = new DelegateRepository(manager);

        const useCase = new ListDelegationsUseCase(delegateRepo, this.config);

        const result = await useCase.listAllDelegationsByUser(req.user.sub);

        res.json(result.delegations);
      }
    );
  };

  listDelegationForSend = async (req: AuthRequest, res: Response) => {
    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const delegateRepo = new DelegateRepository(manager);

        const user = await userRepo.findById(req.user.sub);

        if (!user) {
          throw new NotFoundError("User not found");
        }

        const useCase = new ListDelegationsUseCase(delegateRepo, this.config);

        const result = await useCase.listDelegationsForSendOperation(
          user.smartAccountAddress
        );

        res.json(result.delegations);
      }
    );
  };
}
