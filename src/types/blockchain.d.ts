export type BlockchainAddress = `0x${string}`;

export type SmartAccountImplementation = "Hybrid";

export interface ICreateWalletResponse {
  privateKey: BlockchainAddress;
  smartAccountAddress: BlockchainAddress;
  ownerEOA: BlockchainAddress;
  implementation: SmartAccountImplementation;
  deployed: boolean;
}
