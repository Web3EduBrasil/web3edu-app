import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
        port: "",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.json$/,
      type: 'json'
    });

    // Pacotes nativos (React Native / node-only) que não existem no browser
    // mas são importados transitivamente por @metamask/sdk e pino
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      "encoding": false,
    };

    // No servidor (SSR), idb-keyval usa indexedDB que não existe no Node.js.
    // O WalletConnect tenta inicializá-lo durante setup(), quebrando o SSR.
    // Redirecionamos para um stub no-op que não acessa indexedDB.
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "idb-keyval": path.resolve(__dirname, "src/stubs/idb-keyval.js"),
      };
    }

    return config;
  }
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

// Merge MDX config with Next.js config
export default withNextIntl(withMDX(nextConfig));
