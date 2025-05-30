import { useMemo } from "react";
import {
  WalletInfo,
  WalletType,
  ConnectionMethod,
} from "../types/wallet.types";
import { WALLET_CONFIGS } from "../config/wallet.config";
import { createDeviceInfo } from "../device.utils";

export function useWalletInfo(): {
  availableWallets: WalletInfo[];
  recommendedWallet: WalletInfo | null;
  deviceInfo: ReturnType<typeof createDeviceInfo>;
} {
  const deviceInfo = useMemo(createDeviceInfo, []);

  const availableWallets = useMemo((): WalletInfo[] => {
    const wallets: WalletInfo[] = [];

    Object.entries(WALLET_CONFIGS).forEach(([type, config]) => {
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
        });
        return;
      }

      const isInstalled = deviceInfo.availableWallets.includes(type);
      const isAvailable =
        isInstalled || deviceInfo.isMobile || type === "walletconnect";

      if (isAvailable) {
        wallets.push({
          type: type as WalletType,
          name: config.name,
          icon: config.icon,
          color: config.color,
          installed: isInstalled,
          available: true,
          recommended: type === "metamask" && !deviceInfo.isMobile,
          supportedMethods: config.supportedMethods as ConnectionMethod[],
          requiresDownload: !isInstalled && !deviceInfo.isMobile,
          downloadUrl: deviceInfo.isMobile
            ? deviceInfo.isIOS
              ? (config as any).downloads?.ios
              : (config as any).downloads?.android
            : (config as any).downloads?.chrome,
          deepLink: deviceInfo.isMobile
            ? (config as any).deepLinks?.universal
            : undefined,
        });
      }
    });

    return wallets.sort((a, b) => {
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
  };
}
