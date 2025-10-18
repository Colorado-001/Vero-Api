import { createPublicClient, http } from "viem";
import { monadTestnet as chain } from "viem/chains";

import { Env } from "./env.js";
import {
  closeDataSource,
  initializeDataSource,
} from "../infrastructure/typeorm/data-source.js";
import {
  IEmailTemplateParser,
  INotificationService,
  IPersistenceSessionManager,
} from "../domain/ports/index.js";
import { TypeORMSessionManager } from "../infrastructure/typeorm/session-manager.js";
import {
  JwtService,
  PortfolioValueService,
  QrGeneratorService,
  TokenBalanceService,
  WalletSetupService,
  WalletTransferService,
} from "../application/services/index.js";
import { createNotificationService } from "../infrastructure/factories/notification-service.factory.js";
import { createEmailTemplateParserService } from "../infrastructure/factories/email-template-parser.factory.js";
import { cleanupLoggers } from "../logging/logger.config.js";

export type CoreDependencies = {
  persistenceSessionManager: IPersistenceSessionManager;
  emailTemplateParser: IEmailTemplateParser;
  notificationService: INotificationService;
  walletSetupService: WalletSetupService;
  jwtService: JwtService;
  portfolioService: PortfolioValueService;
  walletTransferService: WalletTransferService;
  qrGenService: QrGeneratorService;
  close: () => Promise<void>;
};

let instance: CoreDependencies | null = null;

export async function getCoreDependencies(
  config: Env
): Promise<CoreDependencies> {
  if (instance) return instance;

  const dataSource = await initializeDataSource(config);

  const persistenceSessionManager = new TypeORMSessionManager(dataSource);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletService = new WalletSetupService(
    publicClient,
    config.ENCRYPTION_KEY
  );

  const balanceService = new TokenBalanceService(publicClient);

  instance = {
    persistenceSessionManager,
    emailTemplateParser: createEmailTemplateParserService(config),
    notificationService: createNotificationService(config),
    walletSetupService: walletService,
    jwtService: new JwtService(config.JWT_SECRET),
    portfolioService: new PortfolioValueService(
      balanceService,
      config.COINGECKO_API_KEY
    ),
    qrGenService: new QrGeneratorService(config),
    walletTransferService: new WalletTransferService(
      config,
      publicClient,
      balanceService
    ),

    close: async () => {
      try {
        await closeDataSource(dataSource);
        cleanupLoggers();
      } catch (e) {
        console.warn("Failed to close data source", e);
      }
      instance = null;
    },
  };

  return instance;
}
