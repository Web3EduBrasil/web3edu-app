/**
 * Testes da API /api/whitelist (GET e POST)
 *
 * Cobre os cenários críticos do fluxo de mintagem de certificados:
 *  - Leitura correta de cada estado possível do Firestore
 *  - Criação do estado pendente no POST
 *  - Verificações de pré-condição (progresso 100%, wallet válida)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAccountInfo = vi.fn();
const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockDocUpdate = vi.fn();

// Encadeia: collection(...).doc(...).get() / set() / update()
const mockDocRef = {
  get: mockDocGet,
  set: mockDocSet,
  update: mockDocUpdate,
};
const mockCollectionRef = {
  doc: vi.fn().mockReturnValue(mockDocRef),
};

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue(mockCollectionRef),
  },
  adminAuth: {
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "test-uid" }),
  },
}));

vi.mock("@/lib/auth-helper", () => ({
  verifyAuth: vi.fn().mockResolvedValue("test-uid"),
}));

vi.mock("@/lib/trail-progress", () => ({
  computeTrailProgress: vi.fn().mockResolvedValue({ percentage: 100 }),
}));

const mockMintTrailCertificate = vi.fn().mockResolvedValue("5XqZFAKETxHashForTests123456789");
const mockGetMintErrorCode = vi.fn().mockReturnValue({ errorCode: "MINT_FAILED", errorMessage: "erro" });

vi.mock("@/lib/solana-mint", () => ({
  mintTrailCertificate: mockMintTrailCertificate,
  getMintErrorCode: mockGetMintErrorCode,
}));

const mockFindProgramAddressSync = vi.fn().mockReturnValue([{ toBuffer: () => Buffer.alloc(32) }]);

vi.mock("@solana/web3.js", () => {
  // arrow functions não podem ser construtoras — usa function regular
  function MockConnection(this: Record<string, unknown>) {
    this.getAccountInfo = mockGetAccountInfo;
  }

  class MockPublicKey {
    _key: string;
    constructor(key: string) {
      // Replica a validação do PublicKey real: base58, 32–44 chars
      if (!key || key.length < 32 || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(key)) {
        throw new Error(`Invalid public key input`);
      }
      this._key = key;
    }
    // Vitest permite referência a variáveis prefixadas com "mock" nos factories hoisted
    static findProgramAddressSync = mockFindProgramAddressSync;
    toBuffer() { return Buffer.from(this._key ?? ""); }
  }

  return {
    Connection: MockConnection,
    PublicKey: MockPublicKey,
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/whitelist");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

function makePostRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/whitelist", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

// ─── Importação dinâmica após mocks ────────────────────────────────────────────
// (Os mocks devem ser definidos antes do import do módulo testado)

let GET: (req: NextRequest) => Promise<Response>;
let POST: (req: NextRequest, res: any) => Promise<Response>;

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  // Redefine padrões após reset
  mockGetAccountInfo.mockResolvedValue(null); // não mintado on-chain por padrão
  mockFindProgramAddressSync.mockReturnValue([{ toBuffer: () => Buffer.alloc(32), _key: "mock-pda" }]);
  mockMintTrailCertificate.mockResolvedValue("5XqZFAKETxHashForTests123456789");
  mockGetMintErrorCode.mockReturnValue({ errorCode: "MINT_FAILED", errorMessage: "erro" });

  const route = await import("@/app/api/whitelist/route");
  GET = route.GET;
  POST = route.POST;
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/whitelist — Leitura de status
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/whitelist", () => {
  it("retorna 400 quando uid ou trailId estão ausentes", async () => {
    const res = await GET(makeGetRequest({ uid: "abc" })); // sem trailId
    expect(res.status).toBe(400);
  });

  it("retorna eligible=true e pending=false quando doc não existe (primeira vez)", async () => {
    mockDocGet.mockResolvedValue({ exists: false, data: () => null });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.eligible).toBe(true);
    expect(body.pending).toBe(false);
    expect(body.txHash).toBeNull();
    expect(body.terminalError).toBe(false);
  });

  it("retorna eligible=true e pending=false quando trailId não tem entrada no doc", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ status: {} }), // sem entrada para este trailId
    });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.eligible).toBe(true);
    expect(body.pending).toBe(false);
    expect(body.txHash).toBeNull();
  });

  it("retorna pending=true quando estado é eligible mas sem txHash (aguardando Cloud Function)", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: {
          IntroducaoWeb3: {
            eligible: true,
            minted: false,
            txHash: "",       // estado criado pelo POST — aguarda Certifier
            terminalError: false,
            errorCode: null,
            errorMessage: null,
          },
        },
      }),
    });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pending).toBe(true);
    expect(body.txHash).toBeNull();   // string vazia vira null
    expect(body.terminalError).toBe(false);
  });

  it("retorna txHash e encerra polling quando Cloud Function escreve txHash", async () => {
    const TX = "5XqZabc123realTxHashFromSolana";
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: {
          IntroducaoWeb3: {
            eligible: true,
            minted: true,
            txHash: TX,
            terminalError: false,
            errorCode: null,
            errorMessage: null,
          },
        },
      }),
    });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.txHash).toBe(TX);   // polling deve sair ao detectar isto
    expect(body.pending).toBe(false);
    expect(body.eligible).toBe(false);
  });

  it("retorna terminalError=true quando Cloud Function falha e sinaliza erro", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: {
          IntroducaoWeb3: {
            eligible: true,
            minted: false,
            txHash: "",
            terminalError: true,
            errorCode: "INSUFFICIENT_FUNDS",
            errorMessage: "Saldo insuficiente na carteira do minter",
          },
        },
      }),
    });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.terminalError).toBe(true);
    expect(body.errorCode).toBe("INSUFFICIENT_FUNDS");
    expect(body.txHash).toBeNull();
  });

  it("detecta mint on-chain e retorna ALREADY_MINTED quando PDA existe na rede", async () => {
    // Simula conta on-chain existente (NFT já mintado na Solana)
    mockGetAccountInfo.mockResolvedValue({ data: Buffer.alloc(0), owner: {} });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.eligible).toBe(false);
    expect(body.pending).toBe(false);
    expect(body.errorCode).toBe("ALREADY_MINTED");
  });

  it("retorna txHash null mesmo quando txHash='' (string vazia não é txHash válido)", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        status: {
          IntroducaoWeb3: { eligible: true, minted: false, txHash: "", terminalError: false },
        },
      }),
    });

    const res = await GET(makeGetRequest({ uid: "user1", trailId: "IntroducaoWeb3" }));
    const body = await res.json();

    // String vazia não deve ser interpretada como txHash válido pelo cliente
    expect(body.txHash).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/whitelist — Registro na whitelist
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/whitelist", () => {
  const VALID_WALLET = "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy"; // pubkey Solana válida

  it("retorna 401 sem token de autenticação", async () => {
    const { verifyAuth } = await import("@/lib/auth-helper");
    vi.mocked(verifyAuth).mockRejectedValueOnce(new Error("Não autorizado"));

    const res = await POST(makePostRequest({ walletAddress: VALID_WALLET, trailId: "T1", ipfsHash: "Qm1" }), {});
    expect(res.status).toBe(401);
  });

  it("retorna 400 quando parâmetros obrigatórios estão ausentes", async () => {
    const res = await POST(makePostRequest({ walletAddress: VALID_WALLET }), {}); // sem trailId e ipfsHash
    expect(res.status).toBe(400);
  });

  it("retorna 400 para walletAddress inválida (não é pubkey Solana)", async () => {
    const res = await POST(
      makePostRequest({ walletAddress: "0xNaoEhSolana", trailId: "T1", ipfsHash: "Qm1" }),
      {}
    );
    expect(res.status).toBe(400);
  });

  it("retorna 403 quando usuário completou menos de 100% da trilha", async () => {
    const { computeTrailProgress } = await import("@/lib/trail-progress");
    vi.mocked(computeTrailProgress).mockResolvedValueOnce({
      percentage: 80,
      completedSectionsCount: 8,
      totalSections: 10,
      validSectionIds: [],
    });

    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ trails: [{ trailId: "IntroducaoWeb3", doneSections: ["1","2","3","4","5","6","7","8"] }] }),
    });

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmAbc" }),
      {}
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/100%/);
  });

  it("retorna 404 quando usuário não existe no Firestore", async () => {
    mockDocGet.mockResolvedValue({ exists: false, data: () => null });

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmAbc" }),
      {}
    );
    expect(res.status).toBe(404);
  });

  it("retorna 409 quando certificado já foi mintado on-chain", async () => {
    mockGetAccountInfo.mockResolvedValue({ data: Buffer.alloc(0), owner: {} });
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ trails: [{ trailId: "IntroducaoWeb3", doneSections: Array.from({length:13}, (_,i)=>String(i+1)) }] }),
    });

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmAbc" }),
      {}
    );
    expect(res.status).toBe(409);
  });

  it("cria o documento de whitelist, minta e retorna txHash (doc novo)", async () => {
    const FAKE_TX = "5XqZFAKETxHashForTests123456789";
    mockMintTrailCertificate.mockResolvedValueOnce(FAKE_TX);

    mockDocGet
      .mockResolvedValueOnce({ // users/{uid}
        exists: true,
        data: () => ({ trails: [{ trailId: "IntroducaoWeb3", doneSections: ["1"] }] }),
      })
      .mockResolvedValueOnce({ exists: false }); // whitelist/{uid} — não existe

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmMetadata" }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.txHash).toBe(FAKE_TX);

    // Verifica que o estado pendente foi criado antes do mint
    expect(mockDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        address: VALID_WALLET,
        status: expect.objectContaining({
          IntroducaoWeb3: expect.objectContaining({
            eligible: true,
            minted: false,
            txHash: "",
            terminalError: false,
            ipfsHash: "QmMetadata",
          }),
        }),
      })
    );

    // Verifica que o txHash foi salvo no Firestore após o mint
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ "status.IntroducaoWeb3.txHash": FAKE_TX })
    );
  });

  it("atualiza documento existente, minta e retorna txHash (upsert)", async () => {
    const FAKE_TX = "5XqZFAKETxHashForTests123456789";
    mockMintTrailCertificate.mockResolvedValueOnce(FAKE_TX);

    mockDocGet
      .mockResolvedValueOnce({ // users/{uid}
        exists: true,
        data: () => ({ trails: [{ trailId: "IntroducaoWeb3", doneSections: ["1"] }] }),
      })
      .mockResolvedValueOnce({ exists: true }); // whitelist/{uid} — já existe

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmMetadata" }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.txHash).toBe(FAKE_TX);
  });

  it("retorna 422 e grava terminalError quando o mint falha", async () => {
    mockMintTrailCertificate.mockRejectedValueOnce(new Error("MINTER_SECRET_KEY não configurado"));
    mockGetMintErrorCode.mockReturnValueOnce({
      errorCode: "MINTER_NOT_CONFIGURED",
      errorMessage: "Chave do minter não configurada no servidor (MINTER_SECRET_KEY)",
    });

    mockDocGet
      .mockResolvedValueOnce({
        exists: true,
        data: () => ({ trails: [{ trailId: "IntroducaoWeb3", doneSections: ["1"] }] }),
      })
      .mockResolvedValueOnce({ exists: true });

    const res = await POST(
      makePostRequest({ walletAddress: VALID_WALLET, trailId: "IntroducaoWeb3", ipfsHash: "QmMetadata" }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.errorCode).toBe("MINTER_NOT_CONFIGURED");

    // Verifica que o terminalError foi gravado no Firestore
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        "status.IntroducaoWeb3.terminalError": true,
        "status.IntroducaoWeb3.errorCode": "MINTER_NOT_CONFIGURED",
      })
    );
  });
});
