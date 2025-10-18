import { IUserRepository } from "../../domain/repositories";
import { BlockchainAddress } from "../../types/blockchain";
import { NotFoundError } from "../../utils/errors";
import { WalletTransferService } from "../services";
import tokens from "../../data/monadTestNetTpkens.json";

export class GetTransferGasUseCase {
  constructor(
    private readonly transferService: WalletTransferService,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(
    userId: string,
    amount: string,
    to: BlockchainAddress,
    tokenSymbol: string | null = null
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

    const result = await this.transferService.estimateSponsoredGas({
      amount,
      to,
      walletData: {
        address: user.smartAccountAddress,
        privateKey: user.privateKey,
        implementation: user.implementation,
      },
      decimals,
      tokenAddress: tokenAddress || undefined,
    });

    return result;
  }
}
