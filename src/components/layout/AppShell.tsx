import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

const navItems = [
  { to: "/generate", label: "生成", icon: "sparkles" },
  { to: "/workspace", label: "工作区", icon: "layout" },
  { to: "/export", label: "导出", icon: "download" },
  { to: "/profile", label: "设置", icon: "settings" },
];

const icons: Record<string, React.ReactNode> = {
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
  logout: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  chevronLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,18 9,12 15,6" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,18 15,12 9,6" />
    </svg>
  ),
};

// 展开/收起按钮组件
function SidebarToggleButton({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={isExpanded ? "收起侧边栏" : "展开侧边栏"}
      className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-line/60 bg-paper shadow-soft transition-all duration-250 ease-out-expo hover:bg-paper-dark hover:border-clay/30 hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-clay/30 focus:ring-offset-2 focus:ring-offset-paper group"
    >
      <span
        className={`transition-transform duration-250 ease-out-expo text-dusk group-hover:text-clay ${
          isExpanded ? "" : "rotate-180"
        }`}
      >
        {icons.chevronLeft}
      </span>
    </button>
  );
}

// 用户菜单组件
function UserMenu({ isExpanded }: { isExpanded: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-paper-dark ${
          isExpanded ? "" : "justify-center"
        }`}
      >
        {/* 头像 */}
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-clay/20 text-sm font-medium text-clay">
          {user.nickname?.charAt(0).toUpperCase() ||
            user.email.charAt(0).toUpperCase()}
        </div>
        {isExpanded && (
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate text-sm font-ui text-ink">
              {user.nickname || "用户"}
            </p>
            <p className="truncate text-[10px] text-dusk/60">{user.email}</p>
          </div>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={`absolute bottom-full z-20 mb-1 overflow-hidden rounded-xl border border-line/60 bg-white shadow-lg ${
              isExpanded ? "left-0 right-0" : "left-full ml-2 bottom-0 w-32"
            }`}
          >
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-paper-dark"
            >
              {icons.logout}
              <span>退出登录</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();

  // 侧边栏展开状态，默认展开（登录后）
  const [isExpanded, setIsExpanded] = useState(() => {
    // 从localStorage读取状态，如果没有则默认展开
    const saved = localStorage.getItem("sidebar-expanded");
    return saved !== null ? saved === "true" : true;
  });

  // 持久化侧边栏状态
  useEffect(() => {
    localStorage.setItem("sidebar-expanded", String(isExpanded));
  }, [isExpanded]);

  // 切换侧边栏展开状态
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // 侧边栏宽度类名
  const sidebarWidthClass = isExpanded ? "w-56" : "w-16";
  const mainPaddingClass = isExpanded ? "md:pl-56" : "md:pl-16";

  return (
    <div className="relative min-h-screen bg-paper text-ink antialiased">
      {/* 背景光效 */}
      <div className="pointer-events-none fixed inset-0 bg-warmglow" />

      {/* 纸质纹理 */}
      <div className="pointer-events-none fixed inset-0 bg-papergrain opacity-25 [background-size:20px_20px]" />

      {/* 左侧边栏导航 */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full border-r border-line/60 bg-paper/90 backdrop-blur-xl transition-all duration-300 ease-out-expo ${sidebarWidthClass}`}
      >
        {/* 展开/收起按钮 */}
        <SidebarToggleButton
          isExpanded={isExpanded}
          onToggle={toggleSidebar}
        />

        {/* Logo区域 */}
        <div
          className={`flex h-14 items-center gap-3 border-b border-line/60 px-3 transition-all duration-300 ease-out-expo md:h-16 ${
            isExpanded ? "md:px-4" : "md:justify-center md:px-2"
          }`}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-clay text-paper shadow-soft">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <div
            className={`overflow-hidden transition-all duration-300 ease-out-expo ${
              isExpanded
                ? "w-auto opacity-100"
                : "w-0 opacity-0 md:hidden"
            }`}
          >
            <p className="font-display text-base leading-tight text-ink">
              MindWrite
            </p>
            <p className="text-[10px] font-ui text-dusk/70">人文感写作</p>
          </div>
        </div>

        {/* 导航链接 */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-250 ease-out-expo ${
                  isActive
                    ? "bg-clay/10 text-clay"
                    : "text-dusk hover:bg-paper-dark hover:text-ink"
                } ${isExpanded ? "" : "justify-center"}`
              }
            >
              <span
                className={`flex-shrink-0 ${
                  location.pathname === item.to ? "text-clay" : ""
                }`}
              >
                {icons[item.icon]}
              </span>
              <span
                className={`overflow-hidden whitespace-nowrap text-sm font-ui transition-all duration-300 ease-out-expo ${
                  isExpanded
                    ? "w-auto opacity-100"
                    : "w-0 opacity-0 md:hidden"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* 用户菜单 */}
        <div className="border-t border-line/60 p-3">
          <UserMenu isExpanded={isExpanded} />
        </div>
      </aside>

      {/* 移动端顶部导航 */}
      <div className="fixed left-0 right-0 top-0 z-40 border-b border-line/60 bg-paper/90 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay text-paper">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
                  `rounded-lg p-2 transition-all duration-250 ${
                    isActive ? "bg-clay/10 text-clay" : "text-dusk"
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
      <main
        className={`relative z-10 min-h-screen pt-14 transition-all duration-300 ease-out-expo ${mainPaddingClass} md:pt-0`}
      >
        <div className="mx-auto max-w-6xl px-3 py-3 md:px-6 md:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
