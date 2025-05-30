export const createSecureStorage = () => ({
  async getItem(key: string): Promise<string | null> {
    try {
      const item = localStorage.getItem(`WALLET_${key}`);
      if (!item) return null;
      return atob(item);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(`WALLET_${key}`, btoa(value));
    } catch {
      // Silent fail for privacy mode
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(`WALLET_${key}`);
    } catch {
      // Silent fail
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("WALLET_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Silent fail
    }
  },
});
