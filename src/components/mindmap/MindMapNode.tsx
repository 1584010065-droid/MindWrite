import { memo, useEffect, useState, useRef } from "react";
import { Handle, Position, type NodeProps } from "reactflow";

const depthColors = [
  { bg: "bg-clay/10", border: "border-clay", text: "text-clay", accent: "bg-clay" },
  { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700", accent: "bg-amber-400" },
  { bg: "bg-emerald-50", border: "border-emerald-400", text: "text-emerald-700", accent: "bg-emerald-400" },
  { bg: "bg-sky-50", border: "border-sky-400", text: "text-sky-700", accent: "bg-sky-400" },
  { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-700", accent: "bg-violet-400" },
];

const MindMapNode = memo(({ id, data }: NodeProps) => {
  const {
    label,
    depth = 0,
    isSelected,
    isEditing,
    isDropTarget,
    isDragging,
    onSelect,
    onEditStart,
    onEditCommit,
    onAddChild,
    onDelete,
    onHover,
    onDragStart,
    onDragEnd,
  } = data as {
    label: string;
    depth: number;
    isSelected: boolean;
    isEditing: boolean;
    isDropTarget: boolean;
    isDragging: boolean;
    onSelect: (id: string, multi: boolean) => void;
    onEditStart: (id: string) => void;
    onEditCommit: (id: string, text: string) => void;
    onAddChild: (id: string) => void;
    onDelete: (id: string) => void;
    onHover: (id: string | null) => void;
    onDragStart: (id: string) => void;
    onDragEnd: () => void;
  };

  const [value, setValue] = useState(label);
  const [showActions, setShowActions] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const colorScheme = depthColors[depth % depthColors.length];

  useEffect(() => {
    setValue(label);
  }, [label]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    if ((e.target as HTMLElement).tagName === "BUTTON") return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setIsDraggingNode(true);
    onDragStart(id);

    const handleMouseMove = () => {
      if (!dragStartPos.current) return;
    };

    const handleMouseUp = () => {
      setIsDraggingNode(false);
      onDragEnd();
      dragStartPos.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onEditCommit(id, value);
    } else if (e.key === "Escape") {
      setValue(label);
      onEditCommit(id, label);
    }
  };

  return (
    <div
      ref={nodeRef}
      className={`
        relative min-w-[200px] max-w-[320px] rounded-xl border-2 px-4 py-3
        shadow-soft transition-all duration-200 ease-out cursor-pointer
        ${isSelected
          ? `${colorScheme.bg} ${colorScheme.border} shadow-glow ring-2 ring-offset-2 ring-offset-white/50 ${colorScheme.border.replace('border-', 'ring-')}`
          : `border-line/40 bg-white/90 hover:border-line-strong hover:shadow-lift`
        }
        ${isDropTarget ? "ring-2 ring-clay ring-offset-2" : ""}
        ${isDragging || isDraggingNode ? "opacity-60 scale-95" : ""}
      `}
      onClick={(event) => {
        event.stopPropagation();
        if (!isDraggingNode) {
          onSelect(id, event.shiftKey);
        }
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEditStart(id);
      }}
      onMouseEnter={() => {
        onHover(id);
        setShowActions(true);
      }}
      onMouseLeave={() => {
        onHover(null);
        setShowActions(false);
      }}
      onMouseDown={handleMouseDown}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2 !border-line-strong !transition-all hover:!scale-125 hover:!border-clay"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2 !border-line-strong !transition-all hover:!scale-125 hover:!border-clay"
        isConnectable={false}
      />

      <div className="flex items-start gap-2">
        <div
          className={`
            flex-shrink-0 w-2 h-2 rounded-full mt-1.5
            ${isSelected ? colorScheme.accent : "bg-line-strong"}
          `}
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              className="w-full bg-transparent text-sm font-ui text-ink focus:outline-none border-b-2 border-clay/60 focus:border-clay pb-1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onBlur={() => onEditCommit(id, value)}
              onKeyDown={handleKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p className="text-sm font-ui text-ink leading-relaxed break-words">{label}</p>
          )}
        </div>
      </div>

      <div
        className={`
          flex items-center gap-1 mt-2 pt-2 border-t border-line/30
          transition-opacity duration-200
          ${showActions || isSelected ? "opacity-100" : "opacity-0"}
        `}
      >
        <button
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-ui text-dusk/70 bg-paper/60 rounded-md border border-line/30 transition-all duration-200 hover:border-clay/50 hover:text-clay hover:bg-clay/5 cursor-pointer"
          onClick={(event) => {
            event.stopPropagation();
            onAddChild(id);
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          添加子节点
        </button>

        {depth > 0 && (
          <button
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-ui text-red-500/70 bg-red-50/50 rounded-md border border-red-200/30 transition-all duration-200 hover:border-red-300 hover:text-red-600 hover:bg-red-100/50 cursor-pointer"
            onClick={(event) => {
              event.stopPropagation();
              if (window.confirm("确定要删除此节点及其所有子节点吗？")) {
                onDelete(id);
              }
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            删除
          </button>
        )}
      </div>

      {depth > 0 && (
        <div
          className={`
            absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full
            ${isSelected ? colorScheme.accent : "bg-line/40"}
          `}
        />
      )}
    </div>
  );
});

MindMapNode.displayName = "MindMapNode";

export default MindMapNode;
