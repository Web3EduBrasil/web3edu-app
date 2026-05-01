"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { buildWagmiConfig } from "./config";
import { ReactNode, useState, useEffect, useMemo } from "react";

const accentColor = "#1e3a5f";

// Inicia o download do chunk Web3Auth imediatamente ao avaliar o módulo (browser-only).
// @web3auth/modal usa browser globals — não pode ser importado estaticamente porque
// WagmiProviders roda no servidor durante SSR mesmo com "use client".
const socialWalletsPromise =
  typeof window !== "undefined"
    ? import("./web3authWallet")
      .then(({ web3AuthWallet }) => [web3AuthWallet])
      .catch(() => undefined)
    : Promise.resolve(undefined);

export function WagmiProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [isDark, setIsDark] = useState(false);
  // Config começa como null — WagmiProvider só monta após o config estar pronto
  // com os connectors sociais incluídos (wagmi v2 ignora mudanças no prop config após mount).
  const [config, setConfig] = useState<ReturnType<typeof buildWagmiConfig> | null>(null);
  // mounted evita que wagmi/RainbowKit renderizem durante SSR/hydration,
  // prevenindo o warning "Cannot update ConnectModal while rendering Hydrate"
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Aguarda social wallets e monta o config UMA vez com tudo incluído.
  // setMounted(true) aqui garante que o tree wagmi/RainbowKit só renderize
  // após a hidratação, prevenindo o warning "Cannot update ConnectModal while rendering Hydrate".
  useEffect(() => {
    setMounted(true);
    socialWalletsPromise.then((socialWallets) => {
      setConfig(buildWagmiConfig(socialWallets ?? []));
    });
  }, []);

  const rkTheme = useMemo(
    () =>
      isDark
        ? darkTheme({ accentColor, accentColorForeground: "white", borderRadius: "medium" })
        : lightTheme({ accentColor, accentColorForeground: "white", borderRadius: "medium" }),
    [isDark]
  );

  if (!config || !mounted) return null;

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
