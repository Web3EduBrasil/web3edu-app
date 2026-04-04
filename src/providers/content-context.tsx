"use client";

import React, { createContext, useState, useContext, useCallback, useMemo } from "react";
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
  fetchTrailsList: (uid: string) => Promise<void>;
  fetchProgramsList: () => void;
  fetchTrail: (trailIdRt: string) => any;
  fetchTrailSections: (trailIdRt: string, uid: string) => Promise<void>;
  fetchSectionContent: (trailId: string, sectionId: string, uid: string) => Promise<any>;
  fetchAiAnswerCheck: (question: string, prompt: string) => Promise<AiAnswerProps>;
  fetchAirDrop: (
    type: "trail" | "program",
    icon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    itemId: string,
    itemName: string
  ) => Promise<void>;
  handleRewardContainer: (data?: RewardData) => void;
  mintStep: "idle" | "uploading" | "minting" | "polling" | "success" | "error";
  mintTxHash: string | null;
  retryMintStatusCheck: (uid: string, itemId: string, type: "trail" | "program") => Promise<void>;
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
  fetchTrailsList: async () => { },
  fetchAchievedNfts: () => { },
  fetchProgramsList: () => { },
  fetchTrail: () => ({}),
  fetchTrailSections: async () => { },
  fetchAirDrop: async () => { },
  fetchAiAnswerCheck: () => Promise.resolve({ explicacao: "", valido: false }),
  fetchSectionContent: async () => ({}),
  handleRewardContainer: () => { },
  mintStep: "idle",
  mintTxHash: null,
  retryMintStatusCheck: async () => { },
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
  const [mintStep, setMintStep] = useState<"idle" | "uploading" | "minting" | "polling" | "success" | "error">("idle");
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  const handleRewardContainer = useCallback((data?: RewardData) => {
    if (data) {
      setRewardData(data);
      setMintStep("idle");
      setMintTxHash(null);
    }
    setRewardContainerVisibility((prev) => !prev);
  }, []);

  const fetchAchievedNfts = useCallback(async (walletAddress: string) => {
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x8984b78F102f85222E7fa9c43d37d84E087B1Be8";
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

    // Tenta buscar via Alchemy NFT API (dados on-chain, mais completo)
    if (alchemyKey) {
      try {
        const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&orderBy=transferTime&pageSize=100`;
        const res = await fetch(url, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const formattedNfts: AchievedNft[] = (data.ownedNfts || []).map((nft: any) => {
            const name = extractNftName(nft.description || nft.raw?.metadata?.description || "");
            const contractAddr = nft.contract?.address;
            const tokenId = nft.tokenId;
            const openseaUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddr}/${tokenId}`;
            return {
              walletAddress,
              trailId: name,
              ipfs: nft.raw?.metadata?.image || nft.image?.originalUrl || "",
              createdAt: new Date(nft.timeLastUpdated),
              openseaUrl,
            };
          });
          setAchievedNfts(formattedNfts);
          return;
        }
      } catch (error) {
        console.error("Alchemy NFT API falhou, tentando fallback:", error);
      }
    }

    // Fallback: busca dados de mint do Firestore via API
    try {
      const res = await fetch(`/api/user/nfts?walletAddress=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setAchievedNfts(data.nfts || []);
      }
    } catch (error) {
      console.error("Erro ao buscar NFTs conquistados:", error);
    }
  }, []);

  /** Extrai o nome da trilha ou programa a partir da description do NFT. */
  function extractNftName(description: string): string {
    if (!description) return "desconhecido";
    const trailMatch = description.match(/trilha de aprendizagem\s(.+)$/i);
    if (trailMatch) return trailMatch[1].trim();
    const programMatch = description.match(/programa\s(.+)$/i);
    if (programMatch) return programMatch[1].trim();
    return "desconhecido";
  }

  const fetchTrailsList = useCallback(async (uid: string) => {
    try {
      const response = await fetch(`/api/trails?uid=${uid}`, { method: "GET" });
      const data = await response.json();
      setTrailsList(data.trails);
    } catch (error: any) {
      console.error("Erro ao buscar trilhas:", error);
    }
  }, []);

  const fetchProgramsList = useCallback(async () => {
    try {
      const response = await fetch("/api/programs", { method: "GET" });
      const data = await response.json();
      setProgramsList(data.programs);
    } catch (error: any) {
      console.error("Erro ao buscar programas:", error);
    }
  }, []);

  const fetchTrail = useCallback(async (trailIdRt: string) => {
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
  }, []);

  const fetchTrailSections = useCallback(async (trailIdRt: string, uid: string) => {
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
  }, []);

  const fetchSectionContent = useCallback(async (
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
  }, []);

  const fetchAiAnswerCheck = useCallback(async (
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
  }, []);

  // ─── IPFS helper (server-side) ─────────────────────────────────────────────────

  const uploadToIpfs = useCallback(async (content: object): Promise<string> => {
    const response = await fetch("/api/ipfs", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Erro ao fazer upload para IPFS");
    }
    const { IpfsHash } = await response.json();
    if (!IpfsHash) throw new Error("IpfsHash não retornado pelo servidor");
    return IpfsHash;
  }, []);

  // ─── Polling feedback mint blockchain ────────────────────────────────────────

  const pollMintStatus = useCallback(async (
    uid: string,
    itemId: string,
    type: "trail" | "program"
  ) => {
    const endpoint =
      type === "trail"
        ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
        : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;
    const MAX_ATTEMPTS = 30;
    const INTERVAL_MS = 8000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.txHash) {
          setMintStep("success");
          setMintTxHash(data.txHash);
          return;
        }
      } catch (err) {
        console.error("Erro no polling de mint:", err);
      }
    }
    setMintStep("error");
    toast.info(
      "O mint está sendo processado. Verifique sua carteira em alguns minutos.",
      { autoClose: 8000 }
    );
  }, []);

  // ─── Retry/check único de status de mint ─────────────────────────────────

  const retryMintStatusCheck = useCallback(async (
    uid: string,
    itemId: string,
    type: "trail" | "program"
  ) => {
    const endpoint = type === "trail"
      ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
      : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.txHash) {
        setMintStep("success");
        setMintTxHash(data.txHash);
      } else {
        toast.info("Mint ainda em processamento. Aguarde mais alguns minutos e tente novamente.", { autoClose: 6000 });
      }
    } catch {
      toast.error("Erro ao verificar status do mint.");
    }
  }, []);

  // ─── Airdrop (Trilha e Programa unificados) ─────────────────────────────────

  const fetchAirDrop = useCallback(async (
    type: "trail" | "program",
    icon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    itemId: string,
    itemName: string
  ) => {
    const checkEndpoint = type === "trail"
      ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
      : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;
    const registerEndpoint = type === "trail" ? "/api/whitelist" : "/api/programWhitelist";
    const bodyKey = type === "trail" ? "trailId" : "programId";
    const description = type === "trail"
      ? `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso a trilha de aprendizagem ${itemName}, totalizando uma carga horária de 3 horas.`
      : `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso o programa ${itemName}.`;

    try {
      // 0. Pré-checagem: verifica se já foi mintado ou está pendente
      const preCheck = await fetch(checkEndpoint);
      const preData = await preCheck.json();
      if (preData.txHash) {
        setMintStep("success");
        setMintTxHash(preData.txHash);
        return;
      }
      if (preData.pending) {
        setMintStep("polling");
        pollMintStatus(uid, itemId, type);
        return;
      }
      if (!preData.eligible) {
        toast.error("Certificado já foi resgatado");
        return;
      }

      // 1. Upload do metadata para o IPFS
      setMintStep("uploading");
      const appLink = process.env.NEXT_PUBLIC_APP_LINK || "";
      const imageUrl = icon.startsWith("http") ? icon : `${appLink}${icon}`;
      const IpfsHash = await uploadToIpfs({ name: `Certificado — ${itemName}`, image: imageUrl, description });

      // 2. Registra na whitelist (dispara Cloud Function de mint)
      setMintStep("minting");
      const whitelistRes = await fetch(registerEndpoint, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, [bodyKey]: itemId, ipfsHash: IpfsHash }),
      });
      if (!whitelistRes.ok) {
        const errorData = await whitelistRes.json();
        setMintStep("error");
        toast.error(`Erro ao registrar na whitelist: ${errorData.message}`);
        return;
      }

      // 3. Salva referência local na subcoleção achievedNfts
      try {
        const firestore = getFirestore();
        const userRef = doc(firestore, "users", uid);
        await addDoc(collection(userRef, "achievedNfts"), {
          walletAddress, trailId: itemId, ipfs: icon, type, createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Erro ao registrar NFT em achievedNfts:", err);
      }

      // 4. Polling — aguarda txHash vindo da Cloud Function
      setMintStep("polling");
      pollMintStatus(uid, itemId, type);
    } catch (error: any) {
      setMintStep("error");
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchAirDrop:", error);
    }
  }, [uploadToIpfs, pollMintStatus]);

  const contextValue = useMemo(() => ({
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
    fetchAirDrop,
    fetchTrailSections,
    fetchAiAnswerCheck,
    fetchSectionContent,
    trailSections,
    mintStep,
    mintTxHash,
    retryMintStatusCheck,
  }), [
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
    fetchAirDrop,
    fetchTrailSections,
    fetchAiAnswerCheck,
    fetchSectionContent,
    trailSections,
    mintStep,
    mintTxHash,
    retryMintStatusCheck,
  ]);

  return (
    <ContentContext.Provider value={contextValue}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => useContext(ContentContext);
