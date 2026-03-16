import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import type { ArticleBlock } from "../../types/article";

export default function ArticleBlockEditor({
  block,
  onUpdate,
  onToggleLock,
  highlight,
}: {
  block: ArticleBlock;
  onUpdate: (id: string, html: string) => void;
  onToggleLock: (id: string) => void;
  highlight?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      Placeholder.configure({ placeholder: "在这里补充段落内容..." }),
    ],
    content: block.contentHtml,
    editable: !block.isLocked,
    onUpdate: ({ editor }) => {
      onUpdate(block.id, editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && block.contentHtml !== editor.getHTML()) {
      editor.commands.setContent(block.contentHtml);
    }
  }, [block.contentHtml, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!block.isLocked);
    }
  }, [block.isLocked, editor]);

  return (
    <div
      className={`group rounded-2xl border px-5 py-4 shadow-soft transition-all duration-250 ease-out-expo ${
        highlight 
          ? "border-clay bg-white shadow-glow" 
          : "border-line/60 bg-paper/60 hover:border-line-strong hover:bg-white/80"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-ui uppercase tracking-[0.15em] text-dusk/60">
            段落
          </span>
          <span className="text-xs font-mono text-dusk/40">
            {block.nodeId.slice(0, 6)}
          </span>
          {block.isUserEdited && (
            <span className="text-[10px] font-ui text-sage bg-sage/10 px-1.5 py-0.5 rounded">
              已编辑
            </span>
          )}
        </div>
        <button
          className={`rounded-full border px-3 py-1.5 text-xs font-ui transition-all duration-250 ease-out-expo ${
            block.isLocked
              ? "border-clay bg-clay text-paper shadow-soft"
              : "border-line/60 text-dusk hover:border-clay/60 hover:text-clay"
          }`}
          onClick={() => onToggleLock(block.id)}
          title={block.isLocked ? "解锁段落" : "锁定段落"}
        >
          <span className="flex items-center gap-1.5">
            {block.isLocked ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                已锁定
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                  <path d="M12 16v3" />
                </svg>
                锁定
              </>
            )}
          </span>
        </button>
      </div>
      <div className="prose prose-sm max-w-none text-ink">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
