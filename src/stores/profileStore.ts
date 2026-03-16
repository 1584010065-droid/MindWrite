import { create } from "zustand";
import type { UserProfile } from "../types/profile";
import { loadProfile, saveProfile } from "../services/storage/profileStorage";

const defaultProfile: UserProfile = {
  nickname: "",
  avatarUrl: "",
  writingPreference: "温润、克制、逻辑清晰",
  exportPreset: "a4",
  modelSelection: "doubao-seed-1-8-251228",
  apiKey: "",
  tavilyApiKey: "",
  enableWebSearch: true,
};

type ProfileState = {
  profile: UserProfile;
  updateProfile: (partial: Partial<UserProfile>) => void;
  loadFromStorage: () => Promise<void>;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile,
  updateProfile: (partial) => {
    const next = { ...get().profile, ...partial };
    set({ profile: next });
    void saveProfile(next);
  },
  loadFromStorage: async () => {
    const stored = await loadProfile();
    if (stored) {
      set({ profile: stored });
    }
  },
}));
