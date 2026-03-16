import { useEffect, useRef } from "react";
import { TaskList } from "./TaskList";
import { useContent } from "@/providers/content-context";
import { Task } from "../Task/Task";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";

export const Learn = ({ trailIdRt, sectionId }: LearnProps) => {
  useOnboardingGuard();
  const { googleUserInfo } = useWeb3AuthContext();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const { fetchTrail, trail, trailsList, fetchTrailsList } = useContent();

  useEffect(() => {
    if (!googleUserInfo) return;

    // Garante que trailsList está carregada (ex: refresh direto na página)
    if (!trailsList || trailsList.length === 0) {
      fetchTrailsList(googleUserInfo.uid);
      return;
    }

    if (Object.keys(trail).length === 0 || trailIdRt !== trail?.trailId) {
      fetchTrail(trailIdRt);
    }

    if (
      trailIdRt &&
      !trailsList.some((t: { id: string }) => t.id === trailIdRt) &&
      !hasRedirectedRef.current
    ) {
      hasRedirectedRef.current = true;
      toast.error("Trilha não encontrada");
      router.push("/trailsPage");
    }
  }, [trail, trailIdRt, trailsList, googleUserInfo, fetchTrail, fetchTrailsList, router]);

  return (
    <div className="md:h-full w-full justify-center items-center flex flex-col md:flex-row sm:px-10 sm:pb-6 md:gap-10 ">
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
  );
};
