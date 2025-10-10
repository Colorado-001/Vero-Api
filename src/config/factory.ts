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
import { MockEmailTemplateParser } from "../infrastructure/email/index.js";
import { MockNotificationService } from "../infrastructure/notification/index.js";
import {
  JwtService,
  WalletSetupService,
} from "../application/services/index.js";
import { createNotificationService } from "../infrastructure/factories/notification-service.factory.js";
import { createEmailTemplateParserService } from "../infrastructure/factories/email-template-parser.factory.js";

export type CoreDependencies = {
  persistenceSessionManager: IPersistenceSessionManager;
  emailTemplateParser: IEmailTemplateParser;
  notificationService: INotificationService;
  walletSetupService: WalletSetupService;
  jwtService: JwtService;
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

  instance = {
    persistenceSessionManager,
    emailTemplateParser: createEmailTemplateParserService(config),
    notificationService: createNotificationService(config),
    walletSetupService: walletService,
    jwtService: new JwtService(config.JWT_SECRET),

    close: async () => {
      try {
        await closeDataSource(dataSource);
      } catch (e) {
        console.warn("Failed to close data source", e);
      }
      instance = null;
    },
  };

  return instance;
}
