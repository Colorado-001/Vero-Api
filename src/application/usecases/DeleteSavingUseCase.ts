import { ITimeBasedSavingRepository } from "../../domain/repositories";
import { Env } from "../../config/env";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { IWorker } from "../../domain/ports";

export class DeleteSavingUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly savingRepository: ITimeBasedSavingRepository,
    private readonly worker: IWorker,
    config: Env
  ) {
    this.logger = createLogger(DeleteSavingUseCase.name, config);
  }

  async execute(id: number): Promise<void> {
    this.logger.debug({
      message: "Received delete saving request",
      data: { id },
    });
    const saving = await this.savingRepository.findById(id);

    await this.savingRepository.delete(id);
    await this.worker.deregisterOperation(`rule_${saving.id}`);
  }
}
