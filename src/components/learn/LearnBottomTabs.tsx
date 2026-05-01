"use client";

import { useState } from "react";
import { LessonQnA } from "../Task/LessonQnA";

interface LearnBottomTabsProps {
  trail: any;
  trailId: string;
  sectionId: string;
}

export const LearnBottomTabs = ({ trail, trailId, sectionId }: LearnBottomTabsProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "qa">("overview");

  const handleTabChange = (nextTab: "overview" | "qa") => {
    if (typeof window === "undefined") {
      setActiveTab(nextTab);
      return;
    }

    const currentScrollY = window.scrollY;
    setActiveTab(nextTab);

    // Evita "pulo" da tela ao trocar de aba e manter o aluno no mesmo ponto da aula.
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: "auto" });
    });
    setTimeout(() => {
      window.scrollTo({ top: currentScrollY, behavior: "auto" });
    }, 40);
  };

  return (
    <div className="w-full sm:px-10 pb-6 [overflow-anchor:none]">
      <div role="tablist" className="tabs tabs-bordered w-full px-1">
        <button
          role="tab"
          className={`tab ${activeTab === "overview" ? "tab-active font-semibold" : ""}`}
          onClick={() => handleTabChange("overview")}
        >
          Visão geral
        </button>
        <button
          role="tab"
          className={`tab ${activeTab === "qa" ? "tab-active font-semibold" : ""}`}
          onClick={() => handleTabChange("qa")}
        >
          Perguntas e respostas
        </button>
      </div>

      {activeTab === "overview" ? (
        <div className="bg-cgray rounded-box p-6 mt-3 text-neutral flex flex-col gap-3 min-h-[36rem]">
          <h3 className="text-xl font-bold">{trail?.name || "Curso"}</h3>
          <p className="text-sm text-neutral/80">
            {trail?.description || "Resumo do curso. Você pode adicionar mais informações aqui depois."}
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="badge badge-outline">Tempo estimado: {trail?.estimatedTime || 0}h</span>
            <span className="badge badge-outline">Tópicos: {Array.isArray(trail?.topics) ? trail.topics.length : 0}</span>
            <span className="badge badge-outline">Categorias: {Array.isArray(trail?.categories) ? trail.categories.length : 0}</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 h-[36rem]">
          <LessonQnA trailId={trailId} sectionId={sectionId} />
        </div>
      )}
    </div>
  );
};
