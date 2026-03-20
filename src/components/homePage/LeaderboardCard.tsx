"use client";

import { useEffect, useState } from "react";
import { levelFromXp } from "@/lib/xp";

interface LeaderEntry {
  uid: string;
  displayName: string;
  xp: number;
  level: number;
  photoURL: string | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export const LeaderboardCard = () => {
  const [top, setTop] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => setTop(data.top || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full bg-cgray rounded-box border-[1.5px] border-gray lg:col-span-5 flex flex-col px-5 py-4 gap-3">
      <p className="font-bold text-xl text-neutral">🏆 Leaderboard</p>
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-full rounded-box" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-gray text-sm">Nenhum usuário rankeado ainda.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {top.map((entry, index) => (
            <div
              key={entry.uid}
              className="flex items-center justify-between bg-white rounded-box px-4 py-2 border border-gray/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">
                  {MEDALS[index] ?? `#${index + 1}`}
                </span>
                {entry.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.photoURL}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ddblue/20 flex items-center justify-center text-xs font-bold text-ddblue">
                    {entry.displayName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="font-medium text-neutral text-sm truncate max-w-[140px]">
                  {entry.displayName}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray">Nv {levelFromXp(entry.xp)}</span>
                <span className="font-bold text-ddblue text-sm">{entry.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
