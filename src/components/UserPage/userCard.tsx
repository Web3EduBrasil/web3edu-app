"use client";

import { FaSave } from "react-icons/fa";
import Image from "next/image";
import { MotionButton } from "../ui/Button";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useEffect, useState } from "react";
import { Bounce, toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { IconButton } from "../ui/IconButton";
import { authHeaders } from "@/lib/getIdToken";
import { useContent } from "@/providers/content-context";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useTranslations } from "next-intl";

export const UserSection = () => {
  const { userDbInfo, googleUserInfo, fetchUserDbData, userAccount } = useWeb3AuthContext();
  const { fetchAchievedNfts, achievedNfts } = useContent();
  const router = useRouter();
  const { userInfo } = useWeb3AuthContext();
  const t = useTranslations("userPage");

  const [activeTab, setActiveTab] = useState<"dados" | "certificados">("dados");

  const back = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/homePage");
      }
    }
  };

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

  useEffect(() => {
    if (activeTab === "certificados" && userAccount[0]) {
      fetchAchievedNfts(userAccount[0]);
    }
  }, [activeTab, userAccount, fetchAchievedNfts]);

  const linkedinRegex =
    /((https?:\/\/)?((www|\w\w)\.)?linkedin\.com\/)((([\w]{2,3})?)|([^\/]+\/(([\w|\d-&#?=])+\/?){1,}))$/;

  const fetchUserEdit = async () => {
    try {
      const response = await fetch("/api/user/edit", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
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
    <div className="flex w-full h-full justify-center items-start pt-8 pb-8">
      <div className="w-4/5 md:w-3/5 bg-cgray shadow-xl flex flex-col border-2 border-gray rounded-[2rem] pt-4 md:pt-6 px-7 pb-7 gap-4">
        {/* Header com voltar + abas */}
        <div className="flex items-center gap-4">
          <IconButton func={back} Icon={IoChevronBack} className="text-neutral shrink-0" />
          <div role="tablist" className="tabs tabs-bordered flex-1">
            <button
              role="tab"
              onClick={() => setActiveTab("dados")}
              className={`tab text-sm md:text-base ${activeTab === "dados" ? "tab-active font-semibold" : "text-dgray"}`}
            >
              {t("personalData")}
            </button>
            <button
              role="tab"
              onClick={() => setActiveTab("certificados")}
              className={`tab text-sm md:text-base ${activeTab === "certificados" ? "tab-active font-semibold" : "text-dgray"}`}
            >
              🏆 {t("certificates")}
            </button>
          </div>
        </div>

        {/* Aba: Dados Pessoais */}
        {activeTab === "dados" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-row justify-start items-center gap-4">
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden">
                <Image
                  src={googleUserInfo?.photoURL || ""}
                  alt={userDbInfo?.displayName || "Avatar"}
                  fill
                  sizes="64px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <p className="text-dgray font-medium text-sm md:text-lg">
                {userDbInfo?.displayName || ""}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex flex-col w-full gap-1">
                <span className="text-xs md:text-sm text-dgray">{t("displayName")}</span>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  type="text"
                  className="input input-bordered w-full h-9 bg-white text-sm rounded-lg border-2 border-gray text-dgray"
                />
                <span className="text-xs md:text-sm text-dgray mt-2">{t("email")}</span>
                <input
                  value={userDbInfo.email || ""}
                  type="text"
                  disabled
                  className="input input-bordered w-full h-9 bg-white text-sm rounded-lg border-2 border-gray text-dgray opacity-60"
                />
              </div>
              <div className="flex flex-col w-full gap-1">
                <span className="text-xs md:text-sm text-dgray">{t("discord")}</span>
                <input
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  type="text"
                  placeholder={t("discordPlaceholder")}
                  className="input input-bordered w-full h-9 bg-white text-sm rounded-lg border-2 border-gray text-dgray"
                />
                <span className="text-xs md:text-sm text-dgray mt-2">{t("linkedin")}</span>
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  type="text"
                  placeholder={t("linkedinPlaceholder")}
                  className="input input-bordered w-full h-9 bg-white text-sm rounded-lg border-2 border-gray text-dgray"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <MotionButton
                Icon={FaSave}
                label={t("save")}
                func={() => Submit()}
                className="flex justify-center text-xs items-center h-8 w-28 bg-green text-ddblue md:text-sm"
                type="button"
              />
            </div>
          </div>
        )}

        {/* Aba: Certificados NFT */}
        {activeTab === "certificados" && (
          <div className="flex flex-col gap-3">
            {achievedNfts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <span className="text-5xl">🏅</span>
                <p className="text-dgray font-semibold text-lg">{t("noCertificates")}</p>
                <p className="text-dgray/70 text-sm max-w-xs">
                  {t("noCertificatesText")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-1">
                {achievedNfts.map((nft, i) => (
                  <a
                    key={i}
                    href={nft.openseaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col rounded-xl overflow-hidden border-2 border-gray bg-white hover:shadow-lg transition-shadow group"
                  >
                    <div className="w-full aspect-square relative">
                      <Image
                        src={nft.ipfs || "/assets/icons/nft-placeholder.svg"}
                        alt={`NFT ${nft.trailId}`}
                        fill
                        sizes="200px"
                        style={{ objectFit: "cover" }}
                        onError={(e) => {
                          try {
                            (e.target as HTMLImageElement).src = "/assets/icons/nft-placeholder.svg";
                          } catch { }
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-semibold text-dgray truncate">{nft.trailId}</p>
                      <p className="text-xs text-dgray/60 flex items-center gap-1 mt-0.5">
                        OpenSea <FaExternalLinkAlt className="text-[10px]" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};