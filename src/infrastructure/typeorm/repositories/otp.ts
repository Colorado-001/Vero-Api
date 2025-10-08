import { EntityManager, Repository } from "typeorm";
import { OtpOrmEntity } from "../entities";
import { OtpEntity } from "../../../domain/entities";
import { OtpType } from "../../../types/common";
import { OTP_EXPIRY_SECONDS } from "../../../utils/constants";
import { IOtpRepository } from "../../../domain/repositories";

export class OtpRepository implements IOtpRepository {
  private readonly repo: Repository<OtpOrmEntity>;

  constructor(manager: EntityManager) {
    this.repo = manager.getRepository(OtpOrmEntity);
  }

  async save(otp: OtpEntity): Promise<void> {
    const record = this.repo.create({
      id: otp.id,
      code: otp.code,
      identifier: otp.identifier,
      token: otp.token,
      type: otp.type,
      createdAt: otp.createdAt,
    });

    await this.repo.save(record);
  }

  async findByToken(token: string, type: OtpType): Promise<OtpEntity | null> {
    const record = await this.repo.findOne({ where: { token, type } });
    if (!record) return null;

    const entity = OtpEntity.create(
      record.code,
      record.identifier,
      record.token,
      record.type,
      record.id,
      record.createdAt
    );

    // auto-delete expired OTPs
    const diff = (Date.now() - record.createdAt.getTime()) / 1000;
    if (diff > OTP_EXPIRY_SECONDS) {
      await this.delete(token, type);
      return null;
    }

    return entity;
  }

  async delete(token: string, type: OtpType): Promise<void> {
    await this.repo.delete({ token, type });
  }
}
