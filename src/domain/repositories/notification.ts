import { NotificationEntity } from "../entities";

export interface INotificationRepository {
  save(notification: NotificationEntity): Promise<void>;
}
