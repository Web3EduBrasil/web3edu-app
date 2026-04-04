import { getAuth } from "firebase/auth";
import { app } from "@/firebase/config";

// Cache do token para evitar chamadas redundantes ao Firebase
let _cachedToken: string | null = null;
let _tokenExpiry = 0;
// Tokens Firebase expiram em 1h — renovamos com 5min de margem (55min de cache)
const TOKEN_TTL_MS = 55 * 60 * 1000;

/** Retorna o Firebase ID Token do usuário autenticado (com cache de 55min). */
export async function getIdToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) return _cachedToken;

  const user = getAuth(app).currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  _cachedToken = await user.getIdToken();
  _tokenExpiry = now + TOKEN_TTL_MS;
  return _cachedToken;
}

/** Invalida o cache do token (chamar no logout). */
export function clearIdTokenCache(): void {
  _cachedToken = null;
  _tokenExpiry = 0;
}

/** Headers padrão com Authorization + Content-Type. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
