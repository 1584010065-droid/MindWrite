import { useEffect, useMemo, useState } from "react";
import { useMindMapStore } from "../stores/mindmapStore";
import { useArticleStore } from "../stores/articleStore";
import { useProfileStore } from "../stores/profileStore";
import MindMapEditor from "../components/mindmap/MindMapEditor";
import ArticleBlockEditor from "../components/article/ArticleBlockEditor";
import StatusBadge from "../components/common/StatusBadge";
import { generateBlocksForNodes } from "../services/ai/aiService";
import { getDFSOrder } from "../utils/mindmap";

export default function WorkspacePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const map = useMindMapStore((state) => state.map);
  const selectedNodeIds = useMindMapStore((state) => state.selectedNodeIds);
  const loadMindMap = useMindMapStore((state) => state.loadFromStorage);

  const article = useArticleStore((state) => state.article);
  const loadArticle = useArticleStore((state) => state.loadFromStorage);
  const updateBlockContent = useArticleStore((state) => state.updateBlockContent);
  const toggleBlockLock = useArticleStore((state) => state.toggleBlockLock);
  const syncBlocksForNodes = useArticleStore((state) => state.syncBlocksForNodes);
  const upsertBlocks = useArticleStore((state) => state.upsertBlocks);
  const setTitle = useArticleStore((state) => state.setTitle);

  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadFromStorage);

  useEffect(() => {
    void loadMindMap();
    void loadArticle();
    void loadProfile();
  }, [loadMindMap, loadArticle, loadProfile]);

  useEffect(() => {
    const nodeIds = map.nodes.map((node) => node.id);
    syncBlocksForNodes(nodeIds);
  }, [map.nodes, syncBlocksForNodes]);

  const orderedBlocks = useMemo(() => {
    const order = getDFSOrder(map);
    const blockMap = new Map(article.blocks.map((block) => [block.nodeId, block]));
    return order
      .filter((id) => id !== map.rootId)
      .map((id) => blockMap.get(id))
      .filter(Boolean);
  }, [article.blocks, map]);

  const apiKey = profile.apiKey || import.meta.env.VITE_ARK_API_KEY;

  const handleGenerate = async (mode: "selected" | "all") => {
    if (!apiKey) {
      setError("请先在用户信息页面填写豆包 API Key。");
      return;
    }
    const targetIds =
      mode === "selected"
        ? selectedNodeIds.filter((id) => id !== map.rootId)
        : map.nodes.map((node) => node.id).filter((id) => id !== map.rootId);

    if (mode === "selected" && targetIds.length === 0) {
      setError("请先选择一个导图节点。");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const blocksToReplace = article.blocks.filter(
        (block) => targetIds.includes(block.nodeId) && !block.isLocked
      );
      const hasUserEdited = blocksToReplace.some((block) => block.isUserEdited);
      if (hasUserEdited) {
        const confirmed = window.confirm(
          "有段落已被你修改过，继续生成将覆盖这些内容。确认继续吗？"
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      const nodeTexts = map.nodes
        .filter((node) => targetIds.includes(node.id))
        .map((node) => ({ nodeId: node.id, text: node.text }));

      const generated = await generateBlocksForNodes(
        nodeTexts,
        apiKey,
        profile.modelSelection,
        profile.writingPreference
      );
      upsertBlocks(generated);
    } catch (err) {
      setError("生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selectedNodeIds.filter((id) => id !== map.rootId).length;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.05fr_1fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-ui uppercase tracking-[0.2em] text-dusk/70">
              MindMap
            </p>
            <h2 className="font-display text-2xl text-ink">思维导图</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-line/70 bg-white/70 px-4 py-2 text-xs font-ui text-dusk hover:border-clay"
              onClick={() => handleGenerate("selected")}
              disabled={loading}
            >
              生成选中段落
            </button>
            <button
              className="rounded-full bg-clay px-4 py-2 text-xs font-ui text-paper shadow-soft"
              onClick={() => handleGenerate("all")}
              disabled={loading}
            >
              {loading ? "生成中..." : "生成全文"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={`节点 ${map.nodes.length}`} />
          <StatusBadge
            label={`已选 ${selectedCount}`}
            tone={selectedCount > 0 ? "accent" : "neutral"}
          />
          <StatusBadge label={`段落 ${article.blocks.length}`} />
          <span className="text-xs font-ui text-dusk/70">
            提示：按住 Shift 可多选节点
          </span>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <MindMapEditor />
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-ui uppercase tracking-[0.2em] text-dusk/70">
            Article
          </p>
          <h2 className="font-display text-2xl text-ink">文章实时对照</h2>
        </div>
        <input
          className="w-full rounded-2xl border border-line/70 bg-white/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
          value={article.title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="文章标题"
        />
        <div className="space-y-4">
          {orderedBlocks.length === 0 && (
            <div className="rounded-3xl border border-dashed border-line/70 bg-paper/60 px-6 py-8 text-center text-dusk/70">
              生成后文章内容会在这里出现
            </div>
          )}
          {orderedBlocks.map((block) => (
            <ArticleBlockEditor
              key={block!.id}
              block={block!}
              onUpdate={updateBlockContent}
              onToggleLock={toggleBlockLock}
              highlight={selectedNodeIds.includes(block!.nodeId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
