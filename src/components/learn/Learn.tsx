"use client";

import { useEffect, useRef } from "react";
import { LearnProps } from "@/interfaces/interfaces";
import { TaskList } from "./TaskList";
import { useContent } from "@/providers/content-context";
import { Task } from "../Task/Task";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";
import { IoArrowBack } from "react-icons/io5";
import { LearnBottomTabs } from "./LearnBottomTabs";

export const Learn = ({ trailIdRt, sectionId }: LearnProps) => {
  useOnboardingGuard();
  const { googleUserInfo } = useWeb3AuthContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const { fetchTrail, trail, trailsList, fetchTrailsList, trailSections } = useContent();
  const trailsFetchedRef = useRef(false);

  useEffect(() => {
    if (!googleUserInfo) return;

    // Garante que trailsList está carregada (ex: refresh direto na página)
    if ((!trailsList || trailsList.length === 0) && !trailsFetchedRef.current) {
      trailsFetchedRef.current = true;
      fetchTrailsList(googleUserInfo.uid);
      return;
    }

    if (Object.keys(trail).length === 0 || trailIdRt !== trail?.trailId) {
      fetchTrail(trailIdRt);
    }

    if (
      trailIdRt &&
      trailsList.length > 0 &&
      !trailsList.some((t: { id: string }) => t.id === trailIdRt) &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      toast.error("Trilha não encontrada");
      router.push("/trailsPage");
    }
  }, [trail, trailIdRt, trailsList, googleUserInfo, fetchTrail, fetchTrailsList, router]);

  const doneSections = trailSections?.filter((s: any) => s.done).length ?? 0;
  const totalSections = trailSections?.length ?? 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header: voltar + nome da trilha + progresso */}
      <div className="w-full flex items-center gap-3 px-4 sm:px-10 py-3 shrink-0 border-b border-base-300">
        <button
          onClick={() => router.push(`/learn/${trailIdRt}`)}
          className="btn btn-ghost btn-sm gap-1.5 text-neutral/60 hover:text-neutral"
        >
          <IoArrowBack className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Voltar</span>
        </button>

        <div className="h-4 w-px bg-neutral/20 shrink-0" />

        <div className="flex-1 min-w-0">
          {trail?.name ? (
            <p className="font-semibold text-neutral truncate">{trail.name}</p>
          ) : (
            <div className="skeleton h-4 w-40" />
          )}
        </div>

        {totalSections > 0 && (
          <span className="text-xs text-neutral/50 shrink-0 hidden sm:block">
            {doneSections}/{totalSections} seções
          </span>
        )}
      </div>

      {/* Conteúdo principal: aula + lista de aulas restantes */}
      <div className="w-full flex flex-col md:flex-row sm:px-10 md:gap-10 md:pt-6 pb-4 md:h-[72vh]">
        {!googleUserInfo || !trailIdRt || Object.keys(trail).length === 0 ? (
          <div className="md:w-3/5 w-full md:h-full flex flex-col justify-start items-start bg-cgray md:rounded-box p-10 md:gap-3 gap-6 md:overflow-y-auto">
            <div className="flex w-full flex-col gap-4">
              <div className="skeleton h-32 w-full"></div>
              <div className="skeleton h-4 w-28"></div>
              <div className="skeleton h-4 w-full"></div>
              <div className="skeleton h-4 w-full"></div>
            </div>
            <div className="skeleton h-full w-full"></div>
            <div className="skeleton h-full w-full"></div>
          </div>
        ) : (
          <Task sectionId={sectionId} trailId={trail?.trailId} />
        )}
        <TaskList uid={googleUserInfo?.uid} />
      </div>

      {googleUserInfo && trailIdRt && Object.keys(trail).length > 0 && (
        <LearnBottomTabs trail={trail} trailId={trailIdRt} sectionId={sectionId} />
      )}
    </div>
  );
};
