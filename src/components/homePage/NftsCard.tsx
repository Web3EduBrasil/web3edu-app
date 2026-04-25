"use client";

import Image from "next/image";
import NoNftIcon from "../../../public/assets/icons/no-certificate.svg";
import { useTranslations } from "next-intl";
import { AchievedNft } from "@/interfaces/interfaces";

export const NftsCard = ({ achievedNfts }: { achievedNfts: AchievedNft[] }) => {
  const t = useTranslations("home.nfts");
  return (
    <div className="w-full lg:h-full h-72 bg-cgray rounded-box lg:col-span-3 lg:row-span-2 flex flex-col px-5 py-3 gap-1">
      <div className="flex justify-between l font-semibold">
        <p className="text-neutral">{t("title")}</p>
        <p className="cursor-pointer font-bold text-gray">{t("seeMore")}</p>
      </div>
      <div className="bg-neutralbg h-full w-full rounded-box flex flex-wrap justify-start items-start gap-2 overflow-y-auto">
        {achievedNfts.length === 0 ? (
          <div className="flex flex-col gap-2 items-center justify-center w-full h-full">
            <Image src={NoNftIcon} alt="No NFTs icon" className="h-2/4" />
            <p className="text-base-content font-medium">
              {t("noCertifications")}
            </p>
          </div>
        ) : (
          achievedNfts.map((nft, index) => (
            <div
              key={index}
              className="w-22 h-22 flex items-center justify-center"
            >
              <Image
                src={nft.ipfs}
                alt="NFT"
                width={100}
                height={100}
                className="w-full h-full object-cover"
                onClick={() => {
                  window.open(nft.openseaUrl, "_blank");
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
