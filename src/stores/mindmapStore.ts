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
  setMap: (map: MindMap) => void;
  selectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  setEditingNodeId: (id: string | null) => void;
  updateNodeText: (id: string, text: string) => void;
  addChildNode: (parentId: string) => void;
  loadFromStorage: () => Promise<void>;
};

function getChildren(nodes: MindMapNode[], parentId: string) {
  return nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.order - b.order);
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  map: defaultMindMap,
  selectedNodeIds: [],
  editingNodeId: null,
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
  loadFromStorage: async () => {
    const stored = await loadMindMap();
    if (stored) {
      set({ map: stored, selectedNodeIds: [stored.rootId] });
    }
  },
}));
