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
      setTimeout(() => navigate("/workspace"), 400);
    } catch (err) {
      setError("生成失败，请稍后重试或调整提示语。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-line/80 bg-paper/70 p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-ui uppercase tracking-[0.2em] text-dusk/70">
              One-liner to MindMap
            </p>
            <h1 className="mt-3 font-display text-3xl text-ink md:text-4xl">
              用一句话点燃结构化写作
            </h1>
          </div>
          <StatusBadge
            label={apiKey ? "API Key 已就绪" : "未检测到 Key"}
            tone={apiKey ? "accent" : "warning"}
          />
        </div>
        <p className="mt-3 text-base text-dusk">
          请输入你的主题或问题，我们将自动生成思维导图草稿。
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <textarea
            className="min-h-[120px] w-full resize-none rounded-2xl border border-line/70 bg-white/70 p-4 text-base text-ink shadow-inner focus:border-clay focus:outline-none"
            placeholder="例如：AI 如何帮助创作者建立可持续的写作节奏..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-full bg-clay px-6 py-3 text-sm font-ui text-paper shadow-soft transition hover:translate-y-[-1px]"
              onClick={() => handleGenerate(input)}
              disabled={loading}
            >
              {loading ? "正在生成..." : "生成导图"}
            </button>
            <span className="text-xs font-ui text-dusk/70">
              推荐在“用户信息”页面配置 API Key
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line/80 bg-white/60 p-6 shadow-soft">
        <p className="text-sm font-ui uppercase tracking-[0.2em] text-dusk/70">
          对话记录
        </p>
        <div className="mt-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line/70 bg-paper/50 px-4 py-6 text-center text-dusk/70">
              这里会显示你的生成记录
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message}-${index}`}
              className="rounded-2xl border border-line/60 bg-paper/80 px-4 py-3"
            >
              {message}
            </div>
          ))}
        </div>
        <div className="mt-6">
          <p className="text-xs font-ui text-dusk/70">灵感建议</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                className="rounded-full border border-line/60 px-3 py-2 text-xs font-ui text-dusk transition hover:border-clay"
                onClick={() => {
                  setInput(item);
                  handleGenerate(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
