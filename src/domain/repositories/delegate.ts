import { Delegation, DelegationType } from "../entities";

export interface IDelegationRepository {
  save(delegation: Delegation): Promise<Delegation>;
  findById(id: string): Promise<Delegation | null>;
  findByUserId(userId: string): Promise<Delegation[]>;
  findByType(userId: string, type: DelegationType): Promise<Delegation[]>;
  findByWalletAddress(walletAddress: string): Promise<Delegation[]>;
  delete(id: string): Promise<void>;
}
