"use client";

import { useState } from "react";
import { MotionButton } from "../ui/Button";
import { MotionDiv } from "../ui/MotionDiv";
import { useRouter } from "next/navigation";
import { useContent } from "@/providers/content-context";

interface QuizSectionProps {
  options: Array<any>;
  question: string;
  explanation?: string;
  fetchDone: (param: Boolean) => Promise<void>;
  done: boolean;
  isLast: Boolean;
  trailId: string;
  id: string;
}

export const RenderQuizV = ({
  options,
  question,
  explanation,
  fetchDone,
  done,
  trailId,
  isLast,
  id,
}: QuizSectionProps) => {
  const [selectedOpt, setSelectedOpt] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [errorExplanation, setErrorExplanation] = useState("");
  const [successExplanation, setSuccessExplanation] = useState("");
  const { trailSections } = useContent();
  const router = useRouter();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  async function HandleSubmit() {
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
    if (options[selectedOpt].correct === true) {
      setIsCorrect(true);
      setErrorExplanation("");
      const msg = explanation
        ? explanation
        : `Correto! A opção "${options[selectedOpt].option}" é a resposta certa.`;
      setSuccessExplanation(msg);
    } else {
      const correctOption = options.find((o) => o.correct)?.option || "";
      const msg = explanation
        ? explanation
        : correctOption
          ? `A resposta correta é: "${correctOption}".`
          : "Tente novamente.";
      setErrorExplanation(msg);
    }
  }

  // Estado de acerto: mostra parabéns + explicação + botão avançar
  if (isCorrect && successExplanation) {
    return (
      <div className="w-full flex flex-col gap-5">
        <div className="w-full bg-green-50 border border-green-300 rounded-box p-8 flex flex-col gap-4">
          <p className="text-green-600 font-bold text-lg">Resposta correta! 🎉</p>
          <p className="text-neutral text-sm leading-relaxed">{successExplanation}</p>
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

  // Estado de erro: esconde quiz e mostra explicação + botão retry
  if (errorExplanation) {
    return (
      <div className="w-full flex flex-col gap-5">
        <div className="w-full bg-orange-50 border border-orange-300 rounded-box p-8 flex flex-col gap-4">
          <p className="text-orange-600 font-bold text-lg">Resposta incorreta!</p>
          <p className="text-neutral text-sm leading-relaxed">{errorExplanation}</p>
          <button
            onClick={() => { setErrorExplanation(""); setSelectedOpt(0); }}
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
      <div className="w-full md:h-fit bg-ccblue rounded-box flex flex-col justify-start items-start p-10 gap-5">
        <p className="text-cblue md:text-xl text-lg">
          Responda o quiz a seguir
        </p>
        <p className="md:text-lg text-base">{question}</p>
      </div>
      <div className="w-full h-fit p-10 grid lg:grid-cols-2 grid-cols-1 justify-center gap-5">
        {options.map((e, index) => {
          return (
            <MotionDiv
              key={index}
              func={() => {
                setSelectedOpt(index);
              }}
              className={`w-full h-24 justify-center bg-white flex flex-col p-5 shadow-lg rounded-box cursor-pointer ${isCorrect === true && e.correct === true
                ? "bg-green border-2 border-green shadow-green shadow"
                : selectedOpt === index
                  ? "border-2"
                  : ""
                }`}
            >
              <p className="text-dblue md:text-lg text-base w-full text-center h-fit">
                {e.option}
              </p>
            </MotionDiv>
          );
        })}
      </div>
      {done && !isLast ? (
        <div className="flex justify-end">
          <MotionButton
            type="button"
            label="Avançar"
            className="w-fit bg-blue text-white"
            func={async () => {
              const nextId = getNextSectionId();
              if (nextId) router.push(`/learn/${trailId}/${nextId}`);
            }}
          />
        </div>
      ) : (
        <div className="flex justify-end">
          <MotionButton
            rightIcon={true}
            label={(isCorrect || done) ? (!isLast ? "Avançar" : "Concluir trilha") : "Verificar"}
            type="button"
            className={`text-neutral w-fit h-12 ${isCorrect || done ? "bg-blue" : "bg-transparent border-2"}`}
            func={HandleSubmit}
          />
        </div>
      )}
    </>
  );
};
