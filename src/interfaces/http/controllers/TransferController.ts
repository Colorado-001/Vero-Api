import { EntityManager } from "typeorm";
import httpStatus from "http-status";
import { Response } from "express";

import { Env } from "../../../config/env";
import { CoreDependencies } from "../../../config/factory";
import { AuthRequest } from "../express";
import {
  DelegateRepository,
  TransactionRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import { GetTransferGasUseCase } from "../../../application/usecases";
import { validateJsonPayload } from "../../../utils/helpers";
import { getGasFeeSchema } from "../schemas";
import { BlockchainAddress } from "../../../types/blockchain";
import winston from "winston";
import createLogger from "../../../logging/logger.config";
import { InitiateTransferUseCase } from "../../../application/usecases/InitiateTransferUseCase";

export class TransferController {
  private readonly logger: winston.Logger;
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {
    this.logger = createLogger("TransferController", config);
  }

  getGas = async (req: AuthRequest, res: Response) => {
    const payload = validateJsonPayload(
      req.query,
      getGasFeeSchema,
      this.logger
    );

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const delegationRepo = new DelegateRepository(manager);

        const useCase = new GetTransferGasUseCase(
          this.coreDeps.walletTransferService,
          userRepo,
          delegationRepo
        );

        const result = await useCase.execute(
          req.user.sub,
          payload.amount,
          payload.to as BlockchainAddress,
          payload.tokenSymbol,
          payload.delegation
        );

        res.status(httpStatus.OK).json(result);
      }
    );
  };

  initiateTransfer = async (req: AuthRequest, res: Response) => {
    const payload = validateJsonPayload(req.body, getGasFeeSchema, this.logger);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const txnRepo = new TransactionRepository(manager);
        const delegationRepo = new DelegateRepository(manager);

        const useCase = new InitiateTransferUseCase(
          this.coreDeps.walletTransferService,
          userRepo,
          txnRepo,
          delegationRepo,
          this.coreDeps.domainEventBus,
          this.config
        );

        await useCase.execute(
          req.user.sub,
          payload.to as BlockchainAddress,
          payload.amount,
          payload.tokenSymbol,
          payload.delegation
        );

        res.status(httpStatus.OK).json({ success: true });
      }
    );
  };
}
