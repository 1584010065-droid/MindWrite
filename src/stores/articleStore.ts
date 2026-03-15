import { create } from "zustand";
import type { Article, ArticleBlock } from "../types/article";
import { createId } from "../utils/id";
import { loadArticle, saveArticle } from "../services/storage/articleStorage";

const defaultArticle: Article = {
  id: "default",
  title: "未命名文章",
  blocks: [],
};

type ArticleState = {
  article: Article;
  setArticle: (article: Article) => void;
  setTitle: (title: string) => void;
  updateBlockContent: (blockId: string, contentHtml: string, userEdited?: boolean) => void;
  toggleBlockLock: (blockId: string) => void;
  upsertBlocks: (blocks: ArticleBlock[]) => void;
  syncBlocksForNodes: (nodeIds: string[]) => void;
  loadFromStorage: () => Promise<void>;
};

export const useArticleStore = create<ArticleState>((set, get) => ({
  article: defaultArticle,
  setArticle: (article) => {
    set({ article });
    void saveArticle(article);
  },
  setTitle: (title) => {
    const next = { ...get().article, title };
    set({ article: next });
    void saveArticle(next);
  },
  updateBlockContent: (blockId, contentHtml, userEdited = true) => {
    const article = get().article;
    const blocks = article.blocks.map((block) =>
      block.id === blockId
        ? { ...block, contentHtml, isUserEdited: userEdited || block.isUserEdited }
        : block
    );
    const next = { ...article, blocks };
    set({ article: next });
    void saveArticle(next);
  },
  toggleBlockLock: (blockId) => {
    const article = get().article;
    const blocks = article.blocks.map((block) =>
      block.id === blockId ? { ...block, isLocked: !block.isLocked } : block
    );
    const next = { ...article, blocks };
    set({ article: next });
    void saveArticle(next);
  },
  upsertBlocks: (incoming) => {
    const article = get().article;
    const existing = new Map(article.blocks.map((block) => [block.nodeId, block]));
    const merged = article.blocks.map((block) => {
      const nextBlock = incoming.find((item) => item.nodeId === block.nodeId);
      if (!nextBlock) return block;
      return {
        ...block,
        contentHtml: nextBlock.contentHtml,
        isUserEdited: false,
      };
    });

    incoming.forEach((block) => {
      if (!existing.has(block.nodeId)) {
        merged.push(block);
      }
    });

    const next = { ...article, blocks: merged };
    set({ article: next });
    void saveArticle(next);
  },
  syncBlocksForNodes: (nodeIds) => {
    const article = get().article;
    const existingIds = new Set(article.blocks.map((block) => block.nodeId));
    const missing = nodeIds.filter((id) => !existingIds.has(id));
    if (missing.length === 0) return;
    const newBlocks = missing.map((nodeId) => ({
      id: createId("block"),
      nodeId,
      contentHtml: "<p>尚未生成内容。</p>",
      isLocked: false,
      isUserEdited: false,
    }));
    const next = { ...article, blocks: [...article.blocks, ...newBlocks] };
    set({ article: next });
    void saveArticle(next);
  },
  loadFromStorage: async () => {
    const stored = await loadArticle();
    if (stored) {
      set({ article: stored });
    }
  },
}));
