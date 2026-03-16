import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMindMapStore } from "../stores/mindmapStore";
import { useProfileStore } from "../stores/profileStore";
import { generateMindMapFromSentence } from "../services/ai/aiService";

const suggestions = [
  "城市慢生活的写作灵感",
  "AI 与创作者思考深度",
  "用户体验的可持续竞争力",
  "如何建立写作节奏",
  "内容创作的长期主义",
];

export default function GeneratePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setMap = useMindMapStore((state) => state.setMap);
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadFromStorage);
  const navigate = useNavigate();

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const apiKey = profile.apiKey || import.meta.env.VITE_ARK_API_KEY;
  const tavilyApiKey = profile.tavilyApiKey || import.meta.env.VITE_TAVILY_API_KEY;

  const handleGenerate = async (text: string) => {
    if (!text.trim()) return;
    if (!apiKey) {
      setError("请先在设置页面填写 API Key");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const map = await generateMindMapFromSentence({
        sentence: text,
        apiKey,
        model: profile.modelSelection,
        tavilyApiKey,
        enableWebSearch: profile.enableWebSearch,
      });
      setMap(map);
      setTimeout(() => navigate("/workspace"), 600);
    } catch (err) {
      setError("生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 animate-fadeIn">
      {/* 品牌区域 - 极简 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-clay text-paper mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl md:text-3xl text-ink mb-1">
          MindWrite
        </h1>
        <p className="text-sm text-dusk/60">
          一句话生成思维导图
        </p>
      </div>

      {/* 核心输入框 - 单行高度 */}
      <div className="w-full max-w-xl mb-4">
        <div className="relative group">
          <input
            type="text"
            className="w-full h-12 pl-4 pr-12 rounded-full border border-line/50 bg-white/90 text-base text-ink shadow-soft transition-all duration-300 ease-out-expo placeholder:text-dusk/40 focus:border-clay focus:bg-white focus:shadow-glow focus:outline-none"
            placeholder="输入你的写作主题..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate(input);
              }
            }}
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-clay text-paper flex items-center justify-center shadow-soft transition-all duration-250 ease-out-expo hover:bg-clay-light hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => handleGenerate(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        
        {error && (
          <p className="text-xs text-red-600 mt-2 text-center animate-floatIn">
            {error}
          </p>
        )}
      </div>

      {/* 快捷提示 - 极简样式 */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {suggestions.map((item, index) => (
          <button
            key={item}
            className="px-3 py-1.5 text-xs text-dusk/70 bg-paper/60 border border-line/40 rounded-full transition-all duration-250 ease-out-expo hover:border-clay/50 hover:text-ink hover:bg-white"
            onClick={() => {
              setInput(item);
              handleGenerate(item);
            }}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* 底部提示 - 极简 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-[10px] text-dusk/40">
          按 Enter 发送 · 在设置中配置 API Key
        </p>
      </div>
    </div>
  );
}
