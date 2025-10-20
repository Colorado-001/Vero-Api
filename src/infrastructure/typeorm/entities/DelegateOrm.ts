import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserOrmEntity } from "./UserOrm";
import { AllowanceFrequency, DelegationType } from "../../../domain/entities";

@Entity("delegations")
export class DelegationOrm {
  @PrimaryColumn("varchar")
  id!: string;

  @Column({
    type: "enum",
    enum: DelegationType,
  })
  type!: DelegationType;

  @Column("varchar")
  name!: string;

  @Column("varchar")
  userId!: string;

  @Column("decimal", { precision: 18, scale: 8 })
  amountLimit!: number;

  // Allowance-specific fields (nullable for group wallet)
  @Column("varchar", { nullable: true })
  walletAddress?: string;

  @Column({
    type: "enum",
    enum: AllowanceFrequency,
    nullable: true,
  })
  frequency?: AllowanceFrequency;

  @Column("timestamp", { nullable: true })
  startDate?: Date;

  // Group wallet-specific fields (nullable for allowance)
  @Column("jsonb", { nullable: true })
  members?: Array<{ name: string; address: string }>;

  @Column("int", { nullable: true })
  approvalThreshold?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "jsonb", nullable: true })
  signedBlockchainDelegation: any;

  // Relationships
  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;
}
