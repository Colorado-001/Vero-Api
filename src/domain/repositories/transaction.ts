import { TransactionEntity } from "../entities";

export interface ITransactionRepository {
  save(txn: TransactionEntity): Promise<void>;
}
