import Image from "next/image";
import web3EduLogo from "../../../public/assets/images/Web3EduBrasil_logo.png";
import { MotionButton } from "../ui/Button";
import { KycIntroProps } from "@/interfaces/interfaces";

export default function KycIntro({ handleTabClick }: KycIntroProps<void>) {
  return (
    <div className="flex flex-col w-full h-full justify-between">
      <div>
        <h2 className="sr-only">Steps</h2>

        <div>
          <p className="text-xs font-medium text-gray">Introdução</p>

          <div className="mt-4 overflow-hidden rounded-full h-1 bg-dgray/20 mb-1">
            <div className="h-1 bg-transparent"></div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-6">
        <Image alt="ss" src={web3EduLogo} className="w-52 h-auto object-fill" />

        <div>
          <h3 className="text-lg font-semibold text-dblue text-justify">
            Bem vindo a nossa plataforma, preencha nosso breve questionário para
            ajustar as nossas recomendações com base em seus gostos e
            necessidades
          </h3>
        </div>
      </div>
      <div className=" w-full justify-center mt-8 flex">
        <MotionButton
          label="Avançar"
          type="button"
          func={() => handleTabClick("Kyc1")}
          className="bg-cgreen w-3/5 text-neutral font-semibold"
        />
      </div>
    </div>
  );
}
