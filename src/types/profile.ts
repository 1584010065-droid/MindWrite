export type UserProfile = {
  nickname: string;
  avatarUrl: string;
  writingPreference: string;
  exportPreset: "a4" | "letter";
  modelSelection: string;
  apiKey: string;
};
