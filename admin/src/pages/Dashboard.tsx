import { useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "../styles/Dashboard.css";

interface DashboardProps {
  user?: any;
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const devicesQuery = trpc.devices.list.useQuery();
  const usersQuery = trpc.users.list.useQuery();

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  if (devicesQuery.isLoading || usersQuery.isLoading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="ダッシュボードを読み込み中..." />
      </div>
    );
  }

  const deviceCount = devicesQuery.data?.length || 0;
  const userCount = usersQuery.data?.length || 0;
  const availableDevices = devicesQuery.data?.filter((d) => d.status === "available").length || 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>ダッシュボード</h1>
        <p>Device Manager 管理画面へようこそ</p>
      </div>

      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => handleCardClick("/devices")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCardClick("/devices");
            }
          }}
        >
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <h3>登録済み端末</h3>
            <p className="stat-value">{deviceCount}</p>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate("/devices?status=available")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/devices?status=available");
            }
          }}
        >
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>利用可能な端末</h3>
            <p className="stat-value">{availableDevices}</p>
          </div>
        </div>

        <div
          className="stat-card"
          onClick={() => handleCardClick("/users")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCardClick("/users");
            }
          }}
        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>登録済みユーザー</h3>
            <p className="stat-value">{userCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
