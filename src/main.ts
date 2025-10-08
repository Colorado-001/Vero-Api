import { validateEnv } from "./config/env";
import { createHTTPServer } from "./interfaces/http/server";

(async () => {
  const interval = setInterval(() => {
    const mem = process.memoryUsage();
    console.log(
      `[${new Date().toISOString()}] Heap Used:`,
      (mem.heapUsed / 1024 / 1024).toFixed(2),
      "MB"
    );
  }, 10000);

  try {
    const config = validateEnv(process.env);

    const { app, close } = await createHTTPServer(config);
    const server = app.listen(config.PORT, config.HOST, () => {
      console.log(`Server running at ${config.HOST}:${config.PORT}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`${signal} received: shutting down gracefully...`);
      try {
        await Promise.race([
          Promise.all([server.closeAllConnections(), close()]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Shutdown timeout")), 5000)
          ),
        ]);
        console.log("Shutdown complete");
        process.exit(0);
      } catch (err) {
        console.error("Graceful shutdown failed:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection at:", reason);
      process.exit(1);
    });

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  } finally {
    clearInterval(interval);
  }
})();

// import { createPublicClient, http, parseEther } from "viem";
// import { createBundlerClient } from "viem/account-abstraction";
// import { monadTestnet as chain } from "viem/chains";
// import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
// import {
//   Implementation,
//   toMetaMaskSmartAccount,
// } from "@metamask/delegation-toolkit";

// const rpcUrl =
//   "https://monad-testnet.g.alchemy.com/v2/OWwGai-H51bn43KK9TgOBAB6Ce18x5J4";

// const publicClient = createPublicClient({
//   chain,
//   transport: http(),
// });

// const bundlerClient = createBundlerClient({
//   client: publicClient,
//   transport: http(rpcUrl),
// });

// const privateKey = generatePrivateKey();
// export const account = privateKeyToAccount(privateKey);
