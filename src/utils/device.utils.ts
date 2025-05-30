import { DeviceInfo, ConnectionMethod } from "../utils/types/wallet.types";

export const createDeviceInfo = (): DeviceInfo => {
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
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isTouchDevice = "ontouchstart" in window;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const hasWebAuthn = !!window.PublicKeyCredential;

  // Detect available wallet providers
  const ethereum = (window as any).ethereum;
  const availableWallets = [];

  if (ethereum) {
    if (ethereum.isMetaMask) availableWallets.push("metamask");
    if (ethereum.isCoinbaseWallet) availableWallets.push("coinbase");
    if (ethereum.isTrust) availableWallets.push("trust");
    if (ethereum.isRainbow) availableWallets.push("rainbow");
    if (!ethereum.isMetaMask && !ethereum.isCoinbaseWallet) {
      availableWallets.push("injected");
    }
  }

  // Determine preferred connection method
  let preferredConnection: ConnectionMethod = "extension";
  if (isMobile) {
    preferredConnection =
      availableWallets.length > 0 ? "mobile_app" : "qr_code";
  } else if (availableWallets.length === 0) {
    preferredConnection = "qr_code";
  }

  return {
    isMobile,
    isIOS,
    isAndroid,
    isTouchDevice,
    isStandalone,
    hasWebAuthn,
    supportsBiometrics: hasWebAuthn && (isIOS || isAndroid),
    preferredConnection,
    availableWallets,
  };
};
