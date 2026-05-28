"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RenderQuizV } from "./Quiz";
import { useContent } from "@/providers/content-context";
import { useWeb3AuthContext } from "@/lib/web3auth/Web3AuthProvider";
import MdxSection from "./RenderMdx";
import { RenderQuestionV } from "./Question";
import { RenderVideoV } from "./RenderVideoV";
import { RenderAudioV } from "./RenderAudioV";
import { RenderImageV } from "./RenderImageV";
import { authHeaders } from "@/lib/getIdToken";
import { useRouter } from "next/navigation";
import { FaMedal, FaTrophy } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

export const Task = ({
  sectionId,
  trailId,
}: {
  sectionId: string;
  trailId: string;
}) => {
  const {
    fetchSectionContent,
    fetchTrailSections,
    handleRewardContainer,
    trailSections,
    trail,
  } = useContent();
  const [section, setSection] = useState<any>({});
  const { googleUserInfo } = useWeb3AuthContext();
  const router = useRouter();
  const t = useTranslations("learn");
  const trailSectionsRef = useRef(trailSections);
  const redirectRef = useRef(false);
  trailSectionsRef.current = trailSections;

  const fetchData = useCallback(async () => {
    const sectionData = await fetchSectionContent(
      trailId,
      sectionId,
      googleUserInfo?.uid
    );
    const sorted = [...trailSectionsRef.current].sort((a, b) => Number(a.id) - Number(b.id));
    const isLast =
      sorted.length > 0 &&
      String(sorted[sorted.length - 1].id) === String(sectionId);
    setSection({ ...sectionData, isLast });
  }, [trailId, sectionId, googleUserInfo, fetchSectionContent]);

  useEffect(() => {
    if (googleUserInfo && trailId && Object.keys(section).length === 0) {
      if (String(sectionId) === "99" && trailSectionsRef.current.length === 0) {
        return;
      }
      // Seção virtual de conclusão — não busca do Firestore
      const sectionMeta = trailSectionsRef.current.find(
        (s: any) => String(s.id) === String(sectionId)
      );
      if (sectionMeta?.type === "conclusion" && sectionMeta.done !== true) {
        if (!redirectRef.current) {
          const sorted = [...trailSectionsRef.current]
            .filter((s: any) => s.type !== "conclusion")
            .sort((a: any, b: any) => Number(a.id) - Number(b.id));
          const firstPending = sorted.find((s: any) => !s.done);
          const targetId = firstPending?.id ?? sorted[sorted.length - 1]?.id;
          if (targetId) {
            redirectRef.current = true;
            toast.error(t("certificateLocked"));
            router.replace(`/learn/${trailId}/${targetId}`);
            return;
          }
        }
      }
      if (sectionMeta?.type === "conclusion") {
        const sorted = [...trailSectionsRef.current].sort(
          (a: any, b: any) => Number(a.id) - Number(b.id)
        );
        const isLast =
          sorted.length > 0 &&
          String(sorted[sorted.length - 1].id) === String(sectionId);
        setSection({ ...sectionMeta, isLast });
        return;
      }
      fetchData();
    }
  }, [googleUserInfo, trailId, section, fetchData, sectionId, router, t, trailSections]);

  const fetchDone = async (isLast: Boolean) => {
    try {
      const response = await fetch("/api/user/section", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          trailId: trailId,
          sectionId: sectionId,
        }),
      });
      if (response.ok) {
        fetchTrailSections(trailId, googleUserInfo?.uid);
        setSection({ ...section, done: true });
        if (isLast) {
          handleRewardContainer({
            type: "trail",
            id: trailId,
            name: trail?.name || trailId,
            icon: trail?.banner || "",
          });
        }
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  if (!googleUserInfo || !trailId) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="md:w-3/5 w-full h-full flex flex-col gap-2">
      <div className="w-full h-fit md:h-full bg-neutralbg">
        <div className="w-full min-h-[28rem] md:h-full bg-cgray relative md:rounded-box flex flex-col text-neutral justify-between overflow-y-auto p-8 font-medium text-medium gap-5">
          {section.type === "text" ? (
            <MdxSection
              fetchDone={fetchDone}
              id={section.id}
              trailId={trailId}
              isLast={section.isLast}
              done={section.done}
            />
          ) : section.type === "quiz" ? (
            <RenderQuizV
              options={section.options}
              question={section.question}
              explanation={section.explanation}
              fetchDone={fetchDone}
              isLast={section.isLast}
              id={section.id}
              trailId={trailId}
              done={section.done}
            />
          ) : section.type === "question" ? (
            <RenderQuestionV
              description={section.description}
              isLast={section.isLast}
              question={section.question || section.title}
              fetchDone={fetchDone}
              trailId={trailId}
              done={section.done}
              id={section.id}
              lessonRange={section.lessonRange}
            />
          ) : section.type === "video" ? (
            <RenderVideoV
              videoUrl={section.videoUrl}
              description={section.description}
              fetchDone={fetchDone}
              isLast={section.isLast}
              done={section.done} id={section.id}
              trailId={trailId} />
          ) : section.type === "audio" ? (
            <RenderAudioV
              audioUrl={section.audioUrl}
              title={section.title}
              description={section.description}
              fetchDone={fetchDone}
              isLast={section.isLast}
              done={section.done} id={section.id}
              trailId={trailId} />
          ) : section.type === "image" ? (
            <RenderImageV
              imageUrl={section.imageUrl}
              caption={section.caption}
              description={section.description}
              id={section.id}
              trailId={trailId}
              fetchDone={fetchDone}
              isLast={section.isLast}
              done={section.done}
            />
          ) : section.type === "conclusion" ? (
            <div className="flex flex-col gap-8 items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                <FaTrophy className="w-10 h-10 text-yellow-500" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-neutral">Trilha concluída!</h2>
                <p className="text-neutral/60 text-sm">
                  Parabéns! Você finalizou{" "}
                  <span className="font-semibold text-neutral">{trail?.name}</span>{" "}
                  com sucesso.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                  onClick={() =>
                    handleRewardContainer({
                      type: "trail",
                      id: trailId,
                      name: trail?.name || trailId,
                      icon: trail?.banner || "",
                    })
                  }
                  disabled={!section.done}
                  className="btn flex-1 h-12 bg-yellow-500 hover:bg-yellow-400 text-white border-0 gap-2 font-semibold"
                >
                  <FaMedal className="w-4 h-4" />
                  Resgatar certificado
                </button>
                <button
                  onClick={() => router.push("/trailsPage")}
                  className="btn flex-1 h-12 bg-transparent border border-neutral/20 text-neutral/70 font-medium gap-2"
                >
                  <IoArrowBack className="w-4 h-4" />
                  Ver outros cursos
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full flex-col gap-4">
                <div className="skeleton h-32 w-full"></div>
                <div className="skeleton h-4 w-28"></div>
                <div className="skeleton h-4 w-full"></div>
                <div className="skeleton h-4 w-full"></div>
              </div>
              <div className="skeleton h-full w-full"></div>
              <div className="skeleton h-full w-full"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
