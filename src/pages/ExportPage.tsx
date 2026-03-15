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

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl border border-line/70 bg-white/70 p-8 shadow-soft">
        <p className="text-sm font-ui uppercase tracking-[0.2em] text-dusk/70">
          Preview
        </p>
        <div
          ref={ref}
          className="prose prose-sm mt-6 max-w-none text-ink"
        >
          <h1>{article.title}</h1>
          {orderedBlocks.length === 0 ? (
            <p>还没有内容可导出，请先在工作区生成文章。</p>
          ) : (
            orderedBlocks.map((block) => (
              <div key={block!.id} dangerouslySetInnerHTML={{ __html: block!.contentHtml }} />
            ))
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-line/70 bg-paper/80 p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink">导出 PDF</h2>
          <p className="mt-2 text-sm text-dusk">
            完成检查后即可导出 PDF。当前纸张：{profile.exportPreset.toUpperCase()}。
          </p>
          <button
            className="mt-6 w-full rounded-full bg-clay px-6 py-3 text-sm font-ui text-paper shadow-soft disabled:cursor-not-allowed disabled:bg-clay/50"
            onClick={handleExport}
            disabled={orderedBlocks.length === 0}
          >
            导出 PDF
          </button>
        </div>
        <div className="rounded-3xl border border-line/70 bg-white/60 p-6 text-sm text-dusk">
          <p>提示：导出失败时，请尝试刷新页面或使用复制富文本作为备选。</p>
        </div>
      </aside>
    </div>
  );
}
