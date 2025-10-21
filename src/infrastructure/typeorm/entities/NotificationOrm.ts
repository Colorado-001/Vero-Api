import {
  Column,
  CreateDateColumn,
  Entity,
  ForeignKey,
  PrimaryColumn,
} from "typeorm";
import {
  NOTIFICATION_LEVELS,
  NotificationLevel,
} from "../../../domain/entities";
import { UserOrmEntity } from "./UserOrm";

@Entity("notifications")
export class NotificationOrm {
  @PrimaryColumn("uuid")
  id!: string;

  @ForeignKey(() => UserOrmEntity, { onDelete: "CASCADE" })
  @Column("uuid")
  userId!: string;

  @Column("enum", { enum: NOTIFICATION_LEVELS })
  level!: NotificationLevel;

  @Column("text")
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
