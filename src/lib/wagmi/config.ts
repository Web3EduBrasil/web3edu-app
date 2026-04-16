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
import { sepolia } from "wagmi/chains";
import type { Wallet } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
export const chains = [sepolia] as const;

const transport = http(
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
  "https://rpc.ankr.com/eth_sepolia"
);

/**
 * Constrói o wagmi config. Aceita connectors sociais opcionais (Web3Auth).
 * Deve ser chamado UMA vez, antes da montagem do WagmiProvider.
 */
export function buildWagmiConfig(socialWallets: (() => Wallet)[] = []) {
  const groups = [
    ...(socialWallets.length > 0
      ? [{ groupName: "Login Social", wallets: socialWallets }]
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

  const connectors = connectorsForWallets(groups, {
    appName: "Web3EduBrasil",
    projectId,
  });

  return createConfig({
    chains,
    connectors,
    transports: {
      [sepolia.id]: transport,
    },
    storage: createStorage({ key: "wagmi-web3edu-v5" }),
    ssr: false,
    multiInjectedProviderDiscovery: true,
  });
}
