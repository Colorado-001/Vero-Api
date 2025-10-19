export type AutoflowFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface ISavingProgress {
  totalSaved: number;
  lastSavedAt: Date | null;
  nextScheduledDate: Date;
  successfulExecutions: number;
  failedExecutions: number;
  consecutiveFailures: number;
  totalExpected: number;
}

export interface ITimeBasedSavingProps {
  id?: string;
  name: string;
  frequency: AutoflowFrequency;
  dayOfMonth: number;
  amountToSave: number;
  tokenToSave: string;
  userId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  progress?: SavingProgress;
}

export interface ISavingExecutionProps {
  id?: string;
  savingId: string;
  scheduledDate: Date;
  executedAt?: Date;
  status: ExecutionStatus;
  amount: number;
  transactionHash?: string;
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface ISavingsContractData {
  totalBalance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  savingsGoal: bigint;
  accountCreatedAt: bigint;
  lastDepositTime: bigint;
  lastWithdrawalTime: bigint;
  depositCount: bigint;
  withdrawalCount: bigint;
  status: number;
  hasAccount: boolean;
}

export interface IContractSavingsProgress {
  current: bigint;
  goal: bigint;
  percentComplete: bigint;
}

export interface IVaultStats {
  totalSavings: bigint;
  userCount: bigint;
}
