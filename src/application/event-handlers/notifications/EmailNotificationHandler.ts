import winston from "winston";
import { SendVerifyOtpEvent } from "../../../domain/events";
import {
  IDomainEventBus,
  IEmailTemplateParser,
  INotificationService,
} from "../../../domain/ports";
import createLogger from "../../../logging/logger.config";
import { Env } from "../../../config/env";

export class EmailNotificationHandler {
  private readonly logger: winston.Logger;

  constructor(
    private readonly emailParser: IEmailTemplateParser,
    private readonly notificationService: INotificationService,
    config: Env
  ) {
    this.logger = createLogger(EmailNotificationHandler.name, config);
  }

  setupSubscriptions(eventBus: IDomainEventBus): void {
    eventBus.subscribe<SendVerifyOtpEvent>("SendVerifyOtp", (event) =>
      this.onSendVerifyOtp(event)
    );
  }

  private async onSendVerifyOtp(event: SendVerifyOtpEvent): Promise<void> {
    this.logger.debug(`${event.eventName} received...`);

    const payload = event.getPayload();

    if (payload.identifierType !== "email") {
      this.logger.warn(
        `Received verify otp event for phone ${payload.identifier} Skipping...`
      );
      return;
    }

    const action = payload.action;

    const { body, subject } = await this.emailParser.getBody(
      action === "login" ? "loginOtp" : "emailSignupOtp",
      {
        code: payload.code,
      }
    );

    await this.notificationService.sendEmail(body, payload.identifier, subject);
  }
}
