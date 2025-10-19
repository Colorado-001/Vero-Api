"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const account_abstraction_1 = require("viem/account-abstraction");
const delegation_toolkit_1 = require("@metamask/delegation-toolkit");
// Configuration
const BUNDLER_URL = "https://api.pimlico.io/v2/10143/rpc?apikey=pim_fesFtvFD5hYoCZ4c94LPyR";
const PAYMASTER_URL = "https://api.pimlico.io/v2/10143/rpc?apikey=pim_fesFtvFD5hYoCZ4c94LPyR";
const PRIVATE_KEY = "0xdcb847b64b159107b36a6a4ed29acd73a002b6ec8ca7807f3fae6298ccec88cb"; // EOA that will be the owner
const CHAIN = chains_1.monadTestnet;
function getPimlicoGasPrices() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(`${BUNDLER_URL}`, {
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
            const data = yield response.json();
            if (data.result) {
                return {
                    maxFeePerGas: BigInt(data.result.standard.maxFeePerGas),
                    maxPriorityFeePerGas: BigInt(data.result.standard.maxPriorityFeePerGas),
                };
            }
        }
        catch (error) {
            console.log("Pimlico gas price endpoint not available, using defaults");
        }
        // Fallback to Monad defaults
        return {
            maxFeePerGas: (0, viem_1.parseGwei)("3"),
            maxPriorityFeePerGas: (0, viem_1.parseGwei)("2.5"),
        };
    });
}
function calculateGasCost(gasLimits, gasPrices) {
    const totalGasLimit = gasLimits.callGasLimit +
        gasLimits.verificationGasLimit +
        gasLimits.preVerificationGas;
    const maxCost = totalGasLimit * gasPrices.maxFeePerGas;
    const likelyCost = totalGasLimit * gasPrices.maxPriorityFeePerGas;
    return {
        totalGasLimit,
        maxCostWei: maxCost,
        maxCostEth: (0, viem_1.formatEther)(BigInt(maxCost)),
        likelyCostWei: likelyCost,
        likelyCostEth: (0, viem_1.formatEther)(BigInt(likelyCost)),
    };
}
// Display gas estimate to user
function displayGasEstimate(gasEstimate, gasPrices, isSponsored = false) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("           GAS ESTIMATE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📊 Gas Breakdown:");
    console.log(`   Call Gas:              ${gasEstimate.callGasLimit.toLocaleString()}`);
    console.log(`   Verification Gas:      ${gasEstimate.verificationGasLimit.toLocaleString()}`);
    console.log(`   Pre-verification Gas:  ${gasEstimate.preVerificationGas.toLocaleString()}`);
    console.log(`   ─────────────────────────────────────`);
    console.log(`   Total Gas Limit:       ${gasEstimate.totalGasLimit.toLocaleString()}`);
    console.log("\n⛽ Gas Prices:");
    console.log(`   Max Fee:              ${(0, viem_1.formatEther)(gasPrices.maxFeePerGas)} ETH/gas`);
    console.log(`   Priority Fee:         ${(0, viem_1.formatEther)(gasPrices.maxPriorityFeePerGas)} ETH/gas`);
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
function deploySmartWalletWithPaymaster() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create owner account from private key
        const owner = (0, accounts_1.privateKeyToAccount)(PRIVATE_KEY);
        // Create public client for reading blockchain state
        const publicClient = (0, viem_1.createPublicClient)({
            chain: CHAIN,
            transport: (0, viem_1.http)(),
        });
        // Create bundler client for submitting user operations
        const bundlerClient = (0, account_abstraction_1.createBundlerClient)({
            transport: (0, viem_1.http)(BUNDLER_URL),
            client: publicClient,
        });
        // Create paymaster client for gas sponsorship
        const paymasterClient = (0, account_abstraction_1.createPaymasterClient)({
            transport: (0, viem_1.http)(PAYMASTER_URL),
        });
        const smartAccount = yield (0, delegation_toolkit_1.toMetaMaskSmartAccount)({
            client: publicClient,
            implementation: delegation_toolkit_1.Implementation.Hybrid,
            deployParams: [owner.address, [], [], []],
            deploySalt: "0x",
            signer: { account: owner },
        });
        console.log("Smart Account Address:", smartAccount.address);
        console.log("Owner Address:", owner.address);
        // Check if account is already deployed
        const code = yield publicClient.getCode({
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
            const gasPrices = yield getPimlicoGasPrices();
            const { maxFeePerGas, maxPriorityFeePerGas } = gasPrices;
            console.log("💰 Gas fees will be sponsored by paymaster", maxFeePerGas, maxPriorityFeePerGas);
            // Send a user operation that will deploy the account
            // Gas fees are sponsored by the paymaster
            const userOpHash = yield bundlerClient.sendUserOperation({
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
            const receipt = yield bundlerClient.waitForUserOperationReceipt({
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
        }
        catch (error) {
            console.error("❌ Deployment failed:", error.message);
            throw error;
        }
    });
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
