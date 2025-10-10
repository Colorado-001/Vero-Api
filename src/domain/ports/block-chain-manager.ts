import { ICreateWalletResponse } from "../../types/blockchain.js";

export interface IBlockchainManager {
  createSmartAccount: () => Promise<ICreateWalletResponse>;
}
