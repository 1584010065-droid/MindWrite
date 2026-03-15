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
      className={`min-w-[180px] rounded-2xl border px-4 py-3 shadow-soft transition ${
        isSelected
          ? "border-clay bg-white text-ink"
          : "border-line/70 bg-paper/80 text-dusk"
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
          className="w-full border-b border-line/60 bg-transparent text-sm font-ui text-ink focus:outline-none"
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
        <p className="text-sm font-ui text-ink">{label}</p>
      )}
      <button
        className="mt-2 rounded-full border border-line/60 px-3 py-1 text-[11px] font-ui text-dusk hover:border-clay"
        onClick={(event) => {
          event.stopPropagation();
          onAddChild(id);
        }}
      >
        + 子节点
      </button>
    </div>
  );
});

export default MindMapNode;
