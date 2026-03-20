"use client";

import { useState } from "react";
import { MotionButton } from "../ui/Button";
import { MotionDiv } from "../ui/MotionDiv";
import { Bounce, toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useContent } from "@/providers/content-context";

interface QuizSectionProps {
  options: Array<any>;
  question: string;
  fetchDone: (param: Boolean) => Promise<void>;
  done: boolean;
  isLast: Boolean;
  trailId: string;
  id: string;
}

export const RenderQuizV = ({
  options,
  question,
  fetchDone,
  done,
  trailId,
  isLast,
  id,
}: QuizSectionProps) => {
  const [selectedOpt, setSelectedOpt] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const { trailSections } = useContent();
  const router = useRouter();

  const getNextSectionId = (): string | null => {
    const sorted = [...trailSections].sort((a, b) => Number(a.id) - Number(b.id));
    const currentIndex = sorted.findIndex((s) => String(s.id) === String(id));
    if (currentIndex === -1 || currentIndex >= sorted.length - 1) return null;
    return String(sorted[currentIndex + 1].id);
  };

  function HandleSubmit() {
    if (isCorrect) {
      toast.promise(fetchDone(isLast), {
        pending: "Enviando...",
        success: "Tarefa concluida com sucesso!",
        error: "Erro ao concluir tarefa.",
      });
    } else {
      if (options[selectedOpt].correct === true) {
        setIsCorrect(true);
        toast.success("Resposta correta!", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      } else {
        toast.error("Resposta Incorreta!", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          transition: Bounce,
        });
      }
    }
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
          rightIcon={true}
          label={isCorrect === true ? "Marcar como concluído" : "Verificar"}
          type="button"
          className={`text-neutral w-fit h-12 self-end ${isCorrect ? "bg-green" : "bg-transparent border-2"
            }`}
          func={() => {
            HandleSubmit();
          }}
        />
      )}
    </>
  );
};
