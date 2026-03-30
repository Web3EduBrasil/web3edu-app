"use client";
import { Trail } from "@/interfaces/interfaces";
import { TrailTopics } from "./TrailTopics";
import { SafeIframe } from "../ui/SafeIframe";

export const TrailContainer = ({ trail }: { trail: Trail }) => {
  return (
    <div className="md:w-3/5 w-full md:h-full flex flex-col justify-start items-start text-neutral bg-cgray md:rounded-box p-10 md:gap-3 gap-6 md:overflow-y-auto">
      <div className="flex flex-col w-full h-full justify-center items-center">
        <SafeIframe
          src={trail?.introVideo}
          allowFullScreen
          className="aspect-video w-full h-auto rounded-box"
        />
      </div>
      <p className="font-extrabold text-2xl">{trail?.name}</p>
      <p className="fonte-medium text-justify">{trail?.description}</p>
      <TrailTopics topics={trail.topics} />
    </div>
  );
};
