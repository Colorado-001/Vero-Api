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
  private _createdAt: Date;
  private _updatedAt: Date;

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
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  private generateId(): string {
    return `se_${uuid4()}`;
  }

  private validate(): void {
    if (!this._savingId || this._savingId <= 0) {
      throw new Error("Saving ID is required and must be positive");
    }

    if (!this._scheduledDate || isNaN(this._scheduledDate.getTime())) {
      throw new Error("Valid scheduled date is required");
    }

    if (this._executedAt && isNaN(this._executedAt.getTime())) {
      throw new Error("Executed date must be valid if provided");
    }

    if (!Object.values(ExecutionStatus).includes(this._status)) {
      throw new Error("Invalid execution status");
    }

    if (this._amount <= 0) {
      throw new Error("Amount must be positive");
    }

    if (this._retryCount < 0) {
      throw new Error("Retry count cannot be negative");
    }

    if (this._transactionHash && !this._transactionHash.startsWith("0x")) {
      throw new Error("Transaction hash must start with 0x");
    }

    // Validate scheduled date is not in the past for pending executions
    if (
      this._status === ExecutionStatus.PENDING &&
      this._scheduledDate < new Date()
    ) {
      throw new Error(
        "Scheduled date cannot be in the past for pending executions"
      );
    }

    // Validate executed date logic
    if (this._executedAt && this._executedAt < this._scheduledDate) {
      throw new Error("Executed date cannot be before scheduled date");
    }
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get savingId(): number {
    return this._savingId;
  }

  get scheduledDate(): Date {
    return this._scheduledDate;
  }

  get executedAt(): Date | null {
    return this._executedAt;
  }

  get status(): ExecutionStatus {
    return this._status;
  }

  get amount(): number {
    return this._amount;
  }

  get transactionHash(): string | null {
    return this._transactionHash;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business Methods
  public markAsSuccess(
    transactionHash: string,
    executedAt: Date = new Date()
  ): void {
    if (!transactionHash.startsWith("0x")) {
      throw new Error("Transaction hash must start with 0x");
    }

    this._status = ExecutionStatus.SUCCESS;
    this._executedAt = executedAt;
    this._transactionHash = transactionHash;
    this._errorMessage = null;
    this._retryCount = 0;
    this._updatedAt = new Date();

    this.addMetadata("successAt", executedAt);
    this.addMetadata("transactionHash", transactionHash);
  }

  public markAsFailed(
    errorMessage: string,
    executedAt: Date = new Date()
  ): void {
    this._status = ExecutionStatus.FAILED;
    this._executedAt = executedAt;
    this._errorMessage = errorMessage;
    this._retryCount += 1;
    this._updatedAt = new Date();

    this.addMetadata("failedAt", executedAt);
    this.addMetadata("errorMessage", errorMessage);
    this.addMetadata("retryCount", this._retryCount);
  }

  public markAsSkipped(reason?: string, executedAt: Date = new Date()): void {
    this._status = ExecutionStatus.SKIPPED;
    this._executedAt = executedAt;
    this._errorMessage = reason || null;
    this._updatedAt = new Date();

    this.addMetadata("skippedAt", executedAt);
    if (reason) {
      this.addMetadata("skipReason", reason);
    }
  }

  public retry(newScheduledDate: Date): void {
    if (newScheduledDate <= new Date()) {
      throw new Error("New scheduled date must be in the future");
    }

    this._status = ExecutionStatus.PENDING;
    this._scheduledDate = newScheduledDate;
    this._executedAt = null;
    this._transactionHash = null;
    this._errorMessage = null;
    this._updatedAt = new Date();

    this.addMetadata("retriedAt", new Date());
    this.addMetadata("newScheduledDate", newScheduledDate);
  }

  public isOverdue(): boolean {
    return (
      this._status === ExecutionStatus.PENDING &&
      this._scheduledDate < new Date()
    );
  }

  public canRetry(maxRetries: number = 3): boolean {
    return (
      this._status === ExecutionStatus.FAILED && this._retryCount < maxRetries
    );
  }

  public getDaysOverdue(): number {
    if (!this.isOverdue()) {
      return 0;
    }
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._scheduledDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public addMetadata(key: string, value: any): void {
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }

  public removeMetadata(key: string): void {
    delete this._metadata[key];
    this._updatedAt = new Date();
  }

  public updateAmount(newAmount: number): void {
    if (newAmount <= 0) {
      throw new Error("Amount must be positive");
    }

    if (this._status !== ExecutionStatus.PENDING) {
      throw new Error(
        "Cannot update amount for executed or skipped executions"
      );
    }

    this._amount = newAmount;
    this._updatedAt = new Date();
    this.addMetadata("amountUpdatedAt", new Date());
    this.addMetadata("previousAmount", this._amount);
  }

  public reschedule(newDate: Date): void {
    if (newDate <= new Date()) {
      throw new Error("New scheduled date must be in the future");
    }

    if (this._status !== ExecutionStatus.PENDING) {
      throw new Error("Can only reschedule pending executions");
    }

    this._scheduledDate = newDate;
    this._updatedAt = new Date();
    this.addMetadata("rescheduledAt", new Date());
    this.addMetadata("previousScheduledDate", this._scheduledDate);
  }

  // Serialization
  public toJSON(): object {
    return {
      id: this._id,
      savingId: this._savingId,
      scheduledDate: this._scheduledDate.toISOString(),
      executedAt: this._executedAt ? this._executedAt.toISOString() : null,
      status: this._status,
      amount: this._amount,
      transactionHash: this._transactionHash,
      errorMessage: this._errorMessage,
      retryCount: this._retryCount,
      metadata: { ...this._metadata },
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      isOverdue: this.isOverdue(),
      daysOverdue: this.getDaysOverdue(),
      canRetry: this.canRetry(),
    };
  }

  // Static methods
  public static createPending(
    savingId: number,
    scheduledDate: Date,
    amount: number
  ): SavingExecution {
    return new SavingExecution({
      savingId,
      scheduledDate,
      amount,
      status: ExecutionStatus.PENDING,
      retryCount: 0,
    });
  }

  public static createFromSuccess(
    savingId: number,
    scheduledDate: Date,
    amount: number,
    transactionHash: string
  ): SavingExecution {
    const execution = new SavingExecution({
      savingId,
      scheduledDate,
      amount,
      status: ExecutionStatus.SUCCESS,
      executedAt: new Date(),
      transactionHash,
      retryCount: 0,
    });

    return execution;
  }

  public static createFromFailure(
    savingId: number,
    scheduledDate: Date,
    amount: number,
    errorMessage: string
  ): SavingExecution {
    const execution = new SavingExecution({
      savingId,
      scheduledDate,
      amount,
      status: ExecutionStatus.FAILED,
      executedAt: new Date(),
      errorMessage,
      retryCount: 1,
    });

    return execution;
  }

  // Utility methods
  public toString(): string {
    return `SavingExecution[${this._id}]: ${this._status} - ${this._amount} for saving ${this._savingId}`;
  }

  public equals(other: SavingExecution): boolean {
    return this._id === other.id;
  }

  public clone(): SavingExecution {
    return new SavingExecution({
      id: this._id,
      savingId: this._savingId,
      scheduledDate: new Date(this._scheduledDate),
      executedAt: this._executedAt ? new Date(this._executedAt) : undefined,
      status: this._status,
      amount: this._amount,
      transactionHash: this._transactionHash || undefined,
      errorMessage: this._errorMessage || undefined,
      retryCount: this._retryCount,
      metadata: { ...this._metadata },
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    });
  }
}
