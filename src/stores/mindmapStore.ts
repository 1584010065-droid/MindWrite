import { create } from "zustand";
import type { MindMap, MindMapNode } from "../types/mindmap";
import { createId } from "../utils/id";
import { loadMindMap, saveMindMap } from "../services/storage/mindmapStorage";

const defaultMindMap: MindMap = {
  id: "default",
  rootId: "root",
  nodes: [
    {
      id: "root",
      parentId: null,
      text: "我的主题",
      order: 0,
    },
  ],
};

type MindMapState = {
  map: MindMap;
  selectedNodeIds: string[];
  editingNodeId: string | null;
  hoveredNodeId: string | null;
  setMap: (map: MindMap) => void;
  selectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  setEditingNodeId: (id: string | null) => void;
  setHoveredNodeId: (id: string | null) => void;
  updateNodeText: (id: string, text: string) => void;
  addChildNode: (parentId: string) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, newParentId: string | null, newOrder: number) => void;
  reorderSiblings: (parentId: string | null) => void;
  loadFromStorage: () => Promise<void>;
};

function getChildren(nodes: MindMapNode[], parentId: string | null) {
  return nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order);
}

function getDescendantIds(nodes: MindMapNode[], nodeId: string): string[] {
  const descendants: string[] = [nodeId];
  const children = nodes.filter((node) => node.parentId === nodeId);
  children.forEach((child) => {
    descendants.push(...getDescendantIds(nodes, child.id));
  });
  return descendants;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  map: defaultMindMap,
  selectedNodeIds: [],
  editingNodeId: null,
  hoveredNodeId: null,
  setMap: (map) => {
    set({ map, selectedNodeIds: [map.rootId] });
    void saveMindMap(map);
  },
  selectNode: (id) => set({ selectedNodeIds: [id] }),
  toggleNodeSelection: (id) => {
    const current = get().selectedNodeIds;
    if (current.includes(id)) {
      set({ selectedNodeIds: current.filter((item) => item !== id) });
    } else {
      set({ selectedNodeIds: [...current, id] });
    }
  },
  setEditingNodeId: (id) => set({ editingNodeId: id }),
  setHoveredNodeId: (id) => set({ hoveredNodeId: id }),
  updateNodeText: (id, text) => {
    const map = get().map;
    const nodes = map.nodes.map((node) => (node.id === id ? { ...node, text } : node));
    const next = { ...map, nodes };
    set({ map: next });
    void saveMindMap(next);
  },
  addChildNode: (parentId) => {
    const map = get().map;
    const children = getChildren(map.nodes, parentId);
    const newNode: MindMapNode = {
      id: createId("node"),
      parentId,
      text: "新节点",
      order: children.length,
    };
    const next = { ...map, nodes: [...map.nodes, newNode] };
    set({ map: next, selectedNodeIds: [newNode.id], editingNodeId: newNode.id });
    void saveMindMap(next);
  },
  deleteNode: (id) => {
    const map = get().map;
    if (id === map.rootId) return;
    const descendantIds = getDescendantIds(map.nodes, id);
    const nodes = map.nodes.filter((node) => !descendantIds.includes(node.id));
    const next = { ...map, nodes };
    set({ map: next, selectedNodeIds: [map.rootId] });
    void saveMindMap(next);
  },
  moveNode: (nodeId, newParentId, newOrder) => {
    const map = get().map;
    if (nodeId === map.rootId) return;
    const descendantIds = getDescendantIds(map.nodes, nodeId);
    if (newParentId && descendantIds.includes(newParentId)) return;
    const nodes = map.nodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, parentId: newParentId, order: newOrder };
      }
      return node;
    });
    const next = { ...map, nodes };
    set({ map: next });
    void saveMindMap(next);
  },
  reorderSiblings: (parentId) => {
    const map = get().map;
    const siblings = getChildren(map.nodes, parentId);
    const updates = new Map<string, number>();
    siblings.forEach((node, index) => {
      if (node.order !== index) {
        updates.set(node.id, index);
      }
    });
    if (updates.size === 0) return;
    const nodes = map.nodes.map((node) => {
      const newOrder = updates.get(node.id);
      if (newOrder !== undefined) {
        return { ...node, order: newOrder };
      }
      return node;
    });
    const next = { ...map, nodes };
    set({ map: next });
    void saveMindMap(next);
  },
  loadFromStorage: async () => {
    const stored = await loadMindMap();
    if (stored) {
      set({ map: stored, selectedNodeIds: [stored.rootId] });
    }
  },
}));
