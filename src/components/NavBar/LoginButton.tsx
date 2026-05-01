"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useConnect } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaWallet, FaEnvelope } from "react-icons/fa";

export const LoginButton = () => {
  const { openConnectModal } = useConnectModal();
  const { connect, connectors } = useConnect();
  const t = useTranslations("login");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSocialLogin = async () => {
    setOpen(false);
    const web3AuthConnector = connectors.find((c) => c.id === "web3auth");
    if (!web3AuthConnector) {
      openConnectModal?.();
      return;
    }
    try {
      // Abre o modal do Web3Auth diretamente para evitar bug do conector
      // onde provider é null antes do login (web3auth-wagmi-connector@7 + modal@9)
      const { getWeb3AuthInstance } = await import("@/lib/wagmi/web3authWallet");
      const instance = getWeb3AuthInstance();
      if (instance.status === "not_ready") {
        await instance.initModal();
      }
      await instance.connect(); // abre modal, aguarda o usuário logar
      connect({ connector: web3AuthConnector }); // sincroniza com wagmi
    } catch {
      // usuário fechou o modal ou erro — não faz nada
    }
  };

  const handleWalletLogin = () => {
    setOpen(false);
    openConnectModal?.();
  };

  return (
    <div className="relative" ref={ref}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 h-9 rounded-xl text-white bg-dblue border border-white/20 shadow-lg font-semibold text-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        type="button"
      >
        <span>{t("button")}</span>
        <FiChevronDown
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={14}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-52 bg-cgray border border-neutral/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <button
              onClick={handleSocialLogin}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-neutral hover:bg-neutral/10 transition-colors"
              type="button"
            >
              <FaEnvelope className="text-cblue w-4 h-4 shrink-0" />
              {t("email")}
            </button>

            <div className="h-px bg-neutral/10 mx-3" />

            <button
              onClick={handleWalletLogin}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-neutral hover:bg-neutral/10 transition-colors"
              type="button"
            >
              <FaWallet className="text-cblue w-4 h-4 shrink-0" />
              {t("wallet")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
