"use client";

import { ObCommuContainers } from "./components/ObCommuContainer";
import { OnboardingProps } from "@/interfaces/interfaces";

export const ObCommu = ({ handleTabClick }: OnboardingProps<void>) => {
  return (
    <div className="w-full h-full flex md:flex-row flex-col md:gap-5">
      <ObCommuContainers handleTabClick={handleTabClick} />
    </div>
  );
};
