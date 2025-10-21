import { INotificationRepository } from "../../domain/repositories";
import { PageOptions } from "../../types/common";

export class ListNotificationUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async listByUser(userId: string, options: PageOptions) {
    if (!userId?.trim()) {
      throw new Error("Valid User ID is required");
    }

    const validatedOptions = {
      page: Math.max(1, options.page || 1),
      size: Math.max(1, Math.min(options.size || 20, 100)),
    };

    const result = await this.notificationRepo.findByUserId(
      userId,
      validatedOptions
    );

    return result.map((i) => i.toJSON());
  }
}
