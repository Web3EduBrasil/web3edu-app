import Image from "next/image";
import NoNftIcon from "../../assets/icons/no-certificate.svg";

export const NftsCard = ({ achievedNfts }: { achievedNfts: AchievedNft[] }) => {
  return (
    <div className="w-full lg:h-full h-72 bg-cgray rounded-box lg:col-span-3 lg:row-span-2 flex flex-col px-5 py-3 gap-1">
      <div className="flex justify-between l font-semibold">
        <p className="text-neutral">NFTs</p>
        <p className="cursor-pointer font-bold text-gray">Veja Mais</p>
      </div>
      <div className="bg-neutralbg h-full w-full rounded-box flex justify-center items-center flex-col gap-2">
        {achievedNfts.length === 0 ? (
          <>
            <Image src={NoNftIcon} alt="No NFTs icon" className="h-2/4" />
            <p className="text-base-content font-medium">
              Você não possui certificações
            </p>
          </>
        ) : (
          achievedNfts.map((nft) => (
            <div
              key={nft.trailId}
              className="w-20 h-20 flex items-center justify-center"
            >
              <Image
                src={nft.ipfs}
                alt="NFT"
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
