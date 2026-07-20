"use client";

import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { RxCross2 } from "react-icons/rx";
import { FaCheck, FaMedal, FaExternalLinkAlt } from "react-icons/fa";
import { IconButton } from "../ui/IconButton";
import { useContent } from "@/providers/content-context";
import "react-toastify/dist/ReactToastify.css";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

export const RewardContainer = () => {
  const {
    handleRewardContainer,
    rewardContainerVisibility,
    rewardData,
    fetchAirDrop,
    mintStep,
    mintTxHash,
    mintIpfsHash,
    mintCheckLoading,
    startMintCheck,
    retryMintStatusCheck,
    closeRewardContainer,
  } = useContent();
  const { googleUserInfo, userAccount, userDbInfo } = useWeb3AuthContext();
  const { setVisible } = useWalletModal();
  const t = useTranslations("reward");
  const tLearn = useTranslations("learn");

  const uid = googleUserInfo?.uid ?? "";
  const isSolanaWalletUid = uid.length >= 32 && !uid.startsWith("0x");
  const dbWalletAddress = (userDbInfo as any)?.walletAddress ?? "";
  const effectiveAddress = userAccount[0] ?? (isSolanaWalletUid ? uid : dbWalletAddress);
  const hasWallet = !!effectiveAddress;
  const fallbackWallet =
    effectiveAddress ? `${effectiveAddress.slice(0, 6)}...${effectiveAddress.slice(-4)}` : "";
  const certificateName =
    (userDbInfo as any)?.certificateName ||
    (userDbInfo as any)?.displayName ||
    googleUserInfo?.displayName ||
    googleUserInfo?.name ||
    fallbackWallet;

  const isProcessing = mintStep === "uploading" || mintStep === "minting" || mintStep === "polling";
  const isDone = mintStep === "success" || mintStep === "error";

  // Email user sem wallet conectada ou salva no perfil — mostra input manual
  const [sessionWalletAddress, setSessionWalletAddress] = useState("");
  const mintAddress = effectiveAddress || sessionWalletAddress;
  const hasWalletOrSession = !!mintAddress;
  const needsWalletInput = !hasWalletOrSession && !isSolanaWalletUid;
  const [walletInput, setWalletInput] = useState("");
  const [walletInputError, setWalletInputError] = useState("");
  const [showWalletInput, setShowWalletInput] = useState(false);

  const isValidSolanaAddress = (addr: string) =>
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());

  // Ao abrir o modal, verifica imediatamente o estado do certificado.
  // mintCheckLoading=true bloqueia os botões enquanto a verificação roda.
  useEffect(() => {
    if (!rewardContainerVisibility || !rewardData || !uid || mintStep !== "idle") return;
    startMintCheck(uid, rewardData.id, rewardData.type);
  }, [rewardContainerVisibility, rewardData, uid, mintStep, startMintCheck]);

  const stepLabel =
    mintStep === "uploading" ? t("uploading") :
      mintStep === "minting" ? t("minting") :
        mintStep === "polling" ? t("polling") :
          mintStep === "success" ? t("success") :
            mintStep === "error" ? t("mintTimeout") : "";

  const handleClaim = async () => {
    if (!rewardData || !googleUserInfo) return;
    if (!hasWalletOrSession) {
      if (needsWalletInput) {
        setShowWalletInput(true);
      } else {
        setVisible(true);
      }
      return;
    }
    await fetchAirDrop(
      rewardData.type,
      rewardData.icon,
      googleUserInfo.uid,
      certificateName,
      mintAddress,
      rewardData.id,
      rewardData.name
    );
  };

  const handleWalletInputSubmit = async () => {
    const addr = walletInput.trim();
    if (!isValidSolanaAddress(addr)) {
      setWalletInputError("Endereço Solana inválido. Cole o endereço da sua carteira (ex: 7HjX...)");
      return;
    }
    if (!rewardData || !googleUserInfo) return;
    setWalletInputError("");
    setShowWalletInput(false);
    setSessionWalletAddress(addr);
    await fetchAirDrop(
      rewardData.type,
      rewardData.icon,
      googleUserInfo.uid,
      certificateName,
      addr,
      rewardData.id,
      rewardData.name
    );
  };

  const title =
    rewardData?.type === "program"
      ? t("programCompleted", { name: certificateName || "", program: rewardData?.name || "" })
      : t("trailCompleted", { name: certificateName || "", trail: rewardData?.name || "" });

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
            <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-neutral text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <FaMedal className="w-3 h-3" />
              NFT
            </div>

            <div className="relative w-full aspect-video">
              <Image
                src={rewardData.icon}
                alt={rewardData.name || "Certificado"}
                fill
                style={{ objectFit: "cover" }}
                unoptimized={rewardData.icon.startsWith("/")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 gap-0.5">
                <span className="text-white/60 text-[10px] uppercase tracking-widest font-semibold">
                  {t("certificateLabel")}
                </span>
                <span className="text-white font-bold text-sm leading-tight">
                  {rewardData.name}
                </span>
                <span className="text-white/70 text-[10px]">
                  {certificateName || effectiveAddress}
                </span>
              </div>
            </div>

            {mintStep === "success" && (
              <div className="bg-green/10 border-t border-green/30 px-3 py-2 flex items-center gap-2">
                <FaCheck className="text-green w-3.5 h-3.5 shrink-0" />
                <span className="text-green text-xs font-semibold">{t("nftMinted")}</span>
                {mintTxHash && (
                  <a
                    href={`https://solscan.io/tx/${mintTxHash}?cluster=devnet`}
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

        {/* Aviso de carteira necessária — só aparece depois do check */}
        {!hasWalletOrSession && !showWalletInput && mintStep === "idle" && !mintCheckLoading && (
          <p className="text-sm text-orange-500 font-medium">{t("connectWarning")}</p>
        )}

        {/* Progress / status */}
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

              {mintStep === "error" && (
                <span className="text-xs font-normal">{t("mintTimeoutHint")}</span>
              )}
            </div>
          </div>
        )}

        {/* Botão de ação — escondido enquanto o pre-check roda */}
        {mintStep === "idle" && (
          mintCheckLoading ? (
            <div className="w-full flex justify-center py-3">
              <span className="loading loading-spinner loading-sm text-neutral/40" />
            </div>
          ) : showWalletInput ? (
            <div className="flex flex-col gap-2 w-full">
              <p className="text-sm text-neutral/70">
                Informe o endereço da sua carteira Solana para receber o certificado:
              </p>
              <input
                value={walletInput}
                onChange={(e) => { setWalletInput(e.target.value); setWalletInputError(""); }}
                placeholder="Cole seu endereço Solana aqui..."
                className="input input-bordered w-full h-10 text-sm bg-base-100 text-neutral"
              />
              {walletInputError && (
                <p className="text-xs text-red-500">{walletInputError}</p>
              )}
              <button
                onClick={handleWalletInputSubmit}
                disabled={!walletInput.trim()}
                className="btn w-full h-12 bg-green text-neutral font-semibold border-0 disabled:opacity-50"
              >
                {t("claimNow")}
              </button>
              <button
                onClick={() => { setShowWalletInput(false); setWalletInputError(""); }}
                className="btn w-full h-9 bg-transparent border border-neutral/20 text-neutral/60 text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              className="btn w-full h-12 bg-green text-neutral font-semibold border-0"
            >
              {!hasWalletOrSession ? tLearn("connectWallet") : t("claimNow")}
            </button>
          )
        )}

        {isProcessing && (
          <div className="flex flex-col gap-3 w-full">
            <p className="text-xs text-neutral/60 text-center">
              O processamento pode levar alguns minutos. Você pode fechar e continuar navegando — será avisado quando o certificado estiver pronto.
            </p>
            <button disabled className="btn w-full h-12 bg-green/50 text-neutral font-semibold cursor-not-allowed border-0">
              <span className="loading loading-spinner loading-sm" />
              {t("processing")}
            </button>
            <button
              onClick={closeRewardContainer}
              className="btn w-full h-10 bg-transparent border border-neutral/20 text-neutral/70 font-medium text-sm"
            >
              Fechar e aguardar
            </button>
          </div>
        )}

        {isDone && mintStep === "success" && (
          <div className="flex flex-col gap-2 w-full">
            {mintIpfsHash && (
              <a
                href={`/certificates/${mintIpfsHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full h-12 bg-dblue text-white font-semibold border-0 flex items-center gap-2"
              >
                <FaExternalLinkAlt className="w-4 h-4" />
                {t("viewCertificate")}
              </a>
            )}
            {mintTxHash && (
              <a
                href={`https://solscan.io/tx/${mintTxHash}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn w-full h-10 bg-transparent border border-neutral/20 text-neutral/70 font-medium text-sm flex items-center gap-2"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
                Ver transação no Solscan
              </a>
            )}
            <button
              onClick={() => handleRewardContainer()}
              className="btn w-full h-10 bg-transparent border border-neutral/20 text-neutral/70 font-medium text-sm"
            >
              {t("close")}
            </button>
          </div>
        )}

        {isDone && mintStep === "error" && (
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleClaim}
              className="btn w-full h-12 bg-green text-neutral font-semibold border-0"
            >
              Tentar novamente
            </button>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => retryMintStatusCheck(
                  googleUserInfo?.uid || "",
                  rewardData?.id || "",
                  rewardData?.type || "trail"
                )}
                className="btn flex-1 h-10 border border-neutral/20 text-neutral/70 text-sm bg-transparent font-medium"
              >
                {t("retryCheck")}
              </button>
              <button
                onClick={() => handleRewardContainer()}
                className="btn flex-1 h-10 bg-neutral/10 text-neutral text-sm font-medium border-0"
              >
                {t("close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
