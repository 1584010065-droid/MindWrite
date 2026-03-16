/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ARK_API_KEY: string;
  readonly VITE_TAVILY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
