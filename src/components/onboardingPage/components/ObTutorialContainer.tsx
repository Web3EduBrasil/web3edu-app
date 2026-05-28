"use client";

import { MotionButton } from "../../ui/Button";
import Image from "next/image";
import Onboarding1 from "../../../../public/assets/images/tutorial/homepage.png";
import Onboarding2 from "../../../../public/assets/images/tutorial/kyc.jpg";
import Onboarding3 from "../../../../public/assets/images/tutorial/trailspage.png";
import Onboarding4 from "../../../../public/assets/images/tutorial/trailpage.png";
import Onboarding5 from "../../../../public/assets/images/tutorial/reward.png";
import Onboarding6 from "../../../../public/assets/images/tutorial/acesswallet.jpg";
import Onboarding7 from "../../../../public/assets/images/tutorial/yourprofile.jpg";
import web3EduLogo from "../../../../public/assets/images/Web3EduBrasil_logo.png";
import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const STEP_IMAGES = [
  Onboarding1.src,
  Onboarding7.src,
  Onboarding2.src,
  Onboarding3.src,
  Onboarding4.src,
  Onboarding5.src,
  Onboarding6.src,
];

const STEP_PROGRESS = [16.6, 25, 33.3, 50, 66.6, 83.3, 100];

type StepKey = "homeScreen" | "profile" | "userConfig" | "trailsScreen" | "learning" | "reward" | "done";
const STEP_KEYS: StepKey[] = ["homeScreen", "profile", "userConfig", "trailsScreen", "learning", "reward", "done"];

export const ObTutorialContainer = () => {
  const router = useRouter();
  const t = useTranslations("onboarding");

  const steps = STEP_KEYS.map((key, i) => ({
    title: t(`${key}.title`),
    description: t(`${key}.text`),
    instruction: t(`${key}.access`),
    image: STEP_IMAGES[i],
    progress: STEP_PROGRESS[i],
  }));

  const handleFinish = () => {
    toast.info("Complete seu cadastro para liberar certificados.");
    router.push("/onboarding");
  };

  const [currentStep, setCurrentStep] = useState(0);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const { title, description, image, progress, instruction } =
    steps[currentStep];

  return (
    <div className="flex md:flex-row flex-col w-full">
      <div className="md:w-2/5 w-full h-full bg-cgray flex p-10">
        <div className="w-full h-full flex flex-col gap-10 justify-center items-start">
          <Image alt="Logo" src={web3EduLogo} className="w-28 h-auto" />
          <div className="font-semibold flex flex-col gap-8">
            <p className="md:text-5xl text-3xl text-dblue">{title}</p>
            <p className="md:text-2xl text-xl">{description}</p>
            {currentStep === steps.length - 1 && (
              <p className="text-lg text-gray-600 mt-4">{t("done.help")}</p>
            )}
          </div>
        </div>
      </div>
      <div className="md:w-3/5 w-full md:h-full flex flex-col items-center justify-center p-10 gap-10">
        <progress
          className="progress progress-success w-56 md:visible invisible"
          value={progress}
          max="100"
        ></progress>
        <div
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
          className="min-w-full md:h-full h-44 flex items-center justify-center text-4xl shadow-2xl rounded-box"
        ></div>
        <div className="w-fit text-center h-fit rounded-box bg-cgray flex font-semibold md:text-xl text-lg p-7">
          <p>{instruction}</p>
        </div>
        <MotionButton
          label={
            currentStep === steps.length - 1
              ? t("access")
              : t("next")
          }
          type="button"
          func={() =>
            currentStep === steps.length - 1
              ? handleFinish()
              : handleNextStep()
          }
          className="bg-cgreen w-fit text-lg font-semibold"
        />
      </div>
    </div>
  );
};
