import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  TransactionGas,
  TransactionStatus,
} from "../../../types/transaction.js";
import { BlockchainAddress } from "../../../types/blockchain.js";

@Entity({ name: "transactions" })
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  hash!: string;

  @Column({ type: "text" })
  userOpHash!: string;

  @Column({ type: "varchar" })
  from!: BlockchainAddress;

  @Column({ type: "varchar" })
  to!: BlockchainAddress;

  @Column({ type: "varchar", nullable: true })
  tokenAddress!: BlockchainAddress | null;

  @Column({ type: "varchar" })
  amount!: string;

  @Column({ type: "enum", enum: ["pending", "success", "failed"] })
  status!: TransactionStatus;

  @Column({ type: "boolean" })
  sponsored!: boolean;

  @Column({ type: "jsonb" })
  gas!: TransactionGas;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  completedAt?: Date;
}
