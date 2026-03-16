import { useEffect } from "react";
import { useProfileStore } from "../stores/profileStore";
import StatusBadge from "../components/common/StatusBadge";

export default function ProfilePage() {
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const loadProfile = useProfileStore((state) => state.loadFromStorage);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const envKey = import.meta.env.VITE_ARK_API_KEY;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] animate-fadeIn">
      {/* 主表单区域 */}
      <section className="rounded-2xl border border-line/60 bg-white/80 p-4 md:p-5 shadow-soft backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl text-ink md:text-2xl">用户信息</h1>
            <p className="mt-1 text-xs text-dusk/80 leading-relaxed">
              这里保存你的偏好设置与豆包 API Key（仅本地存储）。
            </p>
          </div>
          {envKey && <StatusBadge label="已检测到环境变量 Key" tone="accent" />}
        </div>

        <div className="mt-5 grid gap-4">
          {/* 昵称 */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">昵称</span>
            <input
              className="rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              value={profile.nickname}
              onChange={(event) => updateProfile({ nickname: event.target.value })}
              placeholder="给自己一个名字"
            />
          </label>

          {/* 头像链接 */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">头像链接</span>
            <input
              className="rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              value={profile.avatarUrl}
              onChange={(event) => updateProfile({ avatarUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>

          {/* 写作偏好 */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">写作偏好</span>
            <textarea
              className="min-h-[80px] rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow resize-none"
              value={profile.writingPreference}
              onChange={(event) => updateProfile({ writingPreference: event.target.value })}
              placeholder="描述你喜欢的写作风格..."
            />
          </label>

          {/* 导出默认设置 */}
          <div className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">导出默认设置</span>
            <div className="flex gap-2">
              {["a4", "letter"].map((preset) => (
                <button
                  key={preset}
                  className={`rounded-full border px-4 py-2 text-xs font-ui transition-all duration-250 ease-out-expo ${
                    profile.exportPreset === preset
                      ? "border-clay bg-clay text-paper shadow-soft"
                      : "border-line/60 text-dusk hover:border-clay/60 hover:bg-clay/5"
                  }`}
                  onClick={() =>
                    updateProfile({ exportPreset: preset as "a4" | "letter" })
                  }
                >
                  {preset.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 模型选择 */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">模型选择</span>
            <input
              className="rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              value={profile.modelSelection}
              onChange={(event) => updateProfile({ modelSelection: event.target.value })}
              placeholder="doubao-seed-1-8-251228"
            />
          </label>

          {/* API Key */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">豆包 API Key</span>
            <input
              type="password"
              className="rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              value={profile.apiKey}
              onChange={(event) => updateProfile({ apiKey: event.target.value })}
              placeholder="ARK_API_KEY"
            />
            <span className="text-[10px] text-dusk/50">
              若已设置环境变量，可留空。
            </span>
          </label>

          {/* Tavily API Key - 联网搜索 */}
          <label className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">Tavily API Key（联网搜索）</span>
            <input
              type="password"
              className="rounded-xl border border-line/60 bg-paper/60 px-3 py-2 text-sm text-ink shadow-inner transition-all duration-250 ease-out-expo placeholder:text-dusk/50 focus:border-clay focus:bg-white focus:shadow-glow"
              value={profile.tavilyApiKey}
              onChange={(event) => updateProfile({ tavilyApiKey: event.target.value })}
              placeholder="tvly-xxxxxxxx"
            />
            <span className="text-[10px] text-dusk/50">
              在 tavily.com 注册获取，每月 1000 次免费搜索。
            </span>
          </label>

          {/* 联网搜索开关 */}
          <div className="grid gap-1.5">
            <span className="text-xs font-ui text-dusk">联网搜索</span>
            <div className="flex gap-2">
              {[
                { value: true, label: "开启" },
                { value: false, label: "关闭" },
              ].map((option) => (
                <button
                  key={String(option.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-ui transition-all duration-250 ease-out-expo ${
                    profile.enableWebSearch === option.value
                      ? "border-clay bg-clay text-paper shadow-soft"
                      : "border-line/60 text-dusk hover:border-clay/60 hover:bg-clay/5"
                  }`}
                  onClick={() => updateProfile({ enableWebSearch: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-dusk/50">
              开启后 AI 将联网搜索获取实时信息，生成更准确的内容。
            </span>
          </div>
        </div>
      </section>

      {/* 侧边栏 */}
      <aside className="space-y-4">
        {/* 提示卡片 */}
        <div className="rounded-2xl border border-line/60 bg-paper/70 p-4 shadow-soft">
          <h2 className="font-display text-lg text-ink">使用提示</h2>
          <ul className="mt-3 space-y-2 text-xs text-dusk/80">
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-clay flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>API Key 仅保存在浏览器本地，不会上传。</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-clay flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>如需切换模型，直接修改模型名称即可。</span>
            </li>
            <li className="flex items-start gap-1.5">
              <svg className="h-4 w-4 text-clay flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>后续接入登录系统后可同步这些偏好。</span>
            </li>
          </ul>
        </div>

        {/* 关于卡片 */}
        <div className="rounded-2xl border border-line/60 bg-white/60 p-4 shadow-soft">
          <h2 className="font-display text-lg text-ink">关于 MindWrite</h2>
          <p className="mt-2 text-xs text-dusk/80 leading-relaxed">
            MindWrite 是一个人文感写作工作台，帮助你用思维导图的方式组织思路，
            并通过 AI 辅助生成文章。我们相信，技术应该服务于创作，而不是取代创作。
          </p>
          <div className="mt-3 pt-3 border-t border-line/40">
            <p className="text-[10px] text-dusk/50">
              版本 0.1.0 ·  Made with care
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
