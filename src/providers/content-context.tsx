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

type MintStep = "idle" | "uploading" | "minting" | "polling" | "success" | "error";

interface AiAnswerProps {
  explicacao: string;
  valido: boolean;
}

// ─── Trail Context ─────────────────────────────────────────────────────────────

interface TrailState {
  trailsList: any;
  programsList: any;
  trail: any;
  trailSections: any[];
  fetchTrailsList: (uid: string) => Promise<void>;
  fetchProgramsList: () => void;
  fetchTrail: (trailIdRt: string) => Promise<void>;
  fetchTrailSections: (trailIdRt: string, uid: string) => Promise<void>;
  fetchSectionContent: (trailId: string, sectionId: string, uid: string) => Promise<any>;
  fetchAiAnswerCheck: (question: string, prompt: string) => Promise<AiAnswerProps>;
}

const TrailContext = createContext<TrailState>({
  trailsList: [],
  programsList: [],
  trail: {},
  trailSections: [],
  fetchTrailsList: async () => { },
  fetchProgramsList: () => { },
  fetchTrail: async () => { },
  fetchTrailSections: async () => { },
  fetchSectionContent: async () => ({}),
  fetchAiAnswerCheck: () => Promise.resolve({ explicacao: "", valido: false }),
});

// ─── Nft Context ──────────────────────────────────────────────────────────────

interface NftState {
  achievedNfts: AchievedNft[];
  fetchAchievedNfts: (walletAddress: string) => void;
}

const NftContext = createContext<NftState>({
  achievedNfts: [],
  fetchAchievedNfts: () => { },
});

// ─── Reward Context ────────────────────────────────────────────────────────────

interface RewardState {
  rewardContainerVisibility: boolean;
  rewardData: RewardData | null;
  mintStep: MintStep;
  mintTxHash: string | null;
  handleRewardContainer: (data?: RewardData) => void;
  fetchAirDrop: (
    type: "trail" | "program",
    icon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    itemId: string,
    itemName: string
  ) => Promise<void>;
  retryMintStatusCheck: (uid: string, itemId: string, type: "trail" | "program") => Promise<void>;
}

const RewardContext = createContext<RewardState>({
  rewardContainerVisibility: false,
  rewardData: null,
  mintStep: "idle",
  mintTxHash: null,
  handleRewardContainer: () => { },
  fetchAirDrop: async () => { },
  retryMintStatusCheck: async () => { },
});

// ─── Trail Provider ────────────────────────────────────────────────────────────

const TrailProvider = ({ children }: { children: React.ReactNode }) => {
  const [trailsList, setTrailsList] = useState<any>([]);
  const [programsList, setProgramsList] = useState<any>([]);
  const [trailSections, setTrailSections] = useState<any[]>([]);
  const [trail, setTrail] = useState<any>({});

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
      const response = await fetch(`/api/trail?trailId=${trailIdRt}`, { method: "GET" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar trilha");
      }
      setTrail(await response.json());
    } catch (error: any) {
      console.error("Erro na requisição fetchTrail:", error);
      throw error;
    }
  }, []);

  const fetchTrailSections = useCallback(async (trailIdRt: string, uid: string) => {
    try {
      const response = await fetch(`/api/trail/contents?trailId=${trailIdRt}&uid=${uid}`, { method: "GET" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar secoes da trilha");
      }
      const data = await response.json();
      data.sort((a: { id: any }, b: { id: any }) => Number(a.id) - Number(b.id));
      setTrailSections(data);
    } catch (error: any) {
      console.error("Erro na requisição fetchTrailSections:", error);
      throw error;
    }
  }, []);

  const fetchSectionContent = useCallback(async (trailId: string, sectionId: string, uid: string) => {
    try {
      const response = await fetch(
        `/api/trail/contents/section?trailId=${trailId}&sectionId=${sectionId}&uid=${uid}`,
        { method: "GET" }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao buscar conteudo da secao");
      }
      return await response.json();
    } catch (error: any) {
      console.error("Erro na requisição fetchSectionContent:", error);
      throw error;
    }
  }, []);

  const fetchAiAnswerCheck = useCallback(async (question: string, prompt: string): Promise<AiAnswerProps> => {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, prompt }),
      });
      const data = await response.json();
      const jsonString = data.body.replace(/`json|`/g, "").trim();
      try {
        const obj = JSON.parse(jsonString);
        return { explicacao: obj.explicacao, valido: obj.valido };
      } catch {
        throw new Error("Formato de resposta inválido da API");
      }
    } catch (error: any) {
      console.error("Erro na verificação pela IA:", error);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    trailsList, programsList, trail, trailSections,
    fetchTrailsList, fetchProgramsList, fetchTrail, fetchTrailSections, fetchSectionContent, fetchAiAnswerCheck,
  }), [trailsList, programsList, trail, trailSections, fetchTrailsList, fetchProgramsList, fetchTrail, fetchTrailSections, fetchSectionContent, fetchAiAnswerCheck]);

  return <TrailContext.Provider value={value}>{children}</TrailContext.Provider>;
};

