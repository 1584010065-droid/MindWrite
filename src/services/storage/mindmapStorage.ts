import type { MindMap } from "../../types/mindmap";
import { getValue, setValue } from "./db";
import { STORAGE_KEYS } from "./keys";

export async function loadMindMap(): Promise<MindMap | null> {
  return getValue<MindMap>(STORAGE_KEYS.mindmap);
}

export async function saveMindMap(map: MindMap): Promise<void> {
  await setValue(STORAGE_KEYS.mindmap, map);
}
