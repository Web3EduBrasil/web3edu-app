"use client";

import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { IconButton } from "../ui/IconButton";
import Image from "next/image";
import { FaDiscord, FaLinkedin } from "react-icons/fa6";
import { MotionDiv } from "../ui/MotionDiv";
import { levelFromXp, xpProgressPercent, xpToNextLevel } from "@/lib/xp";

export default function UserCard() {
  const { googleUserInfo, userDbInfo } = useWeb3AuthContext();
  const openExternalLink = (url: string) => {
    const formattedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
    window.open(formattedUrl, "_blank", "noopener,noreferrer");
  };

  const xp: number = (userDbInfo as any)?.xp || 0;
  const level: number = levelFromXp(xp);
  const progress: number = xpProgressPercent(xp);
  const toNext: number = xpToNextLevel(xp);
  const streak: number = (userDbInfo as any)?.streak || 0;
  const photoURL = (userDbInfo as any)?.photoURL || googleUserInfo?.photoURL || null;
  const displayName = (userDbInfo as any)?.displayName || googleUserInfo?.displayName || googleUserInfo?.uid?.slice(0, 10) || "";
  const initial = displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="bg-base-100 w-full min-h-56 lg:min-h-60 lg:row-span-2 flex flex-col rounded-box lg:col-span-2 border-[1.5px] border-gray relative">
      <div className="h-14 bg-ddblue rounded-t-box"></div>
      {/* Avatar com badge de nível */}
      <div className="absolute z-10 top-7 left-8">
        <div className="border border-gray rounded-full h-20 w-20 overflow-hidden bg-base-200 relative flex items-center justify-center">
          {photoURL ? (
            <Image
              src={photoURL}
              alt="user avatar"
              fill
              sizes="80px"
              style={{ objectFit: "cover" }}
              priority
            />
          ) : (
            <span className="text-2xl font-bold text-ddblue">{initial}</span>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-ddblue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
          Nv {level}
        </div>
      </div>
      <div className="text-neutral px-8 pt-14 pb-3 flex-1 flex flex-col justify-between gap-3">
        <h2 className="font-bold text-xl truncate">{displayName}</h2>
        {/* XP Bar */}
        <div className="flex flex-col gap-0.5 w-full">
          <div className="flex justify-between text-xs text-gray">
            <span>{xp} XP</span>
            <span>Faltam {toNext} XP para o Nv {level + 1}</span>
          </div>
          <div className="w-full bg-gray/20 rounded-full h-2">
            <div
              className="bg-ddblue h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray">📍 On-chain</p>
            {streak > 0 && (
              <span className="text-xs font-semibold text-orange-500">
                🔥 {streak}d
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row items-start">
            {(userDbInfo as any)?.socialMedia?.linkedin ? (
              <IconButton
                className="h-8 text-ddblue"
                Icon={FaLinkedin}
                func={() => openExternalLink((userDbInfo as any)?.socialMedia?.linkedin)}
              />
            ) : (
              <></>
            )}
            {(userDbInfo as any)?.socialMedia?.discord ? (
              <MotionDiv className="flex items-center gap-2 cursor-pointer">
                <FaDiscord className="h-8 w-8 text-ddblue" />
                <p className="md:text-base">
                  {(userDbInfo as any)?.socialMedia?.discord}
                </p>
              </MotionDiv>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
