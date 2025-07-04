// This tells TypeScript that the `window` object will have our `kiki_api`.
export interface IKikiApi {
  saveApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  loadApiKey: () => Promise<string | null>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    kiki_api: IKikiApi;
  }
}
