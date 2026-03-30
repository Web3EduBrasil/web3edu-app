// app/layout.tsx (sem "use client"!)
import "../styles/globals.css";
import { Web3AuthProvider } from "@/lib/web3auth/Web3AuthProvider";
import NavBar from "@/components/NavBar/NavBar";
import { ContentProvider } from "@/providers/content-context";
import { ToastContainer } from "react-toastify";
import { RewardContainer } from "@/components/RewardContainer/RewardContainer";
import { Lexend_Deca } from "next/font/google";
import { LoadingProvider } from "@/lib/loading-context";
import { WagmiProviders } from "@/lib/wagmi/WagmiProviders";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import type { Metadata } from "next";

const LexendDeca = Lexend_Deca({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_LINK || 'https://www.web3edubrasil.online'),
  title: "Web3EduBrasil - Aprenda sobre Web3 e conquiste NFTs únicas.",
  description:
    "Web3EduBrasil é uma plataforma de ensino descentralizada que facilita o aprendizado e o início nas tecnologias Web3.",
  openGraph: {
    title: "Web3EduBrasil - Aprenda sobre Web3 e conquiste NFTs únicas.",
    description:
      "Web3EduBrasil é uma plataforma de ensino descentralizada que facilita o aprendizado e o início nas tecnologias Web3.",
    url: process.env.NEXT_PUBLIC_APP_LINK || 'https://www.web3edubrasil.online',
    siteName: "Web3EduBrasil",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_LINK || 'https://www.web3edubrasil.online'}/visuals/landing.jpg`,
        width: 680,
        height: 680,
        alt: "Imagem de capa Web3EduBrasil, mostrando o aprendizado de Web3 e NFTs",
      },
    ],
  },
  twitter: {
    site: "@web3edubrasil",
    card: "summary_large_image",
    title: "Web3EduBrasil - Aprenda sobre Web3 e conquiste NFTs únicas.",
    description: "Aprenda sobre Web3, blockchain e NFTs com Web3EduBrasil.",
    images: `${process.env.NEXT_PUBLIC_APP_LINK || 'https://www.web3edubrasil.online'}/visuals/landing.jpg`,
  },
  creator: "Web3EduBrasil Developers",
  publisher: "Web3EduBrasil",
  keywords: [
    "web3edubrasil",
    "web3edu",
    "web3 brasil",
    "blockchain brasil",
    "blockchain",
    "web3",
    "nft",
    "solidity",
    "bitcoin",
    "brasil",
    "educacao",
    "web3educacao",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = cookieStore.get("APP_THEME")?.value === "dark" ? "dark" : "light";

  return (
    <html lang={locale} data-theme={theme} suppressHydrationWarning>
      <head>
        <meta name="robots" content="index, follow" />
      </head>
      <body className={LexendDeca.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <WagmiProviders>
            <LoadingProvider>
              <Web3AuthProvider>
                <ContentProvider>
                  <LoadingOverlay />
                  <main
                    className="flex w-full flex-col items-center bg-neutralbg justify-start h-screen overflow-hidden "
                  >
                    <NavBar />
                    <section className="flex flex-col h-full w-full overflow-y-auto ">
                      {children}
                    </section>
                    <RewardContainer />
                    <ToastContainer
                      position="top-center"
                      autoClose={2500}
                      hideProgressBar={false}
                      newestOnTop={false}
                      closeOnClick
                      rtl={false}
                      pauseOnFocusLoss
                      draggable
                      pauseOnHover
                      theme={theme}
                    />
                  </main>
                </ContentProvider>
              </Web3AuthProvider>
            </LoadingProvider>
          </WagmiProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
