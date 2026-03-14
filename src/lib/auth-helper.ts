import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

/**
 * Extrai e valida o Firebase ID Token do header Authorization.
 * Retorna o UID do usuário ou lança erro se inválido/ausente.
 */
export async function verifyAuth(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization header ausente ou inválido");
  }
  const idToken = authHeader.replace("Bearer ", "").trim();
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}
