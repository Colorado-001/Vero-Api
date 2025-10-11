import { BlockchainAddress } from "../../types/blockchain";

export type TokenDto = {
  address: BlockchainAddress;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

export type TokenBalanceDto = {
  rawBalance: bigint;
  formattedBalance: string;
  coingeckoId: string;
} & TokenDto;

export type NativeBalanceDto = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  rawBalance: bigint;
  formattedBalance: string;
};

export type AssetValueDto = {
  name: string;
  symbol: string;
  logoURI: string;
  balance: string;
  usdPrice: number;
  usdValue: number;
};

export type GetPortfolioResDto = {
  assets: AssetValueDto[];
  usdBalance: number;
};
