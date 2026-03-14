import { FaClock } from "react-icons/fa6";
import { MotionButton } from "../ui/Button";
import { toast } from "react-toastify";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useContent } from "@/providers/content-context";
import { RewardContainer } from "../RewardContainer/RewardContainer";

export const ProgramContainer = ({
  program,
}: {
  program: ProgramContainerProps;
}) => {
  const { userDbInfo } = useWeb3AuthContext();
  const { handleRewardContainer, rewardContainerVisibility } = useContent();

  function RequestCertificate() {
    if (program?.requirements?.trailPercentage !== 100) {
      toast.warning("Conclua os requisitos antes de resgatar o certificado!");
      return;
    }
    handleRewardContainer({
      type: "program",
      id: program.programId,
      name: program.title,
      icon: program.banner,
    });
  }

  return (
    <div className="md:w-2/4 w-full md:h-full flex flex-col justify-start items-start text-neutral bg-cgray md:rounded-box md:overflow-y-auto drop-shadow-2xl relative">
      {/* RewardContainer sobreposto ao card do programa */}
      <RewardContainer />

      <div className="flex flex-col w-full h-2/5 justify-start items-start overflow-hidden">
        <img
          src={program?.banner}
          className="w-full"
          style={{ objectFit: "fill" }}
          alt=""
        />
      </div>
      <div className="w-full h-full px-6 py-4 flex flex-col justify-between items-end">
        <div className="w-full h-full flex flex-col gap-6">
          <div className="flex w-full justify-between items-center">
            <p className="font-extrabold text-2xl">{program?.title}</p>
            <div className="flex gap-2 items-center">
              <FaClock />
              {JSON.stringify(program?.estimatedTime)} horas
            </div>
          </div>
          <p className="fonte-medium text-justify">{program?.description}</p>
          <div>
            <p>Requisitos para conclusão:</p>
            <li>
              Conclua a trilha &ldquo;{program?.requirements?.trailName}&rdquo;.{" "}
              <strong>Status:</strong>{" "}
              {program?.requirements?.trailPercentage ?? 0}%
            </li>
          </div>
        </div>
        <MotionButton
          label="Resgatar Certificado"
          className="w-64 bg-green"
          func={RequestCertificate}
          type="button"
        />
      </div>
    </div>
  );
};
