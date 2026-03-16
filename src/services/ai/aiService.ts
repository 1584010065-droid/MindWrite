import OpenAI from "openai";
import type { MindMap } from "../../types/mindmap";
import type { ArticleBlock } from "../../types/article";
import { createId } from "../../utils/id";
import { tavilySearch, formatSearchResultsForPrompt } from "../search/tavilyService";

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const REQUEST_TIMEOUT = 60000;

type TreeNode = {
  text: string;
  children?: TreeNode[];
};

function getClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: BASE_URL,
    dangerouslyAllowBrowser: true,
    timeout: REQUEST_TIMEOUT,
  });
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

export type GenerateMindMapOptions = {
  sentence: string;
  apiKey: string;
  model: string;
  tavilyApiKey?: string;
  enableWebSearch?: boolean;
};

export async function generateMindMapFromSentence(
  options: GenerateMindMapOptions
): Promise<MindMap> {
  const { sentence, apiKey, model, tavilyApiKey, enableWebSearch } = options;

  console.log("🤖 [aiService] 开始生成思维导图，主题:", sentence);
  console.log("⚙️ [aiService] 使用模型:", model, "网络搜索:", enableWebSearch ? "开启" : "关闭");

  const client = getClient(apiKey);

  let searchContext = "";
  if (enableWebSearch && tavilyApiKey) {
    console.log("🔍 [aiService] 开始网络搜索...");
    try {
      const searchResult = await tavilySearch(sentence, tavilyApiKey, {
        maxResults: 5,
        searchDepth: "advanced",
        includeAnswer: true,
      });
      searchContext = formatSearchResultsForPrompt(searchResult);
      console.log("✅ [aiService] 网络搜索完成，获取到搜索资料");
    } catch (error) {
      console.warn("⚠️ [aiService] Tavily 搜索失败，继续无搜索上下文生成:", error);
    }
  }

  const prompt = searchContext
    ? `请根据以下搜索结果，将主题扩展为结构化思维导图，输出严格 JSON：

主题：${sentence}

${searchContext}

要求：
- 基于搜索结果生成准确、深入的思维导图
- 输出 JSON，结构为 {"text":"主题","children":[{"text":"观点1","children":[...]}, ...]}
- 所有字段必须用双引号
- 不要包含任何额外解释文字`
    : `请将下面一句话扩展为结构化思维导图，输出严格 JSON：

一句话：${sentence}

要求：
- 输出 JSON，结构为 {"text":"主题","children":[{"text":"观点1","children":[...]}, ...]}
- 所有字段必须用双引号
- 不要包含任何额外解释文字`;

  console.log("📤 [aiService] 发送 AI 请求生成思维导图...");
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  console.log("📥 [aiService] 收到 AI 响应");

  const text = response.choices[0]?.message?.content || "";
  console.log("📝 [aiService] 提取响应文本长度:", text.length);
  const json = safeJsonParse(text) as TreeNode;
  const mindMap = treeToMindMap(json);
  console.log("✅ [aiService] 思维导图解析成功，节点数:", mindMap.nodes.length);
  return mindMap;
}

export type GenerateBlocksOptions = {
  nodeTexts: { nodeId: string; text: string }[];
  apiKey: string;
  model: string;
  writingPreference: string;
  tavilyApiKey?: string;
  enableWebSearch?: boolean;
};

export async function generateBlocksForNodes(
  options: GenerateBlocksOptions
): Promise<ArticleBlock[]> {
  const { nodeTexts, apiKey, model, writingPreference, tavilyApiKey, enableWebSearch } = options;

  console.log("🤖 [aiService] 开始生成文章段落，节点数:", nodeTexts.length);
  console.log("⚙️ [aiService] 使用模型:", model, "写作偏好:", writingPreference || "默认");

  const client = getClient(apiKey);

  let searchContext = "";
  if (enableWebSearch && tavilyApiKey && nodeTexts.length > 0) {
    console.log("🔍 [aiService] 开始网络搜索，查询数:", Math.min(nodeTexts.length, 3));
    try {
      const queries = nodeTexts.map((n) => n.text).slice(0, 3);
      const searchPromises = queries.map((query) =>
        tavilySearch(query, tavilyApiKey, {
          maxResults: 3,
          searchDepth: "basic",
          includeAnswer: true,
        })
      );
      const searchResults = await Promise.all(searchPromises);
      searchContext = searchResults
        .map((result, index) => `【${queries[index]}】\n${formatSearchResultsForPrompt(result)}`)
        .join("\n\n");
      console.log("✅ [aiService] 网络搜索完成，获取到", searchResults.length, "个搜索结果");
    } catch (error) {
      console.warn("⚠️ [aiService] Tavily 搜索失败，继续无搜索上下文生成:", error);
    }
  }

  const prompt = searchContext
    ? `请根据以下节点和搜索资料生成文章段落，输出严格 JSON：

写作偏好：${writingPreference}

节点列表：
${nodeTexts.map((node) => `- ${node.nodeId}: ${node.text}`).join("\n")}

搜索资料：
${searchContext}

输出格式：{"blocks":[{"nodeId":"...","html":"<p>...</p>"}]}
要求：
- 基于搜索资料生成准确、有深度的内容
- html 字段必须是可直接渲染的段落 HTML
- 不要包含多余解释或 Markdown 代码块`
    : `请根据以下节点生成文章段落，输出严格 JSON：

写作偏好：${writingPreference}

节点列表：
${nodeTexts.map((node) => `- ${node.nodeId}: ${node.text}`).join("\n")}

输出格式：{"blocks":[{"nodeId":"...","html":"<p>...</p>"}]}
要求：
- html 字段必须是可直接渲染的段落 HTML
- 不要包含多余解释或 Markdown 代码块`;

  console.log("📤 [aiService] 发送 AI 请求生成文章段落...");
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
  });
  console.log("📥 [aiService] 收到 AI 响应");

  const text = response.choices[0]?.message?.content || "";
  console.log("📝 [aiService] 提取响应文本长度:", text.length);
  const json = safeJsonParse(text) as { blocks: { nodeId: string; html: string }[] };
  console.log("✅ [aiService] 解析到", json.blocks?.length || 0, "个段落块");

  const blocks = json.blocks.map((block) => ({
    id: createId("block"),
    nodeId: block.nodeId,
    contentHtml: block.html,
    isLocked: false,
    isUserEdited: false,
  }));
  console.log("✅ [aiService] 段落生成完成，返回", blocks.length, "个段落");
  return blocks;
}
