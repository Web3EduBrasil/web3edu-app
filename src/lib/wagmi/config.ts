import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { sepolia } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const transport = http(
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
  "https://rpc.ankr.com/eth_sepolia"
);

function buildConfig() {
  if (projectId) {
    // Configuração completa com WalletConnect (requer projectId válido)
    return getDefaultConfig({
      appName: "Web3EduBrasil",
      projectId,
      chains: [sepolia],
      transports: { [sepolia.id]: transport },
      ssr: true,
    });
  }

  // Sem projectId: conectores raw do wagmi — NÃO usam WalletConnect nem IndexedDB
  // RainbowKit detecta automaticamente esses conectores e exibe no modal
  if (typeof window === "undefined") {
    console.warn(
      "[wagmi] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID não definido. " +
      "Somente carteiras injetadas disponíveis. Obtenha um projectId gratuito em https://cloud.walletconnect.com"
    );
  }
  return createConfig({
    chains: [sepolia],
    connectors: [
      injected(),
      metaMask(),
      coinbaseWallet({ appName: "Web3EduBrasil" }),
    ],
    transports: { [sepolia.id]: transport },
    // ssr: false evita que o wagmi chame setup() dos conectores no Node.js
    // (os conectores acima usam APIs de browser e não devem rodar no servidor)
    ssr: false,
  });
}

export const wagmiConfig = buildConfig();
