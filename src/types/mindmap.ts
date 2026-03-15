export type MindMapResource = {
  id: string;
  type: "url" | "text";
  value: string;
};

export type MindMapNode = {
  id: string;
  parentId: string | null;
  text: string;
  order: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
  };
  resources?: MindMapResource[];
};

export type MindMap = {
  id: string;
  rootId: string;
  nodes: MindMapNode[];
};
