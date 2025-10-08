import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express";
import { AuthValidator } from "../validators";
import { Env } from "../../../config/env";
import { CoreDependencies } from "../../../config/factory";
import {
  OtpRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories";
import {
  SetupEmailSignupUseCase,
  VerifyEmailSignupUseCase,
} from "../../../application/usecases";
import { WalletSetupService } from "../../../application/services";

export class AuthController {
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {}

  signupEmail = async (req: AuthRequest, res: Response) => {
    const { email } = AuthValidator.validateEmailSignup(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const otpRepo = new OtpRepository(manager);

        const useCase = new SetupEmailSignupUseCase(
          otpRepo,
          userRepo,
          this.coreDeps.emailTemplateParser,
          this.coreDeps.notificationService
        );

        const token = await useCase.execute({ email });

        res.status(httpStatus.OK).json({ token });
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
