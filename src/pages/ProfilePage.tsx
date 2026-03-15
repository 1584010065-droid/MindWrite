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
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-3xl border border-line/70 bg-white/70 p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-ink">用户信息</h1>
            <p className="mt-2 text-sm text-dusk">
              这里保存你的偏好设置与豆包 API Key（仅本地存储）。
            </p>
          </div>
          {envKey && <StatusBadge label="已检测到环境变量 Key" tone="accent" />}
        </div>

        <div className="mt-6 grid gap-5">
          <label className="grid gap-2 text-sm font-ui text-dusk">
            昵称
            <input
              className="rounded-2xl border border-line/70 bg-paper/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
              value={profile.nickname}
              onChange={(event) => updateProfile({ nickname: event.target.value })}
              placeholder="给自己一个名字"
            />
          </label>

          <label className="grid gap-2 text-sm font-ui text-dusk">
            头像链接
            <input
              className="rounded-2xl border border-line/70 bg-paper/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
              value={profile.avatarUrl}
              onChange={(event) => updateProfile({ avatarUrl: event.target.value })}
              placeholder="https://..."
            />
          </label>

          <label className="grid gap-2 text-sm font-ui text-dusk">
            写作偏好
            <textarea
              className="min-h-[100px] rounded-2xl border border-line/70 bg-paper/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
              value={profile.writingPreference}
              onChange={(event) => updateProfile({ writingPreference: event.target.value })}
            />
          </label>

          <div className="grid gap-2 text-sm font-ui text-dusk">
            导出默认设置
            <div className="flex gap-3">
              {["a4", "letter"].map((preset) => (
                <button
                  key={preset}
                  className={`rounded-full border px-4 py-2 text-xs font-ui ${
                    profile.exportPreset === preset
                      ? "border-clay bg-clay text-paper"
                      : "border-line/70 text-dusk"
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

          <label className="grid gap-2 text-sm font-ui text-dusk">
            模型选择
            <input
              className="rounded-2xl border border-line/70 bg-paper/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
              value={profile.modelSelection}
              onChange={(event) => updateProfile({ modelSelection: event.target.value })}
              placeholder="doubao-seed-1-8-251228"
            />
          </label>

          <label className="grid gap-2 text-sm font-ui text-dusk">
            豆包 API Key
            <input
              type="password"
              className="rounded-2xl border border-line/70 bg-paper/70 px-4 py-3 text-base text-ink focus:border-clay focus:outline-none"
              value={profile.apiKey}
              onChange={(event) => updateProfile({ apiKey: event.target.value })}
              placeholder="ARK_API_KEY"
            />
            <span className="text-xs text-dusk/70">
              若已设置环境变量，可留空。
            </span>
          </label>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-line/70 bg-paper/80 p-6 shadow-soft">
          <h2 className="font-display text-2xl text-ink">提示</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-dusk">
            <li>API Key 仅保存在浏览器本地，不会上传。</li>
            <li>如需切换模型，直接修改模型名称即可。</li>
            <li>后续接入登录系统后可同步这些偏好。</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
