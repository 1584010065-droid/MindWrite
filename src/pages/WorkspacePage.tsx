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
  const [showArticle, setShowArticle] = useState(true);

  const map = useMindMapStore((state) => state.map);
  const selectedNodeIds = useMindMapStore((state) => state.selectedNodeIds);
  const hoveredNodeId = useMindMapStore((state) => state.hoveredNodeId);
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
  const tavilyApiKey = profile.tavilyApiKey || import.meta.env.VITE_TAVILY_API_KEY;

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
    console.log("🚀 [WorkspacePage] 开始生成文章段落，模式:", mode);
    console.log("📋 [WorkspacePage] 目标节点数:", targetIds.length, "节点IDs:", targetIds);
    try {
      const blocksToReplace = article.blocks.filter(
        (block) => targetIds.includes(block.nodeId) && !block.isLocked
      );
      const hasUserEdited = blocksToReplace.some((block) => block.isUserEdited);
      console.log("🔍 [WorkspacePage] 待替换段落数:", blocksToReplace.length, "包含用户编辑:", hasUserEdited);
      if (hasUserEdited) {
        const confirmed = window.confirm(
          "有段落已被你修改过，继续生成将覆盖这些内容。确认继续吗？"
        );
        if (!confirmed) {
          console.log("⏹️ [WorkspacePage] 用户取消了生成");
          setLoading(false);
          return;
        }
      }
      const nodeTexts = map.nodes
        .filter((node) => targetIds.includes(node.id))
        .map((node) => ({ nodeId: node.id, text: node.text }));
      console.log("📝 [WorkspacePage] 准备生成的节点内容:", nodeTexts.map(n => n.text).join(", "));

      const generated = await generateBlocksForNodes({
        nodeTexts,
        apiKey,
        model: profile.modelSelection,
        writingPreference: profile.writingPreference,
        tavilyApiKey,
        enableWebSearch: profile.enableWebSearch,
      });
      console.log("✅ [WorkspacePage] 段落生成成功，生成数量:", generated.length);
      upsertBlocks(generated);
      console.log("💾 [WorkspacePage] 段落已更新到文章存储");
    } catch (err) {
      console.error("❌ [WorkspacePage] 生成失败:", err);
      setError("生成失败，请稍后重试。");
    } finally {
      setLoading(false);
      console.log("🏁 [WorkspacePage] 生成流程结束");
    }
  };

  const selectedCount = selectedNodeIds.filter((id) => id !== map.rootId).length;

  return (
    <div className="animate-fadeIn h-[calc(100vh-80px)] flex flex-col">
      {/* 工具栏 - 紧凑设计 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <StatusBadge label={`节点 ${map.nodes.length}`} />
          <StatusBadge
            label={`已选 ${selectedCount}`}
            tone={selectedCount > 0 ? "accent" : "neutral"}
          />
          <StatusBadge label={`段落 ${article.blocks.length}`} />
        </div>
        <div className="flex items-center gap-2">
          {/* 视图切换按钮 - 小屏幕显示 */}
          <button
            className="xl:hidden rounded-full border border-line/60 bg-paper/60 px-3 py-1.5 text-xs font-ui text-dusk transition-all duration-250 ease-out-expo hover:border-clay/60 hover:bg-clay/5"
            onClick={() => setShowArticle(!showArticle)}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showArticle ? (
                  <><path d="M3 3h18v18H3z" /><path d="M3 9h18" /></>
                ) : (
                  <><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></>
                )}
              </svg>
              {showArticle ? "显示导图" : "显示文章"}
            </span>
          </button>
          
          <button
            className="rounded-full border border-line/60 bg-paper/60 px-4 py-1.5 text-xs font-ui text-dusk transition-all duration-250 ease-out-expo hover:border-clay/60 hover:bg-clay/5 hover:text-ink disabled:opacity-50"
            onClick={() => handleGenerate("selected")}
            disabled={loading || selectedCount === 0}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18" />
                <path d="M3 12h18" />
              </svg>
              生成段落
            </span>
          </button>
          <button
            className="rounded-full bg-clay px-4 py-1.5 text-xs font-ui text-paper shadow-soft transition-all duration-250 ease-out-expo hover:bg-clay-light hover:shadow-lift disabled:opacity-60"
            onClick={() => handleGenerate("all")}
            disabled={loading}
          >
            <span className="flex items-center gap-1.5">
              {loading ? (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3v18" />
                  <path d="M3 12h18" />
                </svg>
              )}
              {loading ? "生成中..." : "生成全文"}
            </span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="rounded-xl border border-red-200/60 bg-red-50/80 px-3 py-2 text-sm text-red-700 animate-floatIn mb-3 flex-shrink-0">
          {error}
        </div>
      )}

      {/* 主内容区 - 响应式布局，充分利用空间 */}
      <div className="grid gap-4 xl:grid-cols-[1fr_450px] 2xl:grid-cols-[1fr_500px] flex-1 min-h-0">
        {/* 思维导图区域 */}
        <section className={`flex flex-col min-h-0 ${!showArticle ? 'flex' : 'hidden xl:flex'}`}>
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <div>
              <p className="text-[10px] font-ui uppercase tracking-[0.15em] text-dusk/60">
                MindMap
              </p>
              <h2 className="font-display text-lg text-ink">思维导图</h2>
            </div>
            <span className="text-[10px] font-ui text-dusk/50">
              Shift+点击多选
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <MindMapEditor />
          </div>
        </section>

        {/* 文章区域 */}
        <section className={`flex flex-col min-h-0 ${showArticle ? 'flex' : 'hidden xl:flex'}`}>
          <div className="mb-2 flex-shrink-0">
            <p className="text-[10px] font-ui uppercase tracking-[0.15em] text-dusk/60">
              Article
            </p>
            <h2 className="font-display text-lg text-ink">文章实时对照</h2>
          </div>
          
          <input
            className="w-full rounded-xl border border-line/60 bg-white/70 px-3 py-2 text-base font-display text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 placeholder:font-body focus:border-clay focus:bg-white focus:shadow-glow mb-3 flex-shrink-0"
            value={article.title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="文章标题"
          />
          
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {orderedBlocks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line/60 bg-paper/40 px-4 py-10 text-center">
                <svg className="mx-auto h-10 w-10 text-dusk/30 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-dusk/60">生成后文章内容会在这里出现</p>
              </div>
            )}
            {orderedBlocks.map((block, index) => (
              <div key={block!.id} style={{ animationDelay: `${index * 30}ms` }} className="animate-floatIn">
                <ArticleBlockEditor
                  block={block!}
                  onUpdate={updateBlockContent}
                  onToggleLock={toggleBlockLock}
                  isHovered={hoveredNodeId === block!.nodeId}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
