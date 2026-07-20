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

interface MintStatusResponse {
  eligible?: boolean;
  txHash?: string | null;
  pending?: boolean;
  terminalError?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  ipfsHash?: string | null;
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
  fetchAchievedNfts: (uid: string) => void;
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
  mintIpfsHash: string | null;
  mintCheckLoading: boolean;
  handleRewardContainer: (data?: RewardData) => void;
  startMintCheck: (uid: string, itemId: string, type: "trail" | "program") => Promise<void>;
  fetchAirDrop: (
    type: "trail" | "program",
    icon: string,
    uid: string,
    certificateName: string,
    walletAddress: string,
    itemId: string,
    itemName: string
  ) => Promise<void>;
  retryMintStatusCheck: (uid: string, itemId: string, type: "trail" | "program") => Promise<void>;
  closeRewardContainer: () => void;
}

const RewardContext = createContext<RewardState>({
  rewardContainerVisibility: false,
  rewardData: null,
  mintStep: "idle",
  mintTxHash: null,
  mintIpfsHash: null,
  mintCheckLoading: false,
  handleRewardContainer: () => { },
  startMintCheck: async () => { },
  fetchAirDrop: async () => { },
  retryMintStatusCheck: async () => { },
  closeRewardContainer: () => { },
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
      setTrailsList(data.trails ?? []);
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

const NftProvider = ({ children }: { children: React.ReactNode }) => {
  const [achievedNfts, setAchievedNfts] = useState<AchievedNft[]>([]);

  const fetchAchievedNfts = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      const res = await fetch(`/api/user/nfts?uid=${encodeURIComponent(uid)}`);
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
  const [mintIpfsHash, setMintIpfsHash] = useState<string | null>(null);
  const [mintCheckLoading, setMintCheckLoading] = useState(false);

  const normalizeIpfsHash = useCallback((hash?: string | null) => {
    if (!hash) return null;
    return hash.startsWith("ipfs://") ? hash.replace("ipfs://", "") : hash;
  }, []);

  const handleRewardContainer = useCallback((data?: RewardData) => {
    if (data) {
      setRewardData(data);
      setMintStep("idle");
      setMintTxHash(null);
      setMintIpfsHash(null);
      setMintCheckLoading(false);
      setRewardContainerVisibility(true);
    } else {
      setRewardContainerVisibility((prev) => !prev);
    }
  }, []);

  // Fecha o modal sem resetar o estado do mint (permite fechar durante o polling)
  const closeRewardContainer = useCallback(() => {
    setRewardContainerVisibility(false);
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

  const buildTerminalErrorToastMessage = useCallback((status: MintStatusResponse) => {
    const code = typeof status.errorCode === "string" && status.errorCode.length > 0
      ? status.errorCode
      : null;
    const message = typeof status.errorMessage === "string" && status.errorMessage.length > 0
      ? status.errorMessage
      : "Não foi possível concluir o mint do certificado.";

    return code ? `[${code}] ${message}` : message;
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

    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 8000));
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout por tentativa
        const res = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = (await res.json()) as MintStatusResponse;
        if (data.txHash) {
          setMintStep("success");
          setMintTxHash(data.txHash);
          if (data.ipfsHash) setMintIpfsHash(normalizeIpfsHash(data.ipfsHash));
          toast.success("🎉 Seu certificado NFT foi mintado com sucesso!", { autoClose: 8000 });
          return;
        }

        if (data.terminalError) {
          setMintStep("error");
          setMintTxHash(null);
          toast.error(buildTerminalErrorToastMessage(data), { autoClose: 8000 });
          return;
        }

        if (data.eligible === false) {
          setMintStep("success");
          if (data.ipfsHash) setMintIpfsHash(normalizeIpfsHash(data.ipfsHash));
          toast.success("🎉 Seu certificado NFT foi mintado com sucesso!", { autoClose: 8000 });
          return;
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Erro no polling de mint:", err);
        }
      }
    }
    setMintStep("error");
    toast.info(
      "O processamento está demorando mais que o esperado. Verifique sua carteira em alguns minutos.",
      { autoClose: 8000 }
    );
  }, [buildTerminalErrorToastMessage]);

  // Verifica o status do mint e atualiza o estado do modal.
  // Usado tanto no pre-check inicial (loading=true bloqueia os botões)
  // quanto no retry manual (loading=false para não travar o botão de retry).
  const startMintCheck = useCallback(async (
    uid: string,
    itemId: string,
    type: "trail" | "program",
    showLoading = true
  ) => {
    const endpoint = type === "trail"
      ? `/api/whitelist?uid=${uid}&trailId=${itemId}`
      : `/api/programWhitelist?uid=${uid}&programId=${itemId}`;

    if (showLoading) setMintCheckLoading(true);
    try {
      const res = await fetch(endpoint);
      const data = (await res.json()) as MintStatusResponse;

      if (data.txHash) {
        setMintStep("success");
        setMintTxHash(data.txHash);
        if (data.ipfsHash) setMintIpfsHash(normalizeIpfsHash(data.ipfsHash));
        if (!showLoading) toast.success("🎉 Seu certificado NFT foi mintado com sucesso!", { autoClose: 8000 });
      } else if (data.terminalError) {
        setMintStep("error");
        setMintTxHash(null);
        toast.error(buildTerminalErrorToastMessage(data), { autoClose: 8000 });
      } else if (data.eligible === false) {
        setMintStep("success");
        if (data.ipfsHash) setMintIpfsHash(normalizeIpfsHash(data.ipfsHash));
        if (!showLoading) toast.success("🎉 Seu certificado NFT já foi mintado!", { autoClose: 8000 });
      } else if (data.pending) {
        setMintStep("polling");
        pollMintStatus(uid, itemId, type);
      } else if (!showLoading) {
        toast.info("Mint ainda em processamento. Aguarde mais alguns minutos e tente novamente.", { autoClose: 6000 });
      }
    } catch {
      if (!showLoading) toast.error("Erro ao verificar status do mint.");
    } finally {
      if (showLoading) setMintCheckLoading(false);
    }
  }, [buildTerminalErrorToastMessage, normalizeIpfsHash, pollMintStatus]);

  const retryMintStatusCheck = useCallback(async (uid: string, itemId: string, type: "trail" | "program") => {
    await startMintCheck(uid, itemId, type, false);
  }, [startMintCheck]);

  const fetchAirDrop = useCallback(async (
    type: "trail" | "program",
    icon: string,
    uid: string,
    certificateName: string,
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
      ? `Certificado concedido por completar a trilha de aprendizagem ${itemName}.`
      : `Certificado concedido por completar o programa ${itemName}.`;

    try {
      // 0. Pré-checagem: bloqueia apenas se já foi mintado com sucesso (txHash salvo) ou está pendente
      const preCheck = await fetch(checkEndpoint);
      const preData = (await preCheck.json()) as MintStatusResponse;
      if (preData.txHash) {
        setMintStep("success");
        setMintTxHash(preData.txHash);
        if (preData.ipfsHash) setMintIpfsHash(normalizeIpfsHash(preData.ipfsHash));
        toast.success("🎉 Seu certificado NFT foi mintado com sucesso!", { autoClose: 8000 });
        return;
      }
      if (preData.pending) {
        setMintStep("polling");
        pollMintStatus(uid, itemId, type);
        return;
      }
      // terminalError e eligible===false sem txHash: permite re-tentativa
      // O POST sempre reseta o estado pendente antes de mintar

      // 1. Gera imagem do certificado com nome do usuário e faz upload para IPFS
      setMintStep("uploading");
      const appLink = process.env.NEXT_PUBLIC_APP_LINK || "";
      const rawImageUrl = icon.startsWith("http") ? icon : `${appLink}${icon}`;

      let nftImageUri = rawImageUrl;
      try {
        const certImgRes = await fetch("/api/certificate/image", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ recipientName: certificateName, trailName: itemName }),
        });
        if (certImgRes.ok) {
          const certImgData = await certImgRes.json();
          if (certImgData.ipfsUrl) nftImageUri = certImgData.ipfsUrl;
        }
      } catch {
        // fallback: tenta upload do banner original
        try {
          const imgUploadRes = await fetch("/api/ipfs/image", {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ imageUrl: rawImageUrl }),
          });
          if (imgUploadRes.ok) {
            const imgData = await imgUploadRes.json();
            if (imgData.ipfsUrl) nftImageUri = imgData.ipfsUrl;
          }
        } catch { /* usa URL original como último recurso */ }
      }

      const IpfsHash = await uploadToIpfs({
        name: `Certificado — ${itemName}`,
        image: nftImageUri,
        description,
        recipient: certificateName,
      });
      setMintIpfsHash(IpfsHash);

      // 2. Registra na whitelist e executa o mint na Solana (via API server-side)
      setMintStep("minting");
      const whitelistRes = await fetch(registerEndpoint, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ walletAddress, [bodyKey]: itemId, ipfsHash: IpfsHash }),
      });
      const whitelistData = await whitelistRes.json();
      if (!whitelistRes.ok) {
        setMintStep("error");
        toast.error(`Erro ao mintar certificado: ${whitelistData.message}`);
        return;
      }

      // 3. Salva referência local na subcoleção achievedNfts
      try {
        const firestore = getFirestore();
        const userRef = doc(firestore, "users", uid);
        await addDoc(collection(userRef, "achievedNfts"), {
          walletAddress,
          trailId: itemId,
          type,
          ipfsHash: IpfsHash,
          imageUrl: nftImageUri,
          certificateName,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Erro ao registrar NFT em achievedNfts:", err);
      }

      // 4a. O mint foi executado sincronamente — txHash já está disponível
      if (whitelistData.txHash) {
        setMintStep("success");
        setMintTxHash(whitelistData.txHash);
        toast.success("🎉 Seu certificado NFT foi mintado com sucesso!", { autoClose: 8000 });
        return;
      }

      // 4b. Fallback: aguarda txHash via polling (caso o mint demore mais que o timeout da API)
      setMintStep("polling");
      pollMintStatus(uid, itemId, type);
    } catch (error: any) {
      setMintStep("error");
      toast.error(`Erro ao resgatar certificado: ${error.message}`);
      console.error("Erro em fetchAirDrop:", error);
    }
  }, [uploadToIpfs, pollMintStatus, buildTerminalErrorToastMessage, normalizeIpfsHash]);

  const value = useMemo(() => ({
    rewardContainerVisibility, rewardData, mintStep, mintTxHash, mintIpfsHash, mintCheckLoading,
    handleRewardContainer, startMintCheck, fetchAirDrop, retryMintStatusCheck, closeRewardContainer,
  }), [rewardContainerVisibility, rewardData, mintStep, mintTxHash, mintIpfsHash, mintCheckLoading, handleRewardContainer, startMintCheck, fetchAirDrop, retryMintStatusCheck, closeRewardContainer]);

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
