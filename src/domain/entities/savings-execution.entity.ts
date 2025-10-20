import { v4 as uuid4 } from "uuid";
import { ISavingExecutionProps } from "../../types/saving";
import { ExecutionStatus } from "../../utils/enums";

export class SavingExecution {
  private _id: string;
  private _savingId: number;
  private _scheduledDate: Date;
  private _executedAt: Date | null;
  private _status: ExecutionStatus;
  private _amount: number;
  private _transactionHash: string | null;
  private _errorMessage: string | null;
  private _retryCount: number;
  private _metadata: Record<string, any>;

  constructor(props: ISavingExecutionProps) {
    this._id = props.id || this.generateId();
    this._savingId = props.savingId;
    this._scheduledDate = props.scheduledDate;
    this._executedAt = props.executedAt || null;
    this._status = props.status;
    this._amount = props.amount;
    this._transactionHash = props.transactionHash || null;
    this._errorMessage = props.errorMessage || null;
    this._retryCount = props.retryCount || 0;
    this._metadata = props.metadata || {};

    this.validate();
  }

  private generateId(): string {
    return `se_${uuid4()}`;
  }

  private validate() {}
}
