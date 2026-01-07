import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-icon">📱</span>
          <span className="logo-text">Device Manager</span>
        </div>
      </div>

      <div className="header-right">
        {user && (
          <>
            <div className="user-info">
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-role">
                {user.role === "admin" ? "管理者" : "ユーザー"}
              </span>
            </div>
            <button className="logout-button" onClick={handleLogout}>
              ログアウト
            </button>
          </>
        )}
      </div>
    </header>
  );
}
