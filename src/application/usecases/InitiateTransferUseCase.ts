import {
  ITransactionRepository,
  IUserRepository,
} from "../../domain/repositories";
import { BlockchainAddress } from "../../types/blockchain";
import { NotFoundError } from "../../utils/errors";
import { WalletTransferService } from "../services";

import tokens from "../../data/monadTestNetTpkens.json";
import { TransactionEntity } from "../../domain/entities";
import { TransactionGas } from "../../types/transaction";
import winston from "winston";
import createLogger from "../../logging/logger.config";
import { Env } from "../../config/env";

export class InitiateTransferUseCase {
  private readonly logger: winston.Logger;

  constructor(
    private readonly transferService: WalletTransferService,
    private readonly userRepo: IUserRepository,
    private readonly txnRepo: ITransactionRepository,
    config: Env
  ) {
    this.logger = createLogger("InitiateTransferUseCase", config);
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
    tokenSymbol?: string
  ) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
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

    const gas = await this.transferService.estimateSponsoredGas({
      amount,
      to,
      walletData: {
        address: user.smartAccountAddress,
        privateKey: user.privateKey,
      },
      decimals,
      tokenAddress: tokenAddress || undefined,
    });

    this.logger.debug("Gas", gas);

    if (!tokenAddress) {
      const { txHash, userOpHash } =
        await this.transferService.sponsorTransaction({
          amount,
          to,
          walletData: {
            address: user.smartAccountAddress,
            privateKey: user.privateKey,
          },
        });

      this.logger.debug("Txn Hash", { txHash, userOpHash });

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

      return;
    }

    throw new Error("Not Implemented");
  }
}
