export interface CreateSavingRequest {
  dayOfMonth: number;
  amountToSave: number;
  tokenToSave: string;
  userId: string;
  name: string;
}

export interface CreateSavingResponse {
  success: boolean;
  saving?: {
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
  };
  error?: string;
}
