import axios, { AxiosInstance, isAxiosError } from "axios";
import { IRiskChecker } from "../../domain/ports";
import { Env } from "../../config/env";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { BlockchainAddress } from "../../types/blockchain";
import { riskResultSchema } from "./schemas";

interface IRiskResponse {
  risk: number;
  confidence: number;
}

export class OlamideAIRiskChecker implements IRiskChecker {
  private readonly axios: AxiosInstance;
  private readonly logger: winston.Logger;

  constructor(config: Env) {
    this.axios = axios.create({
      baseURL: config.WORKER_URL,
    });

    this.logger = createLogger(OlamideAIRiskChecker.name, config);
  }

  checkNativeTransaction = async (
    from: BlockchainAddress,
    to: BlockchainAddress,
    amountInMon: string
  ) => {
    try {
      const { data } = await this.axios.post<IRiskResponse>("/risk/score", {
        wallet: from,
        value: { amount: Number(amountInMon), unit: "eth" },
        method_name: "deposit",
        to,
      });

      this.logger.debug({
        message: "Risk Response",
        data,
      });

      const validated = riskResultSchema.parse(data);

      return validated.risk;
    } catch (error) {
      this.handleError(error, { from, to, amountInMon });
      throw error;
    }
  };

  private handleError(error: any, extra: object = {}) {
    if (isAxiosError(error)) {
      this.logger.error({
        message: "Failed to perform risk check",
        data: {
          error: error.response?.data ?? error.message ?? error,
          config: error.config,
          statusCode: error.status,
        },
      });
    } else {
      this.logger.error({
        message: "Failed to perform risk check",
        data: {
          error: error?.message ?? error,
          ...extra,
        },
      });
    }
  }
}
