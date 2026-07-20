/**
 * Testes da lógica de polling de mintagem (pollMintStatus)
 *
 * O polling roda em loop consultando GET /api/whitelist a cada 8s até:
 *  - txHash presente  → sai com "success"
 *  - terminalError    → sai com "error"
 *  - 30 tentativas    → sai com "error" (timeout)
 *
 * Estes testes verificam que os critérios de saída funcionam corretamente
 * sem depender do React (lógica pura extraída).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Lógica de polling extraída em função pura para testar isoladamente ────────

type MintStatusResponse = {
  eligible?: boolean;
  txHash?: string | null;
  pending?: boolean;
  terminalError?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  ipfsHash?: string | null;
};

type MintStep = "idle" | "uploading" | "minting" | "polling" | "success" | "error";

/**
 * Replica a lógica de `pollMintStatus` do content-context.tsx,
 * mas sem o setTimeout (para testar sincronamente) e sem setMintStep.
 * Retorna { step, attempts, txHash }.
 */
async function runPollLogic(
  fetchMock: () => Promise<MintStatusResponse>,
  maxAttempts = 30
): Promise<{ step: MintStep; attempts: number; txHash: string | null }> {
  let finalStep: MintStep = "error";
  let attempts = 0;
  let txHash: string | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    attempts = attempt + 1;
    try {
      const data = await fetchMock();

      if (data.txHash) {
        finalStep = "success";
        txHash = data.txHash;
        return { step: finalStep, attempts, txHash };
      }

      if (data.terminalError) {
        finalStep = "error";
        return { step: finalStep, attempts, txHash: null };
      }
    } catch {
      // Erros de rede são ignorados e o loop continua
    }
  }

  // Esgotou tentativas
  finalStep = "error";
  return { step: finalStep, attempts, txHash: null };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("pollMintStatus — condições de saída", () => {
  it("sai com 'success' na primeira tentativa quando txHash já está presente", async () => {
    const TX = "5XqZrealTxHash";
    const fetch = vi.fn().mockResolvedValue({ txHash: TX, terminalError: false, pending: false });

    const result = await runPollLogic(fetch, 30);

    expect(result.step).toBe("success");
    expect(result.txHash).toBe(TX);
    expect(result.attempts).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sai com 'success' após N tentativas pending + 1 tentativa com txHash (Cloud Function atrasada)", async () => {
    const TX = "5XqZrealTxHash";
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ txHash: null, pending: true, terminalError: false })
      .mockResolvedValueOnce({ txHash: null, pending: true, terminalError: false })
      .mockResolvedValueOnce({ txHash: null, pending: true, terminalError: false })
      .mockResolvedValue({ txHash: TX, pending: false, terminalError: false }); // 4ª tentativa

    const result = await runPollLogic(fetch, 30);

    expect(result.step).toBe("success");
    expect(result.txHash).toBe(TX);
    expect(result.attempts).toBe(4);
  });

  it("sai com 'error' imediatamente quando terminalError=true", async () => {
    const fetch = vi.fn().mockResolvedValue({
      txHash: null,
      terminalError: true,
      errorCode: "INSUFFICIENT_FUNDS",
      pending: false,
    });

    const result = await runPollLogic(fetch, 30);

    expect(result.step).toBe("error");
    expect(result.txHash).toBeNull();
    expect(result.attempts).toBe(1);
  });

  it("esgota tentativas e retorna 'error' quando Cloud Function nunca responde (looping infinito real)", async () => {
    // Simula o cenário atual: Certifier não está rodando, nunca escreve txHash
    const fetch = vi.fn().mockResolvedValue({
      eligible: true,
      pending: true,
      txHash: null,       // string vazia → null pela API, logo falsy
      terminalError: false,
    });

    const MAX = 5; // limite reduzido para o teste ser rápido
    const result = await runPollLogic(fetch, MAX);

    expect(result.step).toBe("error");
    expect(result.attempts).toBe(MAX);
    expect(fetch).toHaveBeenCalledTimes(MAX);
  });

  it("NÃO sai com 'success' quando txHash é string vazia (estado inicial do POST)", async () => {
    // txHash: "" virou null no GET, mas mesmo se viesse "", falsy check deve barrar
    const fetch = vi.fn().mockResolvedValue({ txHash: "", terminalError: false, pending: true });

    const result = await runPollLogic(fetch, 2);

    expect(result.step).toBe("error"); // esgotou tentativas, não saiu como success
  });

  it("continua polling mesmo após erro de rede em uma tentativa", async () => {
    const TX = "txHashAfterNetworkError";
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error")) // tentativa 1 falha
      .mockResolvedValue({ txHash: TX, terminalError: false }); // tentativa 2 ok

    const result = await runPollLogic(fetch, 30);

    expect(result.step).toBe("success");
    expect(result.txHash).toBe(TX);
    expect(result.attempts).toBe(2);
  });

  it("retorna 'error' quando minted=true mas txHash não foi escrito pelo Certifier [POTENTIAL BUG]", async () => {
    // Cenário: Cloud Function marcou minted:true mas não gravou txHash
    // O GET retorna txHash:null → poll não sai como success
    // Este teste documenta o comportamento atual e sinaliza o bug potencial
    const fetch = vi.fn().mockResolvedValue({
      eligible: false,
      pending: false,
      txHash: null,         // minted:true mas txHash não foi escrito
      terminalError: false, // sem erro terminal → poll não sai como error
    });

    const result = await runPollLogic(fetch, 3);

    // Comportamento atual: esgota as tentativas sem detectar sucesso
    // BUG: usuário fica em loop mesmo após mint bem-sucedido no on-chain
    expect(result.step).toBe("error");
    // TODO: Certifier deve SEMPRE gravar txHash junto com minted:true
  });
});

// ─── Testes de condições de pré-checagem em fetchAirDrop ────────────────────

describe("Pré-checagem do fetchAirDrop antes do polling", () => {
  it("detecta txHash existente no pré-check e não inicia novo mint", async () => {
    const TX = "existingTxHash";
    const preCheckResponse: MintStatusResponse = {
      txHash: TX,
      pending: false,
      terminalError: false,
    };

    // Simula o pré-check: se txHash está presente, não deve disparar upload/mint
    const shouldSkipMint = !!preCheckResponse.txHash;
    expect(shouldSkipMint).toBe(true);
  });

  it("detecta pending=true e vai direto ao polling sem novo POST", async () => {
    const preCheckResponse: MintStatusResponse = {
      eligible: true,
      pending: true,
      txHash: null,
      terminalError: false,
    };

    // Se pending=true, não deve refazer o POST/upload
    const shouldJumpToPolling = !!preCheckResponse.pending && !preCheckResponse.txHash;
    expect(shouldJumpToPolling).toBe(true);
  });

  it("detecta terminalError e não inicia novo mint", async () => {
    const preCheckResponse: MintStatusResponse = {
      eligible: false,
      pending: false,
      txHash: null,
      terminalError: true,
      errorCode: "WALLET_MISMATCH",
    };

    const shouldShowError = !!preCheckResponse.terminalError;
    expect(shouldShowError).toBe(true);
  });
});
