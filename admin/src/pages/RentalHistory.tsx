import { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import '../styles/RentalHistory.css';

interface RentalRecord {
  id: string;
  deviceId: number;
  deviceName: string;
  userId: string;
  userName: string;
  borrowedAt: string;
  returnedAt?: string;
  status: 'borrowed' | 'returned';
}

export default function RentalHistory() {
  const [filters, setFilters] = useState({
    deviceName: '',
    userName: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Fetch data using tRPC hooks
  const historyQuery = trpc.rentalHistory.list.useQuery();

  const deleteMutation = trpc.rentalHistory.delete.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      alert('履歴を削除しました');
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteRecord = (recordId: string) => {
    if (confirm('この履歴を削除してもよろしいですか？')) {
      deleteMutation.mutate({ rentalHistoryId: recordId });
    }
  };

  // Filter records
  const filteredRecords = (historyQuery.data || []).filter((record: RentalRecord) => {
    const matchDevice = record.deviceName.toLowerCase().includes(filters.deviceName.toLowerCase());
    const matchUser = record.userName.toLowerCase().includes(filters.userName.toLowerCase());
    const matchStatus = filters.status === 'all' || record.status === filters.status;
    const matchStartDate = !filters.startDate || record.borrowedAt >= filters.startDate;
    const matchEndDate = !filters.endDate || record.borrowedAt <= filters.endDate;

    return matchDevice && matchUser && matchStatus && matchStartDate && matchEndDate;
  });

  return (
    <div className="rental-history-container">
      <div className="rental-history-header">
        <h1>貸出履歴</h1>
        <p className="subtitle">端末の貸出・返却履歴を表示します（自動ログ）</p>
      </div>

      {/* Filters */}
      <div className="filters">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="all">全て</option>
          <option value="borrowed">貸出中</option>
          <option value="returned">返却済み</option>
        </select>
        <input
          type="text"
          name="deviceName"
          placeholder="端末名で検索"
          value={filters.deviceName}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="text"
          name="userName"
          placeholder="ユーザー名で検索"
          value={filters.userName}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="date"
          name="startDate"
          placeholder="開始日"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="date"
          name="endDate"
          placeholder="終了日"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="rental-table">
          <thead>
            <tr>
              <th>端末名</th>
              <th>ユーザー</th>
              <th>貸出日時</th>
              <th>返却日時</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {historyQuery.isLoading ? (
              <tr>
                <td colSpan={6} className="loading">読み込み中...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">貸出履歴がありません</td>
              </tr>
            ) : (
              filteredRecords.map((record: RentalRecord) => (
                <tr key={record.id}>
                  <td>{record.deviceName}</td>
                  <td>{record.userName}</td>
                  <td>{record.borrowedAt}</td>
                  <td>{record.returnedAt || '-'}</td>
                  <td>
                    <span className={`status-badge status-${record.status}`}>
                      {record.status === 'borrowed' ? '貸出中' : '返却済み'}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteRecord(record.id)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? '処理中...' : '削除'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
