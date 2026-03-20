"use client";

import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { MotionButton } from "../ui/Button";
import { RxCross2 } from "react-icons/rx";
import { useState } from "react";
import { IconButton } from "../ui/IconButton";
import { useContent } from "@/providers/content-context";
import "react-toastify/dist/ReactToastify.css";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";

export const RewardContainer = () => {
  const {
    handleRewardContainer,
    rewardContainerVisibility,
    rewardData,
    fetchTrailAirDrop,
    fetchProgramAirDrop,
  } = useContent();
  const { googleUserInfo, userAccount, userDbInfo } = useWeb3AuthContext();
  const { openConnectModal } = useConnectModal();
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("reward");
  const tLearn = useTranslations("learn");

  const hasWallet = !!userAccount[0];

  const handleClaim = async () => {
    if (!rewardData || !googleUserInfo) return;

    if (!hasWallet) {
      if (openConnectModal) openConnectModal();
      return;
    }
    setIsLoading(true);
    try {
      const userName =
        (userDbInfo as any)?.displayName || googleUserInfo?.displayName || "";

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
    } finally {
      setIsLoading(false);
      handleRewardContainer();
    }
  };

  const title =
    rewardData?.type === "program"
      ? t("programCompleted", { name: googleUserInfo?.displayName || "", program: rewardData?.name || "" })
      : t("trailCompleted", { name: googleUserInfo?.displayName || "", trail: rewardData?.name || "" });

  return (
    <div
      className={`w-full min-h-full bg-neutral/50 flex justify-center items-center text-neutral absolute z-20 top-0 px-5 md:px-0 ${rewardContainerVisibility ? "visible" : "invisible"
        }`}
    >
      <div className="md:w-96 w-full h-fit flex flex-col rounded-box py-5 px-6 gap-4 bg-cgray shadow-lg font-semibold items-start cursor-default">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between w-full items-center">
            <p>{title}</p>
            <IconButton
              Icon={RxCross2}
              func={() => handleRewardContainer()}
              className="h-5"
            />
          </div>
          <p>{t("bodyText")}</p>
          {!hasWallet && (
            <p className="text-sm text-orange-500 font-medium">
              {t("connectWarning")}
            </p>
          )}
        </div>
        <MotionButton
          rightIcon={true}
          label={isLoading ? t("processing") : hasWallet ? t("claimNow") : tLearn("connectWallet")}
          type="button"
          className="bg-green text-neutral w-full h-12 self-end font-semibold text-md"
          func={handleClaim}
        />
      </div>
    </div>
  );
};

