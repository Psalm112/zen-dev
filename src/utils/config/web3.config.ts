import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

// Celo USDT Contract Addresses
export const USDT_ADDRESSES = {
  [celo.id]: process.env.VITE_USDT_CONTRACT_ADDRESS_MAINNET!,
  [celoAlfajores.id]: process.env.VITE_USDT_CONTRACT_ADDRESS_TESTNET!,
} as const;

export const ESCROW_ADDRESSES = {
  [celo.id]: process.env.VITE_ESCROW_CONTRACT_MAINNET!,
  [celoAlfajores.id]: process.env.VITE_ESCROW_CONTRACT_TESTNET!,
} as const;

// export const TARGET_CHAIN =
//   process.env.NODE_ENV === "production" ? celo : celoAlfajores;
export const TARGET_CHAIN = celoAlfajores;

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Dezenmart",
        url: window.location.origin,
      },
    }),
    coinbaseWallet({
      appName: "Dezenmart",
      appLogoUrl: `${window.location.origin}/images/logo-full.png`,
    }),
    walletConnect({
      projectId: process.env.VITE_WALLETCONNECT_PROJECT_ID!,
      metadata: {
        name: "Dezenmart",
        description: "Decentralized marketplace",
        url: window.location.origin,
        icons: [`${window.location.origin}/images/logo-full.png`],
      },
    }),
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
});
