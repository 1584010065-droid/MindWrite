import { useEffect, useMemo, useRef } from "react";
import html2pdf from "html2pdf.js";
import { useArticleStore } from "../stores/articleStore";
import { useMindMapStore } from "../stores/mindmapStore";
import { useProfileStore } from "../stores/profileStore";
import { getDFSOrder } from "../utils/mindmap";

export default function ExportPage() {
  const article = useArticleStore((state) => state.article);
  const map = useMindMapStore((state) => state.map);
  const loadArticle = useArticleStore((state) => state.loadFromStorage);
  const loadMindMap = useMindMapStore((state) => state.loadFromStorage);
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadFromStorage);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadProfile();
    void loadMindMap();
    void loadArticle();
  }, [loadProfile, loadMindMap, loadArticle]);

  const orderedBlocks = useMemo(() => {
    const order = getDFSOrder(map);
    const blockMap = new Map(article.blocks.map((block) => [block.nodeId, block]));
    return order
      .filter((id) => id !== map.rootId)
      .map((id) => blockMap.get(id))
      .filter(Boolean);
  }, [article.blocks, map]);

  const handleExport = () => {
    if (!ref.current || orderedBlocks.length === 0) return;
    html2pdf()
      .set({
        margin: 12,
        filename: `${article.title || "mindwrite"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: profile.exportPreset, orientation: "portrait" },
      })
      .from(ref.current)
      .save();
  };

  const wordCount = useMemo(() => {
    return orderedBlocks.reduce((count, block) => {
      const text = block?.contentHtml?.replace(/<[^>]*>/g, '') || '';
      return count + text.length;
    }, 0);
  }, [orderedBlocks]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] animate-fadeIn">
      {/* 预览区域 */}
      <section className="rounded-3xl border border-line/60 bg-white/80 p-6 md:p-8 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-ui uppercase tracking-[0.2em] text-dusk/70">
              Preview
            </p>
            <h2 className="font-display text-2xl text-ink mt-1">预览</h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-ui text-dusk/60">字数</p>
            <p className="text-lg font-display text-ink">{wordCount}</p>
          </div>
        </div>
        
        <div
          ref={ref}
          className="prose prose-sm max-w-none text-ink bg-paper/40 rounded-2xl p-6 md:p-8 min-h-[400px]"
        >
          <h1 className="font-display text-3xl text-ink mb-6">{article.title || "无标题"}</h1>
          {orderedBlocks.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-dusk/30 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-dusk/60">还没有内容可导出，请先在工作区生成文章。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedBlocks.map((block) => (
                <div key={block!.id} dangerouslySetInnerHTML={{ __html: block!.contentHtml }} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 侧边栏 */}
      <aside className="space-y-6">
        {/* 导出卡片 */}
        <div className="rounded-3xl border border-line/60 bg-paper/70 p-6 shadow-soft">
          <h2 className="font-display text-xl text-ink">导出 PDF</h2>
          <p className="mt-2 text-sm text-dusk/80 leading-relaxed">
            完成检查后即可导出 PDF。当前纸张：{profile.exportPreset.toUpperCase()}。
          </p>
          
          <div className="mt-6 space-y-3">
            <button
              className="w-full group rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper shadow-soft transition-all duration-250 ease-out-expo hover:bg-clay-light hover:shadow-lift disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleExport}
              disabled={orderedBlocks.length === 0}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                导出 PDF
              </span>
            </button>
            
            <button
              className="w-full rounded-full border border-line/60 bg-white/60 px-6 py-3 text-sm font-ui text-dusk transition-all duration-250 ease-out-expo hover:border-clay/60 hover:bg-clay/5 hover:text-ink disabled:opacity-50"
              onClick={() => {
                const content = orderedBlocks.map(b => b?.contentHtml?.replace(/<[^>]*>/g, '')).join('\n\n');
                navigator.clipboard.writeText(`${article.title}\n\n${content}`);
              }}
              disabled={orderedBlocks.length === 0}
            >
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                复制纯文本
              </span>
            </button>
          </div>
        </div>

        {/* 提示卡片 */}
        <div className="rounded-3xl border border-line/60 bg-white/60 p-6 shadow-soft">
          <h3 className="font-display text-lg text-ink">导出提示</h3>
          <ul className="mt-3 space-y-2 text-sm text-dusk/80">
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>导出前请检查文章标题和内容</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>PDF 导出可能需要几秒钟时间</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="h-4 w-4 text-sage flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>导出失败时可尝试复制文本作为备选</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
