"use client";

import {
  ADAPTER_EVENTS,
  CHAIN_NAMESPACES,
  IProvider,
  WALLET_ADAPTERS,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import {
  OpenloginAdapter,
  OpenloginLoginParams,
} from "@web3auth/openlogin-adapter";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { WalletServicesPlugin } from "@web3auth/wallet-services-plugin";
import Web3 from "web3";
import { useRouter, usePathname } from "next/navigation";
import { app } from "@/firebase/config";
import { useLoading } from "../loading-context";
import { toast } from "react-toastify";

// Configuração do Web3Auth e da Chain
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xAA36A7",
  rpcTarget: process.env.NEXT_PUBLIC_ALCHEMY_RPC_TARGET || "",
  displayName: "Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io/",
  ticker: "ETH",
  tickerName: "Ethereum",
  isTestnet: true,
};

const web3authConfig = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
  web3AuthNetwork: "sapphire_devnet",
  chainConfig,
};

const openloginAdapter = new OpenloginAdapter({
  adapterSettings: {
    uxMode: "redirect",
    loginConfig: {
      jwt: {
        verifier: process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER || "",
        typeOfLogin: "jwt",
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
      },
    },
    redirectUrl: `${process.env.NEXT_PUBLIC_BUILD_ENV === "production" ? `${process.env.NEXT_PUBLIC_APP_LINK}/homePage` : "http://localhost:3000/homePage"}`,
    whiteLabel: {
      appName: "Web3EduBrasil",
      appUrl: process.env.NEXT_PUBLIC_APP_LINK,
      defaultLanguage: "pt",
      useLogoLoader: true,
    },
  },
  privateKeyProvider: new EthereumPrivateKeyProvider({
    config: { chainConfig },
  }),
});

const web3auth = new Web3AuthNoModal({
  clientId: web3authConfig.clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig: web3authConfig.chainConfig,
  uiConfig: {
    logoLight:
      "https://github.com/Web3EduBrasil/web3edu-app/blob/main/public/assets/images/Web3EduBrasil_logo.png?raw=true",
    logoDark:
      "https://github.com/Web3EduBrasil/web3edu-app/blob/main/public/assets/images/Web3EduBrasil_logo.png?raw=true",
    defaultLanguage: "pt",
    appName: "Web3EduBrasil",
  },
});

web3auth.configureAdapter(openloginAdapter);

const walletPlugin = new WalletServicesPlugin({
  walletInitOptions: {
    confirmationStrategy: "modal",
    whiteLabel: {
      logoLight: "https://cdn.prod.website-files.com/67360adb26042a9f3ca96aa5/673b3e0fd01940ddba6f657a_image%201.png",
      logoDark: "https://cdn.prod.website-files.com/67360adb26042a9f3ca96aa5/673e41d192a4e63d42f9d3db_Mask%20group%201.webp",
      useLogoLoader: false,
      defaultLanguage: "pt",
      appName: "Web3EduBrasil",
    },
  },
});

