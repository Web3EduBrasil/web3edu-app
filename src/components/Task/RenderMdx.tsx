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
      const fetchMdx = async () => {
        try {
          const response = await fetch(
            `/api/mdx/content?trailId=${trailId}&Id=${id}`,
            {
              method: "GET",
            }
          );
          const data = await response.json();
          setMdxSource(data.mdxSource);
        } catch (error) {
          console.error("Error fetching MDX file:", error);
          setMdxSource(null);
        }
      };
      fetchMdx();
    }
  }, [id, trailId]);

  return (
    <div className="flex flex-col gap-6">
      {mdxSource ? (
        <div className="prose prose-blue max-w-none">
          <MDXRemote {...mdxSource} />
        </div>
      ) : (
        <p>Loading...</p>
      )}
      {done && !isLast ? (
        <MotionButton
          type="button"
          label="Avançar"
          className="w-fit bg-blue text-white"
          func={() => {
            const nextId = getNextSectionId();
            if (nextId) router.push(`/learn/${trailId}/${nextId}`);
          }}
        />
      ) : (
        <MotionButton
          type="button"
          label="Marcar como concluído"
          className="w-fit bg-blue text-white"
          func={() => {
            toast.promise(fetchDone(isLast), {
              pending: "Enviando...",
              success: "Tarefa concluída com sucesso!",
              error: "Erro ao concluir tarefa.",
            });
          }}
        />
      )}
    </div>
  );
}
