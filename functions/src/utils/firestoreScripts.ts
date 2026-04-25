// src/utils/firestoreHelper.ts

import * as admin from "firebase-admin";

// Inicialize o Firestore caso ainda não esteja inicializado
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export type TerminalErrorCode =
  | "ACCESS_CONTROL"
  | "INVALID_ADDRESS"
  | "RPC_ERROR"
  | "UNKNOWN";

/**
 * Atualiza o status do airdrop no Firestore para o usuário especificado.
 *
 * @param uid - ID do usuário.
 * @param category - Categoria do airdrop (e.g., "SmartContracts", "introWeb3").
 * @param status - Status do minting, "true" ou "false".
 * @param txHash - Hash da transação.
 */
export async function updateAirdropStatus(
  uid: string,
  category: string,
  status: boolean,
  txHash: string | ""
): Promise<void> {
  const userRef = db.collection("whitelist").doc(uid);
  await userRef.update({
    [`status.${category}.minted`]: status,
    [`status.${category}.txHash`]: txHash,
    [`status.${category}.terminalError`]: false,
    [`status.${category}.errorCode`]: null,
    [`status.${category}.errorMessage`]: null,
    [`status.${category}.errorAt`]: null,
  });
}

/**
 * Atualiza o status do NFT de programa no Firestore.
 *
 * @param uid - ID do usuário.
 * @param programId - ID do programa.
 * @param status - Status do minting.
 * @param txHash - Hash da transação.
 */
export async function updateProgramAirdropStatus(
  uid: string,
  programId: string,
  status: boolean,
  txHash: string | ""
): Promise<void> {
  const userRef = db.collection("programWhitelist").doc(uid);
  await userRef.update({
    [`status.${programId}.minted`]: status,
    [`status.${programId}.txHash`]: txHash,
    [`status.${programId}.terminalError`]: false,
    [`status.${programId}.errorCode`]: null,
    [`status.${programId}.errorMessage`]: null,
    [`status.${programId}.errorAt`]: null,
  });
}

function sanitizeTerminalErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().slice(0, 300);
}

async function updateTerminalFailureStatus(
  collectionName: "whitelist" | "programWhitelist",
  uid: string,
  itemId: string,
  errorCode: TerminalErrorCode,
  errorMessage: string
): Promise<void> {
  const userRef = db.collection(collectionName).doc(uid);
  await userRef.update({
    [`status.${itemId}.minted`]: false,
    [`status.${itemId}.txHash`]: "",
    [`status.${itemId}.terminalError`]: true,
    [`status.${itemId}.errorCode`]: errorCode,
    [`status.${itemId}.errorMessage`]: sanitizeTerminalErrorMessage(errorMessage),
    [`status.${itemId}.errorAt`]: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function updateAirdropTerminalFailureStatus(
  uid: string,
  category: string,
  errorCode: TerminalErrorCode,
  errorMessage: string
): Promise<void> {
  await updateTerminalFailureStatus("whitelist", uid, category, errorCode, errorMessage);
}

export async function updateProgramAirdropTerminalFailureStatus(
  uid: string,
  programId: string,
  errorCode: TerminalErrorCode,
  errorMessage: string
): Promise<void> {
  await updateTerminalFailureStatus("programWhitelist", uid, programId, errorCode, errorMessage);
}
