import OpenAI from "openai";
import type { MindMap } from "../../types/mindmap";
import type { ArticleBlock } from "../../types/article";
import { createId } from "../../utils/id";

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

type TreeNode = {
  text: string;
  children?: TreeNode[];
};

function getClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
    dangerouslyAllowBrowser: true,
  });
}

function extractTextFromResponse(response: any) {
  if (typeof response?.output_text === "string") return response.output_text;
  const output = response?.output?.[0]?.content?.[0]?.text;
  if (typeof output === "string") return output;
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  return "";
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const slice = text.slice(first, last + 1);
      return JSON.parse(slice);
    }
    throw error;
  }
}

function treeToMindMap(tree: TreeNode): MindMap {
  const nodes = [] as MindMap["nodes"];
  const rootId = "root";

  const walk = (node: TreeNode, parentId: string | null, depthOrder: { value: number }) => {
    const id = parentId ? createId("node") : rootId;
    const order = depthOrder.value++;
    nodes.push({
      id,
      parentId,
      text: node.text,
      order,
    });
    node.children?.forEach((child) => walk(child, id, depthOrder));
  };

  walk(tree, null, { value: 0 });

  return {
    id: "default",
    rootId,
    nodes,
  };
}

export async function generateMindMapFromSentence(
  sentence: string,
  apiKey: string,
  model: string
): Promise<MindMap> {
  const client = getClient(apiKey);
  const prompt = `请将下面一句话扩展为结构化思维导图，输出严格 JSON：\n\n一句话：${sentence}\n\n要求：\n- 输出 JSON，结构为 {"text":"主题","children":[{"text":"观点1","children":[...]}, ...]}\n- 所有字段必须用双引号\n- 不要包含任何额外解释文字`;

  const response = await client.responses.create({
    model,
    input: prompt,
  });

  const text = extractTextFromResponse(response);
  const json = safeJsonParse(text) as TreeNode;
  return treeToMindMap(json);
}

export async function generateBlocksForNodes(
  nodeTexts: { nodeId: string; text: string }[],
  apiKey: string,
  model: string,
  writingPreference: string
): Promise<ArticleBlock[]> {
  const client = getClient(apiKey);
  const prompt = `请根据以下节点生成文章段落，输出严格 JSON：\n\n写作偏好：${writingPreference}\n\n节点列表：\n${nodeTexts
    .map((node) => `- ${node.nodeId}: ${node.text}`)
    .join("\n")}\n\n输出格式：{"blocks":[{"nodeId":"...","html":"<p>...</p>"}]}\n要求：\n- html 字段必须是可直接渲染的段落 HTML\n- 不要包含多余解释或 Markdown 代码块`;

  const response = await client.responses.create({
    model,
    input: prompt,
  });

  const text = extractTextFromResponse(response);
  const json = safeJsonParse(text) as { blocks: { nodeId: string; html: string }[] };

  return json.blocks.map((block) => ({
    id: createId("block"),
    nodeId: block.nodeId,
    contentHtml: block.html,
    isLocked: false,
    isUserEdited: false,
  }));
}
