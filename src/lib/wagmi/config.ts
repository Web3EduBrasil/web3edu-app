import { createConfig, createStorage, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { mainnet, sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const chains = [mainnet, sepolia] as const;

type WagmiConfigInstance = ReturnType<typeof createConfig>;

const globalForWagmi = globalThis as typeof globalThis & {
  __web3EduWagmiConfig?: WagmiConfigInstance;
};

function buildWagmiConfig(): WagmiConfigInstance {
  const transport = http(
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
    "https://rpc.ankr.com/eth_sepolia"
  );

  const mainnetTransport = http("https://ethereum-rpc.publicnode.com");

  const connectors = connectorsForWallets(
    [
      {
        groupName: "Carteiras",
        wallets: [metaMaskWallet],
      },
    ],
    {
      appName: "Web3EduBrasil",
      projectId,
    }
  );

  return createConfig({
    chains,
    connectors,
    transports: {
      [mainnet.id]: mainnetTransport,
      [sepolia.id]: transport,
    },
    storage: createStorage({ key: "wagmi-web3edu-v2" }),
    ssr: false,
  });
}

export const wagmiConfig =
  globalForWagmi.__web3EduWagmiConfig ?? buildWagmiConfig();

if (process.env.NODE_ENV !== "production") {
  globalForWagmi.__web3EduWagmiConfig = wagmiConfig;
}
