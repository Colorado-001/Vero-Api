import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  isAxiosError,
} from "axios";
import { IWorker } from "../../domain/ports";
import { WebhookConfig } from "../../types/worker";
import { Env } from "../../config/env";
import winston from "winston";
import createLogger from "../../logging/logger.config";

export class OlamideWorkerServer implements IWorker {
  private readonly axios: AxiosInstance;
  private readonly logger: winston.Logger;

  constructor(config: Env) {
    this.axios = axios.create({
      baseURL: config.WORKER_URL,
    });

    this.logger = createLogger(OlamideWorkerServer.name, config);

    this.logger.info({
      message: "OlamideWorkerServer initialized",
      data: { baseURL: config.WORKER_URL },
    });
  }

  listOperations = async () => {
    const { data: result } = await this.axios.get<unknown>("/schedulerx/jobs");
    return result;
  };

  registerOperation = async <T extends object>(
    cronExpression: string,
    userId: string,
    data: WebhookConfig<T>,
    extra?: Record<string, any>
  ): Promise<string> => {
    const payload = {
      rule_id: data.id,
      user_id: userId,
      schedule: {
        kind: "cron",
        expr: cronExpression,
        timezone: "Africa/Lagos",
      },
      webhook: {
        method: data.method,
        url: data.url,
        headers: data.headers,
        body: data.body,
        timeout: data.timeout,
      },
      extra,
    };

    this.logger.info({
      message: "Registering worker operation",
      data: { userId, cronExpression, ruleId: data.id, extra },
    });

    try {
      const { data: result } = await this.axios.post<{
        job_id: string;
      }>("/schedulerx/jobs", payload);

      this.logger.info({
        message: "Worker operation registered successfully",
        data: { jobId: result.job_id, ruleId: data.id, userId },
      });

      return result.job_id;
    } catch (error: any) {
      if (isAxiosError(error)) {
        this.logger.error({
          message: "Failed to register worker operation",
          data: {
            error: error.response?.data ?? error.message ?? error,
            config: error.config,
          },
        });
      } else {
        this.logger.error({
          message: "Failed to register worker operation",
          data: {
            userId,
            ruleId: data.id,
            error: error?.message ?? error,
            payload,
          },
        });
      }
      throw error;
    }
  };
}
