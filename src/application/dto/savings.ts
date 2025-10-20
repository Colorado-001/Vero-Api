import { AutoflowFrequency } from "../../types/saving";

export interface CreateSavingRequest {
  dayOfMonth: number;
  amountToSave: number;
  tokenToSave: string;
  userId: string;
  name: string;
  frequency: AutoflowFrequency;
}

export interface SavingDto {
  id: string;
  frequency: string;
  name: string;
  dayOfMonth: number;
  amountToSave: number;
  tokenToSave: string;
  userId: string;
  isActive: boolean;
  progress: any;
  nextScheduledDate: Date;
  createdAt: Date;
}
