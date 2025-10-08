import { ICreateWalletResponse } from "../../types/blockchain";

export interface IBlockchainManager {
  createSmartAccount: () => Promise<ICreateWalletResponse>;
}
