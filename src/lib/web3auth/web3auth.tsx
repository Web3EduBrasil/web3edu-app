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
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { app } from "@/firebase/config";
import { useLoading } from "../loading-context";
import { toast } from "react-toastify";
import { authHeaders } from "@/lib/getIdToken";

import {
  useAccount,
  useSignMessage,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { useAccountModal } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";


export default function useWeb3Auth() {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading } = useLoading();

  const [user, setUser] = useState<User | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<any | null>(null);
  const [userDbInfo, setUserDbInfo] = useState<any>({});

  // wagmi hooks
  const { address, isConnected, isReconnecting } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { openAccountModal } = useAccountModal();

  // userInfo compatível com o contrato anterior do contexto
  const userInfo = user
    ? {
        profileImage: user.photoURL || "",
        name: user.displayName || "",
        email: user.email || "",
      }
    : null;

  // userAccount compatível com o contrato anterior
  const userAccount: string[] = address ? [address] : [];

  // Restaura googleUserInfo do localStorage na montagem
  useEffect(() => {
    const stored = localStorage.getItem("googleUserInfo");
    if (stored) {
      try {
        setGoogleUserInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem("googleUserInfo");
      }
    }
  }, []);

  // Quando a carteira conecta → autentica no Firebase via custom token
  const walletAuthAttempted = useRef<string | null>(null);
  useEffect(() => {
    if (!isConnected || !address) {
      walletAuthAttempted.current = null;
      return;
    }
    if (walletAuthAttempted.current === address) return;

    (async () => {
      const auth = getAuth(app);
      // Espera o Firebase inicializar para não sobrescrever sessão existente
      await auth.authStateReady();
      if (auth.currentUser) {
        walletAuthAttempted.current = address;
        return;
      }

      walletAuthAttempted.current = address;

      try {
        setIsLoading(true);

        if (chainId !== sepolia.id) {
          try {
            await switchChainAsync({ chainId: sepolia.id });
          } catch {
            toast.error("Troque para a rede Sepolia para continuar.");
            disconnect();
            return;
          }
        }

        const timestamp = Date.now();
        const message = `Web3EduBrasil Authentication\n\nEndereço: ${address}\nTimestamp: ${timestamp}`;

        const signature = await signMessageAsync({ message });

        const res = await fetch("/api/auth/metamask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature, timestamp }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro na autenticação com carteira");
        }

        const { token } = await res.json();
        const cred = await signInWithCustomToken(auth, token);

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
          error?.name === "UserRejectedRequestError" ||
          error?.code === 4001 ||
          error?.message?.toLowerCase().includes("user rejected") ||
          error?.message?.toLowerCase().includes("rejected the request");

        if (isUserRejected) {
          toast.error("Assinatura cancelada.");
        } else {
          toast.error(error?.message || "Erro ao conectar com carteira.");
        }
        disconnect();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    isConnected,
    address,
    chainId,
    disconnect,
    setIsLoading,
    signMessageAsync,
    switchChainAsync,
  ]);

  // Quando a carteira desconecta → faz logout do Firebase se era sessão de carteira
  useEffect(() => {
    if (isConnected) return;
    if (isReconnecting) return;
    const auth = getAuth(app);
    if (!auth.currentUser) return;
    // UIDs de carteira são endereços ethereum (começam com 0x)
    if (!auth.currentUser.uid.startsWith("0x")) return;

    signOut(auth).catch(() => {});
    setGoogleUserInfo(null);
    setUserDbInfo({});
    localStorage.removeItem("googleUserInfo");
  }, [isConnected, isReconnecting]);

  const fetchUserDbData = async (
    uid: string,
    email?: string | null,
    googleName?: string | null
  ) => {
    let response = await fetch(`/api/user?uid=${uid}`, { method: "GET" });

    if (response.status === 404) {
      const createRes = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          email: email || null,
          displayName: googleName || null,
          tutorialDone: false,
        }),
      });

      if (!createRes.ok) {
        throw new Error("Falha ao criar usuário");
      }

      response = createRes;
    }

    if (!response.ok) {
      throw new Error("Falha ao buscar usuário");
    }

    const data = await response.json();
    setUserDbInfo(data.user || {});

    authHeaders()
      .then((headers) =>
        fetch("/api/user/streak", {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        })
      )
      .catch(() => {});
  };

  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        fetchUserDbData(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        ).catch(() => {
          toast.error("Erro ao carregar dados do usuário.");
        });
      } else {
        if (pathname !== "/") {
          router.push("/");
          toast.warning("Faça login para acessar esta tela");
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

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
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
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

  // Mantido para compatibilidade — abertura do modal é feita diretamente no LoginButton
  const loginWithMetaMask = async () => {};

  const resetPassword = async (email: string) => {
    const auth = getAuth(app);
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try {
      await signOut(getAuth(app));
      disconnect();
      setUserDbInfo({});
      setGoogleUserInfo(null);
      localStorage.removeItem("googleUserInfo");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const WalletUi = async () => {
    if (openAccountModal) {
      openAccountModal();
    } else {
      toast.info("Nenhuma carteira conectada.");
    }
  };

  return {
    logout,
    login,
    loginWithEmail,
    loginWithMetaMask,
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
