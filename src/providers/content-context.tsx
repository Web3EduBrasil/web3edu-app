"use client";

import React, { createContext, useState, useContext } from "react";
import { AchievedNft } from "@/interfaces/interfaces";
import {
  getFirestore,
  doc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";

export interface RewardData {
  type: "trail" | "program";
  id: string;
  name: string;
  icon: string;
}

interface ContentState {
  trailsList: any;
  programsList: any;
  trail: any;
  trailSections: any;
  achievedNfts: AchievedNft[];
  rewardContainerVisibility: boolean;
  rewardData: RewardData | null;
  fetchAchievedNfts: (walletAddress: string) => void;
  fetchTrailsList: (uid: string) => void;
  fetchProgramsList: () => void;
  fetchTrail: (trailIdRt: string) => any;
  fetchTrailSections: (trailIdRt: string, uid: string) => Promise<void>;
  fetchSectionContent: (trailId: string, sectionId: string, uid: string) => Promise<any>;
  fetchAiAnswerCheck: (question: string, prompt: string) => Promise<AiAnswerProps>;
  fetchTrailAirDrop: (
    trailIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    trailId: string,
    trailName: string
  ) => Promise<void>;
  fetchProgramAirDrop: (
    programIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    programId: string,
    programName: string
  ) => Promise<void>;
  handleRewardContainer: (data?: RewardData) => void;
}

interface AiAnswerProps {
  explicacao: string;
  valido: boolean;
}

const ContentContext = createContext<ContentState>({
  trail: {},
  trailsList: [],
  programsList: [],
  trailSections: [],
  achievedNfts: [],
  rewardContainerVisibility: false,
  rewardData: null,
  fetchTrailsList: () => { },
  fetchAchievedNfts: () => { },
  fetchProgramsList: () => { },
  fetchTrail: () => ({}),
  fetchTrailSections: async () => { },
  fetchTrailAirDrop: async () => { },
  fetchProgramAirDrop: async () => { },
  fetchAiAnswerCheck: () => Promise.resolve({ explicacao: "", valido: false }),
  fetchSectionContent: async () => ({}),
  handleRewardContainer: () => { },
});

export const ContentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [trailsList, setTrailsList] = useState<any>([]);
  const [programsList, setProgramsList] = useState<any>([]);
  const [trailSections, setTrailSections] = useState<any[]>([]);
  const [achievedNfts, setAchievedNfts] = useState<AchievedNft[]>([]);
  const [rewardContainerVisibility, setRewardContainerVisibility] =
    useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [trail, setTrail] = useState<any>({});

  const handleRewardContainer = (data?: RewardData) => {
    if (data) setRewardData(data);
    setRewardContainerVisibility((prev) => !prev);
  };

  const fetchAchievedNfts = async (walletAddress: string) => {
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x8984b78F102f85222E7fa9c43d37d84E087B1Be8";
    const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getNFTsForOwner?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&orderBy=transferTime&pageSize=100`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
      });
      const data = await res.json();

      const formattedNfts: AchievedNft[] = data.ownedNfts.map((nft: any) => {
        const name = extractNftName(nft.description);
        const contractAddr = nft.contract?.address;
        const tokenId = nft.tokenId;
        const openseaUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddr}/${tokenId}`;
        return {
          walletAddress,
          trailId: name,
          ipfs: nft.raw.metadata?.image || nft.image?.originalUrl || "",
          createdAt: new Date(nft.timeLastUpdated),
          openseaUrl,
        };
      });

      setAchievedNfts(formattedNfts);
    } catch (error) {
      console.error("Erro ao buscar NFTs conquistados:", error);
    }
  };

  /** Extrai o nome da trilha ou programa a partir da description do NFT. */
  function extractNftName(description: string): string {
    if (!description) return "desconhecido";
    const trailMatch = description.match(/trilha de aprendizagem\s(.+)$/i);
    if (trailMatch) return trailMatch[1].trim();
    const programMatch = description.match(/programa\s(.+)$/i);
    if (programMatch) return programMatch[1].trim();
    return "desconhecido";
  }

  const fetchTrailsList = async (uid: string) => {
    try {
      const response = await fetch(`/api/trails?uid=${uid}`, { method: "GET" });
      const data = await response.json();
      setTrailsList(data.trails);
    } catch (error: any) {
      console.error("Erro ao buscar trilhas:", error);
    }
  };

  const fetchProgramsList = async () => {
    try {
      const response = await fetch("/api/programs", { method: "GET" });
      const data = await response.json();
      setProgramsList(data.programs);
    } catch (error: any) {
      console.error("Erro ao buscar programas:", error);
    }
  };

  const fetchTrail = async (trailIdRt: string) => {
    try {
      const response = await fetch(`/api/trail?trailId=${trailIdRt}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Erro ao buscar trilha";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTrail(data);
    } catch (error: any) {
      console.error("Erro na requisição fetchTrail:", error);
      throw error;
    }
  };

  const fetchTrailSections = async (trailIdRt: string, uid: string) => {
    try {
      const response = await fetch(
        `/api/trail/contents?trailId=${trailIdRt}&uid=${uid}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || "Erro ao buscar secoes da trilha";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      data.sort(
        (a: { id: any }, b: { id: any }) => Number(a.id) - Number(b.id)
      );
      setTrailSections(data);
    } catch (error: any) {
      console.error("Erro na requisição fetchTrailSections:", error);
      throw error;
    }
  };

  const fetchSectionContent = async (
    trailId: string,
    sectionId: string,
    uid: string
  ) => {
    try {
      const response = await fetch(
        `/api/trail/contents/section?trailId=${trailId}&sectionId=${sectionId}&uid=${uid}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message || "Erro ao buscar conteudo da secao";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Erro na requisição fetchSectionContent:", error);
      throw error;
    }
  };

  const fetchAiAnswerCheck = async (
    question: string,
    prompt: string
  ): Promise<AiAnswerProps> => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, prompt }),
      });
      const data = await response.json();
      const bodyString = data.body;
      const jsonString = bodyString.replace(/`json|`/g, "").trim();
      try {
        const obj = JSON.parse(jsonString);
        return { explicacao: obj.explicacao, valido: obj.valido };
      } catch (parseError) {
        console.error("Erro ao fazer parse do JSON:", parseError);
        throw new Error("Formato de resposta inválido da API");
      }
    } catch (error: any) {
      console.error("Erro na verificação pela IA:", error);
      throw error;
    }
  };

  // ─── IPFS helper (server-side) ─────────────────────────────────────────────────

  const uploadToIpfs = async (content: object): Promise<string> => {
    const response = await fetch("/api/ipfs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Erro ao fazer upload para IPFS");
    }
    const { IpfsHash } = await response.json();
    if (!IpfsHash) throw new Error("IpfsHash não retornado pelo servidor");
    return IpfsHash;
  };

  // ─── Polling feedback mint blockchain ────────────────────────────────────────

  const pollMintStatus = async (
    uid: string,
    itemId: string,
    type: "trail" | "program"
  ) => {
    const endpoint =
      type === "trail"
        ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
        : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;
    const MAX_ATTEMPTS = 12;
    const INTERVAL_MS = 5000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.txHash) {
          toast.success(
            <span>
              NFT mintado com sucesso! 🎉{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${data.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline" }}
              >
                Ver na blockchain
              </a>
            </span>,
            { autoClose: 12000 }
          );
          return;
        }
      } catch {
        // retry silenciosamente
      }
    }
    toast.info(
      "O mint está sendo processado. Verifique sua carteira em alguns minutos.",
      { autoClose: 8000 }
    );
  };

  // ─── Airdrop Trilha ──────────────────────────────────────────────────────────

  const fetchTrailAirDrop = async (
    trailIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    trailId: string,
    trailName: string
  ) => {
    try {
      // 1. Verifica elegibilidade
      const eligibilityRes = await fetch(
        `/api/whitelist?uid=${uid}&trailId=${trailId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const { eligible } = await eligibilityRes.json();
      if (!eligible) {
        toast.error("Certificado já foi resgatado para esta trilha");
        return;
      }

      // 2. Upload do metadata para o IPFS (server-side, chave não exposta)
      toast.info("Gerando certificado...");
      const IpfsHash = await uploadToIpfs({
        image: trailIcon,
        description: `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso a trilha de aprendizagem ${trailName}, totalizando uma carga horária de 3 horas.`,
      });
      toast.success("Certificado enviado para o IPFS com sucesso");

      // 3. Registra na whitelist do Firestore (dispara Cloud Function de mint)
      const whitelistRes = await fetch("/api/whitelist", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, trailId, ipfsHash: IpfsHash }),
      });
      if (!whitelistRes.ok) {
        const errorData = await whitelistRes.json();
        toast.error(`Erro ao registrar na whitelist: ${errorData.message}`);
        return;
      }
      toast.success("Processando mint do NFT na blockchain...");

      // 4. Salva na subcoleção achievedNfts do usuário
      const firestore = getFirestore();
      const userRef = doc(firestore, "users", uid);
      await addDoc(collection(userRef, "achievedNfts"), {
        walletAddress,
        trailId,
        ipfs: trailIcon,
        type: "trail",
        createdAt: serverTimestamp(),
      });

      // 5. Polling — aguarda txHash vindo da Cloud Function
      pollMintStatus(uid, trailId, "trail");
    } catch (error: any) {
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchTrailAirDrop:", error);
    }
  };

  // ─── Airdrop Programa ────────────────────────────────────────────────────────

  const fetchProgramAirDrop = async (
    programIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    programId: string,
    programName: string
  ) => {
    try {
      // 1. Verifica elegibilidade
      const eligibilityRes = await fetch(
        `/api/programWhitelist?uid=${uid}&programId=${programId}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const { eligible } = await eligibilityRes.json();
      if (!eligible) {
        toast.error("Certificado já foi resgatado para este programa");
        return;
      }

      // 2. Upload do metadata para o IPFS (server-side)
      toast.info("Gerando certificado do programa...");
      const IpfsHash = await uploadToIpfs({
        image: programIcon,
        description: `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso o programa ${programName}.`,
      });
      toast.success("Certificado enviado para o IPFS com sucesso");

      // 3. Registra na programWhitelist (dispara Cloud Function de mint)
      const whitelistRes = await fetch("/api/programWhitelist", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, programId, ipfsHash: IpfsHash }),
      });
      if (!whitelistRes.ok) {
        const errorData = await whitelistRes.json();
        toast.error(`Erro ao registrar na whitelist: ${errorData.message}`);
        return;
      }
      toast.success("Processando mint do certificado NFT na blockchain...");

      // 4. Salva na subcoleção achievedNfts do usuário
      const firestore = getFirestore();
      const userRef = doc(firestore, "users", uid);
      await addDoc(collection(userRef, "achievedNfts"), {
        walletAddress,
        trailId: programId,
        ipfs: programIcon,
        type: "program",
        createdAt: serverTimestamp(),
      });

      // 5. Polling — aguarda txHash vindo da Cloud Function
      pollMintStatus(uid, programId, "program");
    } catch (error: any) {
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchProgramAirDrop:", error);
    }
  };

  return (
    <ContentContext.Provider
      value={{
        trail,
        fetchTrailsList,
        handleRewardContainer,
        rewardContainerVisibility,
        rewardData,
        trailsList,
        programsList,
        achievedNfts,
        fetchAchievedNfts,
        fetchProgramsList,
        fetchTrail,
        fetchTrailAirDrop,
        fetchProgramAirDrop,
        fetchTrailSections,
        fetchAiAnswerCheck,
        fetchSectionContent,
        trailSections,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);
