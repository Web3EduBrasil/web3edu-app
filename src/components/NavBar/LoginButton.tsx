"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export const LoginButton = () => {
  const { openConnectModal } = useConnectModal();
  const t = useTranslations("login");

  return (
    <motion.button
      onClick={() => openConnectModal?.()}
      className="px-4 h-9 rounded-xl text-white bg-dblue border border-white/20 shadow-lg font-semibold text-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      type="button"
      disabled={!openConnectModal}
    >
      <span>{t("button")}</span>
    </motion.button>
  );
};
