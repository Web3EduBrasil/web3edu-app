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
  fetchTrailAirDrop: async () => { },
  fetchProgramAirDrop: async () => { },
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

  // ─── Airdrop Trilha ──────────────────────────────────────────────────────────

  const fetchTrailAirDrop = useCallback(async (
    trailIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    trailId: string,
    trailName: string
  ) => {
    try {
      // 0. Pré-checagem: verifica se já foi mintado (ex: polling anterior expirou)
      const preCheck = await fetch(`/api/whitelist?uid=${uid}&trailId=${trailId}`);
      const preData = await preCheck.json();
      if (preData.txHash) {
        setMintStep("success");
        setMintTxHash(preData.txHash);
        return;
      }
      // pending = já registrado na whitelist mas CF ainda não mintou — retoma polling
      if (preData.pending) {
        setMintStep("polling");
        pollMintStatus(uid, trailId, "trail");
        return;
      }
      if (!preData.eligible) {
        toast.error("Certificado já foi resgatado para esta trilha");
        return;
      }

      // 1. Elegibilidade confirmada — inicia o processo

      // 2. Upload do metadata para o IPFS (server-side, chave não exposta)
      setMintStep("uploading");
      const appLink = process.env.NEXT_PUBLIC_APP_LINK || "";
      const imageUrl = trailIcon.startsWith("http") ? trailIcon : `${appLink}${trailIcon}`;
      const IpfsHash = await uploadToIpfs({
        name: `Certificado — ${trailName}`,
        image: imageUrl,
        description: `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso a trilha de aprendizagem ${trailName}, totalizando uma carga horária de 3 horas.`,
      });

      // 3. Registra na whitelist do Firestore (dispara Cloud Function de mint)
      setMintStep("minting");
      const whitelistRes = await fetch("/api/whitelist", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, trailId, ipfsHash: IpfsHash }),
      });
      if (!whitelistRes.ok) {
        const errorData = await whitelistRes.json();
        setMintStep("error");
        toast.error(`Erro ao registrar na whitelist: ${errorData.message}`);
        return;
      }

      // 4. Salva na subcoleção achievedNfts do usuário
      try {
        const firestore = getFirestore();
        const userRef = doc(firestore, "users", uid);
        await addDoc(collection(userRef, "achievedNfts"), {
          walletAddress,
          trailId,
          ipfs: trailIcon,
          type: "trail",
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Erro ao registrar NFT em achievedNfts:", error);
      }

      // 5. Polling — aguarda txHash vindo da Cloud Function
      setMintStep("polling");
      pollMintStatus(uid, trailId, "trail");
    } catch (error: any) {
      setMintStep("error");
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchTrailAirDrop:", error);
    }
  }, [uploadToIpfs, pollMintStatus]);

  // ─── Airdrop Programa ────────────────────────────────────────────────────────

  const fetchProgramAirDrop = useCallback(async (
    programIcon: string,
    uid: string,
    userName: string,
    walletAddress: string,
    programId: string,
    programName: string
  ) => {
    try {
      // 0. Pré-checagem: verifica se já foi mintado
      const preCheck = await fetch(`/api/programWhitelist?uid=${uid}&programId=${programId}`);
      const preData = await preCheck.json();
      if (preData.txHash) {
        setMintStep("success");
        setMintTxHash(preData.txHash);
        return;
      }
      // pending = já registrado mas CF ainda não mintou — retoma polling
      if (preData.pending) {
        setMintStep("polling");
        pollMintStatus(uid, programId, "program");
        return;
      }
      if (!preData.eligible) {
        toast.error("Certificado já foi resgatado para este programa");
        return;
      }

      // 1. Elegibilidade confirmada — inicia o processo

      // 2. Upload do metadata para o IPFS (server-side)
      setMintStep("uploading");
      const appLink = process.env.NEXT_PUBLIC_APP_LINK || "";
      const imageUrl = programIcon.startsWith("http") ? programIcon : `${appLink}${programIcon}`;
      const IpfsHash = await uploadToIpfs({
        name: `Certificado — ${programName}`,
        image: imageUrl,
        description: `Este certificado é concedido a ${userName} em reconhecimento por completar com sucesso o programa ${programName}.`,
      });

      // 3. Registra na programWhitelist (dispara Cloud Function de mint)
      const whitelistRes = await fetch("/api/programWhitelist", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, programId, ipfsHash: IpfsHash }),
      });
      if (!whitelistRes.ok) {
        const errorData = await whitelistRes.json();
        setMintStep("error");
        toast.error(`Erro ao registrar na whitelist: ${errorData.message}`);
        return;
      }
      setMintStep("minting");

      // 4. Salva na subcoleção achievedNfts do usuário
      try {
        const firestore = getFirestore();
        const userRef = doc(firestore, "users", uid);
        await addDoc(collection(userRef, "achievedNfts"), {
          walletAddress,
          trailId: programId,
          ipfs: programIcon,
          type: "program",
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        console.error("Erro ao registrar NFT em achievedNfts:", error);
      }

      // 5. Polling — aguarda txHash vindo da Cloud Function
      setMintStep("polling");
      pollMintStatus(uid, programId, "program");
    } catch (error: any) {
      setMintStep("error");
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchProgramAirDrop:", error);
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
    fetchTrailAirDrop,
    fetchProgramAirDrop,
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
    fetchTrailAirDrop,
    fetchProgramAirDrop,
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
