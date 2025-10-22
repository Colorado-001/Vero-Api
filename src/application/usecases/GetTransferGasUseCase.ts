import {
  IDelegationRepository,
  IUserRepository,
} from "../../domain/repositories";
import { BlockchainAddress } from "../../types/blockchain";
import { NotFoundError } from "../../utils/errors";
import { WalletTransferService } from "../services";
import tokens from "../../data/monadTestNetTpkens.json";

export class GetTransferGasUseCase {
  constructor(
    private readonly transferService: WalletTransferService,
    private readonly userRepo: IUserRepository,
    private readonly delegationRepo: IDelegationRepository
  ) {}

  private async getSignedDelegation(delegationId: string) {
    let signedDelegation = null;

    const delegation = await this.delegationRepo.findById(delegationId);

    if (!delegation || !delegation.signedBlockchainDelegation) {
      throw new NotFoundError("Delegation not found");
    }

    signedDelegation = delegation.signedBlockchainDelegation;

    return signedDelegation;
  }

  async execute(
    userId: string,
    amount: string,
    to: BlockchainAddress,
    tokenSymbol: string | null = null,
    delegation: string | null = null
  ) {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    let decimals = 18;
    let tokenAddress: BlockchainAddress | undefined = undefined;

    const signedDelegation = delegation
      ? await this.getSignedDelegation(delegation)
      : null;

    if (tokenSymbol && tokenSymbol.toLowerCase() !== "mon") {
      const token = tokens.find(
        (t) => t.symbol.toLowerCase() === tokenSymbol?.toLowerCase()
      );
      if (token) {
        decimals = token.decimals;
        tokenAddress = token.address as BlockchainAddress;
      }
    }

    try {
      const result = await this.transferService.estimateSponsoredGas({
        amount,
        to,
        walletData: {
          address: user.smartAccountAddress,
          privateKey: user.privateKey,
        },
        decimals,
        tokenAddress: tokenAddress || undefined,
        delegation: signedDelegation || undefined,
      });

      return result;
    } catch (error) {
      return {
        estimatedCostMON: "0",
        estimatedCostUSD: "0",
      };
    }
  }
}
