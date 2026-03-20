"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";

/**
 * Redireciona para /onboarding se o usuário autenticado ainda não
 * completou o fluxo de integração (tutorialDone === false).
 *
 * Use nas páginas protegidas: trailsPage, programsPage, learn, etc.
 */
export function useOnboardingGuard() {
  const { userDbInfo } = useWeb3AuthContext();
  const router = useRouter();

  useEffect(() => {
    if (userDbInfo && Object.keys(userDbInfo).length > 0) {
      if ((userDbInfo as any).tutorialDone === false) {
        router.push("/onboarding");
      }
    }
  }, [userDbInfo, router]);
}
