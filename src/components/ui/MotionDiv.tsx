import { motion } from "framer-motion";
import { MotionDiv as MotionDivProps } from "@/interfaces/interfaces";

export const MotionDiv = ({ className, func, children }: MotionDivProps<void>) => {
  if (func) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={`cursor-pointer ${className}`}
        onClick={() => func()}
      >
        {children}
      </motion.div>
    );
  } else {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className={`cursor-pointer ${className}`}
      >
        {children}
      </motion.div>
    );
  }
};
