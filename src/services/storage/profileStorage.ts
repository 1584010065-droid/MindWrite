import type { UserProfile } from "../../types/profile";
import { getValue, setValue } from "./db";
import { STORAGE_KEYS } from "./keys";

export async function loadProfile(): Promise<UserProfile | null> {
  return getValue<UserProfile>(STORAGE_KEYS.profile);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await setValue(STORAGE_KEYS.profile, profile);
}
