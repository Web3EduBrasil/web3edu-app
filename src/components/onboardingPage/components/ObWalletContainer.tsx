"use client";

import { MotionButton } from "../../ui/Button";
import Image from "next/image";
import Onboarding1 from "../../../../public/assets/images/WalletTutorial/Onboarding1.jpg";
import Onboarding2 from "../../../../public/assets/images/WalletTutorial/Onboarding2.jpg";
import Onboarding3 from "../../../../public/assets/images/WalletTutorial/Onboarding3.jpg";
import Onboarding4 from "../../../../public/assets/images/WalletTutorial/Onboarding4.jpg";
import Onboarding5 from "../../../../public/assets/images/WalletTutorial/Onboarding5.jpg";
import web3EduLogo from "../../../../public/assets/images/Web3EduBrasil_logo.png";
import { useState } from "react";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { Bounce, toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/getIdToken";
import { useTranslations } from "next-intl";

const WALLET_IMAGES = [
  Onboarding1.src,
  Onboarding2.src,
  Onboarding3.src,
  Onboarding4.src,
  Onboarding5.src,
];

const WALLET_PROGRESS = [20, 40, 60, 80, 100];

export const ObWalletContainer = () => {
  const { googleUserInfo, setUserDbInfo } = useWeb3AuthContext();
  const router = useRouter();
  const t = useTranslations("onboarding.wallet");

  const steps = [
    {
      title: t("step1Title"),
      description: t("step1Text"),
      instruction: t("step1Instruction"),
    },
    {
      title: t("step2Title"),
      description: t("step2Text"),
      instruction: t("step2Instruction"),
    },
    {
      title: t("step2Title"),
      description: t("step2Text"),
      instruction: t("step3Instruction"),
    },
    {
      title: t("step2Title"),
      description: t("step4Text"),
      instruction: t("step4Instruction"),
    },
    {
      title: t("step2Title"),
      description: t("step5Text"),
      instruction: t("step5Instruction"),
    },
  ];

  const fetchTutorialDone = async () => {
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const response = await fetch(`/api/user?uid=${googleUserInfo?.uid}`, {
          method: "GET",
        });
        const data = await response.json();
        setUserDbInfo(data.user);
        toast.success("Tutorial completo!", {
          position: "top-right",
          autoClose: 2500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        router.push(`/homePage`);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const { title, description, instruction } = steps[currentStep];

  return (
    <div className="flex md:flex-row flex-col">
      <div className="md:w-3/6 w-full h-full bg-cgray flex p-10">
        <div className="w-full h-full flex flex-col gap-10 justify-center items-start">
          <Image alt="Logo" src={web3EduLogo} className="w-28 h-auto" />
          <div className="font-semibold flex flex-col gap-8">
            <p className="text-5xl text-dblue">{title}</p>
            <p className="text-2xl">{description}</p>
            {currentStep === steps.length - 1 && (
              <p className="text-lg text-gray-600 mt-4">{t("availableHelp")}</p>
            )}
          </div>
        </div>
      </div>
      <div className="md:w-3/6 w-full h-full flex flex-col items-center justify-center p-10 gap-10">
        <progress
          className="progress progress-success w-56"
          value={WALLET_PROGRESS[currentStep]}
          max="100"
        ></progress>
        <div
          style={{
            backgroundImage: `url(${WALLET_IMAGES[currentStep]})`,
            backgroundSize: "cover",
            backgroundPosition: "top",
          }}
          className="md:w-2/4 w-full md:h-full h-fit flex items-center justify-center text-4xl font-bold shadow-2xl rounded-box"
        ></div>
        <div className="w-fit text-center h-fit rounded-box bg-cgray flex font-semibold text-xl p-7">
          <p>{instruction}</p>
        </div>
        <MotionButton
          label={currentStep === steps.length - 1 ? t("finish") : t("nextStep")}
          type="button"
          func={() =>
            currentStep === steps.length - 1
              ? fetchTutorialDone()
              : handleNextStep()
          }
          className="bg-cgreen w-fit text-lg font-semibold"
        />
      </div>
    </div>
  );
};
