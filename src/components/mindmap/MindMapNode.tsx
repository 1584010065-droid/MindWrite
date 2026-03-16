import { memo, useEffect, useState } from "react";
import type { NodeProps } from "reactflow";

const MindMapNode = memo(({ id, data }: NodeProps) => {
  const {
    label,
    isSelected,
    isEditing,
    onSelect,
    onEditStart,
    onEditCommit,
    onAddChild,
  } = data as {
    label: string;
    isSelected: boolean;
    isEditing: boolean;
    onSelect: (id: string, multi: boolean) => void;
    onEditStart: (id: string) => void;
    onEditCommit: (id: string, text: string) => void;
    onAddChild: (id: string) => void;
  };

  const [value, setValue] = useState(label);

  useEffect(() => {
    setValue(label);
  }, [label]);

  return (
    <div
      className={`min-w-[180px] rounded-xl border px-4 py-3 shadow-soft transition-all duration-250 ease-out-expo ${
        isSelected
          ? "border-clay bg-white shadow-glow"
          : "border-line/60 bg-paper/80 hover:border-line-strong hover:bg-white/90"
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id, event.shiftKey);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEditStart(id);
      }}
    >
      {isEditing ? (
        <input
          className="w-full border-b border-clay/60 bg-transparent text-sm font-ui text-ink focus:outline-none focus:border-clay"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => onEditCommit(id, value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onEditCommit(id, value);
            }
          }}
          autoFocus
        />
      ) : (
        <p className="text-sm font-ui text-ink leading-relaxed">{label}</p>
      )}
      <button
        className="mt-2 rounded-full border border-line/50 bg-paper/60 px-3 py-1 text-[11px] font-ui text-dusk transition-all duration-250 ease-out-expo hover:border-clay/60 hover:text-clay hover:bg-clay/5"
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(id);
        }}
      >
        <span className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          子节点
        </span>
      </button>
    </div>
  );
});

export default MindMapNode;
