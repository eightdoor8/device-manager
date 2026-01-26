import { useState, useEffect } from 'react';
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
  const [records, setRecords] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch rental history data
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock data - in production, this would call the tRPC API
        // For now, we'll use mock data to avoid tRPC type issues
        const mockRecords: RentalRecord[] = [
          {
            id: '1',
            deviceId: 1,
            deviceName: 'iPad Pro 12.9"',
            userId: 'user1',
            userName: 'John Doe',
            borrowedAt: '2026-01-20 10:00',
            returnedAt: '2026-01-21 14:30',
            status: 'returned',
          },
          {
            id: '2',
            deviceId: 2,
            deviceName: 'MacBook Pro 16"',
            userId: 'user2',
            userName: 'Jane Smith',
            borrowedAt: '2026-01-22 09:00',
            status: 'borrowed',
          },
        ];
        
        setRecords(mockRecords);
      } catch (err) {
        setError(err instanceof Error ? err.message : '貸出履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleDeleteRecord = async (recordId: string) => {
    if (confirm('この履歴を削除してもよろしいですか？')) {
      try {
        setDeleting(true);
        // Mock delete - in production, this would call the tRPC API
        setRecords(records.filter(r => r.id !== recordId));
        alert('履歴を削除しました');
      } catch (err) {
        alert(`エラー: ${err instanceof Error ? err.message : '不明なエラーが発生しました'}`);
      } finally {
        setDeleting(false);
      }
    }
  };

  if (error) {
    return (
      <div className="rental-history-container">
        <div className="rental-history-header">
          <h1>貸出履歴</h1>
          <p className="subtitle">端末の貸出・返却履歴（最新100件）</p>
        </div>
        <div className="error-message">
          <p>エラー: {error}</p>
          <button onClick={() => window.location.reload()}>再読み込み</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rental-history-container">
      <div className="rental-history-header">
        <h1>貸出履歴</h1>
        <p className="subtitle">端末の貸出・返却履歴（最新100件）</p>
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
            {loading ? (
              <tr>
                <td colSpan={6} className="loading">読み込み中...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">貸出履歴がありません</td>
              </tr>
            ) : (
              records.map((record: RentalRecord) => (
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
                      disabled={deleting}
                    >
                      {deleting ? '処理中...' : '削除'}
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
