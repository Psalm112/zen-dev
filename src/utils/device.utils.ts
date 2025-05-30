import { DeviceInfo, ConnectionMethod } from "./types/wallet.types";

let cachedDeviceInfo: DeviceInfo | null = null;

export const createDeviceInfo = (): DeviceInfo => {
  if (cachedDeviceInfo) return cachedDeviceInfo;

  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isTouchDevice: false,
      isStandalone: false,
      hasWebAuthn: false,
      supportsBiometrics: false,
      preferredConnection: "extension" as ConnectionMethod,
      availableWallets: [],
      userAgent: "",
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
  const hasWebAuthn = !!window.PublicKeyCredential;

  // wallet detection
  const ethereum = (window as any).ethereum;
  const availableWallets: string[] = [];

  if (ethereum) {
    if (ethereum.isMetaMask && !ethereum.isBraveWallet)
      availableWallets.push("metamask");
    if (ethereum.isCoinbaseWallet) availableWallets.push("coinbase");
    if (ethereum.isTrust) availableWallets.push("trust");
    if (ethereum.isRainbow) availableWallets.push("rainbow");
    if (ethereum.isBraveWallet) availableWallets.push("brave");

    if (availableWallets.length === 0) {
      availableWallets.push("injected");
    }
  }

  // Determine preferred connection
  let preferredConnection: ConnectionMethod = "extension";

  if (isMobile) {
    if (availableWallets.length > 0) {
      preferredConnection = "mobile_app";
    } else if (isIOS || isAndroid) {
      preferredConnection = "walletconnect";
    } else {
      preferredConnection = "qr_code";
    }
  } else {
    if (availableWallets.length === 0) {
      preferredConnection = "walletconnect";
    }
  }

  const deviceInfo: DeviceInfo = {
    isMobile,
    isIOS,
    isAndroid,
    isTouchDevice,
    isStandalone,
    hasWebAuthn,
    supportsBiometrics: hasWebAuthn && (isIOS || isAndroid),
    preferredConnection,
    availableWallets,
    userAgent,
  };

  cachedDeviceInfo = deviceInfo;
  return deviceInfo;
};

export const clearDeviceInfoCache = () => {
  cachedDeviceInfo = null;
};
