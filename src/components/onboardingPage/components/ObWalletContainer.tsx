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

const steps = [
  {
    title: "Carteira Web3",
    description:
      "Nossa plataforma conta com uma carteira web3 integrada única para cada usuário, permitindo que você explore e interaja com a web3 em poucos cliques.",
    image: Onboarding1.src,
    progress: 20,
    instruction: "Entre na carteira localizada no canto superior direito",
  },
  {
    title: "Configure a sua Carteira",
    description:
      "Esta é a sua carteira! Com ela, você poderá receber NFTs como recompensa ao concluir trilhas de aprendizagem. Antes de começar, vamos configurá-la juntos.",
    image: Onboarding2.src,
    progress: 40,
    instruction: "Vá até a aba de (Configurações)",
  },
  {
    title: "Configure a sua Carteira",
    description:
      "Esta é a sua carteira! Com ela, você poderá receber NFTs como recompensa ao concluir trilhas de aprendizagem. Antes de começar, vamos configurá-la juntos.",
    image: Onboarding3.src,
    progress: 60,
    instruction: "Vá até a sessão (Em Geral)",
  },
  {
    title: "Configure a sua Carteira",
    description:
      "Essas configurações são essenciais para que você possa receber os NFTs de recompensa ao completar nossas trilhas de aprendizagem.",
    image: Onboarding4.src,
    progress: 80,
    instruction:
      "Ative a opção 'Redes de Teste' e, em seguida, selecione 'Ethereum Sepolia' como sua rede padrão.",
  },
  {
    title: "Tudo Pronto!",
    description:
      "Ótimo! Agora que as configurações estão concluídas, você está pronto para criar sua conta e começar a explorar nossas trilhas de aprendizagem. Vamos lá?",
    image: Onboarding5.src,
    progress: 100,
    instruction: "Sua carteira deve ficar da seguinte maneira:",
    additionalText:
      "Este tutorial estará sempre disponível na aba Ajuda, caso precise revisitar algum passo ou tirar dúvidas.",
  },
];

export const ObWalletContainer = () => {
  const { googleUserInfo, setUserDbInfo } = useWeb3AuthContext();
  const router = useRouter();

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

  const { title, description, image, progress, instruction, additionalText } =
    steps[currentStep];

  return (
    <div className="flex md:flex-row flex-col">
      <div className="md:w-3/6 w-full h-full bg-cgray flex p-10">
        <div className="w-full h-full flex flex-col gap-10 justify-center items-start">
          <Image alt="Logo" src={web3EduLogo} className="w-28 h-auto" />
          <div className="font-semibold flex flex-col gap-8">
            <p className="text-5xl text-dblue">{title}</p>
            <p className="text-2xl">{description}</p>
            {currentStep === steps.length - 1 && (
              <p className="text-lg text-gray-600 mt-4">{additionalText}</p>
            )}
          </div>
        </div>
      </div>
      <div className="md:w-3/6 w-full h-full flex flex-col items-center justify-center p-10 gap-10">
        <progress
          className="progress progress-success w-56"
          value={progress}
          max="100"
        ></progress>
        <div
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "top",
          }}
          className="md:w-2/4 w-full md:h-full h-fit flex items-center justify-center text-4xl font-bold shadow-2xl rounded-box"
        ></div>
        <div className="w-fit text-center h-fit rounded-box bg-cgray flex font-semibold text-xl p-7">
          <p>{instruction}</p>
        </div>
        <MotionButton
          label={
            currentStep === steps.length - 1
              ? "Configure sua Carteira"
              : "Próximo Passo"
          }
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
