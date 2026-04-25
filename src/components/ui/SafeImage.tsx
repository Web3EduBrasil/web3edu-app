"use client";

import Image from "next/image";
import { useState } from "react";
import logo from "../../../public/assets/images/Web3EduBrasil_logo.png";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export const SafeImage = ({ src, alt, ...props }: SafeImageProps) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-cgray/40">
        <Image src={logo} alt="Web3EduBrasil" className="w-14 opacity-25" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
};
