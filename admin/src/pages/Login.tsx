import { useNavigate } from "react-router-dom";
import { getLoginUrl } from "../lib/oauth";
import "../styles/Login.css";

interface LoginProps {
  setIsLoggedIn?: (value: boolean) => void;
  setUser?: (value: any) => void;
}

export function Login({ setIsLoggedIn, setUser }: LoginProps) {
  const navigate = useNavigate();

  const handleOAuthLogin = () => {
    const loginUrl = getLoginUrl();
    console.log("[Login] Redirecting to:", loginUrl);
    window.location.href = loginUrl;
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

export default Login;
