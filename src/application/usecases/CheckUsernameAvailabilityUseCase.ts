import { IUserRepository } from "../../domain/repositories";
import { UsernameAvailabilityResDto } from "../dto";

export class CheckUsernameAvailabilityUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    username: string,
    userId: string
  ): Promise<UsernameAvailabilityResDto> {
    const user = await this.userRepo.findByUsername(username);

    if (!user) {
      return {
        isAvailable: true,
        isYou: false,
      };
    }

    return {
      isAvailable: false,
      isYou: user.id === userId,
    };
  }
}
