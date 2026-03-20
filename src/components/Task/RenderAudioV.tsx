"use client";

import { useRef, useState } from "react";
import { MotionButton } from "../ui/Button";
import { useContent } from "@/providers/content-context";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface AudioTaskProps {
  fetchDone: (param: Boolean) => Promise<void>;
  isLast: Boolean;
  done?: Boolean;
  audioUrl: string;
  id: string;
  trailId: string;
  title?: string;
  description?: string;
}

export const RenderAudioV = ({
  fetchDone,
  isLast,
  done,
  audioUrl,
  id,
  trailId,
  title,
  description,
}: AudioTaskProps) => {
  const router = useRouter();
  const { trailSections } = useContent();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [listened, setListened] = useState(done === true);

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  const handleEnded = () => setListened(true);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="w-full bg-ccblue rounded-box flex flex-col p-8 gap-3">
        <p className="text-cblue md:text-xl text-lg font-semibold">
          🎧 Ouça o áudio a seguir
        </p>
        {description && (
          <p className="md:text-base text-sm text-neutral">{description}</p>
        )}
      </div>

      {/* Player */}
      <div className="w-full flex flex-col items-center gap-4 bg-cgray rounded-box p-6">
        {title && (
          <p className="font-semibold text-neutral text-center">{title}</p>
        )}
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          onEnded={handleEnded}
          className="w-full max-w-xl"
        >
          Seu navegador não suporta o elemento de áudio.
        </audio>
        {!listened && (
          <p className="text-xs text-gray italic">
            Ouça o áudio completo para avançar
          </p>
        )}
      </div>

      {/* Action buttons */}
      {done ? (
        <MotionButton
          rightIcon={true}
          label="Avançar"
          type="button"
          className="bg-blue text-neutral w-2/5 h-12 self-end"
          func={() => {
            const nextId = getNextSectionId();
            if (nextId) router.push(`/learn/${nextId}`);
          }}
        />
      ) : (
        <MotionButton
          rightIcon={true}
          label={listened ? "Marcar como concluído" : "Ouça o áudio primeiro"}
          type="button"
          className={`w-2/5 h-12 self-end ${listened ? "bg-green text-neutral" : "bg-gray/30 text-gray cursor-not-allowed"
            }`}
          func={() => {
            if (!listened) {
              toast.info("Ouça o áudio completo antes de avançar");
              return;
            }
            toast.promise(fetchDone(isLast), {
              pending: "Salvando progresso...",
              success: "Seção concluída! 🎉",
              error: "Erro ao salvar progresso",
            });
          }}
        />
      )}
    </div>
  );
};
