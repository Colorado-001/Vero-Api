import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import { UserRepository } from "../../../infrastructure/typeorm/repositories/index.js";
import { GetPortfolioUseCase } from "../../../application/usecases/GetPortfolioUseCase.js";

export class WalletController {
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {}

  getPortfolio = async (req: AuthRequest, res: Response) => {
    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new GetPortfolioUseCase(
          this.coreDeps.portfolioService,
          userRepo
        );

        const result = await useCase.execute(req.user.sub);

        res.status(httpStatus.OK).json(result);
      }
    );
  };
}
