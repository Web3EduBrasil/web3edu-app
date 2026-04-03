import { createConfig, createStorage, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  trustWallet,
  phantomWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { mainnet, sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
export const chains = [mainnet, sepolia] as const;

type WagmiConfigInstance = ReturnType<typeof createConfig>;

const CONFIG_VERSION = 4;

const globalForWagmi = globalThis as typeof globalThis & {
  __web3EduWagmiConfig?: WagmiConfigInstance;
  __web3EduConfigVersion?: number;
};

const transport = http(
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
  "https://rpc.ankr.com/eth_sepolia"
);
const mainnetTransport = http("https://ethereum-rpc.publicnode.com");

export function buildWagmiConfig(extraWallets?: any[]): WagmiConfigInstance { // eslint-disable-line
  const walletGroups = [
    ...(extraWallets && extraWallets.length > 0
      ? [{ groupName: "Login Social", wallets: extraWallets }]
      : []),
    {
      groupName: "Carteiras",
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
        trustWallet,
        phantomWallet,
      ],
    },
  ];

  const connectors = connectorsForWallets(walletGroups, {
    appName: "Web3EduBrasil",
    projectId,
  });

  return createConfig({
    chains,
    connectors,
    transports: {
      [mainnet.id]: mainnetTransport,
      [sepolia.id]: transport,
    },
    storage: createStorage({ key: "wagmi-web3edu-v4" }),
    ssr: false,
    multiInjectedProviderDiscovery: true,
  });
}

const isClient = typeof window !== "undefined";

const cachedConfig =
  isClient && globalForWagmi.__web3EduConfigVersion === CONFIG_VERSION
    ? globalForWagmi.__web3EduWagmiConfig
    : null;

// Config inicial SEM Web3Auth (rápida, sem deps pesadas)
export let wagmiConfig = cachedConfig ?? buildWagmiConfig();

/** Chamado pelo WagmiProviders depois do import() dinâmico do Web3Auth */
export function upgradeConfigWithSocialWallets(socialWallets: any[]) { // eslint-disable-line
  wagmiConfig = buildWagmiConfig(socialWallets);
  if (isClient) {
    globalForWagmi.__web3EduWagmiConfig = wagmiConfig;
    globalForWagmi.__web3EduConfigVersion = CONFIG_VERSION;
  }
  return wagmiConfig;
}

if (process.env.NODE_ENV !== "production" && isClient) {
  globalForWagmi.__web3EduWagmiConfig = wagmiConfig;
  globalForWagmi.__web3EduConfigVersion = CONFIG_VERSION;
}
