import httpStatus from "http-status";
import { Response } from "express";
import { EntityManager } from "typeorm";

import { AuthRequest } from "../express.js";
import { Env } from "../../../config/env.js";
import { CoreDependencies } from "../../../config/factory.js";
import { UserRepository } from "../../../infrastructure/typeorm/repositories/index.js";
import {
  GetUserByIdUseCase,
  UpdateUserProfileUseCase,
} from "../../../application/usecases/index.js";
import { UserValidator } from "../validators/UserValidator.js";

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

  updateMyProfile = async (req: AuthRequest, res: Response) => {
    const data = UserValidator.validateProfileUpdate(req);

    await this.coreDeps.persistenceSessionManager.executeInTransaction(
      async (manager: EntityManager) => {
        const userRepo = new UserRepository(manager);

        const useCase = new UpdateUserProfileUseCase(userRepo);

        await useCase.execute(data, req.user.sub);

        res.status(httpStatus.OK).json({ success: true });
      }
    );
  };
}
