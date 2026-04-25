"use client";

import { Learn } from "@/components/learn/Learn";
import { useParams } from "next/navigation";

export default function TrailPage() {
  const { trailIdRt, sectionId } = useParams();

  return <Learn trailIdRt={trailIdRt as string} sectionId={sectionId as string} />;
}