// ─── Nft Provider ──────────────────────────────────────────────────────────────

function extractNftName(description: string): string {
  if (!description) return "desconhecido";
  const trailMatch = description.match(/trilha de aprendizagem\s(.+)$/i);
  if (trailMatch) return trailMatch[1].trim();
  const programMatch = description.match(/programa\s(.+)$/i);
  if (programMatch) return programMatch[1].trim();
  return "desconhecido";
}

const NftProvider = ({ children }: { children: React.ReactNode }) => {
  const [achievedNfts, setAchievedNfts] = useState<AchievedNft[]>([]);

  const fetchAchievedNfts = useCallback(async (walletAddress: string) => {
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x8984b78F102f85222E7fa9c43d37d84E087B1Be8";
    const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

    if (alchemyKey) {
      try {
        const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${walletAddress}&contractAddresses[]=${contractAddress}&withMetadata=true&orderBy=transferTime&pageSize=100`;
        const res = await fetch(url, { headers: { accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          const formattedNfts: AchievedNft[] = (data.ownedNfts || []).map((nft: any) => {
            const name = extractNftName(nft.description || nft.raw?.metadata?.description || "");
            const openseaUrl = `https://testnets.opensea.io/assets/sepolia/${nft.contract?.address}/${nft.tokenId}`;
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

  const value = useMemo(() => ({ achievedNfts, fetchAchievedNfts }), [achievedNfts, fetchAchievedNfts]);

  return <NftContext.Provider value={value}>{children}</NftContext.Provider>;
};

// ─── Reward Provider ────────────────────────────────────────────────────────────

const RewardProvider = ({ children }: { children: React.ReactNode }) => {
  const [rewardContainerVisibility, setRewardContainerVisibility] = useState(false);
  const [rewardData, setRewardData] = useState<RewardData | null>(null);
  const [mintStep, setMintStep] = useState<MintStep>("idle");
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  const handleRewardContainer = useCallback((data?: RewardData) => {
    if (data) {
      setRewardData(data);
      setMintStep("idle");
      setMintTxHash(null);
    }
    setRewardContainerVisibility((prev) => !prev);
  }, []);

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

  const pollMintStatus = useCallback(async (uid: string, itemId: string, type: "trail" | "program") => {
    const endpoint =
      type === "trail"
        ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
        : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 8000));
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
    toast.info("O mint está sendo processado. Verifique sua carteira em alguns minutos.", { autoClose: 8000 });
  }, []);

  const retryMintStatusCheck = useCallback(async (uid: string, itemId: string, type: "trail" | "program") => {
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
      if (preData.txHash) { setMintStep("success"); setMintTxHash(preData.txHash); return; }
      if (preData.pending) { setMintStep("polling"); pollMintStatus(uid, itemId, type); return; }
      if (!preData.eligible) { toast.error("Certificado já foi resgatado"); return; }

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

  const value = useMemo(() => ({
    rewardContainerVisibility, rewardData, mintStep, mintTxHash,
    handleRewardContainer, fetchAirDrop, retryMintStatusCheck,
  }), [rewardContainerVisibility, rewardData, mintStep, mintTxHash, handleRewardContainer, fetchAirDrop, retryMintStatusCheck]);

  return <RewardContext.Provider value={value}>{children}</RewardContext.Provider>;
};

// ─── Combined Provider ─────────────────────────────────────────────────────────

export const ContentProvider = ({ children }: { children: React.ReactNode }) => (
  <TrailProvider>
    <NftProvider>
      <RewardProvider>{children}</RewardProvider>
    </NftProvider>
  </TrailProvider>
);

// ─── Hooks ─────────────────────────────────────────────────────────────────────

/** Dados de trilhas, programas e seções. Só re-renderiza quando esses mudam. */
export const useTrail = () => useContext(TrailContext);

/** Dados de NFTs conquistados. Só re-renderiza quando NFTs mudam. */
export const useNft = () => useContext(NftContext);

/** Estado do modal de recompensa e flow de mint. Só re-renderiza quando esses mudam. */
export const useReward = () => useContext(RewardContext);

/** @deprecated Prefira useTrail(), useNft() ou useReward() para melhor performance. */
export const useContent = () => ({
  ...useContext(TrailContext),
  ...useContext(NftContext),
  ...useContext(RewardContext),
});
