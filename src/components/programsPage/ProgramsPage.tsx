"use client";

import { useContent } from "@/providers/content-context";
import { useEffect, useState } from "react";
import { ProgramCard } from "./ProgramCard";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";
import { FiSearch } from "react-icons/fi";

export const Programs = () => {
  useOnboardingGuard();
  const { fetchProgramsList, programsList } = useContent();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPrograms, setFilteredPrograms] = useState([]);

  useEffect(() => {
    if (programsList.length <= 0) {
      fetchProgramsList();
    }
  }, [programsList, fetchProgramsList]);

  useEffect(() => {
    if (programsList.length > 0) {
      const filtered = programsList.filter((p: any) =>
        (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPrograms(filtered);
    }
  }, [searchTerm, programsList]);

  return (
    <div className="flex w-full h-full justify-start items-start flex-col overflow-y-scroll px-12 mt-4 gap-4">
      <div className="flex w-full items-center md:flex-row flex-col gap-3">
        <p className="font-bold lg:text-3xl text-2xl text-center text-nowrap md:order-first order-last">
          Programas
        </p>
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dgray/60" />
          <input
            type="text"
            placeholder="Buscar programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 bg-white text-dgray border-gray"
          />
        </div>
      </div>

      {filteredPrograms.length !== 0 ? (
        filteredPrograms.map((e: any, index: any) => (
          <ProgramCard
            key={index}
            id={e.id}
            image={e.banner}
            title={e.title}
            description={e.resumedDescription}
          />
        ))
      ) : (
        <div className="w-full min-h-full flex items-center justify-center">
          <p className="text-3xl text-gray/80 font-bold">
            Nenhum programa encontrado 🤨
          </p>
        </div>
      )}
    </div>
  );
};