export default function useWeb3Auth() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [userInfo, setUserInfo] =
    useState<Partial<OpenloginLoginParams> | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<any | null>(null);
  const [userAccount, setAccounts] = useState<string[]>([]);
  const [userDbInfo, setUserDbInfo] = useState({});
  const [walletServicesPlugin, setWalletServicesPlugin] =
    useState<WalletServicesPlugin | null>(null);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const init = async () => {
      try {
        web3auth.getPlugin("wallet-services") === null && web3auth.addPlugin(walletPlugin);
        await web3auth.init();
        setProvider(web3auth.provider);
        setWalletServicesPlugin(walletPlugin);

        if (web3auth.status === ADAPTER_EVENTS.CONNECTED) {
          const userInfo = await web3auth.getUserInfo();
          setUserInfo(userInfo);

          const web3 = new Web3(web3auth.provider as any);
          const addresses = await web3.eth.getAccounts();
          setAccounts(addresses.length > 0 ? addresses : []);
        }

        const storedGoogleUserInfo = localStorage.getItem("googleUserInfo");
        if (storedGoogleUserInfo)
          setGoogleUserInfo(JSON.parse(storedGoogleUserInfo));
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!web3auth) return;

    const handleConnectionChange = () => {
      if (web3auth.status !== ADAPTER_EVENTS.CONNECTED) {
        router.push("/");
      }
    };

    web3auth.on(ADAPTER_EVENTS.CONNECTED, handleConnectionChange);
    web3auth.on(ADAPTER_EVENTS.DISCONNECTED, handleConnectionChange);

    return () => {
      web3auth.off(ADAPTER_EVENTS.CONNECTED, handleConnectionChange);
      web3auth.off(ADAPTER_EVENTS.DISCONNECTED, handleConnectionChange);
    };
  }, [web3auth]);

  const fetchUserDbData = async (uid: string, email?: string | null, googleName?: string | null) => {
    const response = await fetch(`/api/user?uid=${uid}&email=${email || ''}&googleName=${googleName || ''}`, {
      method: "GET",
    });
    const data = await response.json();
    setUserDbInfo(data.user);
    // Atualizar streak silenciosamente (token pode ainda não estar pronto, ignora erro)
    import("@/lib/getIdToken")
      .then(({ authHeaders: ah }) => ah())
      .then((headers) =>
        fetch("/api/user/streak", {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        })
      )
      .catch(() => { });
  };

  useEffect(() => {
    const auth = getAuth(app);

    onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // here the endpoint handles the case wheter the user is registered or not
        fetchUserDbData(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
      } else {
        //check if user has already logged but the Firebase session is expired
        if (!web3auth.connected && googleUserInfo) {
          logout();
          toast.warning("Login expirado, faça login novamente");
          return;
        }
        if (pathname !== "/") {
          router.push("/");
          toast.warning("Faça login para acessar esta tela");
          return;
        }
      }
    });
  }, [router, pathname]);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("googleUserInfo", JSON.stringify(res.user));
    return res;
  };

  /**
   * Autentica via email/senha no Firebase e conecta ao Web3Auth.
   * Se a conta não existir, cria automaticamente.
   */
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
      localStorage.setItem("googleUserInfo", JSON.stringify(loginRes.user));
      const idToken = await loginRes.user.getIdToken(true);

      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: "jwt",
          extraLoginOptions: {
            id_token: idToken,
            verifierIdField: "email",
          },
        }
      );

      if (web3authProvider) {
        setProvider(web3authProvider);
        const web3 = new Web3(web3authProvider as any);
        const addresses = await web3.eth.getAccounts();
        setAccounts(addresses.length > 0 ? addresses : []);
        const userInfo = await web3auth.getUserInfo();
        setUserInfo(userInfo);
      }
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

  const login = async () => {
    try {
      setIsLoading(true);
      const loginRes = await signInWithGoogle();
      const idToken = await loginRes.user.getIdToken(true);

      const web3authProvider = await web3auth.connectTo(
        WALLET_ADAPTERS.OPENLOGIN,
        {
          loginProvider: "jwt",
          extraLoginOptions: {
            id_token: idToken,
            verifierIdField: "email",
          },
        }
      );

      if (web3authProvider) {
        setProvider(web3authProvider);
        const web3 = new Web3(web3authProvider as any);
        const addresses = await web3.eth.getAccounts();
        setAccounts(addresses.length > 0 ? addresses : []);

        const userInfo = await web3auth.getUserInfo();
        setUserInfo(userInfo);
      }
      // logEvent(analytics, "login");
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (web3auth.status === ADAPTER_EVENTS.CONNECTED) await web3auth.logout();
      await signOut(getAuth(app));
      setProvider(null);
      setAccounts([]);
      setUserDbInfo({});
      setUserInfo(null);
      setGoogleUserInfo(null);
      localStorage.removeItem("googleUserInfo");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const WalletUi = async () => {
    try {
      if (!web3auth.connected || web3auth.getPlugin("wallet-services") === null) {
        toast.warning("Carteira web3 ainda não conectada, tente novamente");
        return;
      }
      await walletServicesPlugin?.showWalletUi();
      // logEvent(analytics, "open_wallet");
    } catch (error) {
      console.error("error while displaying the wallet: ", error);
    }
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
