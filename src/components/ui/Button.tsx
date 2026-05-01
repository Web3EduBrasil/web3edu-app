"use client";

import { motion } from "framer-motion";
import { MotionButtonProps } from "@/interfaces/interfaces";

export const MotionButton = ({
  label,
  type,
  rightIcon,
  className,
  func,
  Icon,
}: MotionButtonProps<void>) => {
  return (
    <motion.button
      className={`flex items-center justify-center gap-2 px-3 py-[0.125rem] h-9 rounded-[0.7rem] text-base-content shadow-lg ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      type={type}
      onClick={() => func()}
    >
      {Icon && !rightIcon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="truncate">{label}</span>
      {Icon && rightIcon && <Icon className="w-4 h-4 shrink-0" />}
    </motion.button>
  );
};
