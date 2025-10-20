import { TimeBasedSaving } from "../entities";

export interface ITimeBasedSavingRepository {
  save(saving: TimeBasedSaving): Promise<TimeBasedSaving>;
  findById(id: number): Promise<TimeBasedSaving>;
  findByUserId(userId: string): Promise<TimeBasedSaving[]>;
  findByUserIdAndActive(userId: string): Promise<TimeBasedSaving[]>;
  findAllActive(): Promise<TimeBasedSaving[]>;
  delete(id: number): Promise<void>;

  updateProgress(savingId: number, progress: any): Promise<void>;
  findSavingsByStatus(isActive: boolean): Promise<TimeBasedSaving[]>;
}
