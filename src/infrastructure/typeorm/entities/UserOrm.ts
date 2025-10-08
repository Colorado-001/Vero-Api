import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import {
  BlockchainAddress,
  SmartAccountImplementation,
} from "../../../types/blockchain";

@Entity({ name: "users" })
@Index(["smartAccountAddress", "ownerEOA"], { unique: true })
export class UserOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ type: "text" })
  privateKey!: BlockchainAddress;

  @Column({ type: "varchar", length: 100 })
  smartAccountAddress!: BlockchainAddress;

  @Column({ type: "varchar", length: 100 })
  ownerEOA!: BlockchainAddress;

  @Column({ type: "varchar", length: 50 })
  implementation!: SmartAccountImplementation;

  @Column({ type: "boolean", default: false })
  deployed!: boolean;

  @Column({ type: "boolean", default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
