"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import GiftIcon from "../../../public/assets/icons/gift.svg";
import TrailIcon from "../../../public/assets/icons/trail-icon.svg";
import { MotionButton } from "../ui/Button";
import AnimationFuture from "../../../public/assets/animations/FuturoAnimado.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

import { useState } from "react";

import { useTranslations } from "next-intl";

export const Section3 = () => {
  const t = useTranslations("landing.explore");
  const [videoLink, setVideoLink] = useState(
    "https://www.youtube.com/embed/LDWxrrl21AM"
  );

  return (
    <div className="h-fit w-full flex md:flex-row flex-col bg-neutralbg md:p-20 p-10 md:gap-28 gap-4">
      <div className="flex flex-col md:w-2/5 w-full min-h-full justify-start  gap-4 py-8">
        <div className="h-full w-full">
          <div className="w-full flex flex-col m-0 md:flex-row items-center justify-start text-3xl text-center md:text-left">
            <p className="font-bold whitespace-pre-wrap text-neutral">
              {t("accessing")} <br />
              {t("with")}<span className="font-bold text-cgreen"> Web3EduBrasil</span>
            </p>
            <div className="h-24 w-24 md:ml-4 mt-4 md:mt-0 flex justify-center">
              <Lottie animationData={AnimationFuture} loop={true} />
            </div>
          </div>

          <p className="whitespace-pre-wrap"> </p>
          <p className="font-bold md:text-4xl text-3xl text-neutral md:text-left text-center">
            {t("title")}
          </p>
          <p className="whitespace-pre-wrap"> </p>
          <p className="text-gray md:w-3/4 w-full md:text-left text-justify">
            {t("description")}
          </p>
        </div>

        <div className="flex md:flex-row flex-col w-full min-w-fit border border-cgray h-fit rounded-full md:p-2 justify-start gap-5 text-neutral">
          <MotionButton
            className="bg-cgreen w-full min-w-[10rem] text-neutral rounded-full"
            type="button"
            func={() =>
              setVideoLink("https://www.youtube.com/embed/LDWxrrl21AM")
            }
            label={t("rewards")}
            Icon={() => (
              <Image src={GiftIcon} alt="Trail Icon" className="w-4 h-4" />
            )}
          />

          <MotionButton
            className="bg-cgreen w-full min-w-[10rem] text-neutral rounded-full"
            type="button"
            func={() =>
              setVideoLink("https://www.youtube.com/embed/AWrs8B5_K34")
            }
            label={t("trails")}
            Icon={() => (
              <Image src={TrailIcon} alt="Trail Icon" className="w-4 h-4" />
            )}
          />
        </div>
      </div>

      <div className="flex flex-col md:w-2/4 w-full min-h-full justify-between items-center">
        <iframe
          src={videoLink}
          frameBorder="0"
          allowFullScreen
          className="aspect-video md:h-full w-full h-auto rounded-box"
        />
      </div>
    </div>
  );
};
