"use client";

import { useLoading } from "@/lib/loading-context";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import logo from "../../../public/assets/images/Web3EduBrasil_logo.png";

export const LoadingOverlay = () => {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-neutralbg/85 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-5">
            <Image
              src={logo}
              alt="Web3EduBrasil"
              className="w-16 h-16 animate-pulse"
              priority
            />
            <span className="loading loading-spinner loading-lg text-primary" />
            {loadingMessage && (
              <p className="text-neutral text-sm font-medium max-w-xs text-center">
                {loadingMessage}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
