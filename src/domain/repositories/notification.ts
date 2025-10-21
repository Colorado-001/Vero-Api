import { PageOptions } from "../../types/common";
import { NotificationEntity } from "../entities";

export interface INotificationRepository {
  save(notification: NotificationEntity): Promise<void>;
  findByUserId(
    userId: string,
    options: PageOptions
  ): Promise<NotificationEntity[]>;
}
