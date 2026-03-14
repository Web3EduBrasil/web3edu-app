import { TrailCardHome } from "./TrailCardHome";
import { useContent } from "@/providers/content-context";
import { useEffect } from "react";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";

export const TrailsCardSection = () => {
  const { fetchTrailsList, trailsList } = useContent();
  const { googleUserInfo } = useWeb3AuthContext();

  useEffect(() => {
    if (Object.keys(trailsList).length === 0 && googleUserInfo !== null) {
      fetchTrailsList(googleUserInfo?.uid);
    }
  }, [trailsList, googleUserInfo]);

  return (
    <div className="flex flex-col lg:h-full h-80 w-full lg:col-span-3 lg:row-span-3 gap-3">
      <p className="font-bold text-xl text-nowrap ">Trilhas de aprendizagem</p>

      <div className="w-full  h-full flex flex-col border-gray rounded-box justify-between">
        {Object.keys(trailsList).length !== 0 ? (
          trailsList.map((e: any, index: any) => {
            return (
              <TrailCardHome
                text={e.name}
                progress={e.percentage}
                key={index}
                trailId={e.id}
              />
            );
          })
        ) : (
          <>
            <div className="skeleton w-full h-[30%]"></div>
            <div className="skeleton w-full h-[30%]"></div>
            <div className="skeleton w-full h-[30%]"></div>
          </>
        )}
      </div>
    </div>
  );
};
