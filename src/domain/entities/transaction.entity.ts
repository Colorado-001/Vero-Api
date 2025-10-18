import { v4 as uuid4 } from "uuid";
import { BlockchainAddress } from "../../types/blockchain.js";
import { TransactionGas, TransactionStatus } from "../../types/transaction.js";

export class TransactionEntity {
  private readonly _id!: string;
  private _hash!: string;
  private _userOpHash!: string;
  private _from!: BlockchainAddress;
  private _to!: BlockchainAddress;
  private _tokenAddress!: BlockchainAddress | null;
  private _amount!: string;
  private _status!: TransactionStatus;
  private _sponsored!: boolean;
  private _gas!: TransactionGas;
  private readonly _createdAt!: Date;
  private _completedAt!: Date | null;

  private constructor(
    id?: string,
    createdAt?: Date,
    completedAt?: Date | null
  ) {
    this._id = id ?? uuid4();
    this._createdAt = createdAt ?? new Date();
    this._completedAt = completedAt ?? null;
  }

  static create(
    hash: string,
    userOpHash: string,
    from: BlockchainAddress,
    to: BlockchainAddress,
    tokenAddress: BlockchainAddress | null,
    amount: string,
    status: TransactionStatus,
    sponsored: boolean,
    gas: TransactionGas,
    orm?: {
      id: string;
      createdAt: Date;
      completedAt: Date | null;
    }
  ) {
    const transaction = orm
      ? new TransactionEntity(orm.id, orm.createdAt, orm.completedAt)
      : new TransactionEntity();

    transaction._hash = hash;
    transaction._userOpHash = userOpHash;
    transaction._from = from;
    transaction._to = to;
    transaction._sponsored = sponsored;
    transaction._tokenAddress = tokenAddress;
    transaction._amount = amount;
    transaction._status = status;
    transaction._gas = gas;

    return transaction;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get hash(): string {
    return this._hash;
  }

  get userOpHash(): string {
    return this._userOpHash;
  }

  get from(): BlockchainAddress {
    return this._from;
  }

  get to(): BlockchainAddress {
    return this._to;
  }

  get tokenAddress(): BlockchainAddress | null {
    return this._tokenAddress;
  }

  get amount(): string {
    return this._amount;
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get sponsored(): boolean {
    return this._sponsored;
  }

  get gas(): TransactionGas {
    return this._gas;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  // Business methods
  complete(status: TransactionStatus) {
    if (status === "pending") {
      throw new Error("Cannot complete transaction with pending status");
    }
    this._status = status;
    this._completedAt = new Date();
  }

  toJSON() {
    return {
      id: this._id,
      hash: this._hash,
      userOpHash: this.userOpHash,
      from: this._from,
      to: this._to,
      tokenAddress: this._tokenAddress,
      amount: this._amount,
      status: this._status,
      sponsored: this._sponsored,
      gas: this._gas,
      createdAt: this._createdAt,
      completedAt: this._completedAt,
    };
  }
}
