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
  isHovered,
}: {
  block: ArticleBlock;
  onUpdate: (id: string, html: string) => void;
  onToggleLock: (id: string) => void;
  isHovered?: boolean;
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
    <div className="group relative py-4 border-b border-line/30 last:border-b-0">
      {/* 悬停时显示的锁定按钮 */}
      <div className="absolute right-0 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          className={`rounded-full border px-2.5 py-1 text-[10px] font-ui transition-all duration-200 ${
            block.isLocked
              ? "border-clay bg-clay text-paper"
              : "border-line/60 text-dusk hover:border-clay/60 hover:text-clay"
          }`}
          onClick={() => onToggleLock(block.id)}
          title={block.isLocked ? "解锁段落" : "锁定段落"}
        >
          <span className="flex items-center gap-1">
            {block.isLocked ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                已锁定
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* 段落内容 */}
      <div className={`prose prose-sm max-w-none transition-colors duration-200 ${
        isHovered ? "text-blue-600" : "text-ink"
      }`}>
        <EditorContent editor={editor} />
      </div>

      {/* 底部元信息 */}
      <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[10px] font-mono text-dusk/30">
          {block.nodeId.slice(0, 6)}
        </span>
        {block.isUserEdited && (
          <span className="text-[10px] font-ui text-sage">
            已编辑
          </span>
        )}
      </div>
    </div>
  );
}
