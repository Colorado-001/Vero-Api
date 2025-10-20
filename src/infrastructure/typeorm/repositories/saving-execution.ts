import { EntityManager, Repository } from "typeorm";
import { SavingExecutionOrm } from "../entities";
import { ISavingExecutionRepository } from "../../../domain/repositories";
import { SavingExecution } from "../../../domain/entities";
import { ExecutionStatus } from "../../../utils/enums";

export class SavingExecutionRepository implements ISavingExecutionRepository {
  private readonly repo: Repository<SavingExecutionOrm>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(SavingExecutionOrm);
  }

  private mapToDomain(record: SavingExecutionOrm): SavingExecution {
    return new SavingExecution({
      id: record.id,
      amount: record.amount,
      createdAt: record.createdAt,
      errorMessage: record.errorMessage,
      executedAt: record.executedAt,
      metadata: record.metadata,
      retryCount: record.retryCount,
      savingId: record.savingId,
      scheduledDate: record.scheduledDate,
      status: record.status,
      transactionHash: record.transactionHash || undefined,
      updatedAt: record.updatedAt,
    });
  }

  async save(execution: SavingExecution): Promise<SavingExecution> {
    const ormEntity = this.repo.create({
      id: execution.id,
      createdAt: execution.createdAt,
      errorMessage: execution.errorMessage || undefined,
      executedAt: execution.executedAt || undefined,
      amount: execution.amount,
      metadata: execution.metadata,
      retryCount: execution.retryCount,
      savingId: execution.savingId,
      scheduledDate: execution.scheduledDate,
      status: execution.status,
      transactionHash: execution.transactionHash || null,
      updatedAt: execution.updatedAt,
    });
    const savedEntity = await this.repo.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findBySavingId(savingId: number): Promise<SavingExecution[]> {
    const ormEntity = await this.repo.findBy({ savingId });
    return ormEntity.map(this.mapToDomain);
  }

  async findByStatus(status: ExecutionStatus): Promise<SavingExecution[]> {
    const ormEntity = await this.repo.findBy({ status });
    return ormEntity.map(this.mapToDomain);
  }

  async findFailedExecutions(): Promise<SavingExecution[]> {
    const ormEntity = await this.repo.findBy({
      status: ExecutionStatus.FAILED,
    });
    return ormEntity.map(this.mapToDomain);
  }

  // async findExecutionsBetweenDates(from: Date, to: Date): Promise<SavingExecution[]> {
  //   const ormEntity = await this.repo.findBy({
  //     status: ExecutionStatus.FAILED,
  //   });
  //   return ormEntity.map(this.mapToDomain);
  // }

  // deleteOldExecutions(retentionDays: number): Promise<void> {
  //   throw new Error("Method not implemented.");
  // }
}
