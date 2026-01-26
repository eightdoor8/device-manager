import { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase-auth';
import '../styles/RentalHistory.css';

interface RentalRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  userId: string;
  userName: string;
  borrowedAt: Date;
  returnedAt?: Date;
  status: 'borrowed' | 'returned';
}

export default function RentalHistory() {
  const [records, setRecords] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Firestore Timestamp を Date に変換
  const convertTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return new Date();
  };

  // Fetch rental history data from Firebase
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!db) {
          throw new Error('Firestore is not initialized');
        }

        // Firebase の devices コレクションから貸出履歴を取得
        const devicesCollection = collection(db, 'devices');
        const devicesSnapshot = await getDocs(devicesCollection);

        const rentalRecords: RentalRecord[] = [];

        devicesSnapshot.docs.forEach((doc) => {
          const data = doc.data();

          // borrowedAt が存在する場合のみ貸出履歴として記録
          if (data.borrowedAt) {
            const borrowedAt = convertTimestamp(data.borrowedAt);
            const returnedAt = data.status === 'available' ? convertTimestamp(data.updatedAt) : undefined;

            rentalRecords.push({
              id: doc.id,
              deviceId: doc.id,
              deviceName: data.modelName || 'Unknown',
              manufacturer: data.manufacturer || 'Unknown',
              userId: data.currentUserId || 'Unknown',
              userName: data.currentUserName || 'Unknown',
              borrowedAt: borrowedAt,
              returnedAt: returnedAt,
              status: data.status === 'in_use' ? 'borrowed' : 'returned',
            });
          }
        });

        // 貸出日時の新しい順にソート
        rentalRecords.sort((a, b) => b.borrowedAt.getTime() - a.borrowedAt.getTime());

        setRecords(rentalRecords);
      } catch (err) {
        console.error('Error loading rental history:', err);
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
        // Firebase から削除する処理は後で実装
        setRecords(records.filter((r) => r.id !== recordId));
        alert('履歴を削除しました');
      } catch (err) {
        alert(`エラー: ${err instanceof Error ? err.message : '不明なエラーが発生しました'}`);
      } finally {
        setDeleting(false);
      }
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
              <th>メーカー</th>
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
                <td colSpan={7} className="loading">
                  読み込み中...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty">
                  貸出履歴がありません
                </td>
              </tr>
            ) : (
              records.map((record: RentalRecord) => (
                <tr key={record.id}>
                  <td>{record.deviceName}</td>
                  <td>{record.manufacturer}</td>
                  <td>{record.userName}</td>
                  <td>{formatDate(record.borrowedAt)}</td>
                  <td>{record.returnedAt ? formatDate(record.returnedAt) : '-'}</td>
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
