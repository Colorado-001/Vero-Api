export type TransactionStatus = "pending" | "success" | "failed";

export type TransactionGas = {
  estimatedCostMON: string;
  estimatedCostUSD: string;
};
