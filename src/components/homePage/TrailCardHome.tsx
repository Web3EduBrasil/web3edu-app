import { MotionDiv } from "../ui/MotionDiv";
import { useRouter } from "next/navigation";
import { TrailCardHomeProps } from "@/interfaces/interfaces";

export const TrailCardHome = ({
  text,
  progress,
  Icon,
  trailId,
}: TrailCardHomeProps) => {
  const router = useRouter();

  return (
    <MotionDiv
      func={() => router.push(`/learn/${trailId}/1`)}
      className="w-full h-[30%] bg-cgray border-[1.5px] border-gray rounded-box flex justify-between items-center px-5 lg:px-10 cursor-pointer"
    >
      <div className="flex gap-4 items-center text-neutral h-1/4">
        {Icon ? <Icon className="h-full w-auto text-neutral" /> : <></>}
        <p className="text-base font-semibold">{text}</p>
      </div>

      <div
        className="radial-progress text-ddblue"
        style={
          {
            "--value": `${progress > 0 ? progress : 0}`,
            "--size": "4rem",
          } as any
        }
        role="progressbar"
      >
        {progress > 0 ? progress : 0}%
      </div>
    </MotionDiv>
  );
};
