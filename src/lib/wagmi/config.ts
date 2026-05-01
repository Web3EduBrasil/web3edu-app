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
import type { Wallet } from "@rainbow-me/rainbowkit";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
export const chains = [sepolia, mainnet] as const;

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
      [mainnet.id]: http("https://rpc.ankr.com/eth"),
    },
    storage: createStorage({ key: "wagmi-web3edu-v6" }),
    // true: hidratação roda em useEffect (evita setState durante o render do Hydrate → conflito com RainbowKit).
    ssr: true,
    multiInjectedProviderDiscovery: true,
  });
}
