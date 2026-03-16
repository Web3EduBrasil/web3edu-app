"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CiStar } from "react-icons/ci";

import { useRouter } from "next/navigation";
import { MotionDiv } from "../ui/MotionDiv";
import { logEvent } from "firebase/analytics";
// import { analytics } from "@/firebase/config";

export const TrailCards = ({
  image,
  title,
  description,
  id,
}: TrailsPageProps) => {
  const router = useRouter();

  return (
    <MotionDiv
      className="w-full h-80 max-w-80"
      func={() => {
        router.push(`/learn/${id}/1`);
        // logEvent(analytics, `trail_start_${title}`);
      }}
    >
      <div className="card bg-cgray w-full h-full shadow-xl border-2 border-gray overflow-hidden text-left">
        <div className="relative min-h-[40%] w-full">
          <Image
            src={image || ""}
            alt={title || "trail image"}
            fill
            sizes="100%"
            style={{ objectFit: "cover" }}
            priority={false}
          />
        </div>
        <div className="card-body p-4 min-h-[60%]">
          <div className="flex flex-row items-center justify-start relative gap-2 w-full">
            <h2 className="card-title text-dgray w-[90%]">{title}</h2>
          </div>
          <p className="text-justify text-sm text-dgray flex items-start">
            {description}
          </p>
        </div>
      </div>
    </MotionDiv>
  );
};
