import { WebhookConfig } from "../../types/worker";

export interface IWorker {
  registerOperation: <T extends object>(
    cronExpression: string,
    userId: string,
    data: WebhookConfig<T>,
    extra?: Record<string, any>
  ) => Promise<string>; // returns opID
}
