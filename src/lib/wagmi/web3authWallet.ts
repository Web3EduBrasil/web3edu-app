import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";
import { sepolia } from "wagmi/chains";
import type { Wallet } from "@rainbow-me/rainbowkit";

const clientId =
  process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ||
  "BEE2_eEl-UjBYycxSPDNInRo_XKM2aKPTWsWi3fdmemHdhfbQrac5OZJVpamYHCU_QqNpIrlmh3p4z4hbgjiFc8";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x" + sepolia.id.toString(16),
  rpcTarget:
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET ||
    "https://rpc.ankr.com/eth_sepolia",
  displayName: sepolia.name,
  tickerName: sepolia.nativeCurrency.name,
  ticker: sepolia.nativeCurrency.symbol,
  blockExplorerUrl: sepolia.blockExplorers.default.url,
};

// Usa a rede definida em NEXT_PUBLIC_WEB3AUTH_NETWORK (.env)
const web3AuthNetwork =
  process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK === "sapphire_mainnet"
    ? WEB3AUTH_NETWORK.SAPPHIRE_MAINNET
    : WEB3AUTH_NETWORK.SAPPHIRE_DEVNET;

let privateKeyProvider: EthereumPrivateKeyProvider | null = null;
let web3AuthInstance: Web3Auth | null = null;

function getWeb3AuthInstance(): Web3Auth {
  if (!web3AuthInstance) {
    if (!privateKeyProvider) {
      privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig },
      });
    }
    web3AuthInstance = new Web3Auth({
      clientId,
      chainConfig,
      privateKeyProvider,
      web3AuthNetwork,
      uiConfig: {
        appName: "Web3EduBrasil",
        loginMethodsOrder: ["google", "email_passwordless"],
        defaultLanguage: "pt",
        modalZIndex: "2147483647",
        logoLight: "https://web3edubrasil.com/assets/images/Web3EduBrasil_logo.png",
        logoDark: "https://web3edubrasil.com/assets/images/Web3EduBrasil_logo.png",
        mode: "auto",
      },
    });
  }
  return web3AuthInstance;
}

// Conector único sem loginParams → abre o modal completo do Web3Auth
// (Google, Discord, Reddit, Email, etc.)
export const web3AuthWallet = (): Wallet => ({
  id: "web3auth",
  name: "Login Social",
  iconUrl: "https://authjs.dev/img/providers/google.svg",
  iconBackground: "#ffffff",
  createConnector: () =>
    Web3AuthConnector({
      id: "web3auth",
      name: "Login Social",
      web3AuthInstance: getWeb3AuthInstance(),
    }),
});

// Mantidos para compatibilidade com código existente que possa importá-los
export const web3AuthGoogleWallet = web3AuthWallet;
export const web3AuthEmailWallet = web3AuthWallet;
