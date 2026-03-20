import type { Metadata } from "next";
import { Home } from "@/components/homePage/Home";

export const metadata: Metadata = {
  title: "Home | Web3EduBrasil",
  description: "Seu painel de aprendizagem Web3 — trilhas, programas, NFTs e leaderboard.",
};

export default function homePage() {
  return <Home />;
}
