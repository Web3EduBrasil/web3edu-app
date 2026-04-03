"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  progressLoading: number | null;
  setProgressLoading: (progress: number | null) => void;
  countLoading: number[] | null;
  setCountLoading: (count: number[] | null) => void;
}>({
  isLoading: true,
  setIsLoading: () => { },
  loadingMessage: "",
  setLoadingMessage: () => { },
  progressLoading: null,
  setProgressLoading: () => { },
  countLoading: null,
  setCountLoading: () => { },
});

export const LoadingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [progressLoading, setProgressLoading] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState<number[] | null>(null);

  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading,
    loadingMessage,
    setLoadingMessage,
    progressLoading,
    setProgressLoading,
    countLoading,
    setCountLoading,
  }), [isLoading, loadingMessage, progressLoading, countLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
