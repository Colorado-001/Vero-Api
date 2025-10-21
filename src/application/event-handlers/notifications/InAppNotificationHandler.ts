import winston from "winston";
import { NotificationEntity } from "../../../domain/entities";
import { AllowanceWithdrawnEvent } from "../../../domain/events";
import { IDomainEventBus } from "../../../domain/ports";
import { INotificationRepository } from "../../../domain/repositories";
import createLogger from "../../../logging/logger.config";
import { Env } from "../../../config/env";

export class InAppNotificationHandler {
  private readonly logger: winston.Logger;

  constructor(
    private readonly notificationRepo: INotificationRepository,
    config: Env
  ) {
    this.logger = createLogger(InAppNotificationHandler.name, config);
  }

  setupSubscriptions(eventBus: IDomainEventBus) {
    eventBus.subscribe<AllowanceWithdrawnEvent>(
      AllowanceWithdrawnEvent.eventName,
      this.onAllowanceWithdrawn
    );
  }

  private async onAllowanceWithdrawn(event: AllowanceWithdrawnEvent) {
    this.logger.debug(`${AllowanceWithdrawnEvent.eventName} received...`);

    const payload = event.getPayload();

    const message = `${payload.withdrawnBy} spent ${payload.amount} from ${payload.allocationName} (Allocation)`;
    const notification = NotificationEntity.create(
      "success",
      message,
      payload.ownerUserId,
      undefined,
      event.getOccurredOn()
    );
    await this.notificationRepo.save(notification);
  }
}
