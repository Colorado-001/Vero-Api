import { EntityManager, Repository } from "typeorm";
import { OtpOrmEntity } from "../entities/index.js";
import { OtpEntity } from "../../../domain/entities/index.js";
import { OtpType } from "../../../types/common.js";
import { IOtpRepository } from "../../../domain/repositories/index.js";

export class OtpRepository implements IOtpRepository {
  private readonly repo: Repository<OtpOrmEntity>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(OtpOrmEntity);
  }

  async save<Data extends object | undefined>(
    otp: OtpEntity<Data>
  ): Promise<void> {
    const record = this.repo.create({
      id: otp.id,
      code: otp.code,
      data: otp.data || null,
      token: otp.token,
      type: otp.type,
      createdAt: otp.createdAt,
    });

    await this.repo.save(record);
  }

  async findByToken<Data extends object | undefined>(
    token: string,
    type: OtpType
  ): Promise<OtpEntity<Data> | null> {
    const record = await this.repo.findOne({
      where: { token, type },
      order: {
        createdAt: "DESC",
      },
    });
    if (!record) return null;

    const entity = OtpEntity.create<Data>(
      record.code,
      record.token,
      record.type,
      record.data ?? undefined,
      record.id,
      record.createdAt
    );

    return entity;
  }

  async delete(token: string, type: OtpType): Promise<void> {
    await this.repo.delete({ token, type });
  }
}
