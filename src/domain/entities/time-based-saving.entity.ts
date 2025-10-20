import { v4 as uuid4 } from "uuid";
import {
  AutoflowFrequency,
  ISavingProgress,
  ITimeBasedSavingProps,
} from "../../types/saving";
import { ValueError } from "../../utils/errors";

export class TimeBasedSaving {
  private _id: number;
  private _name: string;
  private _frequency: AutoflowFrequency;
  private _dayOfMonth: number;
  private _amountToSave: number;
  private _tokenToSave: string;
  private _userId: string;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _progress: ISavingProgress;

  constructor(props: ITimeBasedSavingProps) {
    this._id = props.id || this.generateId();
    this._frequency = props.frequency;
    this._dayOfMonth = props.dayOfMonth;
    this._amountToSave = props.amountToSave;
    this._tokenToSave = props.tokenToSave;
    this._userId = props.userId;
    this._name = props.name;
    this._isActive = props.isActive ?? true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this._progress = props.progress || this.initializeProgress();
    this.validate();
  }

  private initializeProgress(): ISavingProgress {
    return {
      totalSaved: 0,
      lastSavedAt: null,
      nextScheduledDate: this.calculateNextScheduledDate(),
      successfulExecutions: 0,
      failedExecutions: 0,
      consecutiveFailures: 0,
      totalExpected: this.calculateTotalExpected(),
    };
  }

  private calculateNextScheduledDate(): Date {
    const now = new Date();

    switch (this._frequency) {
      case "daily":
        return new Date(now.setDate(now.getDate() + 1));

      case "weekly":
        return new Date(now.setDate(now.getDate() + 7));

      case "monthly":
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(
          Math.min(this._dayOfMonth, this.getDaysInMonth(nextMonth))
        );
        return nextMonth;

      case "yearly":
        const nextYear = new Date(now);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        return nextYear;

      default:
        return new Date(now.setDate(now.getDate() + 1));
    }
  }

  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  private calculateTotalExpected(): number {
    return this._amountToSave;
  }

  public recordSuccessfulSave(
    amount: number,
    savedAt: Date = new Date()
  ): void {
    this._progress.totalSaved += amount;
    this._progress.lastSavedAt = savedAt;
    this._progress.successfulExecutions += 1;
    this._progress.consecutiveFailures = 0;
    this._progress.nextScheduledDate = this.calculateNextScheduledDate();
    this._updatedAt = new Date();
  }

  public recordFailedSave(): void {
    this._progress.failedExecutions += 1;
    this._progress.consecutiveFailures += 1;
    this._progress.nextScheduledDate = this.calculateNextScheduledDate();
    this._updatedAt = new Date();
  }

  public updateProgress(updates: Partial<ISavingProgress>): void {
    this._progress = { ...this._progress, ...updates };
    this._updatedAt = new Date();
  }

  public getProgress(): ISavingProgress {
    return { ...this._progress };
  }

  public calculateCompletionPercentage(): number {
    if (this._progress.totalExpected <= 0) return 0;
    return (this._progress.totalSaved / this._progress.totalExpected) * 100;
  }

  public isOverdue(): boolean {
    return new Date() > this._progress.nextScheduledDate;
  }

  public getDaysUntilNextSaving(): number {
    const now = new Date();
    const diffTime = this._progress.nextScheduledDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private generateId(): number {
    return 0;
  }

  private validate(): void {
    if (
      this._frequency !== "monthly" &&
      this._frequency !== "every_n_minutes"
    ) {
      throw new ValueError(
        `${this._frequency} frequency is not supported at this time`
      );
    }

    if (this.frequency === "monthly") {
      if (this._dayOfMonth < 1 || this._dayOfMonth > 31) {
        throw new Error("Day of month must be between 1 and 31");
      }
    }

    if (
      this._frequency === "every_n_minutes" &&
      (this._dayOfMonth < 1 || this._dayOfMonth > 60)
    ) {
      throw new Error("Minute internal must be from 1 to 60");
    }

    if (this._amountToSave <= 0) {
      throw new Error("Amount to save must be positive");
    }

    if (!this._tokenToSave || this._tokenToSave.trim() === "") {
      throw new Error("Token to save is required");
    }

    if (!this._userId || this._userId.trim() === "") {
      throw new Error("User ID is required");
    }
  }

  // Getters
  get id(): number {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get frequency(): AutoflowFrequency {
    return this._frequency;
  }
  get dayOfMonth(): number {
    return this._dayOfMonth;
  }
  get amountToSave(): number {
    return this._amountToSave;
  }
  get tokenToSave(): string {
    return this._tokenToSave;
  }
  get userId(): string {
    return this._userId;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  public getCronExpression(): string {
    const timeOfDay = "12"; // Default to 12:00 PM UTC
    const minute = "0";

    switch (this._frequency) {
      case "monthly":
        // Run on specific day of month at specified time
        // Handle day 31 by using "L" for last day in shorter months
        const day = this._dayOfMonth > 28 ? "L" : this._dayOfMonth.toString();
        return `${minute} ${timeOfDay} ${day} * *`;

      case "every_n_minutes":
        return `${this._dayOfMonth} * * * *`;

      default:
        throw new ValueError(
          `${this._frequency} frequency is not supported at this time`
        );
    }
  }

  public updateFrequency(frequency: AutoflowFrequency): void {
    this._frequency = frequency;
    this._updatedAt = new Date();
    this.validate();
  }

  public updateAmount(amount: number): void {
    this._amountToSave = amount;
    this._updatedAt = new Date();
    this.validate();
  }

  public updateDayOfMonth(day: number): void {
    this._dayOfMonth = day;
    this._updatedAt = new Date();
    this.validate();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      frequency: this._frequency,
      dayOfMonth: this._dayOfMonth,
      amountToSave: this._amountToSave,
      tokenToSave: this._tokenToSave,
      userId: this._userId,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
