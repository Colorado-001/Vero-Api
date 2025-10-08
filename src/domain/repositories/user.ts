import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  save(user: UserEntity): Promise<void>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  delete(id: string): Promise<void>;
  //   findBySmartAccountAddress(address: string): Promise<UserEntity | null>;
  //   findByOwnerEOA(ownerEOA: string): Promise<UserEntity | null>;
}
