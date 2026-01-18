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

  const handleDeleteRecord = (recordId: string) => {
    if (confirm('この履歴を削除してもよろしいですか？')) {
      deleteMutation.mutate({ rentalHistoryId: recordId });
    }
  };

  // Display records as-is (latest 100 are already fetched from backend)
  const records = historyQuery.data || [];

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
            {historyQuery.isLoading ? (
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
