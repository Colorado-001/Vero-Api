import { IUserRepository } from "../../domain/repositories/index.js";
import { NotFoundError } from "../../utils/errors/index.js";
import { UserDto } from "../dto/index.js";

export class GetUserByIdUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<UserDto> {
    const user = await this.userRepo.findById(id);

    if (!user) {
      throw new NotFoundError("User does not exist");
    }

    return {
      id: user.id,
      address: user.smartAccountAddress,
      deployed: user.deployed,
      email: user.email,
      enabled: user.deployed,
      implementation: user.implementation,
      username: user.username,
    };
  }
}
