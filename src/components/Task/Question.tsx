"use client";

import { useState } from "react";
import { MotionButton } from "../ui/Button";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { TextArea } from "../ui/TextArea";
import { useContent } from "@/providers/content-context";
import { AiAnswerProps } from "@/interfaces/interfaces";

interface RenderQuestionProps {
  description: string;
  isLast: Boolean;
  fetchDone: (param: Boolean) => Promise<void>;
  question: string;
  done: boolean;
  trailId: string;
  id: string;
  lessonRange?: number[];
}

export const RenderQuestionV = ({
  description,
  isLast,
  fetchDone,
  question,
  id,
  trailId,
  done,
  lessonRange,
}: RenderQuestionProps) => {
  const [answer, setAnswer] = useState("");
  const [aiExplanation, setAiExplanation] = useState("");
  const [showError, setShowError] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { fetchAiAnswerCheck, trailSections } = useContent();
  const router = useRouter();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  async function fetchAiCheck(q: string, a: string): Promise<AiAnswerProps> {
    // Se tiver lessonRange, usa a rota contextual com MDX
    if (lessonRange && lessonRange.length > 0) {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trailId, question: q, answer: a, lessonRange }),
      });
      if (!res.ok) throw new Error("Erro na validação com IA");
      const data = await res.json();
      return {
        valido: Boolean(data?.valido),
        explicacao:
          typeof data?.explicacao === "string" && data.explicacao.trim().length > 0
            ? data.explicacao
            : "Não foi possível validar com segurança. Tente novamente.",
      };
    }
    return fetchAiAnswerCheck(q, a);
  }

  async function HandleSubmit() {
    if (answer.trim().length === 0) {
      toast.warning("Preencha sua resposta!");
      return;
    }

    if (answer.length > 800) {
      toast.warning("Resposta muito longa! (máx 800 caracteres)");
      return;
    }

    if (isCorrect || done) {
      if (!isLast) {
        if (!done) await fetchDone(false);
        const nextId = getNextSectionId();
        if (nextId) router.push(`/learn/${trailId}/${nextId}`);
      } else if (!done) {
        await fetchDone(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      const aiAnswer: AiAnswerProps = await fetchAiCheck(question, answer);
      setAiExplanation(aiAnswer.explicacao);
      if (aiAnswer.valido === true) {
        setIsCorrect(true);
        setShowError(false);
      } else {
        setShowError(true);
      }
    } catch {
      toast.error("Erro ao verificar resposta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  // Estado de acerto: mostra parabéns + explicação + botão avançar
  if (isCorrect && aiExplanation) {
    return (
      <div className="w-full flex flex-col gap-5">
        <div className="w-full bg-green-50 border border-green-300 rounded-box p-8 flex flex-col gap-4">
          <p className="text-green-600 font-bold text-lg">Resposta correta! 🎉</p>
          <p className="text-neutral text-sm leading-relaxed">{aiExplanation}</p>
          <div className="flex justify-end">
            <MotionButton
              rightIcon={true}
              label={!isLast ? "Avançar" : "Concluir trilha"}
              type="button"
              className="bg-blue text-neutral w-fit h-12"
              func={HandleSubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  // Estado de erro: esconde pergunta/campo e mostra explicação + retry
  if (showError) {
    return (
      <div className="w-full flex flex-col gap-5">
        <div className="w-full bg-orange-50 border border-orange-300 rounded-box p-8 flex flex-col gap-4">
          <p className="text-orange-600 font-bold text-lg">Resposta incorreta!</p>
          <p className="text-neutral text-sm leading-relaxed">{aiExplanation}</p>
          <button
            onClick={() => { setShowError(false); setAnswer(""); setAiExplanation(""); }}
            className="btn btn-outline btn-sm w-fit border-orange-400 text-orange-600 hover:bg-orange-100 hover:border-orange-400 hover:text-orange-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full md:h-fit bg-ccblue rounded-box flex flex-col justify-start items-start p-8 gap-3">
        <p className="text-cblue md:text-xl text-lg font-semibold">Responda a pergunta a seguir</p>
        <p className="md:text-lg text-base font-medium">{question}</p>
        {description && (
          <p className="text-sm text-neutral/70 leading-relaxed">{description}</p>
        )}
        {isCorrect && aiExplanation && (
          <p className="text-dgreen">{aiExplanation} 🎉😊</p>
        )}
      </div>
      <div className="w-full h-full justify-center gap-5">
        <TextArea
          value={answer}
          setContent={setAnswer}
          placeholder="Escreva sua resposta"
          className="w-full min-h-full"
        />
      </div>

      <div className="flex justify-end">
        {done && !isLast ? (
          <MotionButton
            type="button"
            label="Avançar"
            className="w-fit bg-blue text-white"
            func={async () => {
              const nextId = getNextSectionId();
              if (nextId) router.push(`/learn/${trailId}/${nextId}`);
            }}
          />
        ) : (
          <MotionButton
            rightIcon={true}
            label={isLoading ? "Verificando..." : (isCorrect || done) ? (!isLast ? "Avançar" : "Concluir trilha") : "Verificar"}
            type="button"
            className={`text-neutral w-fit h-12 ${isCorrect || done ? "bg-blue" : "bg-transparent border-2"}`}
            func={HandleSubmit}
          />
        )}
      </div>
    </>
  );
};
