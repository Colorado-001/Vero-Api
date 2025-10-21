import { v4 } from "uuid";

export const NOTIFICATION_LEVELS = ["success", "critical", "warning"] as const;
export type NotificationLevel = (typeof NOTIFICATION_LEVELS)[number];

export class NotificationEntity {
  private readonly _id: string;
  private _level!: NotificationLevel;
  private _message!: string;
  private _userId!: string;
  private readonly _createdAt: Date;

  private constructor(id?: string, createdAt?: Date) {
    this._id = id ?? v4();
    this._createdAt = createdAt ?? new Date();
  }

  static create(
    level: NotificationLevel,
    message: string,
    userId: string,
    id?: string,
    createdAt?: Date
  ): NotificationEntity {
    const notification = new NotificationEntity(id, createdAt);
    notification._level = level;
    notification._userId = userId;
    notification._message = message;
    return notification;
  }

  get id(): string {
    return this._id;
  }

  get message(): string {
    return this._message;
  }

  get level(): NotificationLevel {
    return this._level;
  }

  get userId(): string {
    return this._userId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
