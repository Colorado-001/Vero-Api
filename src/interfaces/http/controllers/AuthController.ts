import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express.js";
import { AuthValidator } from "../validators/AuthValidator.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import {
  OtpRepository,
  UserRepository,
} from "../../../infrastructure/typeorm/repositories/index.js";
import {
  LoginUseCase,
  SetupEmailSignupUseCase,
  VerifyEmailSignupUseCase,
  VerifyLoginUseCase,
} from "../../../application/usecases/index.js";

export class AuthController {
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {}

  login = async (req: AuthRequest, res: Response) => {
    const { email } = AuthValidator.validateEmailSignup(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const otpRepo = new OtpRepository(manager);

        const useCase = new LoginUseCase(
          otpRepo,
          userRepo,
          this.coreDeps.domainEventBus
        );

        const token = await useCase.execute({ email });

        res.status(httpStatus.OK).json({ token });
      }
    );
  };

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

  verifyLogin = async (req: AuthRequest, res: Response) => {
    const data = AuthValidator.validateVerifyEmailSignup(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);
        const otpRepo = new OtpRepository(manager);

        const useCase = new VerifyLoginUseCase(
          otpRepo,
          userRepo,
          this.coreDeps.jwtService
        );

        const access_token = await useCase.execute(data);

        res.status(httpStatus.OK).json({ access_token });
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
          this.coreDeps.jwtService,
          this.coreDeps.qrGenService
        );

        const access_token = await useCase.execute(data);

        res.status(httpStatus.OK).json({ access_token });
      }
    );
  };
}
