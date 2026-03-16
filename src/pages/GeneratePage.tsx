import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMindMapStore } from "../stores/mindmapStore";
import { useProfileStore } from "../stores/profileStore";
import StatusBadge from "../components/common/StatusBadge";
import { generateMindMapFromSentence } from "../services/ai/aiService";

const suggestions = [
  "如何写一篇关于城市慢生活的文章",
  "AI 如何帮助创作者保持思考深度",
  "把用户体验做成可持续竞争力",
];

export default function GeneratePage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
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

  const handleGenerate = async (text: string) => {
    if (!text.trim()) return;
    if (!apiKey) {
      setError("请先在用户信息页面填写豆包 API Key。");
      return;
    }
    setError(null);
    setMessages((prev) => [...prev, `你：${text}`]);
    setLoading(true);
    try {
      const map = await generateMindMapFromSentence(
        text,
        apiKey,
        profile.modelSelection
      );
      setMap(map);
      setMessages((prev) => [...prev, "MindWrite：导图已生成，正在进入工作区..."]);
      setTimeout(() => navigate("/workspace"), 600);
    } catch (err) {
      setError("生成失败，请稍后重试或调整提示语。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] animate-fadeIn">
      {/* 主输入区域 */}
      <section className="rounded-3xl border border-line/60 bg-white/80 p-6 md:p-8 shadow-soft backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-ui uppercase tracking-[0.2em] text-dusk/70">
              One-liner to MindMap
            </p>
            <h1 className="font-display text-2xl text-ink md:text-3xl lg:text-4xl leading-tight">
              用一句话点燃<br className="hidden sm:block" />结构化写作
            </h1>
          </div>
          <StatusBadge
            label={apiKey ? "API Key 已就绪" : "未检测到 Key"}
            tone={apiKey ? "accent" : "warning"}
          />
        </div>
        
        <p className="mt-4 text-base text-dusk leading-relaxed">
          请输入你的主题或问题，我们将自动生成思维导图草稿。
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <textarea
              className="min-h-[140px] w-full resize-none rounded-2xl border border-line/60 bg-paper/60 p-4 text-base text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              placeholder="例如：AI 如何帮助创作者建立可持续的写作节奏..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleGenerate(input);
                }
              }}
            />
            <span className="absolute bottom-3 right-3 text-xs font-ui text-dusk/40">
              ⌘+Enter 快速生成
            </span>
          </div>
          
          {error && (
            <div className="rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-floatIn">
              {error}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="group relative rounded-full bg-clay px-6 py-3 text-sm font-medium text-paper shadow-soft transition-all duration-250 ease-out-expo hover:bg-clay-light hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              onClick={() => handleGenerate(input)}
              disabled={loading || !input.trim()}
            >
              <span className="flex items-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    正在生成...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v18" />
                      <path d="M3 12h18" />
                    </svg>
                    生成导图
                  </>
                )}
              </span>
            </button>
            <span className="text-xs font-ui text-dusk/60">
              推荐在"用户信息"页面配置 API Key
            </span>
          </div>
        </div>
      </section>

      {/* 侧边栏 */}
      <aside className="space-y-6">
        {/* 对话记录 */}
        <section className="rounded-3xl border border-line/60 bg-paper/60 p-6 shadow-soft">
          <p className="text-xs font-ui uppercase tracking-[0.2em] text-dusk/70">
            对话记录
          </p>
          <div className="mt-4 space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line/60 bg-paper/40 px-4 py-8 text-center">
                <p className="text-sm text-dusk/60">这里会显示你的生成记录</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message}-${index}`}
                  className={`rounded-2xl border px-4 py-3 text-sm animate-floatIn ${
                    message.startsWith('你：')
                      ? 'border-line/60 bg-white/80 ml-4'
                      : 'border-clay/30 bg-clay/5 mr-4'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className={message.startsWith('你：') ? 'text-dusk' : 'text-clay'}>
                    {message.startsWith('你：') ? '你' : 'MindWrite'}
                  </span>
                  <span className="text-ink-light">：{message.replace(/^(你|MindWrite)：/, '')}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 灵感建议 */}
        <section className="rounded-3xl border border-line/60 bg-white/60 p-6 shadow-soft">
          <p className="text-xs font-ui uppercase tracking-[0.2em] text-dusk/70">灵感建议</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((item, index) => (
              <button
                key={item}
                className="group rounded-full border border-line/60 bg-paper/40 px-4 py-2 text-sm font-ui text-dusk transition-all duration-250 ease-out-expo hover:border-clay/60 hover:bg-clay/5 hover:text-ink"
                onClick={() => {
                  setInput(item);
                  handleGenerate(item);
                }}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-dusk/50 group-hover:text-clay transition-colors">
                    <path d="M12 3v18" />
                    <path d="M3 12h18" />
                  </svg>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
