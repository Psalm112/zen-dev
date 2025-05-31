import { useMemo, useCallback } from "react";
import {
  WalletInfo,
  WalletType,
  ConnectionMethod,
} from "../types/wallet.types";
import { WALLET_CONFIGS } from "../config/wallet.config";
import { createDeviceInfo } from "../device.utils";

// Enhanced mobile wallet detection
const detectMobileWallets = (): string[] => {
  const wallets: string[] = [];
  const ethereum = (window as any).ethereum;

  if (!ethereum) return wallets;

  // Check for multiple providers first
  if (ethereum.providers?.length > 0) {
    ethereum.providers.forEach((provider: any) => {
      if (provider.isMetaMask && !provider.isBraveWallet)
        wallets.push("metamask");
      if (
        provider.isCoinbaseWallet ||
        provider.selectedProvider?.isCoinbaseWallet
      )
        wallets.push("coinbase");
      if (provider.isTrust) wallets.push("trust");
      if (provider.isRainbow) wallets.push("rainbow");
      if (provider.isTokenPocket) wallets.push("tokenpocket");
      if (provider.isSafePal) wallets.push("safepal");
      if (provider.isBraveWallet) wallets.push("brave");
    });
  } else {
    if (ethereum.isMetaMask && !ethereum.isBraveWallet)
      wallets.push("metamask");
    if (
      ethereum.isCoinbaseWallet ||
      ethereum.selectedProvider?.isCoinbaseWallet
    )
      wallets.push("coinbase");
    if (ethereum.isTrust) wallets.push("trust");
    if (ethereum.isRainbow) wallets.push("rainbow");
    if (ethereum.isTokenPocket) wallets.push("tokenpocket");
    if (ethereum.isSafePal) wallets.push("safepal");
    if (ethereum.isBraveWallet) wallets.push("brave");
    if (ethereum.isImToken) wallets.push("imtoken");

    // Fallback for unknown injected wallets
    if (wallets.length === 0 && ethereum.isEthereum) {
      wallets.push("injected");
    }
  }

  return [...new Set(wallets)];
};

// device info
const createEnhancedDeviceInfo = () => {
  const baseInfo = createDeviceInfo();
  const enhancedWallets = detectMobileWallets();

  // Better preferred connection logic
  let preferredConnection: ConnectionMethod = "extension";

  if (baseInfo.isMobile) {
    if (enhancedWallets.length > 0) {
      preferredConnection = "mobile_app";
    } else if (baseInfo.isIOS || baseInfo.isAndroid) {
      preferredConnection = "deeplink";
    } else {
      preferredConnection = "qr_code";
    }
  } else {
    if (enhancedWallets.length === 0) {
      preferredConnection = "qr_code"; // WalletConnect fallback
    } else if (enhancedWallets.includes("metamask")) {
      preferredConnection = "extension";
    }
  }

  return {
    ...baseInfo,
    availableWallets: enhancedWallets,
    preferredConnection,
  };
};

export function useWalletInfo(): {
  availableWallets: WalletInfo[];
  recommendedWallet: WalletInfo | null;
  deviceInfo: ReturnType<typeof createEnhancedDeviceInfo>;
  openWalletWithFallback: (walletType: WalletType, dappUrl?: string) => void;
} {
  const deviceInfo = useMemo(() => createEnhancedDeviceInfo(), []);

  const openWalletWithFallback = useCallback(
    (walletType: WalletType, dappUrl?: string) => {
      if (!walletType || walletType === "smart") return;

      const config = WALLET_CONFIGS[walletType as keyof typeof WALLET_CONFIGS];
      if (!config) return;

      const currentUrl = dappUrl || window.location.href;

      // Construct deep link URL
      let deepLinkUrl = "";
      if (deviceInfo.isIOS && config.deepLinks.ios) {
        deepLinkUrl = config.deepLinks.ios + encodeURIComponent(currentUrl);
      } else if (deviceInfo.isAndroid && config.deepLinks.android) {
        deepLinkUrl = config.deepLinks.android + encodeURIComponent(currentUrl);
      } else if (config.deepLinks.universal) {
        deepLinkUrl =
          config.deepLinks.universal + encodeURIComponent(currentUrl);
      }

      if (deepLinkUrl) {
        window.location.href = deepLinkUrl;

        // Fallback to app store after timeout if user didn't leave the page
        setTimeout(() => {
          if (document.visibilityState === "visible") {
            const storeUrl = deviceInfo.isIOS
              ? (config as any).downloads?.ios
              : (config as any).downloads?.android;

            if (storeUrl) {
              window.open(storeUrl, "_blank");
            }
          }
        }, 2500);
      }
    },
    [deviceInfo]
  );

  const availableWallets = useMemo((): WalletInfo[] => {
    const wallets: WalletInfo[] = [];
    // const priorityCounter = 0;

    Object.entries(WALLET_CONFIGS).forEach(([type, config]) => {
      // Smart wallet is always available
      if (type === "smart") {
        wallets.push({
          type: type as WalletType,
          name: config.name,
          icon: config.icon,
          color: config.color,
          installed: true,
          available: true,
          recommended:
            deviceInfo.isMobile || deviceInfo.availableWallets.length === 0,
          supportedMethods: config.supportedMethods as ConnectionMethod[],
          requiresDownload: false,
          priority: deviceInfo.isMobile ? 0 : 10,
        });
        return;
      }

      const isInstalled = deviceInfo.availableWallets.includes(type);
      const isAvailable =
        isInstalled || deviceInfo.isMobile || type === "walletconnect";

      if (isAvailable) {
        let recommended = false;
        let priority = 10;

        // recommendation logic
        if (type === "metamask" && !deviceInfo.isMobile && isInstalled) {
          recommended = true;
          priority = 1;
        } else if (
          type === "walletconnect" &&
          !isInstalled &&
          !deviceInfo.isMobile
        ) {
          recommended = deviceInfo.availableWallets.length === 0;
          priority = 5;
        } else if (deviceInfo.isMobile && isInstalled) {
          priority = 2;
        }

        wallets.push({
          type: type as WalletType,
          name: config.name,
          icon: config.icon,
          color: config.color,
          installed: isInstalled,
          available: true,
          recommended,
          supportedMethods: config.supportedMethods as ConnectionMethod[],
          requiresDownload: !isInstalled && deviceInfo.isMobile,
          downloadUrl: deviceInfo.isMobile
            ? deviceInfo.isIOS
              ? (config as any).downloads?.ios
              : (config as any).downloads?.android
            : (config as any).downloads?.chrome,
          deepLink: deviceInfo.isMobile
            ? (config as any).deepLinks?.universal
            : undefined,
          priority,
        });
      }
    });

    // Sort by priority, then by recommendation, then by installation status
    return wallets.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      if (a.installed && !b.installed) return -1;
      if (!a.installed && b.installed) return 1;
      return 0;
    });
  }, [deviceInfo]);

  const recommendedWallet = useMemo(() => {
    return (
      availableWallets.find((w) => w.recommended) || availableWallets[0] || null
    );
  }, [availableWallets]);

  return {
    availableWallets,
    recommendedWallet,
    deviceInfo,
    openWalletWithFallback,
  };
}
