import { Link, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "ダッシュボード", icon: "📊" },
  { path: "/devices", label: "端末管理", icon: "📱" },
  { path: "/users", label: "ユーザー管理", icon: "👥" },
  { path: "/settings", label: "設定", icon: "⚙️" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <nav className="nav-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
