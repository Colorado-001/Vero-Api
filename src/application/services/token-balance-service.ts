import { PublicClient, erc20Abi, Address, formatUnits } from "viem";
import tokens from "../../data/monadTestNetTpkens.json";
import type { NativeBalanceDto, TokenBalanceDto } from "../dto/crypto";
import { BlockchainAddress } from "../../types/blockchain";

export class TokenBalanceService {
  constructor(private readonly publicClient: PublicClient) {}

  async getTokenBalances(walletAddress: Address): Promise<TokenBalanceDto[]> {
    const results: TokenBalanceDto[] = [];

    for (const token of tokens) {
      try {
        const rawBalance = await this.publicClient.readContract({
          address: token.address as BlockchainAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [walletAddress],
        });

        const formatted = formatUnits(rawBalance, token.decimals);

        results.push({
          address: token.address as Address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
          rawBalance,
          formattedBalance: formatted,
          coingeckoId: token.coingeckoId,
        });
      } catch (err) {
        console.warn(`Failed to fetch balance for ${token.symbol}:`, err);
        results.push({
          address: token.address as Address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
          rawBalance: BigInt(0),
          formattedBalance: "0",
          coingeckoId: token.coingeckoId,
        });
      }
    }

    return results;
  }

  async getNativeBalance(walletAddress: Address): Promise<NativeBalanceDto> {
    try {
      const rawBalance = await this.publicClient.getBalance({
        address: walletAddress,
      });
      const decimals = 18; // MON uses 18 decimals, like ETH
      const formatted = formatUnits(rawBalance, decimals);

      return {
        name: "Monad",
        symbol: "MON",
        decimals,
        logoURI: "https://assets.monad.xyz/mon.png",
        rawBalance,
        formattedBalance: formatted,
      };
    } catch (err) {
      console.warn("Failed to fetch native MON balance:", err);
      return {
        name: "Monad",
        symbol: "MON",
        decimals: 18,
        logoURI: "https://assets.monad.xyz/mon.png",
        rawBalance: BigInt(0),
        formattedBalance: "0",
      };
    }
  }
}
