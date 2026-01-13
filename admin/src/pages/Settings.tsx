import { useState } from "react";
import "../styles/Settings.css";

interface SettingsProps {
  user?: any;
}

export function Settings({ user }: SettingsProps) {
  const [settings, setSettings] = useState({
    appName: "Device Manager",
    maxDevicesPerUser: 5,
    enableNotifications: true,
    theme: "light",
  });

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    console.log("設定を保存:", settings);
    alert("設定を保存しました");
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>設定</h1>
        <p>システム設定を変更します</p>
      </div>

      <div className="settings-form">
        <div className="settings-section">
          <h2>一般設定</h2>

          <div className="form-group">
            <label htmlFor="appName">アプリケーション名</label>
            <input
              id="appName"
              type="text"
              value={settings.appName}
              onChange={(e) => handleChange("appName", e.target.value)}
              placeholder="アプリケーション名を入力"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxDevices">ユーザーあたりの最大貸出端末数</label>
            <input
              id="maxDevices"
              type="number"
              value={settings.maxDevicesPerUser}
              onChange={(e) => handleChange("maxDevicesPerUser", parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>通知設定</h2>

          <div className="form-group checkbox">
            <input
              id="notifications"
              type="checkbox"
              checked={settings.enableNotifications}
              onChange={(e) => handleChange("enableNotifications", e.target.checked)}
            />
            <label htmlFor="notifications">通知を有効にする</label>
          </div>
        </div>

        <div className="settings-section">
          <h2>表示設定</h2>

          <div className="form-group">
            <label htmlFor="theme">テーマ</label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
            >
              <option value="light">ライト</option>
              <option value="dark">ダーク</option>
              <option value="auto">自動</option>
            </select>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
