"use client";

import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { RxCross2 } from "react-icons/rx";
import { FaCheck, FaMedal } from "react-icons/fa";
import { IconButton } from "../ui/IconButton";
import { useContent } from "@/providers/content-context";
import "react-toastify/dist/ReactToastify.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";
import Image from "next/image";

export const RewardContainer = () => {
  const {
    handleRewardContainer,
    rewardContainerVisibility,
    rewardData,
    fetchTrailAirDrop,
    fetchProgramAirDrop,
    mintStep,
    mintTxHash,
    retryMintStatusCheck,
  } = useContent();
  const { googleUserInfo, userAccount, userDbInfo } = useWeb3AuthContext();
  const { openConnectModal } = useConnectModal();
  const t = useTranslations("reward");
  const tLearn = useTranslations("learn");

  const hasWallet = !!userAccount[0];
  const isProcessing = mintStep === "uploading" || mintStep === "minting" || mintStep === "polling";
  const isDone = mintStep === "success" || mintStep === "error";

  const stepLabel =
    mintStep === "uploading" ? t("uploading") :
      mintStep === "minting" ? t("minting") :
        mintStep === "polling" ? t("polling") :
          mintStep === "success" ? t("success") :
            mintStep === "error" ? t("mintTimeout") : "";

  const handleClaim = async () => {
    if (!rewardData || !googleUserInfo) return;
    if (!hasWallet) {
      if (openConnectModal) openConnectModal();
      return;
    }
    const userName = (userDbInfo as any)?.displayName || googleUserInfo?.displayName || "";
    if (rewardData.type === "trail") {
      await fetchTrailAirDrop(
        rewardData.icon,
        googleUserInfo.uid,
        userName,
        userAccount[0],
        rewardData.id,
        rewardData.name
      );
    } else {
      await fetchProgramAirDrop(
        rewardData.icon,
        googleUserInfo.uid,
        userName,
        userAccount[0],
        rewardData.id,
        rewardData.name
      );
    }
  };

  const title =
    rewardData?.type === "program"
      ? t("programCompleted", { name: googleUserInfo?.displayName || "", program: rewardData?.name || "" })
      : t("trailCompleted", { name: googleUserInfo?.displayName || "", trail: rewardData?.name || "" });

  return (
    <div
      className={`w-full min-h-full bg-neutral/50 flex justify-center items-center text-neutral absolute z-20 top-0 px-5 md:px-0 ${rewardContainerVisibility ? "visible" : "invisible"}`}
    >
      <div className="md:w-[26rem] w-full h-fit flex flex-col rounded-box py-5 px-6 gap-4 bg-cgray shadow-lg font-semibold items-start cursor-default">

        {/* Header */}
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-2">
            <FaMedal className="text-yellow-500 w-5 h-5" />
            <p className="text-base">{title}</p>
          </div>
          <IconButton Icon={RxCross2} func={() => handleRewardContainer()} className="h-5" />
        </div>

        <p className="text-sm font-normal text-neutral/70">{t("bodyText")}</p>

        {/* Pré-visualização do certificado NFT */}
        {rewardData?.icon && (
          <div className="w-full rounded-box overflow-hidden border-2 border-yellow-400/60 shadow-md relative">
            {/* Badge NFT */}
            <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-neutral text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaMedal className="w-3 h-3" />
              NFT
            </div>

            {/* Imagem da trilha como arte do certificado */}
            <div className="relative w-full aspect-video">
              <Image
                src={rewardData.icon}
                alt={rewardData.name || "Certificado"}
                fill
                style={{ objectFit: "cover" }}
                unoptimized={rewardData.icon.startsWith("/")}
              />
              {/* Overlay com texto de certificado */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 gap-0.5">
                <span className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
                  {t("certificateLabel")}
                </span>
                <span className="text-white font-bold text-sm leading-tight">
                  {rewardData.name}
                </span>
                <span className="text-white/70 text-[10px]">
                  {googleUserInfo?.name || googleUserInfo?.displayName || userAccount[0]}
                </span>
              </div>
            </div>

            {/* Status do mint sobreposto ao certificado */}
            {mintStep === "success" && (
              <div className="bg-green/10 border-t border-green/30 px-3 py-2 flex items-center gap-2">
                <FaCheck className="text-green w-3.5 h-3.5 shrink-0" />
                <span className="text-green text-xs font-semibold">{t("nftMinted")}</span>
                {mintTxHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${mintTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dblue underline text-xs ml-auto"
                  >
                    {t("viewOnChain")} ↗
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        {!hasWallet && mintStep === "idle" && (
          <p className="text-sm text-orange-500 font-medium">{t("connectWarning")}</p>
        )}

        {/* Step-by-step progress */}
        {mintStep !== "idle" && (
          <div className={`flex items-start gap-3 w-full rounded-box p-4 text-sm
            ${mintStep === "success" ? "bg-green/10 border border-green/30 text-green" :
              mintStep === "error" ? "bg-orange-50 border border-orange-200 text-orange-600" :
                "bg-base-200 text-neutral"}`}>

            <div className="shrink-0 mt-0.5">
              {isProcessing && <span className="loading loading-spinner loading-sm" />}
              {mintStep === "success" && <FaCheck className="w-4 h-4 text-green" />}
              {mintStep === "error" && <span>⚠️</span>}
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <span className="font-semibold">{stepLabel}</span>

              {/* Steps visual */}
              {isProcessing && (
                <div className="flex flex-col gap-1 text-xs text-neutral/60 mt-1">
                  <div className={`flex items-center gap-2 ${mintStep === "uploading" ? "text-dblue font-semibold" : "line-through opacity-50"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${mintStep === "uploading" ? "bg-dblue" : "bg-green"}`} />
                    {t("stepUpload")}
                  </div>
                  <div className={`flex items-center gap-2 ${mintStep === "minting" ? "text-dblue font-semibold" : mintStep === "uploading" ? "opacity-40" : "line-through opacity-50"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${mintStep === "minting" ? "bg-dblue" : mintStep === "uploading" ? "bg-neutral/30" : "bg-green"}`} />
                    {t("stepMint")}
                  </div>
                  <div className={`flex items-center gap-2 ${mintStep === "polling" ? "text-dblue font-semibold" : "opacity-40"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${mintStep === "polling" ? "bg-dblue" : "bg-neutral/30"}`} />
                    {t("stepConfirm")}
                  </div>
                </div>
              )}

              {/* Success: sem link duplicado (aparece no card do certificado) */}

              {/* Error: suggest checking wallet */}
              {mintStep === "error" && (
                <span className="text-xs font-normal">{t("mintTimeoutHint")}</span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {mintStep === "idle" && (
          <button
            onClick={handleClaim}
            className="btn w-full h-12 bg-green text-neutral font-semibold border-0"
          >
            {!hasWallet ? tLearn("connectWallet") : t("claimNow")}
          </button>
        )}

        {isProcessing && (
          <button disabled className="btn w-full h-12 bg-green/50 text-neutral font-semibold cursor-not-allowed border-0">
            <span className="loading loading-spinner loading-sm" />
            {t("processing")}
          </button>
        )}

        {isDone && mintStep === "success" && (
          <button
            onClick={() => handleRewardContainer()}
            className="btn w-full h-12 bg-dblue text-white font-semibold border-0"
          >
            {t("close")}
          </button>
        )}

        {isDone && mintStep === "error" && (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => retryMintStatusCheck(
                googleUserInfo?.uid || "",
                rewardData?.id || "",
                rewardData?.type || "trail"
              )}
              className="btn flex-1 h-12 border-2 border-dblue text-dblue bg-transparent font-semibold"
            >
              {t("retryCheck")}
            </button>
            <button
              onClick={() => handleRewardContainer()}
              className="btn flex-1 h-12 bg-neutral/10 text-neutral font-semibold border-0"
            >
              {t("close")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

