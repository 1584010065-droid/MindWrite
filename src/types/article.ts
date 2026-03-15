export type ArticleBlock = {
  id: string;
  nodeId: string;
  contentHtml: string;
  isLocked: boolean;
  isUserEdited: boolean;
};

export type Article = {
  id: string;
  title: string;
  blocks: ArticleBlock[];
};
