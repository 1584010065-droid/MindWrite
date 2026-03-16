import { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import type { MindMap } from "../../types/mindmap";
import { useMindMapStore } from "../../stores/mindmapStore";
import MindMapNode from "./MindMapNode";

const nodeTypes = { mindNode: MindMapNode };

function buildLayout(map: MindMap) {
  const nodesByParent = new Map<string | null, typeof map.nodes>();
  map.nodes.forEach((node) => {
    const key = node.parentId ?? null;
    const list = nodesByParent.get(key) ?? [];
    list.push(node);
    nodesByParent.set(key, list);
  });

  nodesByParent.forEach((list, key) => {
    list.sort((a, b) => a.order - b.order);
    nodesByParent.set(key, list);
  });

  const layout: { id: string; x: number; y: number }[] = [];
  let cursor = 0;

  const walk = (nodeId: string, depth: number) => {
    const current = map.nodes.find((node) => node.id === nodeId);
    if (!current) return;
    const y = cursor * 120;
    const x = depth * 240;
    layout.push({ id: nodeId, x, y });
    cursor += 1;
    const children = nodesByParent.get(nodeId) ?? [];
    children.forEach((child) => walk(child.id, depth + 1));
  };

  walk(map.rootId, 0);

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
  const setHoveredNodeId = useMindMapStore((state) => state.setHoveredNodeId);

  const layout = useMemo(() => buildLayout(map), [map]);
  const nodes = layout.map((pos) => {
    const node = map.nodes.find((item) => item.id === pos.id);
    return {
      id: pos.id,
      position: { x: pos.x, y: pos.y },
      type: "mindNode",
      data: {
        label: node?.text ?? "",
        isSelected: selectedNodeIds.includes(pos.id),
        isEditing: editingNodeId === pos.id,
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
        onHover: setHoveredNodeId,
      },
    };
  });

  const edges = map.nodes
    .filter((node) => node.parentId)
    .map((node) => ({
      id: `edge-${node.parentId}-${node.id}`,
      source: node.parentId as string,
      target: node.id,
      style: { stroke: "rgba(43, 30, 22, 0.4)", strokeWidth: 1.2 },
    }));

  return (
    <div className="h-full rounded-2xl border border-line/60 bg-white/60 shadow-soft">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => selectNode(map.rootId)}
      >
        <Background color="rgba(43, 30, 22, 0.12)" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
