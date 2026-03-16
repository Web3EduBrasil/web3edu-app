"use client";

import { TrailCards } from "./TrailContainer";
import { useContent } from "@/providers/content-context";
import { useEffect, useState } from "react";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";
import { FiSearch } from "react-icons/fi";

export const Trails = () => {
  useOnboardingGuard();
  const { fetchTrailsList, trailsList } = useContent();
  const { userDbInfo } = useWeb3AuthContext();
  const [filteredTrails, setFilteredTrails] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (userDbInfo !== null && trailsList.length === 0) {
      fetchTrailsList(userDbInfo?.uid);
    }
  }, [userDbInfo, trailsList, fetchTrailsList]);

  useEffect(() => {
    if (trailsList.length > 0) {
      const filtered = trailsList.filter((trail: any) => {
        const matchName = trail.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === "" || (trail.categories && trail.categories.includes(activeCategory));
        return matchName && matchCat;
      });
      setFilteredTrails(filtered);
    }
  }, [searchTerm, activeCategory, trailsList]);

  // Extrair categorias únicas de todas as trilhas
  const allCategories: string[] = Array.from(
    new Set(trailsList.flatMap((t: any) => t.categories || []))
  );

  return (
    <div className="flex w-full h-full justify-start items-center flex-col overflow-y-scroll px-12 mt-4">
      <div className="flex w-full items-center md:flex-row flex-col gap-3 mb-4">
        <p className="font-bold lg:text-3xl text-2xl text-center text-nowrap md:order-first order-last">
          Trilhas de aprendizagem
        </p>
        {/* Barra de busca */}
        <div className="relative flex-1 max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dgray/60" />
          <input
            type="text"
            placeholder="Buscar trilha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 bg-white text-dgray border-gray"
          />
        </div>
      </div>

      {/* Filtro por categoria */}
      {allCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap w-full mb-4">
          <button
            onClick={() => setActiveCategory("")}
            className={`badge badge-lg cursor-pointer ${activeCategory === "" ? "badge-neutral" : "badge-outline"
              }`}
          >
            Todas
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
              className={`badge badge-lg cursor-pointer ${activeCategory === cat ? "badge-neutral" : "badge-outline"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="w-full h-full gap-7 mb-8 flex flex-wrap">
        {filteredTrails.length !== 0 ? (
          filteredTrails.map((e: any, index: any) => {
            return (
              <TrailCards
                key={index}
                id={e.id}
                image={e.banner}
                title={e.name}
                description={e.resumedDescription}
              />
            );
          })
        ) : (
          <div className="w-full min-h-full flex items-center justify-center">
            <p className="text-3xl text-gray/80 font-bold">
              Nenhuma trilha encontrada 🤨
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
