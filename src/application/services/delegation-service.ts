import winston from "winston";
import { parseEther } from "viem";
import { Env } from "../../config/env";
import { UserEntity } from "../../domain/entities";
import { WalletTransferService } from "./transfer-service";
import createLogger from "../../logging/logger.config";
import { createDelegation } from "@metamask/delegation-toolkit";

export class DelegationService {
  private readonly logger: winston.Logger;

  constructor(
    config: Env,
    private readonly walletTransferService: WalletTransferService
  ) {
    this.logger = createLogger(DelegationService.name, config);
  }

  async createNewDelegation(
    from: UserEntity,
    to: UserEntity,
    amount: string,
    startDate: Date
  ) {
    const delegatorSmartAccount =
      await this.walletTransferService.getSmartAccount(
        from.privateKey,
        from.smartAccountAddress
      );

    const delegateeSmartAccount =
      await this.walletTransferService.getSmartAccount(
        to.privateKey,
        to.smartAccountAddress
      );

    const start = Math.floor(startDate.getTime() / 1000);

    this.logger.info({
      message: "Create Delegation",
      data: {
        delegator: delegatorSmartAccount.address,
        delegatee: delegateeSmartAccount.address,
        start,
        amount,
      },
    });

    const delegation = createDelegation({
      to: delegateeSmartAccount.address,
      from: delegatorSmartAccount.address,
      environment: delegatorSmartAccount.environment,
      scope: {
        type: "nativeTokenPeriodTransfer",
        startDate: start,
        periodAmount: parseEther(amount),
        periodDuration: 86400, // 24 hours in seconds,
      },
    });

    const signature = await delegatorSmartAccount.signDelegation({
      delegation,
    });

    const signedDelegation = {
      ...delegation,
      signature,
    };

    this.logger.debug({
      message: "Signed Delegation",
      data: signedDelegation,
    });

    return signedDelegation;
  }
}
