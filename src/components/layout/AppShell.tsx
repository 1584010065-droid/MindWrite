import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import TopNav from "./TopNav";

const navItems = [
  { to: "/generate", label: "一句话生成" },
  { to: "/workspace", label: "工作区" },
  { to: "/export", label: "导出" },
  { to: "/profile", label: "用户信息" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-paper text-ink antialiased">
      {/* 背景光效 - 更柔和 */}
      <div className="pointer-events-none fixed inset-0 bg-warmglow" />
      
      {/* 纸质纹理 - 更细腻 */}
      <div className="pointer-events-none fixed inset-0 opacity-25 bg-papergrain [background-size:20px_20px]" />
      
      {/* 顶部导航 */}
      <TopNav />
      
      {/* 移动端导航 */}
      <div className="relative z-10 border-b border-line/60 bg-paper/80 backdrop-blur-md px-4 py-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-4 py-2 text-xs font-ui transition-all duration-250 ease-out-expo ${
                  isActive
                    ? "border-clay bg-clay text-paper shadow-soft"
                    : "border-line/80 text-dusk hover:border-clay/60 hover:text-ink"
                }`
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      
      {/* 主内容区 */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-6 md:pt-12">
        {children}
      </main>
    </div>
  );
}
