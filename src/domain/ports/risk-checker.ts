import { BlockchainAddress } from "../../types/blockchain";

export interface IRiskChecker {
  checkNativeTransaction: (
    from: BlockchainAddress,
    to: BlockchainAddress,
    amountInMon: string
  ) => Promise<number>;
}
