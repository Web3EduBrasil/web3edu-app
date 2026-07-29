"use client";

import { FC, ReactNode, useMemo } from "react";
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as SolanaWalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

// Cast: wallet-adapter tipa FC com React 19; o app usa React 18 — evita erro de JSX no build do CI.
const ConnectionProvider = SolanaConnectionProvider as FC<{
  children: ReactNode;
  endpoint: string;
}>;
const WalletProvider = SolanaWalletProvider as FC<{
  children: ReactNode;
  wallets: (PhantomWalletAdapter | SolflareWalletAdapter)[];
  autoConnect?: boolean;
}>;
const WalletModalProvider = SolanaWalletModalProvider as FC<{
  children: ReactNode;
}>;

export const SolanaProviders: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
