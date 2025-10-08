import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { PublicClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SmartAccountImplementation } from "../../types/blockchain";
import { encryptValue } from "../../utils/encryption";

export class WalletSetupService {
  constructor(
    private readonly monadPublicClient: PublicClient,
    private readonly encryptionKey: string
  ) {}

  async execute() {
    const privateKey = generatePrivateKey();
    const eoaAccount = privateKeyToAccount(privateKey);

    const smartAccount = await toMetaMaskSmartAccount({
      client: this.monadPublicClient,
      implementation: Implementation.Hybrid,
      deployParams: [eoaAccount.address, [], [], []],
      deploySalt: "0x",
      signer: { account: eoaAccount },
    });

    const isDeployed = await smartAccount.isDeployed();

    return {
      privateKey: encryptValue(this.encryptionKey, privateKey),
      eoaAccount: eoaAccount.address,
      implementation: "Hybrid" as SmartAccountImplementation,
      isDeployed,
      address: smartAccount.address,
    };
  }
}
