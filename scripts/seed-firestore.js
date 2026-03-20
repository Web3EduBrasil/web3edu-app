/* eslint-disable */
// @ts-nocheck
/**
 * Script de seed do Firestore para a trilha IntroducaoWeb3.
 *
 * Pré-requisitos:
 *   1. `firebase-admin` instalado (já está em package.json).
 *   2. Variável de ambiente FIREBASE_ADMIN_SERVICE_ACCOUNT com o JSON da
 *      service account (ou APPLICATION_DEFAULT_CREDENTIALS configurado via gcloud).
 *
 * Como rodar:
 *   # Opção 1 — variável de ambiente com JSON da service account:
 *   $env:FIREBASE_ADMIN_SERVICE_ACCOUNT = Get-Content serviceAccount.json -Raw
 *   node scripts/seed-firestore.js
 *
 *   # Opção 2 — lendo .env.local automaticamente:
 *   node scripts/seed-firestore.js
 *   (o script tenta carregar .env.local automaticamente)
 *
 *   # Opção 3 — Application Default Credentials (gcloud auth login):
 *   node scripts/seed-firestore.js
 */

const fs = require("fs");
const path = require("path");

// ── Carregar .env.local manualmente (sem dependência dotenv) ──────────────────
const envFile = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
  console.log("✅ .env.local carregado.");
} else {
  console.log("⚠️  .env.local não encontrado — usando variáveis do sistema.");
}

// ── Inicializar Firebase Admin ────────────────────────────────────────────────
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const saEnv = process.env.ADMIN_SERVICE_ACCOUNT;
  if (saEnv) {
    try {
      const json = saEnv.startsWith("{")
        ? saEnv
        : Buffer.from(saEnv, "base64").toString("utf-8");
      const serviceAccount = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ Firebase Admin inicializado com service account.");
    } catch (e) {
      console.error("❌ Falha ao parsear ADMIN_SERVICE_ACCOUNT:", e.message);
      process.exit(1);
    }
  } else {
    admin.initializeApp();
    console.log("⚠️  Firebase Admin inicializado via Application Default Credentials.");
  }
}

const db = admin.firestore();

// ── Dados da trilha ───────────────────────────────────────────────────────────
const TRAIL_ID = "IntroducaoWeb3";

const TRAIL_META = {
  name: "Introdução à Web3",
  resumedDescription: "Fundamentos de Web3, Blockchain e NFTs para iniciantes",
  description:
    "Aprenda os fundamentos da Web3, blockchain, NFTs e criptomoedas de forma prática e acessível.",
  estimatedTime: 3,
  banner:
    "https://firebasestorage.googleapis.com/v0/b/web3edubrasil.firebasestorage.app/o/imagens%2Fintrodu%C3%A7%C3%A3o%20%C3%A0%20Web3.png?alt=media&token=420a423a-fe0d-472a-bd1c-2b9f17fadb31",
  categories: ["blockchain", "web3", "nft", "iniciante"],
  topics: ["Web3", "Blockchain", "Criptomoedas", "NFTs", "Segurança"],
  introVideo: "",
  createdAt: "2025-01-01",
};

const SECTIONS = [
  { id: "1", title: "Introdução", type: "text", order: 1 },
  { id: "2", title: "As Gerações da Internet", type: "text", order: 2 },
  { id: "3", title: "Web 2.0, a internet social", type: "text", order: 3 },
  { id: "4", title: "Web3, a internet semântica", type: "text", order: 4 },
  { id: "5", title: "O que é Blockchain?", type: "text", order: 5 },
  { id: "6", title: "Como funciona uma Blockchain?", type: "text", order: 6 },
  { id: "7", title: "Aplicações da Blockchain", type: "text", order: 7 },
  { id: "8", title: "Carteiras de Criptomoedas", type: "text", order: 8 },
  { id: "9", title: "Golpes com Criptomoedas", type: "text", order: 9 },
  { id: "10", title: "O que são NFTs?", type: "text", order: 10 },
  { id: "11", title: "Setup Básico", type: "text", order: 11 },
  { id: "12", title: "Vídeos Interessantes", type: "text", order: 12 },
  { id: "13", title: "Crie uma Identidade Sólida", type: "text", order: 13 },
];

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  const force = process.argv.includes("--force");
  console.log(`\n🚀 Iniciando seed${force ? " (force)" : " (merge)"}...\n`);

  // Trilha
  const trailRef = db.collection("trails").doc(TRAIL_ID);
  await trailRef.set(TRAIL_META, { merge: !force });
  console.log(`✅ Trilha "${TRAIL_META.name}" criada/atualizada.`);

  // Seções
  for (const section of SECTIONS) {
    const { id, ...data } = section;
    const ref = db.collection(`trails/${TRAIL_ID}/contents`).doc(id);
    await ref.set({ ...data, trailName: TRAIL_META.name }, { merge: !force });
    console.log(`  ✓ Seção ${id}: ${data.title}`);
  }

  console.log(`\n✅ Seed concluído! ${SECTIONS.length} seções criadas em "trails/${TRAIL_ID}/contents".\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
