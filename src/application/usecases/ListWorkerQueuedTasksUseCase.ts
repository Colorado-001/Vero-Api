import { IWorker } from "../../domain/ports";

export class ListWorkerQueuedTasksUseCase {
  constructor(private readonly worker: IWorker) {}

  async execute() {
    return await this.worker.listOperations();
  }
}
