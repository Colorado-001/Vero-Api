import { IUserRepository } from "../../domain/repositories";
import { hashPassword } from "../../utils/encryption";
import { BadRequestError, NotFoundError } from "../../utils/errors";
import { UserDto } from "../dto";

export class SetupPinUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(pin: string, userId: string): Promise<UserDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.pinSetup) {
      throw new BadRequestError("Pin is already setup");
    }

    const hashedPin = await hashPassword(pin);

    user.setPin(hashedPin);

    await this.userRepo.save(user);

    return user.toJSON();
  }
}
