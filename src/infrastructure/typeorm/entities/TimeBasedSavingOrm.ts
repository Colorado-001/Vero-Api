import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ForeignKey,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AutoflowFrequency } from "../../../types/saving";
import { UserOrmEntity } from "./UserOrm";
import { SavingExecutionOrm } from "./SavingExecutionOrm";
import { AUTOFLOW_FREQUENCY } from "../../../utils/constants";

@Entity("time_based_savings")
@Index("idx_user_active", ["userId", "isActive"])
export class TimeBasedSavingOrm {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column("varchar")
  name!: string;

  @Column({
    type: "enum",
    enum: AUTOFLOW_FREQUENCY,
  })
  frequency!: AutoflowFrequency;

  @Column("integer")
  dayOfMonth!: number;

  @Column("decimal", { precision: 18, scale: 8 })
  amountToSave!: number;

  @Column("varchar")
  tokenToSave!: string;

  @Column({ type: "uuid" })
  @ForeignKey(() => UserOrmEntity)
  userId!: string;

  @Column("boolean", { default: true })
  @Index()
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column("jsonb", { default: {} })
  progress!: {
    totalSaved: number;
    lastSavedAt: Date | null;
    nextScheduledDate: Date;
    successfulExecutions: number;
    failedExecutions: number;
    consecutiveFailures: number;
    totalExpected: number;
  };

  @OneToMany(() => SavingExecutionOrm, (execution) => execution.saving)
  executions!: SavingExecutionOrm[];
}
