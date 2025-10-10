import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express.js";
import { AuthValidator } from "../validators/index.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import {
  OtpRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories/index.js";
import {
  GetUserByIdUseCase,
  VerifyEmailSignupUseCase,
} from "../../../application/usecases/index.js";

export class UserController {
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {}

  getLoggedInUser = async (req: AuthRequest, res: Response) => {
    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new GetUserByIdUseCase(userRepo);

        const user = await useCase.execute(req.user.sub);

        res.status(httpStatus.OK).json({ ...user });
      }
    );
  };

  verifySignupEmail = async (req: AuthRequest, res: Response) => {
    const data = AuthValidator.validateVerifyEmailSignup(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const otpRepo = new OtpRepository(manager);

        const useCase = new VerifyEmailSignupUseCase(
          otpRepo,
          userRepo,
          this.coreDeps.walletSetupService,
          this.coreDeps.jwtService
        );

        const access_token = await useCase.execute(data);

        res.status(httpStatus.OK).json({ access_token });
      }
    );
  };
}
