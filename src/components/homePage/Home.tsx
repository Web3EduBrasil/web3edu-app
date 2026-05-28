"use client";

import UserCard from "./UserCard";
import { NftsCard } from "./NftsCard";
import { JourneysCard } from "./JourneysCard";
import { TrailsCardSection } from "./TrailsCardSection";
import { LeaderboardCard } from "./LeaderboardCard";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/providers/content-context";

export const Home = () => {
  const router = useRouter();
  const { userDbInfo, userAccount, googleUserInfo } = useWeb3AuthContext();
  const { fetchAchievedNfts, achievedNfts } = useContent();
  const nftsFetchedRef = useRef(false);

  useEffect(() => {
    if (userDbInfo && Object.keys(userDbInfo).length > 0) {
      if ((userDbInfo as any).onboardingCompleted !== true) {
        router.push(`/onboarding`);
      }
    }
  }, [userDbInfo, router]);

  const effectiveAddress =
    userAccount[0] || (googleUserInfo?.uid?.startsWith("0x") ? googleUserInfo.uid : "");

  useEffect(() => {
    if (!effectiveAddress) return;
    if (userDbInfo && Object.keys(userDbInfo).length > 0 && !nftsFetchedRef.current) {
      nftsFetchedRef.current = true;
      fetchAchievedNfts(effectiveAddress);
    }
  }, [userDbInfo, effectiveAddress, fetchAchievedNfts]);

  return (
    <div className="w-full grid items-start grid-cols-1 pb-6 lg:grid-cols-5 lg:[grid-template-rows:repeat(5,minmax(90px,auto))] lg:px-40 px-10 justify-center gap-6">
      <UserCard />
      <NftsCard achievedNfts={achievedNfts} />
      <JourneysCard />
      <TrailsCardSection />
      <LeaderboardCard />
    </div>
  );
};
