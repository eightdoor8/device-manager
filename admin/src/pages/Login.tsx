import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLoginUrl } from "../lib/oauth";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Login.css";

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleOAuthLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Device Manager</h1>
        <p className="login-subtitle">管理画面へログイン</p>

        <button className="oauth-button" onClick={handleOAuthLogin}>
          Manusでログイン
        </button>
      </div>
    </div>
  );
}
