import { getAuth } from "firebase/auth";
import { app } from "@/firebase/config";

/** Retorna o Firebase ID Token do usuário autenticado. */
export async function getIdToken(): Promise<string> {
  const user = getAuth(app).currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  return user.getIdToken();
}

/** Headers padrão com Authorization + Content-Type. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
