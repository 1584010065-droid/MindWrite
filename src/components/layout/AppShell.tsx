import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/generate", label: "生成", icon: "sparkles" },
  { to: "/workspace", label: "工作区", icon: "layout" },
  { to: "/export", label: "导出", icon: "download" },
  { to: "/profile", label: "设置", icon: "settings" },
];

const icons: Record<string, JSX.Element> = {
  sparkles: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
    </svg>
  ),
  layout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="relative min-h-screen bg-paper text-ink antialiased">
      {/* 背景光效 */}
      <div className="pointer-events-none fixed inset-0 bg-warmglow" />
      
      {/* 纸质纹理 */}
      <div className="pointer-events-none fixed inset-0 opacity-25 bg-papergrain [background-size:20px_20px]" />
      
      {/* 左侧边栏导航 */}
      <aside className="fixed left-0 top-0 z-50 h-full w-16 md:w-56 border-r border-line/60 bg-paper/90 backdrop-blur-xl flex flex-col">
        {/* Logo区域 */}
        <div className="flex h-14 md:h-16 items-center gap-3 border-b border-line/60 px-3 md:px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay text-paper shadow-soft">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <div className="hidden md:block">
            <p className="font-display text-base text-ink leading-tight">MindWrite</p>
            <p className="text-[10px] font-ui text-dusk/70">人文感写作</p>
          </div>
        </div>
        
        {/* 导航链接 */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-250 ease-out-expo ${
                  isActive
                    ? "bg-clay/10 text-clay"
                    : "text-dusk hover:bg-paper-dark hover:text-ink"
                }`
              }
            >
              <span className={`flex-shrink-0 ${location.pathname === item.to ? 'text-clay' : ''}`}>
                {icons[item.icon]}
              </span>
              <span className="hidden md:block text-sm font-ui">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* 底部信息 */}
        <div className="border-t border-line/60 p-3">
          <div className="hidden md:block text-[10px] text-dusk/50 text-center">
            v0.1.0
          </div>
        </div>
      </aside>
      
      {/* 移动端顶部导航 */}
      <div className="fixed top-0 left-0 right-0 z-40 border-b border-line/60 bg-paper/90 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay text-paper">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              </svg>
            </div>
            <span className="font-display text-base text-ink">MindWrite</span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `p-2 rounded-lg transition-all duration-250 ${
                    isActive ? "text-clay bg-clay/10" : "text-dusk"
                  }`
                }
              >
                {icons[item.icon]}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      
      {/* 主内容区 - 适配左侧边栏 */}
      <main className="relative z-10 min-h-screen md:pl-56 pt-14 md:pt-0">
        <div className="mx-auto max-w-6xl px-3 py-3 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
