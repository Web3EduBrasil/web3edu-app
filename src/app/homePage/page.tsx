"use client";

import { Home } from "@/components/homePage/Home";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useContent } from "@/providers/content-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function homePage() {
  const router = useRouter();
  const { userDbInfo, isLoggedIn } = useWeb3AuthContext();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      toast.warning("Faça login para acessar esta tela");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (userDbInfo) {
      if (userDbInfo.tutorialDone === false) 
        router.push(`/onboarding`);
    }
  }, [userDbInfo]);
  return <Home />;
}
