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
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { authHeaders } from "@/lib/getIdToken";

const steps = [
  {
    title: "Tela Home",
    description:
      "Nesta tela você encontrará alguns dados de seu perfil, um preview de suas NFT's conquistadas, a jornada de usuário e suas três últimas trilhas de aprendizagem realizadas.",
    image: Onboarding1.src,
    progress: 16.6,
    instruction: "Acesse através da barra de navegação ao topo da tela",
  },
  {
    title: "Seu Perfil",
    description: (
      <span>
        Aqui, você pode personalizar seu perfil, adicionando o Discord e LinkedIn. <span className="bg-cyellow">Não esqueça de atualizar seu nome, pois ele aparecerá no seu certificado!</span>
      </span>
    ),
    image: Onboarding7.src,
    progress: 25,
    instruction:
      "Acesse (Perfil) no canto superior direito da sua tela, clicando no ícone do seu perfil.",
  },
  {
    title: "Configurar perfil de usuário",
    description:
      "Complete nosso breve formulário para recomendarmos trilhas de aprendizagem do seu interesse!",
    image: Onboarding2.src,
    progress: 33.3,
    instruction: `Acesse na tela home em "Pesquisa de perfil"`,
  },
  {
    title: "Tela de trilhas",
    description:
      "Nesta tela você encontrará todas as trilhas de aprendizagem, podendo buscá-las por nome ou categoria e acessá-las.",
    image: Onboarding3.src,
    progress: 50,
    instruction: "Acesse através da barra de navegação ao topo da tela",
  },
  {
    title: "Trilha de aprendizagem",
    description:
      "Aprenda sobre Web3 acessando e completando as tarefas de nossas trilhas!",
    image: Onboarding4.src,
    progress: 66.6,
    instruction:
      "Acesse através da tela de trilhas ou pelo acesso rápido na tela home",
  },
  {
    title: "Resgate sua recompensa!",
    description: `Ao concluir uma trilha de aprendizagem, resgate sua NFT clicando em "Resgatar Agora"`,
    image: Onboarding5.src,
    progress: 83.3,
    instruction:
      "Disponível ao marcar a última tarefa de uma trilha como concluída.",
    additionalText:
      "Este tutorial estará sempre disponível na aba Ajuda, caso precise revisitar algum passo ou tirar dúvidas.",
  },
  {
    title: "Tudo Pronto!",
    description:
      "Ótimo! Você está pronto para começar a explorar nossa plataforma e colecionar NFT's",
    image: Onboarding6.src,
    progress: 100,
    instruction: "Acesse sua NFT clicando em sua carteira",
    additionalText: `Caso precise revisitar algum passo ou tirar dúvidas, acesse este tutorial na aba "Ajuda" no menu de usuário.`,
  },
];

export const ObTutorialContainer = () => {
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

        router.push(`/homePage`);
      }
    } catch (error: any) {
      console.error(error.msg);
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
    <div className="flex md:flex-row flex-col w-full">
      <div className="md:w-2/5 w-full h-full bg-cgray flex p-10">
        <div className="w-full h-full flex flex-col gap-10 justify-center items-start">
          <Image alt="Logo" src={web3EduLogo} className="w-28 h-auto" />
          <div className="font-semibold flex flex-col gap-8">
            <p className="md:text-5xl text-3xl text-dblue">{title}</p>
            <p className="md:text-2xl text-xl">{description}</p>
            {currentStep === steps.length - 1 && (
              <p className="text-lg text-gray-600 mt-4">{additionalText}</p>
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
              ? "Acessar plataforma"
              : "Próximo Passo"
          }
          type="button"
          func={() =>
            currentStep === steps.length - 1
              ? toast.promise(fetchTutorialDone(), {
                pending: "Enviando...",
                success: "Tutorial completo!",
                error: "Erro ao concluir tutorial.",
              })
              : handleNextStep()
          }
          className="bg-cgreen w-fit text-lg font-semibold"
        />
      </div>
    </div>
  );
};
