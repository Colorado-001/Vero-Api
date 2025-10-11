import { IUserRepository } from "../../domain/repositories";
import { NotFoundError } from "../../utils/errors";
import { GetPortfolioResDto } from "../dto";
import { PortfolioValueService } from "../services";

export class GetPortfolioUseCase {
  constructor(
    private readonly portfolioService: PortfolioValueService,
    private readonly userRepo: IUserRepository
  ) {}

  async execute(id: string): Promise<GetPortfolioResDto> {
    const user = await this.userRepo.findById(id);

    if (!user) throw new NotFoundError("User not found");

    const result = await this.portfolioService.getPortfolioValue(
      user.smartAccountAddress
    );

    return {
      assets: result.assets,
      usdBalance: result.totalUsdValue,
    };
  }
}
