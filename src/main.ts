import { createPublicClient, http, parseEther } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { monadTestnet as chain } from "viem/chains";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";

const rpcUrl =
  "https://monad-testnet.g.alchemy.com/v2/OWwGai-H51bn43KK9TgOBAB6Ce18x5J4";

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(rpcUrl),
});

const privateKey = generatePrivateKey();
export const account = privateKeyToAccount(privateKey);

(async () => {
  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: "0x",
    signer: { account },
  });

  const isDeployed = await smartAccount.isDeployed();

  console.log(
    `Smart Account: ${smartAccount.address}, EOA: ${account.address}, Is Deployed: ${isDeployed}`
  );

  const maxFeePerGas = 1n;
  const maxPriorityFeePerGas = 1n;

  const userOperationHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
      {
        to: "0x1234567890123456789012345678901234567890",
        value: parseEther("1"),
      },
    ],
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  console.log(`Operation Hash: ${userOperationHash}`);
})();
