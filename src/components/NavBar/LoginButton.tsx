"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaWallet, FaEnvelope } from "react-icons/fa";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";

export const LoginButton = () => {
  const { setVisible } = useWalletModal();
  const { login } = useWeb3AuthContext();
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
    try {
      await login();
    } catch {
      // user cancelled or error — no-op
    }
  };

  const handleWalletLogin = () => {
    setOpen(false);
    setVisible(true);
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
