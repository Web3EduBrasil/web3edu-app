import { motion } from "framer-motion";
import { TaskUnitsProps } from "@/interfaces/interfaces";
import { useParams, useRouter } from "next/navigation";
import { MotionDiv } from "../ui/MotionDiv";
import { FaCircleCheck } from "react-icons/fa6";
import { useEffect } from "react";
import { useContent } from "@/providers/content-context";
import { toast } from "react-toastify";
import { FaLock } from "react-icons/fa";

export const TaskUnits = ({
  text,
  id,
  trailId,
  done,
  index,
}: TaskUnitsProps) => {
  const router = useRouter();
  const { sectionId } = useParams();
  const { trailSections } = useContent();

  return (
    <MotionDiv
      className={`w-full min-h-20 h-20 rounded-lg flex gap-4 outline-none items-center justify-between bg-ccgray rounded-box shadow-lg px-6 text-neutral font-bold cursor-pointer transition-[border] duration-1000 overflow-hidden ${
        done === true
          ? "border-green border "
          : sectionId === id
          ? "border-ddblue border-2"
          : ""
      } ${done === true && sectionId === id ? "border-green border-2" : ""}`}
      func={() => {
        if (index === 0) {
          router.push(`/learn/${trailId}/${id}`);
        } else if (trailSections[index - 1].done === true) {
          router.push(`/learn/${trailId}/${id}`);
        } else {
          toast.error("Complete a tarefa anterior");
        }
      }}
    >
      <p
        className={`line-clamp-3 w-full ${
          trailSections && trailSections[index - 1]?.done === false
            ? "text-neutral/50"
            : ""
        }`}
      >
        {text}
      </p>
      {trailSections && trailSections[index - 1]?.done === false ? (
        <FaLock className="h-auto min-w-6 text-ddblue" />
      ) : (
        done === true && <FaCircleCheck className="h-auto min-w-6 text-green" />
      )}
    </MotionDiv>
  );
};
