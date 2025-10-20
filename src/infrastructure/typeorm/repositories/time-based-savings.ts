import { EntityManager, Repository } from "typeorm";
import { TimeBasedSavingOrm } from "../entities/index.js";
import { TimeBasedSaving } from "../../../domain/entities/index.js";
import { ITimeBasedSavingRepository } from "../../../domain/repositories/index.js";
import { NotFoundError } from "../../../utils/errors/index.js";

export class TimeBasedSavingRepository implements ITimeBasedSavingRepository {
  private readonly repo: Repository<TimeBasedSavingOrm>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(TimeBasedSavingOrm);
  }

  private mapToDomain(record: TimeBasedSavingOrm): TimeBasedSaving {
    return new TimeBasedSaving({
      ...record,
    });
  }

  async save(saving: TimeBasedSaving) {
    const ormEntity = this.repo.create({
      id: saving.id > 0 ? saving.id : undefined,
      amountToSave: saving.amountToSave,
      createdAt: saving.createdAt,
      dayOfMonth: saving.dayOfMonth,
      frequency: saving.frequency,
      isActive: saving.isActive,
      name: saving.name,
      progress: saving.getProgress(),
      tokenToSave: saving.tokenToSave,
      updatedAt: saving.updatedAt,
      userId: saving.userId,
    });
    const savedEntity = await this.repo.save(ormEntity);
    return this.mapToDomain(savedEntity);
  }

  async findById(id: number): Promise<TimeBasedSaving> {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundError(`TimeBasedSaving with id ${id} not found`);
    }
    return this.mapToDomain(record);
  }

  async findByUserId(userId: string): Promise<TimeBasedSaving[]> {
    const result = await this.repo.findBy({ userId });
    return result.map(this.mapToDomain);
  }

  async findByUserIdAndActive(userId: string): Promise<TimeBasedSaving[]> {
    const result = await this.repo.findBy({ userId, isActive: true });
    return result.map(this.mapToDomain);
  }

  async findAllActive(): Promise<TimeBasedSaving[]> {
    const result = await this.repo.findBy({ isActive: true });
    return result.map(this.mapToDomain);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async updateProgress(savingId: number, progress: any): Promise<void> {
    const saving = await this.findById(savingId);
    saving.updateProgress(progress);
    await this.save(saving);
  }

  async findSavingsByStatus(isActive: boolean): Promise<TimeBasedSaving[]> {
    const result = await this.repo.findBy({ isActive });
    return result.map(this.mapToDomain);
  }
}
