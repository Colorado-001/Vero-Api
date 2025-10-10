import { Env } from "../../config/env";
import { INotificationService } from "../../domain/ports";
import { MockNotificationService } from "../notification";

export function createNotificationService(config: Env): INotificationService {
  switch (config.NOTIFICATION_SERVICE) {
    case "mailgun":
      throw new Error("Not Implemented");

    case "mock":
    default:
      return new MockNotificationService();
  }
}
