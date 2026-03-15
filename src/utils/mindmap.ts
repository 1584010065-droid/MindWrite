import type { MindMap } from "../types/mindmap";

export function getDFSOrder(map: MindMap): string[] {
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

  const result: string[] = [];
  const walk = (id: string) => {
    result.push(id);
    const children = nodesByParent.get(id) ?? [];
    children.forEach((child) => walk(child.id));
  };

  walk(map.rootId);
  return result;
}
