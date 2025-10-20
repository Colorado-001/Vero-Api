import { ExecutionStatus } from "../../utils/enums";
import { SavingExecution } from "../entities";

export interface ISavingExecutionRepository {
  save(execution: SavingExecution): Promise<SavingExecution>;
  findBySavingId(savingId: number): Promise<SavingExecution[]>;
  findByStatus(status: ExecutionStatus): Promise<SavingExecution[]>;
  findFailedExecutions(): Promise<SavingExecution[]>;
  // findExecutionsBetweenDates(from: Date, to: Date): Promise<SavingExecution[]>;
  // deleteOldExecutions(retentionDays: number): Promise<void>;
}
