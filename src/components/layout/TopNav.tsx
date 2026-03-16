import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/generate", label: "一句话生成" },
  { to: "/workspace", label: "工作区" },
  { to: "/export", label: "导出" },
  { to: "/profile", label: "用户信息" },
];

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Logo区域 */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clay text-paper shadow-soft transition-transform duration-250 hover:scale-105">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <div>
            <p className="font-display text-lg text-ink md:text-xl">MindWrite</p>
            <p className="text-xs font-ui text-dusk/80 md:text-sm">人文感写作工作台</p>
          </div>
        </div>
        
        {/* 桌面端导航 */}
        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative rounded-full border px-4 py-2 text-sm font-ui transition-all duration-250 ease-out-expo ${
                  isActive
                    ? "border-clay bg-clay text-paper shadow-soft"
                    : "border-transparent text-dusk hover:border-line/60 hover:text-ink"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
