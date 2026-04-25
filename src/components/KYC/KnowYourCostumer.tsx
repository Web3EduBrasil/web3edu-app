"use client";

import { useState } from "react";
import Kyc1 from "./Kyc1";
import Kyc2 from "./Kyc2";
import KycIntro from "./KycIntro";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { FaXmark } from "react-icons/fa6";
import { IconButton } from "../ui/IconButton";
import { authHeaders } from "@/lib/getIdToken";
import { HandleScreenProps, Interests } from "@/interfaces/interfaces";

interface KycContainerProps {
  setKycOpen: React.Dispatch<React.SetStateAction<boolean>>;
  kycOpen: boolean;
}

function KnowLedge({ setKycOpen, kycOpen }: KycContainerProps) {
  const [activeTab, setActiveTab] = useState("KycIntro");

  const { googleUserInfo, fetchUserDbData } = useWeb3AuthContext();

  const [level, setLevel] = useState<string>("");
  const [interests, setInterests] = useState<Interests>({
    crypto: false,
    blockchain: false,
    rwa: false,
    smartcontracts: false,
    defi: false,
  });

  const fetchKyc = async () => {
    try {
      const response = await fetch("/api/kyc", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          userInfo: {
            level: level,
            interests: interests,
          },
        }),
      });
      if (response.ok) {
        fetchUserDbData(googleUserInfo?.uid);
        setKycOpen(!kycOpen);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  function Switch({ activeTab }: HandleScreenProps) {
    switch (activeTab) {
      case "KycIntro":
        return <KycIntro handleTabClick={setActiveTab} />;
      case "Kyc1":
        return (
          <Kyc1
            handleTabClick={setActiveTab}
            setLevel={setLevel}
            level={level}
          />
        );
      case "Kyc2":
        return (
          <Kyc2
            handleTabClick={setActiveTab}
            interests={interests}
            setInterests={setInterests}
            fetchKyc={fetchKyc}
          />
        );
    }
  }
  return (
    <div className="z-20 backdrop-blur-[1.5px] absolute inset-0 bg-black/50 flex justify-center items-center w-full min-h-full">
      <div className="flex-col flex items-center bg-cgray justify-between shadow-2xl rounded-box h-[40rem] w-[30rem] py-6 px-8 relative">
        <IconButton
          className="h-8 w-auto absolute top-4 right-7"
          Icon={FaXmark}
          func={() => setKycOpen(!kycOpen)}
        />

        {Switch({ activeTab })}
      </div>
    </div>
  );
}

export default KnowLedge;
