/**
 * Seed: corrige títulos e tipos das seções da trilha IntroducaoWeb3 no Firestore.
 * 
 * Uso:
 *   $env:GOOGLE_APPLICATION_CREDENTIALS = "caminho/para/serviceAccount.json"
 *   node scripts/seed-introWeb3-sections.js
 * 
 * Ou com dotenv:
 *   node -r dotenv/config scripts/seed-introWeb3-sections.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!process.env.ADMIN_SERVICE_ACCOUNT) {
  console.error("❌ Variável ADMIN_SERVICE_ACCOUNT não encontrada no .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.ADMIN_SERVICE_ACCOUNT, "base64").toString("utf8")
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const TRAIL_ID = "IntroducaoWeb3";

const sections = [
  { id: "1",  title: "Introdução",                        type: "text" },
  { id: "2",  title: "As Gerações da Internet",            type: "text" },
  { id: "3",  title: "Web 2.0, a Internet Social",         type: "text" },
  { id: "4",  title: "Web3, a Internet Semântica",         type: "text" },
  { id: "5",  title: "O que é Blockchain?",                type: "text" },
  { id: "6",  title: "Como funciona uma Blockchain?",      type: "text" },
  { id: "7",  title: "Aplicações da Blockchain",           type: "text" },
  { id: "8",  title: "Segurança em Blockchain",            type: "text" },
  { id: "9",  title: "Golpes no mundo cripto",             type: "text" },
  { id: "10", title: "O que são NFTs?",                    type: "text" },
  { id: "11", title: "Como fazer um NFT?",                 type: "text" },
  { id: "12", title: "Vídeos sobre o universo NFT",        type: "text" },
  { id: "13", title: "Marketing e Comunidades",            type: "text" },
  // Quizzes — IDs decimais inseridos entre as aulas
  { id: "3.5",  title: "Quiz 1 — Fundamentos da Internet",  type: "quiz" },
  { id: "6.5",  title: "Quiz 2 — Web3 e Blockchain",        type: "question" },
  { id: "9.5",  title: "Quiz 3 — Aplicações e Segurança",   type: "quiz" },
  { id: "13.5", title: "Quiz 4 — NFTs e Comunidades",       type: "question" },
];

async function seed() {
  const batch = db.batch();
  for (const section of sections) {
    const ref = db.collection(`trails/${TRAIL_ID}/contents`).doc(section.id);
    batch.set(ref, { title: section.title, type: section.type }, { merge: true });
  }
  await batch.commit();
  console.log(`✅ ${sections.length} seções atualizadas em trails/${TRAIL_ID}/contents`);
}

seed().catch((err) => {
  console.error("Erro ao fazer seed:", err);
  process.exit(1);
});
