import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/generate", label: "一句话生成" },
  { to: "/workspace", label: "工作区" },
  { to: "/export", label: "导出" },
  { to: "/profile", label: "用户信息" },
];

export default function TopNav() {
  return (
    <header className="relative z-10 border-b border-line/70 bg-paper/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-clay text-paper shadow-soft">
            MW
          </div>
          <div>
            <p className="font-display text-xl text-ink">MindWrite</p>
            <p className="text-sm font-ui text-dusk/80">人文感写作工作台</p>
          </div>
        </div>
        <nav className="hidden items-center gap-3 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full border px-4 py-2 text-sm font-ui transition ${
                  isActive
                    ? "border-clay bg-clay text-paper shadow-soft"
                    : "border-line/80 text-dusk hover:border-clay/60 hover:text-ink"
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
