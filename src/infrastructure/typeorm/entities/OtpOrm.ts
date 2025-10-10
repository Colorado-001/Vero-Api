import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import { OtpType } from "../../../types/common.js";

@Entity({ name: "otps" })
@Index(["token", "type"])
export class OtpOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  code!: string;

  @Column({ type: "jsonb", nullable: true })
  data!: any;

  @Column("varchar")
  token!: string;

  @Column({ type: "varchar" })
  type!: OtpType;

  @CreateDateColumn()
  createdAt!: Date;
}
