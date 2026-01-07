import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import "../styles/Dashboard.css";

export function Dashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    availableDevices: 0,
    inUseDevices: 0,
    totalUsers: 0,
  });

  const devicesQuery = trpc.devices.list.useQuery();
  const usersQuery = trpc.users.list.useQuery();

  useEffect(() => {
    if (devicesQuery.data && usersQuery.data) {
      try {
        const devices = devicesQuery.data;
        setStats({
          totalDevices: devices.length,
          availableDevices: devices.filter((d) => d.status === "available").length,
          inUseDevices: devices.filter((d) => d.status === "in_use").length,
          totalUsers: usersQuery.data.length,
        });
      } catch (err) {
        console.error("Error processing data:", err);
      }
    }
  }, [devicesQuery.data, usersQuery.data]);

  if (devicesQuery.isLoading || usersQuery.isLoading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="ダッシュボードデータを読み込み中..." />
      </div>
    );
  }

  if (devicesQuery.isError || usersQuery.isError) {
    return (
      <div className="dashboard-container">
        <ErrorMessage
          message="ダッシュボードデータの取得に失敗しました。"
          onRetry={() => {
            devicesQuery.refetch();
            usersQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>ダッシュボード</h1>
        <p>Device Manager 管理画面へようこそ</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-content">
            <h3>総端末数</h3>
            <p className="stat-value">{stats.totalDevices}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>利用可能</h3>
            <p className="stat-value">{stats.availableDevices}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>貸出中</h3>
            <p className="stat-value">{stats.inUseDevices}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>ユーザー数</h3>
            <p className="stat-value">{stats.totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/devices" className="action-button">
          📱 端末管理へ
        </Link>
        <Link to="/users" className="action-button">
          👥 ユーザー管理へ
        </Link>
      </div>
    </div>
  );
}
