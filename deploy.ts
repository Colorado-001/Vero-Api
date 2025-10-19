import {
  createPublicClient,
  formatEther,
  http,
  parseGwei,
  PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "viem/chains";
import {
  BundlerClient,
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { AnyAaaaRecord } from "dns";

// Configuration
const BUNDLER_URL =
  "https://api.pimlico.io/v2/10143/rpc?apikey=pim_fesFtvFD5hYoCZ4c94LPyR";
const PAYMASTER_URL =
  "https://api.pimlico.io/v2/10143/rpc?apikey=pim_fesFtvFD5hYoCZ4c94LPyR";
const PRIVATE_KEY =
  "0xdcb847b64b159107b36a6a4ed29acd73a002b6ec8ca7807f3fae6298ccec88cb"; // EOA that will be the owner
const CHAIN = monadTestnet;

async function getPimlicoGasPrices() {
  try {
    const response = await fetch(`${BUNDLER_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "pimlico_getUserOperationGasPrice",
        params: [],
      }),
    });

    const data = await response.json();

    if (data.result) {
      return {
        maxFeePerGas: BigInt(data.result.standard.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(data.result.standard.maxPriorityFeePerGas),
      };
    }
  } catch (error) {
    console.log("Pimlico gas price endpoint not available, using defaults");
  }

  // Fallback to Monad defaults
  return {
    maxFeePerGas: parseGwei("3"),
    maxPriorityFeePerGas: parseGwei("2.5"),
  };
}

function calculateGasCost(gasLimits: any, gasPrices: any) {
  const totalGasLimit =
    gasLimits.callGasLimit +
    gasLimits.verificationGasLimit +
    gasLimits.preVerificationGas;

  const maxCost = totalGasLimit * gasPrices.maxFeePerGas;
  const likelyCost = totalGasLimit * gasPrices.maxPriorityFeePerGas;

  return {
    totalGasLimit,
    maxCostWei: maxCost,
    maxCostEth: formatEther(BigInt(maxCost)),
    likelyCostWei: likelyCost,
    likelyCostEth: formatEther(BigInt(likelyCost)),
  };
}

// Display gas estimate to user
function displayGasEstimate(
  gasEstimate: any,
  gasPrices: any,
  isSponsored = false
) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("           GAS ESTIMATE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📊 Gas Breakdown:");
  console.log(
    `   Call Gas:              ${gasEstimate.callGasLimit.toLocaleString()}`
  );
  console.log(
    `   Verification Gas:      ${gasEstimate.verificationGasLimit.toLocaleString()}`
  );
  console.log(
    `   Pre-verification Gas:  ${gasEstimate.preVerificationGas.toLocaleString()}`
  );

  console.log(`   ─────────────────────────────────────`);
  console.log(
    `   Total Gas Limit:       ${gasEstimate.totalGasLimit.toLocaleString()}`
  );

  console.log("\n⛽ Gas Prices:");
  console.log(
    `   Max Fee:              ${formatEther(gasPrices.maxFeePerGas)} ETH/gas`
  );
  console.log(
    `   Priority Fee:         ${formatEther(
      gasPrices.maxPriorityFeePerGas
    )} ETH/gas`
  );

  console.log("\n💰 Estimated Cost:");
  console.log(`   Maximum Cost:         ${gasEstimate.maxCostEth} ETH`);
  console.log(`   Likely Cost:          ${gasEstimate.likelyCostEth} ETH`);

  if (isSponsored) {
    console.log("\n✅ Gas fees will be SPONSORED by paymaster");
    console.log("   You will pay: 0 ETH 🎉");
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return {
    maxCostEth: gasEstimate.maxCostEth,
    likelyCostEth: gasEstimate.likelyCostEth,
    totalGas: gasEstimate.totalGasLimit,
    isSponsored,
  };
}

async function deploySmartWalletWithPaymaster() {
  // Create owner account from private key
  const owner = privateKeyToAccount(PRIVATE_KEY);

  // Create public client for reading blockchain state
  const publicClient = createPublicClient({
    chain: CHAIN,
    transport: http(),
  });

  // Create bundler client for submitting user operations
  const bundlerClient = createBundlerClient({
    transport: http(BUNDLER_URL),
    client: publicClient,
  });

  // Create paymaster client for gas sponsorship
  const paymasterClient = createPaymasterClient({
    transport: http(PAYMASTER_URL),
  });

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [owner.address, [], [], []],
    deploySalt: "0x",
    signer: { account: owner },
  });

  console.log("Smart Account Address:", smartAccount.address);
  console.log("Owner Address:", owner.address);

  // Check if account is already deployed
  const code = await publicClient.getCode({
    address: smartAccount.address,
  });

  if (code) {
    console.log("✅ Smart wallet already deployed!");
    return {
      address: smartAccount.address,
      alreadyDeployed: true,
    };
  }

  console.log("🚀 Deploying smart wallet with paymaster...");

  try {
    const gasPrices = await getPimlicoGasPrices();

    const { maxFeePerGas, maxPriorityFeePerGas } = gasPrices;

    console.log(
      "💰 Gas fees will be sponsored by paymaster",
      maxFeePerGas,
      maxPriorityFeePerGas
    );

    // Send a user operation that will deploy the account
    // Gas fees are sponsored by the paymaster
    const userOpHash = await bundlerClient.sendUserOperation({
      account: smartAccount,
      calls: [
        {
          to: smartAccount.address, // Send to self
          value: BigInt(0),
          data: "0x", // Empty data
        },
      ],
      paymaster: paymasterClient,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });

    console.log("User Operation Hash:", userOpHash);
    console.log("⏳ Waiting for user operation to be mined...");

    // Wait for the user operation to be included in a block
    const receipt = await bundlerClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });

    console.log("✅ Transaction Hash:", receipt.receipt.transactionHash);
    console.log("✅ Smart wallet deployed successfully!");
    console.log("📍 Smart Wallet Address:", smartAccount.address);
    console.log("💰 Gas paid by paymaster:", receipt.receipt.from);

    return {
      address: smartAccount.address,
      transactionHash: receipt.receipt.transactionHash,
      userOpHash,
      alreadyDeployed: false,
    };
  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

deploySmartWalletWithPaymaster()
  .then((result) => {
    console.log("\n🎉 Deployment complete!");
    console.log("Result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
