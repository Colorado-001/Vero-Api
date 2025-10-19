import { TimeBasedSaving } from "../entities";

export interface ITimeBasedSavingRepository {
  save(saving: TimeBasedSaving): Promise<void>;
  findById(id: string): Promise<TimeBasedSaving>;
  findByUserId(userId: string): Promise<TimeBasedSaving[]>;
  findByUserIdAndActive(userId: string): Promise<TimeBasedSaving[]>;
  findAllActive(): Promise<TimeBasedSaving[]>;
  delete(id: string): Promise<void>;

  updateProgress(savingId: string, progress: any): Promise<void>;
  findSavingsDueForExecution(date: Date): Promise<TimeBasedSaving[]>;
  findSavingsByStatus(isActive: boolean): Promise<TimeBasedSaving[]>;
}
