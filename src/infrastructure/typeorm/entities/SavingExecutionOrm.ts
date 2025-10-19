import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { TimeBasedSavingOrm } from "./TimeBasedSavingOrm";
import { ExecutionStatus } from "../../../utils/enums";

@Entity("saving_executions")
@Index(["savingId", "scheduledDate"])
@Index(["status", "scheduledDate"])
export class SavingExecutionOrm {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  @Index()
  savingId!: string;

  @Column("timestamp")
  @Index()
  scheduledDate!: Date;

  @Column("timestamp", { nullable: true })
  executedAt!: Date;

  @Column({
    type: "enum",
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  @Index()
  status!: ExecutionStatus;

  @Column("decimal", { precision: 18, scale: 8 })
  amount!: number;

  @Column("varchar", { nullable: true })
  transactionHash!: string;

  @Column("text", { nullable: true })
  errorMessage!: string;

  @Column("int", { default: 0 })
  retryCount!: number;

  @Column("jsonb", { default: {} })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => TimeBasedSavingOrm, (saving) => saving.executions)
  @JoinColumn({ name: "savingId" })
  saving!: TimeBasedSavingOrm;
}
