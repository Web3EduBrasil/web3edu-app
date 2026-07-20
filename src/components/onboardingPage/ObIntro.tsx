"use client";

import Image from "next/image";
import web3EduLogo from "../../../public/assets/images/Web3EduBrasil_logo.png";
import { MotionButton } from "../ui/Button";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { OnboardingProps } from "@/interfaces/interfaces";
import { useTranslations } from "next-intl";

export const ObIntro = ({ handleTabClick }: OnboardingProps<void>) => {
  const router = useRouter();
  const t = useTranslations("onboarding");

  const handleSkip = () => {
    toast.info("Complete seu cadastro para emitir certificados.");
    router.push("/onboarding");
  };
  return (
    <div className="w-full h-full flex justify-center items-center p-5">
      <div className="w-full h-full flex flex-col justify-center items-center gap-10 text-center">
        <Image
          alt="ss"
          src={web3EduLogo}
          className="md:w-36 w-32 h-auto object-fill "
        />
        <div className="text-neutral font-semibold flex flex-col justify-center items-center gap-5">
          <p className="md:text-4xl text-3xl text-dblue">
            {t("welcome.title")}
          </p>
          <p className="md:text-2xl text-xl  text-center">
            {t("welcome.subtitle")}
          </p>
        </div>
        <MotionButton
          label={t("next")}
          type="button"
          func={() => handleTabClick("ObCommu")}
          className="bg-cgreen w-28 text-neutral font-bold"
        />
        <div className="cursor-pointer text-dblue">
          <a onClick={handleSkip}>{t("skip")}</a>
        </div>
      </div>
    </div>
  );
};
