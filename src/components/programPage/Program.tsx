import { useEffect, useState } from "react";
import { ProgramProps, ProgramContainerProps } from "@/interfaces/interfaces";
import { useContent } from "@/providers/content-context";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useRouter } from "next/navigation";
import { ProgramContainer } from "../programsPage/ProgramContainer";

export const Program = ({ programId }: ProgramProps) => {
  const { userInfo, userDbInfo } = useWeb3AuthContext();
  const { trailsList, fetchTrailsList } = useContent();
  const [program, setProgram] = useState<ProgramContainerProps>({
    programId: "",
    banner: "",
    description: "",
    estimatedTime: 0,
    requirements: {},
    title: "",
  });

  const router = useRouter();


  useEffect(() => {
    if (!userInfo) {
      router.push("/");
    }
  }, [userInfo, router]);

  useEffect(() => {
    if (Object.keys(userDbInfo).length !== 0) {
      fetchTrailsList(userDbInfo?.uid);
    }
  }, [programId, userDbInfo, fetchTrailsList]);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/program?programId=${programId}`, {
          method: "GET",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message);
        }

        const data = await response.json();
        const requiredTrail = trailsList.find(
          (trail: { id: string }) => trail.id === data.requirements.trail
        );

        // Armazena o nome e a porcentagem da trilha
        if (requiredTrail) {
          data.requirements.trailName = requiredTrail.name;
          data.requirements.trailPercentage = requiredTrail.percentage;
        }
        setProgram(data);
      } catch (error: any) {
        console.error("Erro na requisição fetchProgram:", error);
      }
    };

    if (program.programId === "" && trailsList.length > 0) {
      fetchProgram();
    }
  }, [programId, trailsList, program.programId]);

  return (
    <div className="md:h-full w-full justify-center items-center flex flex-col md:flex-row sm:px-10 sm:pb-6 md:gap-10 ">
      {!userDbInfo || program.programId === "" ? (
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
        <ProgramContainer program={program} />
      )}
    </div>
  );
};
