import { SavingExecution, TimeBasedSaving } from "../../domain/entities";
import { ITimeBasedSavingRepository } from "../../domain/repositories";
import { ISavingExecutionRepository } from "../../domain/repositories/savings-execution";
import { ExecutionStatus } from "../../utils/enums";

export class ProgressTrackingService {
  constructor(
    private savingRepo: ITimeBasedSavingRepository,
    private executionRepo: ISavingExecutionRepository
  ) {}

  async recordSuccessfulExecution(
    savingId: string,
    amount: number,
    transactionHash: string
  ): Promise<void> {
    const saving = await this.savingRepo.findById(savingId);

    saving.recordSuccessfulSave(amount);

    const execution = new SavingExecution({
      savingId,
      scheduledDate: new Date(),
      executedAt: new Date(),
      status: ExecutionStatus.SUCCESS,
      amount,
      transactionHash,
      retryCount: 0,
    });

    await this.savingRepo.save(saving);
    await this.executionRepo.save(execution);
  }

  async recordFailedExecution(
    savingId: string,
    amount: number,
    errorMessage: string
  ): Promise<void> {
    const saving = await this.savingRepo.findById(savingId);

    saving.recordFailedSave();

    const execution = new SavingExecution({
      savingId,
      scheduledDate: new Date(),
      executedAt: new Date(),
      status: ExecutionStatus.FAILED,
      amount,
      errorMessage,
      retryCount: 0,
    });

    await this.savingRepo.save(saving);
    await this.executionRepo.save(execution);
  }

  async getSavingProgress(savingId: string): Promise<{
    progress: any;
    recentExecutions: SavingExecution[];
    completionPercentage: number;
    isOnTrack: boolean;
  }> {
    const saving = await this.savingRepo.findById(savingId);
    if (!saving) throw new Error("Saving not found");

    const recentExecutions = await this.executionRepo.findBySavingId(savingId);

    return {
      progress: saving.getProgress(),
      recentExecutions: recentExecutions.slice(0, 10), // Last 10 executions
      completionPercentage: saving.calculateCompletionPercentage(),
      isOnTrack:
        !saving.isOverdue() && saving.getProgress().consecutiveFailures < 3,
    };
  }

  async generateProgressReport(userId: string): Promise<{
    totalSavings: number;
    activeSavings: number;
    totalSaved: number;
    successRate: number;
    upcomingExecutions: TimeBasedSaving[];
  }> {
    const userSavings = await this.savingRepo.findByUserId(userId);
    const activeSavings = userSavings.filter((s) => s.isActive);

    const totalSaved = activeSavings.reduce(
      (sum, saving) => sum + saving.getProgress().totalSaved,
      0
    );

    const totalExecutions = activeSavings.reduce((sum, saving) => {
      const progress = saving.getProgress();
      return sum + progress.successfulExecutions + progress.failedExecutions;
    }, 0);

    const successRate =
      totalExecutions > 0
        ? (activeSavings.reduce(
            (sum, saving) => sum + saving.getProgress().successfulExecutions,
            0
          ) /
            totalExecutions) *
          100
        : 0;

    const upcomingExecutions = activeSavings
      .filter((saving) => !saving.isOverdue())
      .sort(
        (a, b) =>
          a.getProgress().nextScheduledDate.getTime() -
          b.getProgress().nextScheduledDate.getTime()
      )
      .slice(0, 5);

    return {
      totalSavings: userSavings.length,
      activeSavings: activeSavings.length,
      totalSaved,
      successRate,
      upcomingExecutions,
    };
  }
}
