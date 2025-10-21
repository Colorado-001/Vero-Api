import winston from "winston";
import { NotificationEntity } from "../../../domain/entities";
import {
  AllowanceWithdrawnEvent,
  SavingExecutionEvent,
} from "../../../domain/events";
import { IDomainEventBus } from "../../../domain/ports";
import { INotificationRepository } from "../../../domain/repositories";
import createLogger from "../../../logging/logger.config";
import { Env } from "../../../config/env";
import { InsufficientAmountError } from "../../../utils/errors";

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
      (event) => this.onAllowanceWithdrawn(event)
    );
    eventBus.subscribe<SavingExecutionEvent>(
      SavingExecutionEvent.eventName,
      (event) => this.onSavingExecutionEvent(event)
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

  private async onSavingExecutionEvent(event: SavingExecutionEvent) {
    this.logger.debug(`${SavingExecutionEvent.eventName} received...`);

    const payload = event.getPayload();

    let message;

    if (payload.type === "success") {
      const { displayAmount, name } = payload.saving;
      message = `${displayAmount} transferred to Savings (${name})`;
    } else {
      const { error, saving } = payload;
      if (error instanceof InsufficientAmountError) {
        message = `Attempt to save ${saving.displayAmount} failed due to insufficient funds`;
      } else {
        message = `Attempt to save ${saving.displayAmount} failed`;
      }
    }

    const notification = NotificationEntity.create(
      payload.type === "success" ? "success" : "critical",
      message,
      payload.saving.userId
    );

    await this.notificationRepo.save(notification);
  }
}
