import { IUserRepository } from "../../domain/repositories";
import { NotFoundError } from "../../utils/errors";
import { UpdateUserProfileDto } from "../dto";

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: UpdateUserProfileDto, id: string) {
    if (!input || Object.keys(input).length === 0) {
      return;
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
  }
}
