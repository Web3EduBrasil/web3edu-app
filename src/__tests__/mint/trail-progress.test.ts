/**
 * Testes de computeTrailProgress
 *
 * A lógica de progresso é o gate de pré-condição do POST /api/whitelist.
 * Se o cálculo retornar < 100%, o usuário recebe 403 e não chega ao mint.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetDocs = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collection: vi.fn().mockReturnValue({
      get: mockGetDocs,
    }),
  },
}));

vi.mock("fs");
vi.mock("path");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Cria um documento Firestore simulado. */
function makeDoc(id: string, type = "text") {
  return { id, data: () => ({ type }) };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.mocked(path.join).mockImplementation((...args) => args.join("/"));
});

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("computeTrailProgress", () => {
  it("retorna 100% quando todas as seções estão concluídas", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("1"), makeDoc("2"), makeDoc("3")],
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(["1.mdx", "2.mdx", "3.mdx"] as any);

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    const result = await computeTrailProgress("IntroducaoWeb3", ["1", "2", "3"]);

    expect(result.percentage).toBe(100);
    expect(result.completedSectionsCount).toBe(3);
    expect(result.totalSections).toBe(3);
  });

  it("retorna 0% quando nenhuma seção está concluída", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("1"), makeDoc("2"), makeDoc("3")],
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(["1.mdx", "2.mdx", "3.mdx"] as any);

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    const result = await computeTrailProgress("IntroducaoWeb3", []);

    expect(result.percentage).toBe(0);
    expect(result.completedSectionsCount).toBe(0);
  });

  it("retorna porcentagem correta para conclusão parcial", async () => {
    mockGetDocs.mockResolvedValue({
      docs: Array.from({ length: 10 }, (_, i) => makeDoc(String(i + 1))),
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(
      Array.from({ length: 10 }, (_, i) => `${i + 1}.mdx`) as any
    );

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    const result = await computeTrailProgress("IntroducaoWeb3", ["1", "2", "3", "4", "5"]);

    expect(result.percentage).toBe(50);
  });

  it("exclui seções do tipo 'text' sem arquivo .mdx correspondente da contagem", async () => {
    // Seção 3 é do tipo text mas não tem arquivo .mdx → não conta como válida
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("1", "text"), makeDoc("2", "quiz"), makeDoc("3", "text")],
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(["1.mdx"] as any); // só 1 tem .mdx

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    // Seções válidas: "1" (text + mdx) e "2" (quiz, não precisa de mdx) = 2 seções
    const result = await computeTrailProgress("IntroducaoWeb3", ["1", "2"]);

    expect(result.totalSections).toBe(2);
    expect(result.percentage).toBe(100);
  });

  it("retorna 0% quando não há seções definidas (trilha vazia)", async () => {
    mockGetDocs.mockResolvedValue({ docs: [] });
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    const result = await computeTrailProgress("TrilhaVazia", []);

    expect(result.percentage).toBe(0);
    expect(result.totalSections).toBe(0);
  });

  it("ignora IDs de seções concluídas que não estão na lista válida (anti-tamper)", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [makeDoc("1"), makeDoc("2")],
    });
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockReturnValue(["1.mdx", "2.mdx"] as any);

    const { computeTrailProgress } = await import("@/lib/trail-progress");
    // "99" e "hack" não estão nas seções válidas
    const result = await computeTrailProgress("IntroducaoWeb3", ["1", "99", "hack"]);

    expect(result.completedSectionsCount).toBe(1); // só "1" é válida
    expect(result.percentage).toBe(50);
  });
});
