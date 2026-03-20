"use client";

import { ObWalletContainer } from "./components/ObWalletContainer";
import { OnboardingProps } from "@/interfaces/interfaces";

export const ObWalletConfig = ({ handleTabClick }: OnboardingProps<void>) => {
  return (
    <div className="w-full h-full flex md:flex-row flex-col gap-10">
      <ObWalletContainer />
    </div>
  );
};
