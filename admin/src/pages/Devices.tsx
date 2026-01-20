import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { DeleteConfirmDialog } from "../components/DeleteConfirmDialog";
import "../styles/Devices.css";
import "../styles/Messages.css";

interface DevicesProps {
  user?: any;
}

interface Device {
  id: number | string;
  modelName: string;
  osName: string;
  osVersion: string;
  uuid: string;
  status: "available" | "in_use";
  currentUserName?: string;
  registeredAt: string | Date;
}

export function Devices({ user }: DevicesProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortColumn, setSortColumn] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "in_use">("all");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string>("");

  // URLクエリパラメータから初期フィルタを設定
  useEffect(() => {
    const filterParam = searchParams.get("status");
    if (filterParam === "available" || filterParam === "in_use") {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const devicesQuery = trpc.devices.list.useQuery();
  const csvQuery = trpc.devices.csv.useQuery();
  const deleteMutation = trpc.devices.delete.useMutation({
    onSuccess: () => {
      setDeleteSuccess("端末を削除しました");
      setDeleteError(null);
      setDeleteConfirmOpen(false);
      setTimeout(() => setDeleteSuccess(null), 3000);
      devicesQuery.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "削除に失敗しました";
      setDeleteError(errorMessage);
      setDeleteSuccess(null);
      console.error("Delete error:", error);
    },
  });

  const handleDownloadCSV = async () => {
    try {
      if (!csvQuery.data) return;
      const blob = new Blob([csvQuery.data], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `devices_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("CSV出力エラー:", error);
    }
  };

  const handleDeleteClick = (deviceId: number | string, deviceName: string) => {
    setSelectedDeviceId(String(deviceId));
    setSelectedDeviceName(deviceName);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDeviceId !== null) {
      setDeleteError(null);
      setDeleteSuccess(null);
      deleteMutation.mutate({ id: selectedDeviceId });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSelectedDeviceId(null);
    setSelectedDeviceName("");
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const handleFilterChange = (newFilter: "all" | "available" | "in_use") => {
    setStatusFilter(newFilter);
    if (newFilter === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ status: newFilter });
    }
  };

  if (devicesQuery.isLoading) {
    return (
      <div className="devices-container">
        <LoadingSpinner message="端末情報を読み込み中..." />
      </div>
    );
  }

  if (devicesQuery.isError) {
    return (
      <div className="devices-container">
        <ErrorMessage
          message="端末情報の取得に失敗しました。"
          onRetry={() => devicesQuery.refetch()}
        />
      </div>
    );
  }

  let devices = devicesQuery.data || [];

  // フィルタリング
  if (statusFilter !== "all") {
    devices = devices.filter((d) => d.status === statusFilter);
  }

  // ソート
  devices = [...devices].sort((a, b) => {
    let aVal: any = a[sortColumn as keyof typeof a];
    let bVal: any = b[sortColumn as keyof typeof b];

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="devices-container">
      {deleteError && (
        <div className="error-banner">
          <p>{deleteError}</p>
        </div>
      )}
      {deleteSuccess && (
        <div className="success-banner">
          <p>{deleteSuccess}</p>
        </div>
      )}
      <div className="devices-header">
        <div>
          <h1>端末管理</h1>
          <p>登録済み端末の一覧と管理</p>
        </div>
        <button onClick={handleDownloadCSV} className="csv-button" disabled={!csvQuery.data}>
          📥 CSV出力
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>ステータスフィルタ：</label>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">すべて</option>
            <option value="available">利用可能</option>
            <option value="in_use">貸出中</option>
          </select>
        </div>
      </div>

      <div className="devices-table-wrapper">
        <table className="devices-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")} className="sortable">
                ID {sortColumn === "id" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("modelName")} className="sortable">
                モデル {sortColumn === "modelName" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("osName")} className="sortable">
                OS {sortColumn === "osName" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th>UUID</th>
              <th onClick={() => handleSort("status")} className="sortable">
                ステータス {sortColumn === "status" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th>現在のユーザー</th>
              <th onClick={() => handleSort("registeredAt")} className="sortable">
                登録日時 {sortColumn === "registeredAt" && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.id}</td>
                <td>{device.modelName}</td>
                <td>
                  {device.osName} {device.osVersion}
                </td>
                <td className="uuid-cell" title={device.uuid}>
                  {device.uuid}
                </td>
                <td>
                  <span className={`status-badge status-${device.status}`}>
                    {device.status === "available" ? "利用可能" : "貸出中"}
                  </span>
                </td>
                <td>{device.currentUserName || "-"}</td>
                <td>{new Date(device.registeredAt).toLocaleDateString("ja-JP")}</td>
                <td>
                  <div className="action-buttons">
                    {device.status === "available" && (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteClick(device.id, device.modelName)}
                        disabled={deleteMutation.isPending}
                        title="この端末を削除"
                      >
                        {deleteMutation.isPending ? "削除中..." : "削除"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {devices.length === 0 && (
        <div className="empty-state">
          <p>条件に合致する端末がありません</p>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        deviceName={selectedDeviceName}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
