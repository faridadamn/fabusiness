import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Command Center" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/settings/profile", label: "Settings" },
];

export function AppShell({ children, userLabel }: { children: ReactNode; userLabel: string }) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div>
          <p className="brand-mark">FA</p>
          <p className="brand-name">Business OS</p>
        </div>
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar">{userLabel.slice(0, 1).toUpperCase()}</span>
          <span>{userLabel}</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">FA BUSINESS OS</p>
            <p className="topbar-title">Build what matters next.</p>
          </div>
          <Link href="/settings/profile" className="profile-link">
            Profile
          </Link>
        </header>
        <main className="workspace-content">{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} className="bottom-nav-link">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
