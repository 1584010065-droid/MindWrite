import { useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  BezierEdge,
  MarkerType,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { MindMap } from "../../types/mindmap";
import { useMindMapStore } from "../../stores/mindmapStore";
import MindMapNode from "./MindMapNode";

const nodeTypes = { mindNode: MindMapNode };
const edgeTypes = {
  default: BezierEdge,
};

const HORIZONTAL_GAP = 280;
const VERTICAL_GAP = 100;

function buildLayout(map: MindMap): Map<string, { x: number; y: number; depth: number }> {
  const nodesByParent = new Map<string | null, typeof map.nodes>();
  map.nodes.forEach((node) => {
    const key = node.parentId ?? null;
    const list = nodesByParent.get(key) ?? [];
    list.push(node);
    nodesByParent.set(key, list);
  });

  nodesByParent.forEach((list) => {
    list.sort((a, b) => a.order - b.order);
  });

  const layout = new Map<string, { x: number; y: number; depth: number }>();
  const subtreeHeights = new Map<string, number>();

  const calculateSubtreeHeight = (nodeId: string): number => {
    const children = nodesByParent.get(nodeId) ?? [];
    if (children.length === 0) return 1;
    const height = children.reduce((sum, child) => sum + calculateSubtreeHeight(child.id), 0);
    subtreeHeights.set(nodeId, height);
    return height;
  };

  calculateSubtreeHeight(map.rootId);

  const positionNode = (nodeId: string, depth: number, startY: number): number => {
    const children = nodesByParent.get(nodeId) ?? [];
    const subtreeHeight = subtreeHeights.get(nodeId) ?? 1;
    const y = startY + (subtreeHeight * VERTICAL_GAP) / 2 - VERTICAL_GAP / 2;
    const x = depth * HORIZONTAL_GAP;
    layout.set(nodeId, { x, y, depth });

    let currentY = startY;
    children.forEach((child) => {
      const childHeight = subtreeHeights.get(child.id) ?? 1;
      positionNode(child.id, depth + 1, currentY);
      currentY += childHeight * VERTICAL_GAP;
    });

    return subtreeHeight;
  };

  positionNode(map.rootId, 0, 0);

  return layout;
}

export default function MindMapEditor() {
  const map = useMindMapStore((state) => state.map);
  const selectedNodeIds = useMindMapStore((state) => state.selectedNodeIds);
  const editingNodeId = useMindMapStore((state) => state.editingNodeId);
  const selectNode = useMindMapStore((state) => state.selectNode);
  const toggleNodeSelection = useMindMapStore((state) => state.toggleNodeSelection);
  const updateNodeText = useMindMapStore((state) => state.updateNodeText);
  const setEditingNodeId = useMindMapStore((state) => state.setEditingNodeId);
  const addChildNode = useMindMapStore((state) => state.addChildNode);
  const deleteNode = useMindMapStore((state) => state.deleteNode);
  const setHoveredNodeId = useMindMapStore((state) => state.setHoveredNodeId);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const reactFlowInstance = useRef<any>(null);

  const layout = useMemo(() => buildLayout(map), [map]);

  const nodes: Node[] = useMemo(() => {
    return map.nodes.map((node) => {
      const pos = layout.get(node.id);
      const depth = pos?.depth ?? 0;
      return {
        id: node.id,
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        type: "mindNode",
        draggable: false,
        data: {
          label: node.text,
          depth,
          isSelected: selectedNodeIds.includes(node.id),
          isEditing: editingNodeId === node.id,
          isDropTarget: false,
          isDragging: draggedNodeId === node.id,
          onSelect: (id: string, multi: boolean) => {
            if (multi) {
              toggleNodeSelection(id);
            } else {
              selectNode(id);
            }
          },
          onEditStart: setEditingNodeId,
          onEditCommit: (id: string, text: string) => {
            updateNodeText(id, text);
            setEditingNodeId(null);
          },
          onAddChild: addChildNode,
          onDelete: deleteNode,
          onHover: setHoveredNodeId,
          onDragStart: setDraggedNodeId,
          onDragEnd: () => setDraggedNodeId(null),
        },
      };
    });
  }, [
    map.nodes,
    layout,
    selectedNodeIds,
    editingNodeId,
    draggedNodeId,
    selectNode,
    toggleNodeSelection,
    setEditingNodeId,
    updateNodeText,
    addChildNode,
    deleteNode,
    setHoveredNodeId,
  ]);

  const edges: Edge[] = useMemo(() => {
    return map.nodes
      .filter((node) => node.parentId)
      .map((node) => {
        const isHighlighted = selectedNodeIds.includes(node.id) || selectedNodeIds.includes(node.parentId!);

        return {
          id: `edge-${node.parentId}-${node.id}`,
          source: node.parentId as string,
          target: node.id,
          type: "default",
          style: {
            stroke: isHighlighted ? "rgba(139, 90, 43, 0.8)" : "rgba(43, 30, 22, 0.35)",
            strokeWidth: isHighlighted ? 2.5 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10,
            height: 10,
            color: isHighlighted ? "rgba(139, 90, 43, 0.7)" : "rgba(43, 30, 22, 0.3)",
          },
          pathOptions: {
            curvature: 0.25,
          },
        };
      });
  }, [map.nodes, selectedNodeIds]);

  return (
    <div className="h-full rounded-2xl border border-line/60 bg-white/60 shadow-soft overflow-hidden">
      <ReactFlow
        ref={reactFlowInstance}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => selectNode(map.rootId)}
        defaultEdgeOptions={{
          type: "default",
          style: { stroke: "rgba(43, 30, 22, 0.35)", strokeWidth: 2 },
        }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="rgba(43, 30, 22, 0.08)" gap={24} />
        <Controls
          showInteractive={false}
          className="!bg-white/80 !border-line/40 !rounded-lg !shadow-soft"
        />
      </ReactFlow>
    </div>
  );
}
