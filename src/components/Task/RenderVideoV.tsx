"use client";

import { MotionButton } from "../ui/Button";
import { useContent } from "@/providers/content-context";
import { useRouter } from "next/navigation";

interface VideoTaskProps {
  fetchDone: (param: Boolean) => Promise<void>;
  isLast: Boolean;
  done?: Boolean;
  videoUrl?: string;
  description?: string;
  id: string;
  trailId: string;
}

export const RenderVideoV = ({
  fetchDone,
  isLast,
  done,
  videoUrl,
  description,
  id,
  trailId,
}: VideoTaskProps) => {
  const router = useRouter();
  const { trailSections } = useContent();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  // Converte URL do YouTube para formato embed se necessário
  const getEmbedUrl = (url: string): string => {
    if (!url) return "";
    if (url.includes("/embed/")) return url;
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  const embedUrl = getEmbedUrl(
    videoUrl || "https://www.youtube.com/embed/MmB9b5njVbA"
  );

  return (
    <>
      <div className="flex flex-col items-center gap-5">
        <div className="w-full md:h-fit bg-ccblue rounded-box flex flex-col justify-start items-start p-10 gap-5">
          <p className="text-cblue md:text-xl text-lg">Assista o vídeo a seguir</p>
          {description && (
            <p className="md:text-lg text-base">{description}</p>
          )}
        </div>
        <div className="w-full h-fit justify-center items-center">
          <iframe
            src={embedUrl}
            frameBorder="0"
            allowFullScreen
            className="aspect-video w-full h-auto rounded-box"
          />
        </div>
      </div>
      {done ? (
        <MotionButton
          rightIcon={true}
          label="Avançar"
          type="button"
          className="bg-blue text-neutral w-2/5 h-12 self-end"
          func={() => {
            if (!isLast) {
              const nextId = getNextSectionId();
              if (nextId) router.push(`/learn/${trailId}/${nextId}`);
            }
          }}
        />
      ) : (
        <MotionButton
          rightIcon={true}
          label="Marcar como concluído"
          type="button"
          className="bg-green text-neutral w-2/5 h-12 self-end"
          func={() => fetchDone(isLast)}
        />
      )}
    </>
  );
};
