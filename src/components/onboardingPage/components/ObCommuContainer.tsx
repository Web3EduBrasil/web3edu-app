"use client";

import { FaDiscord } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedinIn } from "react-icons/fa";
import { MotionDiv } from "@/components/ui/MotionDiv";
import { MotionButton } from "@/components/ui/Button";
import web3EduLogo from "../../../../public/assets/images/Web3EduBrasil_logo.png";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { OnboardingProps } from "../../../interfaces/interfaces";

const linkDiscord = () => {
  window.open("https://discord.com/invite/GJk58TPaDx", "_blank");
};

const linkTelegram = () => {
  window.open("https://t.me/web3edubrasil", "_blank");
};

const linkInstagram = () => {
  window.open("https://www.instagram.com/web3edubrasil", "_blank");
};

const linkYoutube = () => {
  window.open("https://www.youtube.com/@Web3EduBrasil", "_blank");
};

const linkX = () => {
  window.open("https://x.com/web3edubrasil", "_blank");
};

const linkLinkedin = () => {
  window.open(
    "https://www.linkedin.com/company/web3edubrasil/posts/?feedView=all",
    "_blank"
  );
};

export const ObCommuContainers = ({
  handleTabClick,
}: OnboardingProps<void>) => {
  const t = useTranslations("onboarding");
  return (
    <div className=" flex md:flex-row flex-col">
      <div className="md:w-3/6 w-full h-full bg-cgray flex p-10">
        <div className="w-full h-full flex flex-col gap-10 justify-center items-start">
          <Image alt="ss" src={web3EduLogo} className="w-28 h-auto" />
          <div className="font-semibold flex flex-col gap-8">
            <p className="md:text-5xl text-3xl leading-loose text-dblue">
              {t("communities.title")}
            </p>
            <p className="md:text-2xl text-base">
              {t("communities.text")}
            </p>
          </div>
          <MotionButton
            label={t("next")}
            type="button"
            func={() => handleTabClick("ObTutorial")}
            className="bg-cgreen w-28 text-neutral font-bold"
          />
        </div>
      </div>
      <div className="md:w-3/6 w-full h-full flex flex-col p-10">
        <div className="w-full md:h-[60vh] h-fit p-2 flex flex-col gap-10 justify-center items-center">
          <MotionDiv
            func={() => linkDiscord()}
            className="md:w-3/5 w-full  transform bg-cgray rounded-box md:text-2xl text-xl flex flex-row p-5 justify-center items-center font-semibold md:cursor-pointer"
          >
            <p className="flex flex-row gap-2 justify-center items-center">
              <FaDiscord className="w-12 h-auto text-[#536BF2]" /> Servidor no
              <span className="text-[#536BF2]"> {t("communities.discord")}</span>
            </p>
          </MotionDiv>

          <MotionDiv
            func={() => linkTelegram()}
            className="md:w-3/5 w-full bg-cgray rounded-box md:text-2xl text-xl flex flex-row p-5 justify-center items-center font-semibold md:cursor-pointer"
          >
            <p className="flex flex-row gap-2 justify-center items-center">
              <FaTelegram className="w-12 h-auto text-[#24A1DD]" />
              Grupo no <span className="text-[#24A1DD]"> {t("communities.telegram")}</span>
            </p>
          </MotionDiv>
          <p className="font-semibold text-xl">{t("communities.followSocials")}</p>
        </div>
        <div className="md:w-full w-fit h-fit flex flex-row gap-10 justify-center items-center ">
          <MotionDiv
            func={() => linkInstagram()}
            className="md:w-16 w-14 md:h-16 h-14 bg-cgray rounded-full flex justify-center items-center cursor-pointer hover:scale-105 transition duration-300"
          >
            <FaInstagram className="w-10 h-auto" />
          </MotionDiv>
          <MotionDiv
            func={() => linkYoutube()}
            className="md:w-16 w-14 md:h-16 h-14 bg-cgray rounded-full flex justify-center items-center cursor-pointer hover:scale-105 transition duration-300"
          >
            <FaYoutube className="w-10 h-auto text-[#CC0000]" />
          </MotionDiv>
          <MotionDiv
            func={() => linkX()}
            className="md:w-16 w-14 md:h-16 h-14 bg-cgray rounded-full flex justify-center items-center cursor-pointer hover:scale-105 transition duration-300"
          >
            <FaXTwitter className="w-10 h-auto" />
          </MotionDiv>
          <MotionDiv
            func={() => linkLinkedin()}
            className="md:w-16 w-14 md:h-16 h-14 bg-cgray rounded-full flex justify-center items-center cursor-pointer hover:scale-105 transition duration-300"
          >
            <FaLinkedinIn className="w-10 h-auto text-[#005C8E]" />
          </MotionDiv>
        </div>
      </div>
    </div>
  );
};
