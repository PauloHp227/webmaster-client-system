"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
};

const menuItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/clientes", label: "Clientes", icon: "👥" },
  { href: "/projetos", label: "Projetos", icon: "💻" },
  { href: "/briefings", label: "Briefings", icon: "📝" },
  { href: "/contratos", label: "Contratos", icon: "📄" },
  { href: "/acessos", label: "Acessos", icon: "🔐" },
  { href: "/financeiro", label: "Financeiro", icon: "💰" },
];

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="logo-area">
            <img src="/logo.png" alt="Webmaster Digital" />
          </div>

          <nav className="menu">
            {menuItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`menu-link ${active ? "active" : ""}`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <strong>Webmaster Digital</strong>
          <p>Criação de Sites & Design</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="page-label">Sistema de Gestão</span>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="admin-box">
            <div className="admin-avatar">WD</div>
            <div>
              <strong>Administrador</strong>
              <span>Online</span>
            </div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}