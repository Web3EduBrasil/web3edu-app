"use client";

import Image from "next/image";
import logo from "../../../public/assets/images/Web3EduBrasil_logo.png";

interface SafeIframeProps {
  src?: string;
  className?: string;
  allowFullScreen?: boolean;
  frameBorder?: string;
  title?: string;
}

export const SafeIframe = ({ src, className, allowFullScreen, frameBorder, title }: SafeIframeProps) => {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-cgray rounded-box ${className ?? "aspect-video w-full"}`}>
        <Image src={logo} alt="Web3EduBrasil" className="w-20 opacity-25" />
      </div>
    );
  }

  return (
    <iframe
      src={src}
      className={className}
      allowFullScreen={allowFullScreen}
      frameBorder={frameBorder}
      title={title ?? "vídeo"}
    />
  );
};
