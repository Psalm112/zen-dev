/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_THIRDWEB_CLIENT_ID: string;
  readonly VITE_ESCROW_CONTRACT_ADDRESS: string;
  readonly VITE_USDT_CONTRACT_ADDRESS: string;
  readonly VITE_INFURA_KEY: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
