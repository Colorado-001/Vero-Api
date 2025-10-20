// infrastructure/database/typeorm/repositories/delegation.repository.ts
import { EntityManager, Repository } from "typeorm";

import { IDelegationRepository } from "../../../domain/repositories";
import { DelegationOrm } from "../entities";
import {
  AllowanceDelegation,
  Delegation,
  DelegationType,
  GroupWalletDelegation,
  isAllowanceDelegation,
  isGroupWalletDelegation,
} from "../../../domain/entities";

export class DelegateRepository implements IDelegationRepository {
  private repository: Repository<DelegationOrm>;

  constructor(manager: EntityManager) {
    this.repository = manager.getRepository(DelegationOrm);
  }

  private toDomain(model: DelegationOrm): Delegation {
    if (model.type === DelegationType.ALLOWANCE) {
      return new AllowanceDelegation({
        id: model.id,
        type: model.type,
        name: model.name,
        userId: model.userId,
        amountLimit: parseFloat(model.amountLimit as any),
        walletAddress: model.walletAddress!,
        frequency: model.frequency!,
        startDate: model.startDate!,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      });
    } else {
      return new GroupWalletDelegation({
        id: model.id,
        type: model.type,
        name: model.name,
        userId: model.userId,
        amountLimit: parseFloat(model.amountLimit as any),
        members: model.members!,
        approvalThreshold: model.approvalThreshold!,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      });
    }
  }

  private toPersistence(delegation: Delegation): DelegationOrm {
    const model = new DelegationOrm();
    model.id = delegation.id;
    model.type = delegation.type;
    model.name = delegation.name;
    model.userId = delegation.userId;
    model.amountLimit = delegation.amountLimit;

    if (isAllowanceDelegation(delegation)) {
      model.walletAddress = delegation.walletAddress;
      model.frequency = delegation.frequency;
      model.startDate = delegation.startDate;
    } else if (isGroupWalletDelegation(delegation)) {
      model.members = delegation.members;
      model.approvalThreshold = delegation.approvalThreshold;
    }

    model.createdAt = delegation.createdAt;
    model.updatedAt = delegation.updatedAt;

    return model;
  }

  async save(delegation: Delegation): Promise<Delegation> {
    const model = this.toPersistence(delegation);
    const savedModel = await this.repository.save(model);
    return this.toDomain(savedModel);
  }

  async findById(id: string): Promise<Delegation | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? this.toDomain(model) : null;
  }

  async findByUserId(userId: string): Promise<Delegation[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return models.map((model) => this.toDomain(model));
  }

  async findByType(
    userId: string,
    type: DelegationType
  ): Promise<Delegation[]> {
    const models = await this.repository.find({
      where: { userId, type },
      order: { createdAt: "DESC" },
    });
    return models.map((model) => this.toDomain(model));
  }

  async findByWalletAddress(walletAddress: string): Promise<Delegation[]> {
    const models = await this.repository.find({
      where: { walletAddress, type: DelegationType.ALLOWANCE },
    });
    return models.map((model) => this.toDomain(model));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
