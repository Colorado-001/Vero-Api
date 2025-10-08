import { EntityManager, Repository } from "typeorm";
import { UserOrmEntity } from "../entities";
import { UserEntity } from "../../../domain/entities";
import { IUserRepository } from "../../../domain/repositories";

export class UserRepository implements IUserRepository {
  private readonly repo: Repository<UserOrmEntity>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(UserOrmEntity);
  }

  private mapToDomain(record: UserOrmEntity): UserEntity {
    const entity = UserEntity.create(
      record.privateKey,
      record.smartAccountAddress,
      record.ownerEOA,
      record.implementation,
      record.deployed,
      record.email,
      record.username ?? undefined,
      {
        id: record.id,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        enabled: record.enabled,
      }
    );

    return entity;
  }

  async save(user: UserEntity): Promise<void> {
    const record = this.repo.create({
      id: user.id,
      privateKey: user.privateKey,
      smartAccountAddress: user.smartAccountAddress,
      ownerEOA: user.ownerEOA,
      implementation: user.implementation,
      deployed: user.deployed,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      username: user.username,
    });

    await this.repo.save(record);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.repo.findOne({ where: { email } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const record = await this.repo.findOne({
      where: { username },
    });
    return record ? this.mapToDomain(record) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
