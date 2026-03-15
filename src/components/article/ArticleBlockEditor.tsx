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
      className={`rounded-3xl border px-5 py-4 shadow-soft transition ${
        highlight ? "border-clay bg-white" : "border-line/70 bg-paper/70"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-ui uppercase tracking-[0.18em] text-dusk/70">
          段落 · {block.nodeId.slice(0, 6)}
        </p>
        <button
          className={`rounded-full border px-3 py-1 text-xs font-ui transition ${
            block.isLocked
              ? "border-clay bg-clay text-paper"
              : "border-line/70 text-dusk hover:border-clay"
          }`}
          onClick={() => onToggleLock(block.id)}
        >
          {block.isLocked ? "已锁定" : "锁定"}
        </button>
      </div>
      <div className="prose prose-sm mt-3 max-w-none text-ink">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
