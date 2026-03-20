"use client";
import { useState } from "react";
import { Trail } from "@/interfaces/interfaces";
import { TrailTopics } from "./TrailTopics";

export const TrailContainer = ({ trail }: { trail: Trail }) => {
  const [videoLink, setVideoLink] = useState(
    "https://www.youtube.com/embed/MmB9b5njVbA"
  );

  return (
    <div className="md:w-3/5 w-full md:h-full flex flex-col justify-start items-start text-neutral bg-cgray md:rounded-box p-10 md:gap-3 gap-6 md:overflow-y-auto">
      <div className="flex flex-col w-full h-full justify-center items-center">
        <iframe
          src={trail?.introVideo}
          frameBorder="0"
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
