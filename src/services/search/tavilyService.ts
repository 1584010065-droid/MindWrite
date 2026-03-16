const TAVILY_API_URL = "https://api.tavily.com/search";

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export type TavilySearchResponse = {
  answer?: string;
  results: TavilySearchResult[];
};

export async function tavilySearch(
  query: string,
  apiKey: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    includeAnswer?: boolean;
  }
): Promise<TavilySearchResponse> {
  const { maxResults = 5, searchDepth = "basic", includeAnswer = true } = options || {};

  const response = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_answer: includeAnswer,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    answer: data.answer,
    results: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}

export function formatSearchResultsForPrompt(
  searchResponse: TavilySearchResponse
): string {
  const parts: string[] = [];

  if (searchResponse.answer) {
    parts.push(`【搜索摘要】\n${searchResponse.answer}`);
  }

  if (searchResponse.results.length > 0) {
    parts.push("\n【搜索结果】");
    searchResponse.results.forEach((result, index) => {
      parts.push(
        `\n${index + 1}. ${result.title}\n   来源: ${result.url}\n   摘要: ${result.content.slice(0, 300)}${result.content.length > 300 ? "..." : ""}`
      );
    });
  }

  return parts.join("\n");
}
