import {
  IDelegationRepository,
  ITransactionRepository,
  IUserRepository,
} from "../../domain/repositories";
import { BlockchainAddress } from "../../types/blockchain";
import { HighRiskOperationDetected, NotFoundError } from "../../utils/errors";
import { WalletTransferService } from "../services";

import tokens from "../../data/monadTestNetTpkens.json";
import { TransactionEntity } from "../../domain/entities";
import { TransactionGas } from "../../types/transaction";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";
import { IDomainEventBus, IRiskChecker } from "../../domain/ports";
import { AllowanceWithdrawnEvent } from "../../domain/events";

export class InitiateTransferUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly transferService: WalletTransferService,
    private readonly userRepo: IUserRepository,
    private readonly txnRepo: ITransactionRepository,
    private readonly delegationRepo: IDelegationRepository,
    private readonly domainEventBus: IDomainEventBus,
    private readonly riskChecker: IRiskChecker,
    config: Env
  ) {
    this.logger = createLogger("InitiateTransferUseCase", config);
  }

  private async getSignedDelegation(delegationId: string) {
    const delegation = await this.delegationRepo.findById(delegationId);

    this.logger.debug({
      message: "Fetched delegation",
      data: delegation,
    });

    if (!delegation || !delegation.signedBlockchainDelegation) {
      throw new NotFoundError("Delegation not found");
    }

    return delegation;
  }

  private async saveTxn(
    hash: string,
    userOpHash: string,
    amount: string,
    from: BlockchainAddress,
    to: BlockchainAddress,
    gas: TransactionGas,
    tokenAddress?: BlockchainAddress
  ) {
    const transaction = TransactionEntity.create(
      hash,
      userOpHash,
      from,
      to,
      tokenAddress || null,
      amount,
      "pending",
      true,
      gas
    );

    await this.txnRepo.save(transaction);
  }

  async execute(
    userId: string,
    to: BlockchainAddress,
    amount: string,
    tokenSymbol?: string,
    delegation?: string,
    pin?: string
  ) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!pin) {
      const risk = await this.riskChecker.checkNativeTransaction(
        user.smartAccountAddress,
        to,
        amount
      );

      if (risk > 0.65) {
        throw new HighRiskOperationDetected(
          "This transaction has been flagged by ##Vero AI Checker## as risky"
        );
      }
    } else {
      user.validatePin(pin);
    }

    let decimals = 18;
    let tokenAddress: BlockchainAddress | undefined = undefined;

    if (tokenSymbol && tokenSymbol.toLowerCase() !== "mon") {
      const token = tokens.find(
        (t) => t.symbol.toLowerCase() === tokenSymbol?.toLowerCase()
      );
      if (token) {
        decimals = token.decimals;
        tokenAddress = token.address as BlockchainAddress;
      }
    }

    const userDelegation = delegation
      ? await this.getSignedDelegation(delegation)
      : null;

    const gas = await this.transferService.estimateSponsoredGas({
      amount,
      to,
      walletData: {
        address: user.smartAccountAddress,
        privateKey: user.privateKey,
      },
      decimals,
      tokenAddress: tokenAddress || undefined,
      delegation: userDelegation?.signedBlockchainDelegation,
    });

    this.logger.debug("Gas", gas);

    if (!tokenAddress) {
      const { txHash, userOpHash } =
        await this.transferService.sponsorTransaction({
          amount,
          to,
          delegation: userDelegation?.signedBlockchainDelegation,
          walletData: {
            address: user.smartAccountAddress,
            privateKey: user.privateKey,
          },
        });

      this.logger.info("Save Txn Info");

      await this.saveTxn(
        txHash,
        userOpHash,
        amount,
        user.smartAccountAddress,
        to,
        gas,
        tokenAddress
      );

      if (userDelegation) {
        const event = new AllowanceWithdrawnEvent({
          allocationName: userDelegation.name,
          amount: `${amount} ${tokenSymbol?.toUpperCase() || "MON"}`,
          ownerUserId: userDelegation.userId,
          withdrawnBy: user.displayName,
        });
        this.domainEventBus.publish(event);
      }

      return;
    }

    throw new Error("Not Implemented");
  }
}
