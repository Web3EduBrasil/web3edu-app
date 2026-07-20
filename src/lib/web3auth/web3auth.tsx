"use client";

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { app } from "@/firebase/config";
import { useLoading } from "../loading-context";
import { clearIdTokenCache } from "../getIdToken";
import { toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";
import { useWallet } from "@solana/wallet-adapter-react";

function isSolanaWalletUid(uid: string): boolean {
  // Solana pubkeys are base58 and 43–44 chars; Firebase Google UIDs are 28 chars
  return uid.length >= 32 && !uid.startsWith("0x");
}

export default function useWeb3Auth() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading, setLoadingMessage } = useLoading();

  const [user, setUser] = useState<User | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<any | null>(null);
  const [userDbInfo, setUserDbInfo] = useState<any>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const authCheckedRef = useRef(false);

  // Solana wallet adapter hooks
  const { publicKey, connected, disconnect, signMessage, disconnecting } = useWallet();
  const address = publicKey?.toBase58() ?? null;

  const userInfo = useMemo(() => user
    ? {
      profileImage: user.photoURL || "",
      name: user.displayName || "",
      email: user.email || "",
    }
    : null, [user]);

  const userAccount: string[] = useMemo(() => address ? [address] : [], [address]);

  useEffect(() => {
    const stored = localStorage.getItem("googleUserInfo");
    if (stored) {
      try {
        setGoogleUserInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem("googleUserInfo");
      }
    }
    setIsHydrated(true);
  }, []);

  // When Solana wallet connects → authenticate with Firebase via custom token
  const walletAuthAttempted = useRef<string | null>(null);
  useEffect(() => {
    if (!connected || !address || !signMessage) {
      walletAuthAttempted.current = null;
      return;
    }

    if (walletAuthAttempted.current === address) return;

    (async () => {
      const auth = getAuth(app);
      await auth.authStateReady();
      if (auth.currentUser) {
        walletAuthAttempted.current = address;
        return;
      }

      walletAuthAttempted.current = address;

      try {
        setLoadingMessage("Conectando carteira...");
        setIsLoading(true);

        const getCustomToken = async () => {
          const timestamp = Date.now();
          const message = `Web3EduBrasil Authentication\n\nEndereço: ${address}\nTimestamp: ${timestamp}`;
          const messageBytes = new TextEncoder().encode(message);

          setLoadingMessage("Assine a mensagem na carteira...");
          const signatureBytes = await signMessage(messageBytes);
          const signature = Buffer.from(signatureBytes).toString("base64");

          setLoadingMessage("Autenticando...");
          const res = await fetch("/api/auth/solana", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicKey: address, signature, timestamp }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const statusInfo = res.status ? ` (status ${res.status})` : "";
            return {
              ok: false,
              error: data.error || `Erro na autenticação com carteira${statusInfo}`,
            } as const;
          }

          const { token } = await res.json();
          return { ok: true, token } as const;
        };

        const firstAttempt = await getCustomToken();
        let token: string;

        if (!firstAttempt.ok) {
          if (firstAttempt.error.includes("Mensagem expirada")) {
            const retryAttempt = await getCustomToken();
            if (!retryAttempt.ok) throw new Error(retryAttempt.error);
            token = retryAttempt.token;
          } else {
            throw new Error(firstAttempt.error);
          }
        } else {
          token = firstAttempt.token;
        }

        const cred = await signInWithCustomToken(getAuth(app), token);

        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        const walletInfo = {
          uid: cred.user.uid,
          displayName: shortAddress,
          email: null,
          photoURL: null,
          wallet: address,
        };
        localStorage.setItem("googleUserInfo", JSON.stringify(walletInfo));
        setGoogleUserInfo(walletInfo);
      } catch (error: any) {
        walletAuthAttempted.current = null;
        const isUserRejected =
          error?.name === "WalletSignMessageError" ||
          error?.message?.toLowerCase().includes("user rejected") ||
          error?.message?.toLowerCase().includes("rejected the request");

        if (isUserRejected) {
          toast.error("Assinatura cancelada.");
        } else {
          toast.error(error?.message || "Erro ao conectar com carteira.");
        }
        disconnect().catch(() => {});
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
      }
    })();
  }, [
    connected,
    address,
    signMessage,
    disconnect,
    setIsLoading,
    setLoadingMessage,
  ]);

  // When wallet disconnects → sign out if this was a wallet session
  useEffect(() => {
    if (connected || disconnecting) return;
    const auth = getAuth(app);
    if (!auth.currentUser) return;
    if (!isSolanaWalletUid(auth.currentUser.uid)) return;

    clearIdTokenCache();
    signOut(auth).catch(() => {});
    setGoogleUserInfo(null);
    setUserDbInfo({});
    localStorage.removeItem("googleUserInfo");
  }, [connected, disconnecting]);

  const fetchUserDbData = useCallback(async (
    uid: string,
    email?: string | null,
    googleName?: string | null,
    options?: {
      emailVerified?: boolean;
      photoURL?: string | null;
      walletAddress?: string | null;
      walletProvider?: string | null;
    }
  ) => {
    const displayName = googleName
      || (isSolanaWalletUid(uid) ? `${uid.slice(0, 6)}...${uid.slice(-4)}` : null);

    const walletAddress = options?.walletAddress ?? null;
    const walletProvider = options?.walletProvider ?? null;

    let response = await fetch(`/api/user?uid=${uid}`, { method: "GET" });
    let userData: any = null;

    if (response.status === 404) {
      const createRes = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          email: email || null,
          displayName,
          certificateName: displayName,
          emailVerified: options?.emailVerified ?? false,
          photoURL: options?.photoURL ?? null,
          walletAddress,
          walletProvider,
        }),
      });

      if (!createRes.ok) throw new Error("Falha ao criar usuário");
      userData = await createRes.json();
    } else if (response.ok) {
      userData = await response.json();

      if (walletAddress) {
        const existingWallet =
          userData?.user?.walletAddressLowercase || userData?.user?.walletAddress || "";
        if (!existingWallet) {
          await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, walletAddress, walletProvider }),
          });
          const refreshRes = await fetch(`/api/user?uid=${uid}`, { method: "GET" });
          if (refreshRes.ok) userData = await refreshRes.json();
        }
      }
    }

    if (!userData) throw new Error("Falha ao buscar usuário");

    setUserDbInfo(userData.user || {});

    authHeaders()
      .then((headers) =>
        fetch("/api/user/streak", {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      authCheckedRef.current = true;
      setIsLoading(false);
      setLoadingMessage("");

      if (firebaseUser) {
        fetchUserDbData(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          {
            emailVerified: firebaseUser.emailVerified,
            photoURL: firebaseUser.photoURL,
            walletAddress: address || (isSolanaWalletUid(firebaseUser.uid) ? firebaseUser.uid : null),
            walletProvider: address ? "solana" : null,
          }
        ).catch(() => {
          toast.error("Erro ao carregar dados do usuário.");
        });
      } else {
        if (!authCheckedRef.current) return;
        if (pathname.startsWith("/certificates")) return;
        if (pathname !== "/") {
          router.push("/");
          toast.warning("Faça login para acessar esta tela");
        }
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname, fetchUserDbData, address]);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, googleProvider);
    const userObj = {
      uid: res.user.uid,
      displayName: res.user.displayName,
      email: res.user.email,
      photoURL: res.user.photoURL,
    };
    localStorage.setItem("googleUserInfo", JSON.stringify(userObj));
    setGoogleUserInfo(userObj);
    return res;
  };

  const login = async () => {
    try {
      setLoadingMessage("Entrando com Google...");
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const auth = getAuth(app);
      let loginRes: UserCredential;
      try {
        loginRes = await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        if (
          err.code === "auth/user-not-found" ||
          err.code === "auth/invalid-credential"
        ) {
          loginRes = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }
      const userObj = {
        uid: loginRes.user.uid,
        displayName: loginRes.user.displayName || email,
        email: loginRes.user.email,
        photoURL: loginRes.user.photoURL,
      };
      localStorage.setItem("googleUserInfo", JSON.stringify(userObj));
      setGoogleUserInfo(userObj);
    } catch (error) {
      console.error("Erro no login com email:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      clearIdTokenCache();
      await signOut(getAuth(app));
      await disconnect().catch(() => {});
      setUserDbInfo({});
      setGoogleUserInfo(null);
      localStorage.removeItem("googleUserInfo");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Opens Solana wallet adapter modal programmatically — callers import useWalletModal
  const WalletUi = async () => {
    toast.info("Use o botão de carteira para gerenciar sua conexão.");
  };

  return {
    logout,
    login,
    loginWithEmail,
    resetPassword,
    user,
    WalletUi,
    userInfo,
    userAccount,
    userDbInfo,
    setUserDbInfo,
    fetchUserDbData,
    googleUserInfo,
  };
}
