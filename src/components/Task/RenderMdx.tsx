import { useEffect, useState } from "react";
import { MDXRemote } from "next-mdx-remote";
import { toast } from "react-toastify";
import { MotionButton } from "../ui/Button";
import { useRouter } from "next/navigation";
import { useContent } from "@/providers/content-context";

interface MdxSectionProps {
  fetchDone: (param: Boolean) => Promise<void>;
  id: string;
  trailId: string;
  isLast: Boolean;
  done: Boolean;
}

export default function MdxSection({
  id,
  trailId,
  fetchDone,
  isLast,
  done,
}: MdxSectionProps) {
  const [mdxSource, setMdxSource] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  const router = useRouter();
  const { trailSections } = useContent();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  useEffect(() => {
    if (id && trailId) {
      setMdxSource(null);
      setLoadError(false);
      const fetchMdx = async () => {
        try {
          const response = await fetch(
            `/api/mdx/content?trailId=${trailId}&Id=${id}`,
            { method: "GET" }
          );
          if (!response.ok) {
            setLoadError(true);
            return;
          }
          const data = await response.json();
          setMdxSource(data.mdxSource);
        } catch (error) {
          console.error("Error fetching MDX file:", error);
          setLoadError(true);
        }
      };
      fetchMdx();
    }
  }, [id, trailId]);

  return (
    <div className="flex flex-col gap-6">
      {loadError ? (
        <div className="w-full bg-orange-50 border border-orange-200 rounded-box p-6 text-center">
          <p className="text-orange-600 font-semibold text-sm">Conteúdo não disponível</p>
          <p className="text-orange-500 text-xs mt-1">Este módulo ainda não possui conteúdo cadastrado.</p>
        </div>
      ) : mdxSource ? (
        <div className="prose prose-blue max-w-none">
          <MDXRemote {...mdxSource} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-5/6"></div>
        </div>
      )}
      {!isLast ? (
        <MotionButton
          type="button"
          label="Avançar"
          className="w-fit bg-blue text-white"
          func={async () => {
            if (!done) await fetchDone(false);
            const nextId = getNextSectionId();
            if (nextId) router.push(`/learn/${trailId}/${nextId}`);
          }}
        />
      ) : !done ? (
        <MotionButton
          type="button"
          label="Concluir trilha"
          className="w-fit bg-green text-white"
          func={() => {
            toast.promise(fetchDone(true), {
              pending: "Enviando...",
              success: "Trilha concluída! 🎉",
              error: "Erro ao concluir.",
            });
          }}
        />
      ) : null}
    </div>
  );
}
