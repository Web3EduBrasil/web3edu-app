import { motion } from "framer-motion";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IconButtonProps } from "@/interfaces/interfaces";

export const IconButton = ({
  func,
  Icon,
  className,
}: IconButtonProps<void>) => {
  return (
    <motion.button
      className={`cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17,
      }}
      onClick={() => func()}
    >
      <Icon className="w-full h-full" />
    </motion.button>
  );
};
