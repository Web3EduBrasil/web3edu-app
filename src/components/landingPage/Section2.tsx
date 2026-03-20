"use client";

import MainFunctions from "./mainFunctions";
import dynamic from 'next/dynamic';
import AnimationLearning from "../../../public/assets/animations/LearningAnimation.json";
import AnimationRewards from "../../../public/assets/animations/RewardsAnimation.json";
import AnimationEmBreve from "../../../public/assets/animations/EmBreveAnimation.json";
import { useTranslations } from "next-intl";

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Section2() {
  const t = useTranslations("landing.features");
  return (
    <div className="w-full flex flex-col">
      <figure>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 160">
          <path
            fill="#7EC8A0"
            fillOpacity="1"
            d="M0,32L60,29.35C120,26.5,240,21.5,360,26.65C480,32,600,48,720,66.65C840,85.5,960,106.5,1080,98.65C1200,90.5,1320,53.5,1380,34.65L1440,16L1440,160L1380,160C1320,160,1200,160,1080,160C960,160,840,160,720,160C600,160,480,160,360,160C240,160,120,160,60,160L0,160Z"
          ></path>
        </svg>
      </figure>

      <div className="bg-cgreen w-full h-fit p-10 flex flex-col justify-center items-center gap-10 mt-[-1px]">
        <p className="text-neutral text-3xl font-bold">{t("title")}</p>

        {/* container do scroll horizontal */}
        <div className="w-full overflow-x-auto">
          {/* linha de funções, centralizada na tela mas alinhando os itens à esquerda */}
          <div className="flex justify-start items-center gap-10 py-10 h-fit text-justify max-w-7xl mx-auto px-4">
            <MainFunctions
              functionName={t("rewards")}
              content={t("rewardsContent")}
              image={
                <Lottie
                  animationData={AnimationRewards}
                  loop
                  autoplay
                  style={{ width: 120, height: 120 }}
                />
              }
            />

            <MainFunctions
              functionName={t("learningTrails")}
              content={t("learningTrailsContent")}
              image={
                <Lottie
                  animationData={AnimationLearning}
                  loop
                  autoplay
                  style={{ width: 120, height: 120 }}
                />
              }
            />

            <MainFunctions
              functionName={t("soon")}
              content={t("soonContent")}
              image={
                <Lottie
                  animationData={AnimationEmBreve}
                  loop
                  autoplay
                  style={{ width: 200, height: 200 }}
                />
              }
              isHoverBlocked={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
