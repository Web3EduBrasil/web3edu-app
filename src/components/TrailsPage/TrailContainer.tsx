"use client";

import { TrailsPageProps } from "@/interfaces/interfaces";
import { useRouter } from "next/navigation";
import { MotionDiv } from "../ui/MotionDiv";
import { SafeImage } from "../ui/SafeImage";

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
        router.push(`/learn/${id}`);
      }}
    >
      <div className="card bg-cgray w-full h-full shadow-xl border-2 border-gray overflow-hidden text-left">
        <div className="relative min-h-[40%] w-full">
          <SafeImage
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
