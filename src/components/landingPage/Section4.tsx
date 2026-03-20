import { useState } from "react";
import { TrailCardsLanding } from "./TrailCardLanding";
import { useTranslations } from "next-intl";

export const Section4 = () => {
  const t = useTranslations("landing.trails");

  return (
    <div className="w-full h-fit flex bg-neutralbg md:px-20 px-10 py-10 flex-col justify-center items-center ">
      <div className="flex flex-col justify-center items-center gap-8">
        <p className="text-neutral text-4xl font-bold text-center">
          {t("title")}
        </p>
        <p className="text-gray md:px-20 font-medium text-justify ">
          {t("description")}
        </p>
      </div>

      <TrailCardsLanding />
    </div>
  );
};
