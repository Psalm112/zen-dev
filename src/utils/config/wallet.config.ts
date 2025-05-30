import { defineChain } from "thirdweb";
import { ConnectionMethod } from "../types/wallet.types";

export const SUPPORTED_CHAINS = {
  celoAlfajores: defineChain({
    id: 44787,
    name: "Celo Alfajores Testnet",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpc: "https://alfajores-forno.celo-testnet.org",
    blockExplorers: [
      {
        name: "Celo Explorer",
        url: "https://alfajores-blockscout.celo-testnet.org",
      },
    ],
  }),
  celoMainnet: defineChain({
    id: 42220,
    name: "Celo Mainnet",
    nativeCurrency: { name: "Celo", symbol: "CELO", decimals: 18 },
    rpc: "https://forno.celo.org",
    blockExplorers: [
      {
        name: "Celo Explorer",
        url: "https://explorer.celo.org",
      },
    ],
  }),
} as const;

export const WALLET_CONFIGS = {
  metamask: {
    name: "MetaMask",
    icon: "/icons/metamask.svg",
    color: "#f6851b",
    deepLinks: {
      ios: "metamask://dapp/",
      android: "https://metamask.app.link/dapp/",
      universal: "https://metamask.app.link/dapp/",
    },
    downloads: {
      ios: "https://apps.apple.com/app/metamask/id1438144202",
      android: "https://play.google.com/store/apps/details?id=io.metamask",
      chrome:
        "https://chrome.google.com/webstore/detail/nkbihfbeogaeaoehlefnkodbefgpgknn",
      firefox: "https://addons.mozilla.org/firefox/addon/ether-metamask/",
    },
    supportedMethods: [
      "extension",
      "mobile_app",
      "deeplink",
    ] as ConnectionMethod[],
  },
  coinbase: {
    name: "Coinbase Wallet",
    icon: "/icons/coinbase.svg",
    color: "#0052ff",
    deepLinks: {
      ios: "cbwallet://dapp?cb_url=",
      android: "cbwallet://dapp?cb_url=",
      universal: "https://go.cb-w.com/dapp?cb_url=",
    },
    downloads: {
      ios: "https://apps.apple.com/app/coinbase-wallet/id1278383455",
      android: "https://play.google.com/store/apps/details?id=org.toshi",
      chrome:
        "https://chrome.google.com/webstore/detail/coinbase-wallet/hnfanknocfeofbddgcijnmhnfnkdnaad",
    },
    supportedMethods: [
      "extension",
      "mobile_app",
      "qr_code",
      "deeplink",
    ] as ConnectionMethod[],
  },
  trust: {
    name: "Trust Wallet",
    icon: "/icons/trustwallet.svg",
    color: "#3375bb",
    deepLinks: {
      ios: "trust://open_url?coin_id=60&url=",
      android: "trust://open_url?coin_id=60&url=",
      universal: "https://link.trustwallet.com/open_url?coin_id=60&url=",
    },
    downloads: {
      ios: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409",
      android:
        "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
    },
    supportedMethods: ["mobile_app", "qr_code", "deeplink"],
  },
  walletconnect: {
    name: "WalletConnect",
    icon: "/icons/walletconnect.svg",
    color: "#3b99fc",
    supportedMethods: ["qr_code", "mobile_app"] as ConnectionMethod[],
    deepLinks: {
      ios: "",
      android: "",
      universal: "",
    },
    downloads: {
      // ios: "",
      // android: "",
      // chrome: "",
      // firefox: "",
    },
  },
  smart: {
    name: "Smart Wallet",
    icon: "/icons/smart-wallet.svg",
    color: "#7c3aed",
    supportedMethods: ["embedded"] as ConnectionMethod[],
    deepLinks: {
      ios: "",
      android: "",
      universal: "",
    },
    downloads: {
      // ios: "",
      // android: "",
      // chrome: "",
      // firefox: "",
    },
  },
} as const;

export const USDT_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;

export const USDT_CONTRACT_ADDRESS = import.meta.env.VITE_USDT_CONTRACT_ADDRESS;
