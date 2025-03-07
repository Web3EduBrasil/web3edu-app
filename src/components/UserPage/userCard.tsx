"use client";

import { FaSave, FaWallet } from "react-icons/fa";
import { MotionButton } from "../ui/Button";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useRouter } from "next/navigation";

export const UserSection = () => {
  const { userDbInfo, googleUserInfo, fetchUserDbData } = useWeb3AuthContext();
  const router = useRouter();
  const { isLoggedIn } = useWeb3AuthContext();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/");
      toast.warning("Faça login para acessar esta tela");
    }
  }, [isLoggedIn]);

  const [userName, setUserName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [discord, setDiscord] = useState("");

  useEffect(() => {
    setUserName(userDbInfo?.displayName);
    if (userDbInfo.socialMedia) {
      setLinkedin(userDbInfo?.socialMedia?.linkedin);
      setDiscord(userDbInfo?.socialMedia?.discord);
    }
  }, [userDbInfo]);

  const linkedinRegex =
    /((https?:\/\/)?((www|\w\w)\.)?linkedin\.com\/)((([\w]{2,3})?)|([^\/]+\/(([\w|\d-&#?=])+\/?){1,}))$/;

  const fetchUserEdit = async () => {
    try {
      const response = await fetch("/api/user/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: googleUserInfo?.uid,
          displayName: userName,
          socialMedia: {
            linkedin: linkedin,
            discord: discord,
          },
        }),
      });
      if (response.ok) {
        fetchUserDbData(googleUserInfo?.uid);
      }
    } catch (error: any) {
      console.error("Erro ao editar os dados do usúario", error);
    }
  };

  const Submit = async () => {
    console.log(linkedin, discord);
    if (linkedin !== "") {
      if (!linkedinRegex.test(linkedin)) {
        toast.warning("Link do linkedin inválido", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
        return;
      }
      toast.promise(fetchUserEdit(), {
        pending: "Enviando...",
        success: "Dados salvos com sucesso!",
        error: "Erro ao enviar dados.",
      });
    } else if (linkedin === "") {
      toast.promise(fetchUserEdit(), {
        pending: "Enviando...",
        success: "Dados salvos com sucesso!",
        error: "Erro ao enviar dados.",
      });
    }
  };

  return (
    <div className="flex w-full h-full justify-center items-center">
      <div className=" w-4/5 h-[33rem] md:w-3/5 md:h-[33rem] bg-cgray shadow-xl flex flex-col border-2 border-gray rounded-[2rem] pt-2 md:pt-7 p-7">
        <div className="flex w-full h-12 flex-row justify-center">
          <div
            role="tablist"
            className="tabs tabs-bordered gap-1 md:gap-8 w-full h-4/5"
          >
            <a
              role="tab"
              className="tab hover:tab-active text-xm md:text-lg text-dgray"
            >
              Dados
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-6 ">
          <div className="flex h-full md:justify-start justify-center">
            <p className="text-dgray text-md md:text-xl mt-5 font-medium">
              Dados Pessoais
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white rounded-xl shadow-md">
            <div className="flex items-center gap-4">
              <img
                src={googleUserInfo?.photoURL}
                alt="Foto do usuário"
                className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-green"
              />
              <div>
                <p className="text-dgray font-semibold text-base md:text-lg">
                  {userDbInfo.displayName}
                </p>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex justify-center">
              {/* adicionar um operador ternário verificando `isWalletConnected`, falta implementação */}
              <MotionButton
                Icon={FaWallet}
                label="Conectar Carteira"
                func={() => Submit()}
                className="flex justify-center items-center gap-3 text-base md:text-lg h-11 w-full md:w-64 bg-green text-ddblue rounded-full shadow-lg hover:bg-green/90 transition-all"
                type="button"
              />
            </div>
          </div>
          <label className="flex flex-row h-full w-full gap-8 justify-center">
            <div className="flex flex-col justify-center w-full">
              <div className="label text-dgray">
                <span className="md:text-sm text-xs  text-dgray">Nome</span>
              </div>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                type="text"
                placeholder=""
                className="input input-bordered w-full md:h-10 h-8 bg-white md:text-base text-xs md:rounded-box border-2 border-gray text-dgray"
              />
              <div className="label">
                <span className="md:text-sm text-xs text-dgray">Email</span>
              </div>
              <input
                value={userDbInfo.email}
                type="text"
                disabled={true}
                placeholder=""
                className="input input-bordered w-full md:h-10 h-8 bg-white md:text-base text-xs md:rounded-box border-2 border-gray text-dgray"
              />
            </div>
            <div className="flex flex-col w-full">
              <div className="label">
                <span className="md:text-sm text-xs text-dgray">Discord</span>
              </div>
              <input
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
                type="text"
                placeholder=""
                className="input input-bordered w-full md:h-10 h-8  bg-white md:text-base text-xs md:rounded-box border-2 border-gray text-dgray"
              />
              <div className="label">
                <span className="md:text-sm text-xs text-dgray">Linkedin</span>
              </div>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                type="text"
                placeholder="www.linkedin.com/in/username"
                className="input input-bordered w-full md:h-10 h-8 bg-white md:text-base text-xs md:rounded-box border-2 border-gray text-dgray"
              />
            </div>
          </label>
          <div className="flex md:justify-end justify-center w-full">
            <MotionButton
              Icon={FaSave}
              label="Salvar"
              func={() => Submit()}
              className=" flex justify-center text-xs items-center  h-7 w-[6rem] bg-green text-ddblue md:text-sm md:h-8 md:w-36"
              type="button"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
