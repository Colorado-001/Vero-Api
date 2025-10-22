import { createPublicClient, http } from "viem";
import { monadTestnet as chain } from "viem/chains";

import { Env } from "./env.js";
import {
  closeDataSource,
  initializeDataSource,
} from "../infrastructure/typeorm/data-source.js";
import {
  IDomainEventBus,
  IEmailTemplateParser,
  INotificationService,
  IPersistenceSessionManager,
  IRiskChecker,
  IWorker,
} from "../domain/ports/index.js";
import { TypeORMSessionManager } from "../infrastructure/typeorm/session-manager.js";
import {
  DelegationService,
  JwtService,
  MonadTransferDetector,
  PortfolioValueService,
  QrGeneratorService,
  SavingsBlockchainService,
  TokenBalanceService,
  WalletSetupService,
  WalletTransferService,
} from "../application/services/index.js";
import { createNotificationService } from "../infrastructure/factories/notification-service.factory.js";
import { createEmailTemplateParserService } from "../infrastructure/factories/email-template-parser.factory.js";
import { cleanupLoggers } from "../logging/logger.config.js";
import { UserOrmEntity } from "../infrastructure/typeorm/entities/UserOrm.js";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { OlamideWorkerServer } from "../infrastructure/workers/OlamideWorkerServer.js";
import { InMemoryDomainEventBus } from "../infrastructure/domain-event-bus/in-mem.js";
import { EmailNotificationHandler } from "../application/event-handlers/notifications/EmailNotificationHandler.js";
import { InAppNotificationHandler } from "../application/event-handlers/notifications/InAppNotificationHandler.js";
import { NotificationRepository } from "../infrastructure/typeorm/repositories/notification.js";
import { OlamideAIRiskChecker } from "../infrastructure/risk-checkers/olamide-risk-checker.js";

export type CoreDependencies = {
  persistenceSessionManager: IPersistenceSessionManager;
  emailTemplateParser: IEmailTemplateParser;
  notificationService: INotificationService;
  walletSetupService: WalletSetupService;
  jwtService: JwtService;
  portfolioService: PortfolioValueService;
  walletTransferService: WalletTransferService;
  qrGenService: QrGeneratorService;
  savingsBlockchainService: SavingsBlockchainService;
  transferMonitor: MonadTransferDetector;
  worker: IWorker;
  blockchainDelegationService: DelegationService;
  domainEventBus: IDomainEventBus;
  transactionRiskDetector: IRiskChecker;
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

  const bundlerClient = createBundlerClient({
    transport: http(config.RPC_URL),
    client: publicClient,
  });

  const paymasterClient = createPaymasterClient({
    transport: http(config.RPC_URL),
  });

  const walletService = new WalletSetupService(
    publicClient,
    config.ENCRYPTION_KEY
  );

  const balanceService = new TokenBalanceService(publicClient);

  const userRepo = dataSource.getRepository(UserOrmEntity);

  const users = await userRepo.find({
    select: { smartAccountAddress: true },
  });

  const addresses = users.map((a) => a.smartAccountAddress);

  const transferDetector = new MonadTransferDetector(
    publicClient,
    config,
    addresses
  );

  const walletTransferService = new WalletTransferService(
    config,
    publicClient,
    bundlerClient,
    paymasterClient,
    balanceService
  );
  const worker = new OlamideWorkerServer(config);
  const savingsBlockchainService = new SavingsBlockchainService(
    config,
    walletTransferService
  );

  const blockchainDelegationService = new DelegationService(
    config,
    walletTransferService
  );

  const domainEventBus = new InMemoryDomainEventBus(config);

  // Infra
  const emailTemplateParser = createEmailTemplateParserService(config);
  const notificationService = createNotificationService(config);

  // Event Handlers
  const emailNotificationHandler = new EmailNotificationHandler(
    emailTemplateParser,
    notificationService,
    config
  );
  const inAppNotificationHandler = new InAppNotificationHandler(
    new NotificationRepository(dataSource.manager),
    config
  );

  // Setup subscriptions
  emailNotificationHandler.setupSubscriptions(domainEventBus);
  inAppNotificationHandler.setupSubscriptions(domainEventBus);

  // await transferDetector.start();

  instance = {
    persistenceSessionManager,
    emailTemplateParser,
    notificationService,
    walletSetupService: walletService,
    jwtService: new JwtService(config.JWT_SECRET),
    portfolioService: new PortfolioValueService(
      balanceService,
      config.COINGECKO_API_KEY
    ),
    qrGenService: new QrGeneratorService(config),
    walletTransferService,
    transferMonitor: transferDetector,
    savingsBlockchainService,
    worker,
    blockchainDelegationService,
    domainEventBus,
    transactionRiskDetector: new OlamideAIRiskChecker(config),

    close: async () => {
      try {
        domainEventBus.stop();
        // transferDetector.stop();
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
