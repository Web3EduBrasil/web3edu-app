import type { Metadata } from "next";
import { Trails } from "@/components/TrailsPage/Trails";

export const metadata: Metadata = {
  title: "Trilhas de Aprendizagem | Web3EduBrasil",
  description:
    "Explore as trilhas de aprendizagem de Web3, Blockchain, NFTs e Criptomoedas da Web3EduBrasil.",
};

export default function trailsPage() {
  return (
    <>
      <Trails />
    </>
  );
}