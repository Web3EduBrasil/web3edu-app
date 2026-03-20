"use client";

import { useRef, useState, useEffect } from "react";
import { useConnect } from "wagmi";
import { useTranslations } from "next-intl";
import { FaWallet } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

/** Ícone laranja genérico para MetaMask (evita dependência de react-icons/si) */
function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none">
      <path d="M21.4 3L13.3 9.1l1.5-3.6L21.4 3z" fill="#E2761B" />
      <path d="M2.6 3l8 6.2-1.4-3.7L2.6 3z" fill="#E4761B" />
      <path d="M18.4 16.9l-2.1 3.3 4.5 1.2 1.3-4.4-3.7-.1z" fill="#E4761B" />
      <path d="M1.9 17l1.3 4.4 4.5-1.2-2.1-3.3-3.7.1z" fill="#E4761B" />
      <path d="M7.4 11.1l-1.2 1.9 4.4.2-.1-4.8-3.1 2.7z" fill="#E4761B" />
      <path d="M16.6 11.1l-3.2-2.7-.1 4.8 4.4-.2-1.1-1.9z" fill="#E4761B" />
      <path d="M7.7 20.2l2.7-1.3-2.3-1.8-.4 3.1z" fill="#E4761B" />
      <path d="M13.6 18.9l2.7 1.3-.4-3.1-2.3 1.8z" fill="#E4761B" />
    </svg>
  );
}

function connectorIcon(id: string): ReactNode {
  if (id === "metaMask" || id === "metaMaskSDK") return <MetaMaskIcon />;
  return <FaWallet className="w-5 h-5 shrink-0 text-blue-400" />;
}

export const LoginButton = () => {
  const { connect, connectors: allConnectors, isPending } = useConnect();

  // Remove duplicatas por id e exclui walletConnect (sem projectId configurado)
  const connectors = allConnectors.filter(
    (c, idx, arr) =>
      c.id !== "walletConnect" &&
      arr.findIndex((x) => x.id === c.id) === idx
  );
  const t = useTranslations("login");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="px-4 h-9 rounded-xl text-white bg-dblue border border-white/20 shadow-lg font-semibold text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        type="button"
        disabled={isPending}
      >
        <span>{isPending ? t("loading") : t("button")}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 bg-cgray rounded-box shadow-xl p-4 min-w-56 flex flex-col gap-2"
          >
            <p className="font-semibold text-neutral text-sm text-center mb-1">
              {t("wallet")}
            </p>
            {connectors.map((connector) => (
              <button
                key={connector.uid ?? connector.id}
                type="button"
                disabled={isPending}
                onClick={() => {
                  connect({ connector });
                  setOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-xl bg-dblue text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {connectorIcon(connector.id)}
                <span>{connector.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
