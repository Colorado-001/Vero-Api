import { IUserRepository } from "../../domain/repositories";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { UpdateUserProfileDto, UserDto } from "../dto";

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: UpdateUserProfileDto, id: string): Promise<UserDto> {
    if (!input || Object.keys(input).length === 0) {
      throw new BadRequestError("Nothing to update");
    }

    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // ✅ apply updates safely
    user.update({
      ...(input.username !== undefined && { username: input.username }),
    });

    await this.userRepo.save(user);

    return {
      id: user.id,
      address: user.smartAccountAddress,
      deployed: user.deployed,
      email: user.email,
      enabled: user.deployed,
      implementation: user.implementation,
      username: user.username,
      pinSetup: user.pinSetup,
    };
  }
}
