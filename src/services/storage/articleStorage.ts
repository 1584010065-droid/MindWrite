import type { Article } from "../../types/article";
import { getValue, setValue } from "./db";
import { STORAGE_KEYS } from "./keys";

export async function loadArticle(): Promise<Article | null> {
  return getValue<Article>(STORAGE_KEYS.article);
}

export async function saveArticle(article: Article): Promise<void> {
  await setValue(STORAGE_KEYS.article, article);
}
