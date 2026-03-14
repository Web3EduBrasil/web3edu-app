"use client";

import Image from "next/image";
import web3EduLogo from "../../../public/assets/images/Web3EduBrasil_logo.png";
import { MotionButton } from "../ui/Button";
import { useRouter } from "next/navigation";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { Bounce, toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";

export const ObIntro = ({ handleTabClick }: OnboardingProps<void>) => {
  const router = useRouter();
  const { googleUserInfo, setUserDbInfo } = useWeb3AuthContext();

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
            Seja bem vindo a Web3EduBrasil!
          </p>
          <p className="md:text-2xl text-xl  text-center">
            Antes de começarmos, vamos entender as funcionalidades da plataforma
            Web3EduBrasil
          </p>
        </div>
        <MotionButton
          label="Avançar"
          type="button"
          func={() => handleTabClick("ObCommu")}
          className="bg-cgreen w-28 text-neutral font-bold"
        />
        <div className="cursor-pointer text-dblue">
          <a onClick={() => fetchTutorialDone()}>Pular Introdução</a>
        </div>
      </div>
    </div>
  );
};
