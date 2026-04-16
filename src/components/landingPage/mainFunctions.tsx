"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

function MainFunctions({
  functionName,
  content,
  image,
  className = "",
  isHoverBlocked = false, // Recebe a prop que bloqueia o hover
}: {
  functionName: any;
  content: any;
  image: any;
  className?: string;
  isHoverBlocked?: boolean; // Nova prop
}) {
  const [isHovered, setIsHovered] = useState(false); // Cada card tem seu próprio estado de hover

  // Condição para verificar se o hover deve ser bloqueado
  const handleMouseEnter = () => {
    if (!isHoverBlocked) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isHoverBlocked) setIsHovered(false);
  };

  return (
    <motion.div
      className={`bg-[#F3F3F3] text-black flex flex-col w-full md:w-96 md:min-w-0 rounded-3xl shadow-xl overflow-hidden transition-all ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Parte Superior */}
      <div className="flex h-40">
        <div className="w-2/5 h-full rounded-l-3xl flex justify-center items-center shadow-lg">
          {typeof image === "string" ? (
            <Image src={image} alt="" className="w-20 h-auto text-ddblue" />
          ) : (
            image
          )}
        </div>
        <div className="w-3/5 h-full bg-[#001D3D] rounded-r-3xl flex justify-center items-center text-center shadow-lg md:px-8 px-2">
          <p className="text-white text-2xl">{functionName}</p>
        </div>
      </div>

      {/* Parte Inferior Expansível */}
      <motion.div
        className="bg-gray-200 text-black px-4 py-2 text-sm rounded-b-3xl h-fit overflow-hidden"
        initial={{ maxHeight: 0, opacity: 0 }}
        animate={{
          maxHeight: isHovered ? 9999 : 0,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

export default MainFunctions;
