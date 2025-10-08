import { v4 as uuid4 } from "uuid";
import {
  BlockchainAddress,
  SmartAccountImplementation,
} from "../../types/blockchain";

export class UserEntity {
  private readonly _id!: string;
  private _email!: string;
  private _username!: string | null;
  private _privateKey!: string;
  private _smartAccountAddress!: BlockchainAddress;
  private _ownerEOA!: BlockchainAddress;
  private _implementation!: SmartAccountImplementation;
  private _deployed!: boolean;
  private _enabled!: boolean;
  private readonly _createdAt!: Date;
  private _updatedAt!: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id ?? uuid4();
    this._createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? this._createdAt;
  }

  static create(
    privateKey: string,
    smartAccountAddress: BlockchainAddress,
    ownerEOA: BlockchainAddress,
    implementation: SmartAccountImplementation,
    deployed: boolean,
    email: string,
    username?: string,
    orm?: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      enabled: boolean;
    }
  ) {
    const user = orm
      ? new UserEntity(orm.id, orm.createdAt, orm.updatedAt)
      : new UserEntity();

    user._privateKey = privateKey;
    user._smartAccountAddress = smartAccountAddress;
    user._ownerEOA = ownerEOA;
    user._implementation = implementation;
    user._deployed = deployed;
    user._enabled = orm?.enabled ?? false;
    user._email = email;
    user._username = username ?? null;

    return user;
  }

  get id() {
    return this._id;
  }
  get privateKey() {
    return this._privateKey;
  }
  get smartAccountAddress() {
    return this._smartAccountAddress;
  }
  get ownerEOA() {
    return this._ownerEOA;
  }
  get implementation() {
    return this._implementation;
  }
  get deployed() {
    return this._deployed;
  }
  get enabled() {
    return this._enabled;
  }
  get email() {
    return this._email;
  }
  get username() {
    return this._username;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  enable() {
    this._enabled = true;
    this._updatedAt = new Date();
  }

  disable() {
    this._enabled = false;
    this._updatedAt = new Date();
  }
}
