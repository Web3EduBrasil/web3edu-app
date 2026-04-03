"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, upgradeConfigWithSocialWallets } from "./config";
import { ReactNode, useState, useEffect, useRef } from "react";

const accentColor = "#1e3a5f";

// Inicia o download do chunk Web3Auth imediatamente ao avaliar o módulo,
// sem bloquear o render. Assim, quando o usuário clica em Login, o chunk
// já está carregado (ou quase) em vez de começar a carregar só nesse momento.
const web3authChunkPromise =
  typeof window !== "undefined" ? import("./web3authWallet") : null;

export function WagmiProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState(wagmiConfig);
  const socialLoaded = useRef(false);

  useEffect(() => {
    const check = () =>
      setIsDark(
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    check();
    setMounted(true);
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Usa a promise já iniciada no topo do módulo — sem re-disparar o download
  useEffect(() => {
    if (socialLoaded.current || !web3authChunkPromise) return;
    socialLoaded.current = true;

    web3authChunkPromise
      .then(({ web3AuthGoogleWallet, web3AuthEmailWallet }) => {
        const upgraded = upgradeConfigWithSocialWallets([
          web3AuthGoogleWallet,
          web3AuthEmailWallet,
        ]);
        setConfig(upgraded);
      })
      .catch((err) => {
        console.error("Web3Auth wallets failed to load:", err);
      });
  }, []);

  const rkTheme = mounted
    ? isDark
      ? darkTheme({ accentColor, accentColorForeground: "white", borderRadius: "medium" })
      : lightTheme({ accentColor, accentColorForeground: "white", borderRadius: "medium" })
    : lightTheme({ accentColor, accentColorForeground: "white", borderRadius: "medium" });

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="pt-BR" theme={rkTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
