"use client";

import { Program } from "@/components/programPage/Program";
import { useParams } from "next/navigation";

export default function ProgramPage() {
  const { id } = useParams();

  return <Program programId={id as string} />;
}
