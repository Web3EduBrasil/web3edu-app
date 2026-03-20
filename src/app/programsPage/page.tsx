import type { Metadata } from "next";
import { Programs } from "@/components/programsPage/ProgramsPage";

export const metadata: Metadata = {
  title: "Programas | Web3EduBrasil",
  description:
    "Conheça os programas completos de formação em Web3, Blockchain e DeFi da Web3EduBrasil.",
};

export default function programsPage() {
  return <Programs />;
}
