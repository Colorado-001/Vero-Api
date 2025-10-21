import { EntityManager, Repository } from "typeorm";
import { NotificationOrm } from "../entities/index.js";
import { NotificationEntity } from "../../../domain/entities/index.js";
import { INotificationRepository } from "../../../domain/repositories/index.js";
import { PageOptions } from "../../../types/common.js";

export class NotificationRepository implements INotificationRepository {
  private readonly repo: Repository<NotificationOrm>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(NotificationOrm);
  }

  async findByUserId(
    userId: string,
    options: PageOptions
  ): Promise<NotificationEntity[]> {
    const offset = (options.page - 1) * options.size;
    const models = await this.repo.find({
      where: {
        userId,
      },
      take: options.size,
      skip: offset,
      order: {
        createdAt: "DESC",
      },
    });
    return models.map(this.toDomain);
  }

  private toDomain(model: NotificationOrm): NotificationEntity {
    return NotificationEntity.create(
      model.level,
      model.message,
      model.userId,
      model.id,
      model.createdAt
    );
  }

  private toPersistence(delegation: NotificationEntity): NotificationOrm {
    const model = new NotificationOrm();
    model.id = delegation.id;
    model.level = delegation.level;
    model.message = delegation.message;
    model.userId = delegation.userId;
    model.createdAt = delegation.createdAt;
    return model;
  }

  async save(notification: NotificationEntity): Promise<void> {
    const model = this.toPersistence(notification);
    await this.repo.save(model);
  }
}
