"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import { useContent } from "@/providers/content-context";
import { authHeaders } from "@/lib/getIdToken";
import { FaCheck, FaPlay, FaBookOpen } from "react-icons/fa";
import { MdAccessTime } from "react-icons/md";
import { motion } from "framer-motion";
import Image from "next/image";
import { useOnboardingGuard } from "@/lib/useOnboardingGuard";
import { useTranslations } from "next-intl";

export default function TrailOverviewPage() {
  useOnboardingGuard();
  const { trailIdRt } = useParams() as { trailIdRt: string };
  const router = useRouter();
  const { googleUserInfo } = useWeb3AuthContext();
  const { fetchTrail, trail } = useContent();

  const [enrolled, setEnrolled] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [nextSection, setNextSection] = useState<string | null>(null);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [checking, setChecking] = useState(true);
  const t = useTranslations("learn");

  // Carrega dados da trilha
  useEffect(() => {
    if (trailIdRt && (!trail || trail.trailId !== trailIdRt)) {
      fetchTrail(trailIdRt);
    }
  }, [trailIdRt, trail, fetchTrail]);

  // Verifica status de inscrição
  useEffect(() => {
    if (!googleUserInfo?.uid || !trailIdRt) return;

    (async () => {
      setChecking(true);
      try {
        const res = await fetch(
          `/api/user/trail?uid=${googleUserInfo.uid}&trailId=${trailIdRt}`
        );
        const data = await res.json();
        setEnrolled(data.enrolled);
        setPercentage(data.percentage || 0);

        // Determina próxima seção: busca seções e encontra a primeira não concluída
        if (data.enrolled) {
          const sectionsRes = await fetch(
            `/api/trail/contents?trailId=${trailIdRt}&uid=${googleUserInfo.uid}`
          );
          const sections = await sectionsRes.json();
          const sorted = [...sections].sort(
            (a: any, b: any) => Number(a.id) - Number(b.id)
          );
          const next = sorted.find((s: any) => !s.done) || sorted[0];
          setNextSection(next?.id || "1");
        }
      } catch {
        /* ignora */
      } finally {
        setChecking(false);
      }
    })();
  }, [googleUserInfo?.uid, trailIdRt]);

  const handleEnroll = async () => {
    if (!googleUserInfo?.uid) return;
    setLoadingEnroll(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/user/trail", {
        method: "POST",
        headers,
        body: JSON.stringify({ trailId: trailIdRt }),
      });
      if (res.ok) {
        setEnrolled(true);
        setNextSection("1");
        router.push(`/learn/${trailIdRt}/1`);
      }
    } catch {
      /* ignora */
    } finally {
      setLoadingEnroll(false);
    }
  };

  const handleContinue = () => {
    router.push(`/learn/${trailIdRt}/${nextSection || "1"}`);
  };

  if (checking || !trail || trail.trailId !== trailIdRt) {
    return (
      <div className="flex w-full h-full justify-center items-center p-10">
        <div className="flex flex-col gap-4 w-full max-w-2xl">
          <div className="skeleton h-64 w-full rounded-box" />
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full justify-center items-start overflow-y-auto p-6 md:p-10">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* Banner + vídeo intro */}
        {trail.introVideo ? (
          <iframe
            src={trail.introVideo}
            frameBorder="0"
            allowFullScreen
            className="aspect-video w-full rounded-box shadow-lg"
          />
        ) : trail.banner ? (
          <div className="relative w-full aspect-video rounded-box overflow-hidden shadow-lg">
            <Image
              src={trail.banner}
              alt={trail.name}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        ) : null}

        {/* Título e meta */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold text-neutral">{trail.name}</h1>
          <div className="flex items-center gap-2 text-dgray text-sm">
            <MdAccessTime className="w-4 h-4" />
            <span>{t("contentHours", { hours: trail.estimatedTime })}</span>
          </div>
          <p className="text-neutral text-justify leading-relaxed">{trail.description}</p>
        </div>

        {/* Progresso (se inscrito) */}
        {enrolled && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-semibold text-neutral">
              <span>{t("yourProgress")}</span>
              <span>{percentage}%</span>
            </div>
            <progress
              className="progress progress-success w-full"
              value={percentage}
              max={100}
            />
          </div>
        )}

        {/* O que você aprenderá */}
        {trail.topics?.length > 0 && (
          <div className="bg-cgray rounded-box p-6 flex flex-col gap-4">
            <p className="font-bold text-xl text-neutral">{t("whatYouLearn")}</p>
            <div className="grid md:grid-cols-2 gap-3">
              {trail.topics.map((topic: string, i: number) => (
                <div key={i} className="flex items-center gap-3 text-neutral text-sm">
                  <FaCheck className="text-green shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-4 flex-col sm:flex-row">
          {enrolled ? (
            <motion.button
              onClick={handleContinue}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-lg flex-1 bg-dblue text-white font-bold gap-2"
            >
              <FaPlay className="w-4 h-4" />
              {percentage === 100 ? t("review") : t("continue")}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleEnroll}
              disabled={loadingEnroll}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-lg flex-1 bg-green text-neutral font-bold gap-2"
            >
              <FaBookOpen className="w-4 h-4" />
              {loadingEnroll ? t("enrolling") : t("enrollFree")}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
