"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";

/**
 * Redireciona para /onboarding se o usuário autenticado ainda não
 * completou o fluxo de onboarding (onboardingCompleted === false).
 *
 * Use nas páginas protegidas: trailsPage, programsPage, learn, etc.
 */
export function useOnboardingGuard() {
  const { userDbInfo } = useWeb3AuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!userDbInfo || Object.keys(userDbInfo).length === 0) return;
    if (pathname.startsWith("/onboarding")) return;
    if (pathname.startsWith("/certificates")) return;
    if ((userDbInfo as any).onboardingCompleted !== true) {
      router.push("/onboarding");
    }
  }, [userDbInfo, router, pathname]);
}
