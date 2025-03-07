import UserCard from "./UserCard";
import { NftsCard } from "./NftsCard";
import { JourneysCard } from "./JourneysCard";
import { TrailsCardSection } from "./TrailsCardSection";

export const Home = () => {
  return (
    <div className="h-full w-full grid items-center grid-cols-1 lg:grid-rows-5 pb-6 lg:grid-cols-5 lg:px-40 px-10 justify-center gap-10">
      <UserCard />
      <NftsCard />
      <JourneysCard />
      <TrailsCardSection />
    </div>
  );
};
