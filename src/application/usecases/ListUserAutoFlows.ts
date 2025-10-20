import winston from "winston";
import {
  ITimeBasedSavingRepository,
  IUserRepository,
} from "../../domain/repositories";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { SavingDto } from "../dto";
import { NotFoundError } from "../../utils/errors";

export class ListUserAutoFlowsUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly savingRepository: ITimeBasedSavingRepository,
    private readonly userRepository: IUserRepository,
    config: Env
  ) {
    this.logger = createLogger(ListUserAutoFlowsUseCase.name, config);
  }

  async execute(userId: string): Promise<SavingDto[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      this.logger.warn({
        message: "User not found",
        data: { userId: userId },
      });
      throw new NotFoundError("User not found");
    }

    this.logger.debug({
      message: "Fetched user successfully",
      data: { userId: user.id, smartAccount: user.smartAccountAddress },
    });

    const activeSavings = await this.savingRepository.findByUserIdAndActive(
      userId
    );

    // Return response
    const response: SavingDto[] = activeSavings.map((saving) => ({
      id: saving.id.toString(),
      name: saving.name,
      frequency: saving.frequency,
      dayOfMonth: saving.dayOfMonth,
      amountToSave: saving.amountToSave,
      tokenToSave: saving.tokenToSave,
      userId: saving.userId,
      isActive: saving.isActive,
      progress: saving.getProgress(),
      nextScheduledDate: saving.getProgress().nextScheduledDate,
      createdAt: saving.createdAt,
    }));

    return response;
  }
}
