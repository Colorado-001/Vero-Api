import { EntityManager, Repository } from "typeorm";
import { TransactionOrmEntity } from "../entities/index.js";
import { TransactionEntity } from "../../../domain/entities/index.js";
import { ITransactionRepository } from "../../../domain/repositories/index.js";

export class TransactionRepository implements ITransactionRepository {
  private readonly repo: Repository<TransactionOrmEntity>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(TransactionOrmEntity);
  }

  private mapToDomain(record: TransactionOrmEntity): TransactionEntity {
    const entity = TransactionEntity.create(
      record.hash,
      record.userOpHash,
      record.from,
      record.to,
      record.tokenAddress,
      record.amount,
      record.status,
      record.sponsored,
      record.gas,
      {
        id: record.id,
        createdAt: record.createdAt,
        completedAt: record.completedAt || null,
      }
    );

    return entity;
  }

  async save(txn: TransactionEntity): Promise<void> {
    const record = this.repo.create({
      id: txn.id,
      amount: txn.amount,
      completedAt: txn.completedAt || undefined,
      createdAt: txn.createdAt,
      from: txn.from,
      gas: txn.gas,
      hash: txn.hash,
      sponsored: txn.sponsored,
      status: txn.status,
      to: txn.to,
      tokenAddress: txn.tokenAddress,
      userOpHash: txn.userOpHash,
    });

    await this.repo.save(record);
  }
}
