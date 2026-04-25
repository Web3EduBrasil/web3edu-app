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
  const { userDbInfo, userAccount } = useWeb3AuthContext();
  const { fetchAchievedNfts, achievedNfts } = useContent();
  const nftsFetchedRef = useRef(false);

  useEffect(() => {
    if (userDbInfo && Object.keys(userDbInfo).length > 0) {
      if ((userDbInfo as any).tutorialDone === false) {
        router.push(`/onboarding`);
      }
    }
  }, [userDbInfo, router]);

  useEffect(() => {
    if (userDbInfo && Object.keys(userDbInfo).length > 0 && userAccount[0] && !nftsFetchedRef.current) {
      nftsFetchedRef.current = true;
      fetchAchievedNfts(userAccount[0]);
    }
  }, [userDbInfo, userAccount, fetchAchievedNfts]);

  return (
    <div className="h-full w-full grid items-center grid-cols-1 lg:grid-rows-5 pb-6 lg:grid-cols-5 lg:px-40 px-10 justify-center gap-10">
      <UserCard />
      <NftsCard achievedNfts={achievedNfts} />
      <JourneysCard />
      <TrailsCardSection />
      <LeaderboardCard />
    </div>
  );
};
