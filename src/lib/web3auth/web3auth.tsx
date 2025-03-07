"use client";

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  UserCredential,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { app } from "@/firebase/config";

export default function useWeb3Auth() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleUserInfo, setGoogleUserInfo] = useState<any | null>(null);
  const [userDbInfo, setUserDbInfo] = useState({});

  useEffect(() => {
    const init = async () => {
      try {
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
    // Salva o estado de login no localStorage sempre que ele muda
    localStorage.setItem("isLoggedIn", isLoggedIn.toString());
  }, [isLoggedIn]);

  const fetchUserDbData = async (uid: string) => {
    const response = await fetch(`/api/user?uid=${uid}`, {
      method: "GET",
    });
    const data = await response.json();
    setUserDbInfo(data.user);
    console.log(data);
  };

  useEffect(() => {
    const auth = getAuth(app);

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        fetchUserDbData(user.uid);

        try {
          const userObj = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            tutorialDone: false,
          };
          const response = await fetch("/api/user", {
            method: "POST",
            body: JSON.stringify(userObj),
          });
          const data = await response.json();
          console.log(data);

          router.push("/homePage");
        } catch (error: any) {
          console.error("Error handling user login:", error);
        }
      } else {
        setIsLoggedIn(false);
      }
    });
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("googleUserInfo", JSON.stringify(res.user));
    return res;
  };

  const login = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(getAuth(app));
      setIsLoggedIn(false);
      localStorage.removeItem("googleUserInfo");
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return {
    logout,
    login,
    isLoggedIn,
    isLoggingIn,
    userDbInfo,
    setUserDbInfo,
    fetchUserDbData,
    googleUserInfo,
  };
}
