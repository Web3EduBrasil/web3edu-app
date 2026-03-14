"use client";

import { MotionButton } from "../ui/Button";
import { useContent } from "@/providers/content-context";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface ImageTaskProps {
  fetchDone: (param: Boolean) => Promise<void>;
  isLast: Boolean;
  done?: Boolean;
  imageUrl: string;
  caption?: string;
  description?: string;
  id: string;
  trailId: string;
}

export const RenderImageV = ({
  fetchDone,
  isLast,
  done,
  imageUrl,
  caption,
  description,
  id,
  trailId,
}: ImageTaskProps) => {
  const router = useRouter();
  const { trailSections } = useContent();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Description */}
      {description && (
        <div className="w-full bg-ccblue rounded-box p-6">
          <p className="text-neutral md:text-base text-sm">{description}</p>
        </div>
      )}

      {/* Image */}
      <div className="w-full flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption || "Imagem da seção"}
          className="w-full max-w-3xl rounded-box shadow-md object-contain"
        />
        {caption && (
          <p className="text-xs text-gray italic text-center max-w-xl">
            {caption}
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
            if (nextId) router.push(`/learn/${trailId}/${nextId}`);
          }}
        />
      ) : (
        <MotionButton
          rightIcon={true}
          label="Marcar como concluído"
          type="button"
          className="bg-green text-neutral w-2/5 h-12 self-end"
          func={() => {
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
