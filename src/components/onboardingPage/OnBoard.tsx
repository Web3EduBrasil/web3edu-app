"use client";

import { useEffect, useState } from "react";
import { HandleScreenProps } from "@/interfaces/interfaces";
import { ObCommu } from "./Obcommu";
import { ObIntro } from "./ObIntro";

import { ObWalletConfig } from "./ObWalletConfig";
import { ObTutorial } from "./ObTutorial";

function OnBoard() {
  const [activeTab, setActiveTab] = useState("ObIntro");

  function Switch({ activeTab }: HandleScreenProps) {
    switch (activeTab) {
      case "ObIntro":
        return <ObIntro handleTabClick={setActiveTab} />;
      case "ObTutorial":
        return <ObTutorial handleTabClick={setActiveTab} />;
      case "ObCommu":
        return <ObCommu handleTabClick={setActiveTab} />;
      case "ObWalletConfig":
        return <ObWalletConfig handleTabClick={setActiveTab} />;
    }
  }
  return (
    <div className="flex justify-center items-center w-full h-full ">
      {Switch({ activeTab })}
    </div>
  );
}

export default OnBoard;
