"use client";

import { useContent } from "@/providers/content-context";
import { TaskUnits } from "../Task/TaskUnits";
import { useEffect } from "react";
import { useParams } from "next/navigation";

export const TaskList = ({ uid }: { uid: string }) => {
  const { fetchTrailSections, trailSections } = useContent();
  const { trailIdRt }: any = useParams();

  useEffect(() => {
    if (!trailIdRt || !uid) return;
    fetchTrailSections(trailIdRt, uid);
  }, [trailIdRt, uid, fetchTrailSections]);

  return (
    <div className="md:w-3/12 md:min-w-80 w-full h-full bg-cgray md:rounded-box p-8 md:overflow-y-auto gap-2 flex flex-col justify-start items-start">
      {Object.keys(trailSections).length !== 0 ? (
        trailSections.map((section: any, index: any) => (
          <TaskUnits
            text={section.title}
            id={section.id}
            done={section.done}
            key={index}
            trailId={trailIdRt}
            index={index}
          />
        ))
      ) : (
        <>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-32 w-full"></div>
        </>
      )}
    </div>
  );
};
