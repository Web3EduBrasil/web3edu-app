import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useEffect, useState } from "react";
import { FaCheck, FaXmark } from "react-icons/fa6";
import KnowLedge from "../KYC/KnowYourCostumer";
import { useRouter } from "next/navigation";

export const JourneysCard = () => {
  const router = useRouter();

  const { userDbInfo } = useWeb3AuthContext();
  const [kycOpen, setKycOpen] = useState(false);

  return (
    <div className="w-full lg:h-full h-72 lg:col-span-2 lg:row-span-3 flex flex-col gap-3 ">
      <p className="font-bold text-xl">Jornada do usuário</p>
      <div className="w-full lg:h-full h-full border-[1.5px] border-gray rounded-box flex flex-col overflow-hidden">
        {userDbInfo !== null ? (
          <>
            <div
              className="h-1/4 border-b-[1.5px] border-gray flex items-center px-7 justify-between cursor-pointer bg-cgray hover:bg-cgray/20 transition-colors duration-100"
              onClick={() =>
                userDbInfo?.socialMedia?.discord ||
                userDbInfo?.socialMedia?.linkedin
                  ? null
                  : router.push(`/userPage`)
              }
            >
              <p className=" font-bold">Preencher dados do perfil</p>{" "}
              {userDbInfo?.socialMedia?.discord &&
              userDbInfo?.socialMedia?.linkedin ? (
                <FaCheck className="h-8 w-auto" />
              ) : (
                <FaXmark className="h-8 w-auto" />
              )}
            </div>
            <div
              className="h-1/4 border-b-[1.5px] border-gray flex items-center px-7 justify-between cursor-pointer bg-cgray  hover:bg-cgray/20 transition-colors duration-100"
              onClick={() => !userDbInfo.kyc && setKycOpen(!kycOpen)}
            >
              <p className=" font-bold">Pesquisa de perfil</p>{" "}
              {userDbInfo.kyc ? (
                <FaCheck className="h-8 w-auto" />
              ) : (
                <FaXmark className="h-8 w-auto" />
              )}
            </div>
            <div className="h-1/4 border-b-[1.5px] border-gray flex items-center px-7 justify-between cursor-pointer bg-cgray  hover:bg-cgray/20 transition-colors duration-100">
              <p className=" font-bold">Resgatar NFT de boas-vindas</p>{" "}
              <FaCheck className="h-8 w-auto" />
            </div>
            <div
              className="h-1/4 border-gray flex items-center px-7 justify-between cursor-pointer bg-cgray  hover:bg-cgray/20 transition-colors duration-100"
              onClick={() =>
                userDbInfo?.trails ? null : router.push("/trailsPage")
              }
            >
              <p className="font-bold">Comece uma trilha</p>{" "}
              {userDbInfo.trails ? (
                <FaCheck className="h-8 w-auto" />
              ) : (
                <FaXmark className="h-8 w-auto" />
              )}
            </div>
          </>
        ) : (
          <>
            <div className="h-1/4 border-b-[1.5px] border-gray cursor-pointer"></div>
            <div className="h-1/4 border-b-[1.5px] border-gray cursor-pointer"></div>
            <div className="h-1/4 border-b-[1.5px] border-gray cursor-pointer"></div>
            <div className="h-1/4 cursor-pointer"></div>
          </>
        )}
      </div>
      {kycOpen === true ? (
        <KnowLedge setKycOpen={setKycOpen} kycOpen={kycOpen} />
      ) : (
        <></>
      )}
    </div>
  );
};
