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
    <div className="relative min-h-screen bg-paper text-ink">
      <div className="pointer-events-none absolute inset-0 bg-warmglow" />
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-papergrain [background-size:18px_18px]" />
      <TopNav />
      <div className="relative z-10 border-b border-line/70 bg-paper/60 px-6 py-3 md:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-4 py-2 text-xs font-ui transition ${
                  isActive
                    ? "border-clay bg-clay text-paper shadow-soft"
                    : "border-line/80 text-dusk"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10">
        {children}
      </main>
    </div>
  );
}
