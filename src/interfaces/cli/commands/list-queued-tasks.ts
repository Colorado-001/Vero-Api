#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { getCoreDependencies } from "../../../config/factory";
import { validateEnv } from "../../../config/env";
import { ListWorkerQueuedTasksUseCase } from "../../../application/usecases";

export const listQueuedTasksCommand = new Command();

listQueuedTasksCommand
  .name("list:tasks")
  .description("List all worker scheduled tasks")
  .action(async () => {
    const config = validateEnv(process.env);
    const { worker } = await getCoreDependencies(config);

    const useCase = new ListWorkerQueuedTasksUseCase(worker);

    const jobs = await useCase.execute();

    console.log(chalk.bold("\nScheduled Jobs:\n"));

    (jobs as any).forEach((job: any) => {
      console.log(
        `${chalk.cyan("•")} ${chalk.bold(job.extra.name)} (${chalk.green(
          job.id
        )})`
      );
      console.log(`${chalk.gray("  Asset:")} ${job.extra.asset}`);
      console.log(`${chalk.gray("  Next run:")} ${chalk.yellow(job.next_run)}`);
      console.log(
        `${chalk.gray("  Schedule:")} ${chalk.magenta(job.schedule.expr)} (${
          job.schedule.timezone
        })`
      );
      console.log(`${chalk.gray("  User:")} ${job.rule.user_id}`);
      console.log(`${chalk.gray("  Status:")} ${job.last_status ?? "Pending"}`);
      console.log();
    });
  });
