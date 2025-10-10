import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import { UserRepository } from "../../../infrastructure/typeorm/repositories/index.js";
import {
  CheckUsernameAvailabilityUseCase,
  GetUserByIdUseCase,
  SetupPinUseCase,
  UpdateUserProfileUseCase,
} from "../../../application/usecases/index.js";
import { UserValidator } from "../validators/UserValidator.js";

export class UserController {
  constructor(
    private readonly coreDeps: CoreDependencies,
    private readonly config: Env
  ) {}

  setupMyPin = async (req: AuthRequest, res: Response) => {
    const { pin } = UserValidator.validateSetupPin(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new SetupPinUseCase(userRepo);

        const result = await useCase.execute(pin, req.user.sub);

        res.status(httpStatus.OK).json(result);
      }
    );
  };

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

  isUsernameAvailable = async (req: AuthRequest, res: Response) => {
    const { username } = UserValidator.validateUsernameAvailableUpdate(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new CheckUsernameAvailabilityUseCase(userRepo);

        const result = await useCase.execute(username, req.user.sub);

        res.status(httpStatus.OK).json(result);
      }
    );
  };

  updateMyProfile = async (req: AuthRequest, res: Response) => {
    const data = UserValidator.validateProfileUpdate(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new UpdateUserProfileUseCase(userRepo);

        const user = await useCase.execute(data, req.user.sub);

        res.status(httpStatus.OK).json(user);
      }
    );
  };
}
