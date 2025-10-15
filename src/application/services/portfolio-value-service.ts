import { Address } from "viem";
import { TokenBalanceService } from "./token-balance-service";
import {
  AssetValueDto,
  NativeBalanceDto,
  TokenBalanceDto,
} from "../dto/crypto";

export class PortfolioValueService {
  constructor(private readonly tokenBalanceService: TokenBalanceService) {}

  async getPortfolioValue(walletAddress: Address): Promise<{
    assets: AssetValueDto[];
    totalUsdValue: number;
  }> {
    // 1. Fetch balances
    const [native, tokens] = await Promise.all([
      this.tokenBalanceService.getNativeBalance(walletAddress),
      this.tokenBalanceService.getTokenBalances(walletAddress),
    ]);

    // 2. Fetch USD prices
    const symbols = [
      native.coingeckoId || native.symbol.toLowerCase(),
      ...tokens.map((t) => t.coingeckoId || t.symbol.toLowerCase()),
    ];
    const prices = await this.fetchUsdPrices(symbols);

    // Temporary override
    if (prices["monad"] === 0 && Boolean(prices["weth"])) {
      prices["monad"] = prices["weth"];
    }
    console.log("[prices]", prices, native, tokens);

    // 3. Map balances to USD values
    const assets: AssetValueDto[] = [
      this.toAssetValue(
        native,
        prices[native.coingeckoId || native.symbol.toLowerCase()]
      ),
      ...tokens.map((t) =>
        this.toAssetValue(t, prices[t.coingeckoId || t.symbol.toLowerCase()])
      ),
    ];

    // 4. Sum total USD value
    const totalUsdValue = assets.reduce((sum, a) => sum + a.usdValue, 0);

    return { assets, totalUsdValue };
  }

  private getDefaultPrice(id: string) {
    // if (id === "monad") {
    //   return 0.00009;
    // }
    return 0;
  }

  private async fetchUsdPrices(
    symbols: string[]
  ): Promise<Record<string, number>> {
    const uniqueSymbols = Array.from(
      new Set(symbols.map((s) => s.toLowerCase()))
    );
    const idsParam = uniqueSymbols.join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch prices: ${res.statusText}`);
      const data = await res.json();

      const prices: Record<string, number> = {};
      for (const symbol of symbols) {
        prices[symbol] =
          data[symbol.toLowerCase()]?.usd ?? this.getDefaultPrice(symbol);
      }
      return prices;
    } catch (err) {
      console.warn("Failed to fetch USD prices:", err);
      return Object.fromEntries(symbols.map((s) => [s, 0]));
    }
  }

  private toAssetValue(
    token: TokenBalanceDto | NativeBalanceDto,
    usdPrice: number
  ): AssetValueDto {
    const balance = parseFloat(token.formattedBalance);
    const usdValue = balance * usdPrice;
    return {
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI,
      balance: token.formattedBalance,
      usdPrice,
      usdValue,
    };
  }
}
