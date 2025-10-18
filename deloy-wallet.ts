import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseGwei,
  toHex,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  toMetaMaskSmartAccount,
  Implementation,
} from "@metamask/delegation-toolkit";
import * as dotenv from "dotenv";
import { createBundlerClient } from "viem/account-abstraction";

dotenv.config();

function serializeUserOp(userOp: any) {
  return JSON.parse(
    JSON.stringify(userOp, (key, value) =>
      typeof value === "bigint" ? toHex(value) : value
    )
  );
}

// ==================== CONFIGURABLE PARAMS ====================
const CONFIG = {
  // Your MetaMask EOA private key
  EOA_PRIVATE_KEY:
    "0xdcb847b64b159107b36a6a4ed29acd73a002b6ec8ca7807f3fae6298ccec88cb",

  // Monad Testnet RPC
  RPC_URL: "https://testnet-rpc.monad.xyz/",

  // Bundler URL for User Operations
  BUNDLER_URL:
    "https://monad-testnet.g.alchemy.com/v2/OWwGai-H51bn43KK9TgOBAB6Ce18x5J4",

  // Deployment parameters
  DEPLOYMENT_AMOUNT: parseEther("0.001"), // Small amount to trigger deployment
  CHAIN_ID: 10143, // Monad Testnet
};

// ==================== MONAD TESTNET CONFIG ====================
const monadTestnet = {
  id: CONFIG.CHAIN_ID,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: [CONFIG.RPC_URL],
    },
    public: {
      http: [CONFIG.RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadTestnetExplorer",
      url: "https://testnet.monadexplorer.com/",
    },
  },
  testnet: true,
};

// ==================== UTILITY FUNCTIONS ====================
async function checkBalance(address: `0x${string}`, publicClient: any) {
  const balance = await publicClient.getBalance({ address });
  console.log(`💰 Balance: ${parseFloat(balance.toString()) / 1e18} MON`);

  if (balance === BigInt(0)) {
    throw new Error(
      "Insufficient MON balance. Get testnet MON from: https://faucet.monad.xyz/"
    );
  }

  return balance;
}

async function sendUserOperation(
  userOp: any,
  bundlerUrl: string
): Promise<Hash> {
  console.log("🔄 Sending User Operation to bundler...");

  const response = await fetch(bundlerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendUserOperation",
      params: [
        serializeUserOp(userOp),
        "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      ], // EntryPoint
    }),
  });

  const result = await response.json();

  console.log(result);
  if (result.error) {
    throw new Error(`Bundler error: ${result.error.message}`);
  }

  console.log("✅ UserOp Hash:", result.result);
  return result.result;
}

async function waitForUserOperation(
  userOpHash: Hash,
  bundlerUrl: string
): Promise<Hash> {
  console.log("\n⏳ Waiting for confirmation...");

  const maxAttempts = 30;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(bundlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getUserOperationByHash",
          params: [userOpHash],
        }),
      });

      const result = await response.json();

      if (result.result?.transactionHash) {
        console.log("✅ User Operation confirmed!");
        return result.result.transactionHash;
      }
    } catch (error) {
      // Continue waiting
    }

    process.stdout.write(`\r⏰ ${attempt * 3}s...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Confirmation timeout after 90s");
}

async function getMonadGasPrices(publicClient: any) {
  try {
    // Try to get gas prices from the network
    const [block, priorityFee] = await Promise.all([
      publicClient.getBlock(),
      publicClient.estimateMaxPriorityFeePerGas?.(),
    ]);

    const baseFee = block.baseFeePerGas || parseGwei("0.1");
    const maxPriorityFeePerGas = priorityFee || parseGwei("2.5");

    return {
      maxFeePerGas: baseFee + maxPriorityFeePerGas,
      maxPriorityFeePerGas: maxPriorityFeePerGas,
    };
  } catch (error) {
    // Fallback: Use safe defaults for Monad testnet
    console.log("Using fallback gas prices for Monad");
    return {
      maxFeePerGas: parseGwei("3"), // 3 Gwei
      maxPriorityFeePerGas: parseGwei("2.5"), // 2.5 Gwei (minimum)
    };
  }
}

async function getPimlicoGasPrices(publicClient: any) {
  try {
    const response = await fetch(`${CONFIG.BUNDLER_URL}`, {
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

// ==================== MAIN DEPLOYMENT FUNCTION ====================
async function deployHybridAccount() {
  console.log("🎯 Deploying MetaMask Hybrid Smart Account on Monad Testnet\n");

  // Validate config
  if (
    !CONFIG.EOA_PRIVATE_KEY ||
    CONFIG.EOA_PRIVATE_KEY === "0xYOUR_EOA_PRIVATE_KEY_HERE"
  ) {
    throw new Error("Please set EOA_PRIVATE_KEY in config or .env file");
  }

  // Setup clients
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(),
  });

  const account = privateKeyToAccount(CONFIG.EOA_PRIVATE_KEY as `0x${string}`);

  console.log("👤 EOA Address:", account.address);

  // Create MetaMask Hybrid Smart Account
  console.log("\n🔧 Creating Hybrid Smart Account...");

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [account.address, [], [], []],
    deploySalt: "0x",
    signer: { account },
  });

  console.log("📦 Smart Account Address:", smartAccount.address);

  // Check if already deployed
  const isDeployed = await smartAccount.isDeployed();

  if (isDeployed) {
    console.log("✅ Smart Account is already deployed!");
    return {
      address: smartAccount.address,
      isDeployed: true,
      eoaAccount: account.address,
    };
  }

  console.log("🔄 Smart Account needs deployment...");

  // Check balance
  await checkBalance(smartAccount.address, publicClient);

  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(CONFIG.BUNDLER_URL),
  });

  // The account will be deployed when the first UserOp is sent
  console.log("\n🚀 Creating deployment User Operation...");

  const nonce = await smartAccount.getNonce();
  console.log(`Account nonce: ${nonce}`);

  const gasPrices = await getMonadGasPrices(publicClient);
  const maxFeePerGas = BigInt(152500000000);
  const maxPriorityFeePerGas = BigInt(1);

  const userOpHash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls: [
      {
        to: smartAccount.address,
        value: BigInt(0),
        data: "0x",
      },
    ],
    nonce,
    // callGasLimit: BigInt(100000),
    // verificationGasLimit: BigInt(400000),
    // preVerificationGas: BigInt(70000),
    // maxFeePerGas: parseGwei("50"),
    // maxPriorityFeePerGas: parseGwei("40"),
  });

  console.log("✅ Sent User Operation");

  // Wait for confirmation
  const transactionHash = await waitForUserOperation(
    userOpHash,
    CONFIG.BUNDLER_URL
  );

  console.log("\n🎉 Deployment Successful!");
  console.log("================================");
  console.log("Smart Account:", smartAccount.address);
  console.log("UserOp Hash:", userOpHash);
  console.log("Tx Hash:", transactionHash);
  console.log(
    "Block Explorer: https://testnet.monadexplorer.com/tx/" + transactionHash
  );
  console.log("================================\n");

  // Verify deployment
  const finalDeploymentStatus = await smartAccount.isDeployed();
  console.log("✅ Final deployment status:", finalDeploymentStatus);

  return {
    address: smartAccount.address,
    userOpHash,
    transactionHash,
    isDeployed: finalDeploymentStatus,
    eoaAccount: account.address,
  };
}

// ==================== EXECUTE ====================
async function main() {
  try {
    await deployHybridAccount();
  } catch (error) {
    console.error(
      "\n💥 Deployment failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { deployHybridAccount, CONFIG };
