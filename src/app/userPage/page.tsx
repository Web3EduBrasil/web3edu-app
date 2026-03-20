import type { Metadata } from "next";
import { UserSection } from "@/components/UserPage/userCard";

export const metadata: Metadata = {
  title: "Meu Perfil | Web3EduBrasil",
  description: "Gerencie seu perfil, veja seus certificados NFT e acompanhe seu progresso na Web3EduBrasil.",
};

export default function userPage() {
  return <UserSection />;
}
