import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  save(user: UserEntity): Promise<void>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  delete(id: string): Promise<void>;
  //   findById(id: string): Promise<UserEntity | null>;
  //   findBySmartAccountAddress(address: string): Promise<UserEntity | null>;
  //   findByOwnerEOA(ownerEOA: string): Promise<UserEntity | null>;
}
