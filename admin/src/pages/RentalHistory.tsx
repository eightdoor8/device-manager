import { useState, useEffect } from 'react';
import { collection, query, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase-auth';
import '../styles/RentalHistory.css';

interface RentalRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  modelName: string;
  userId: string;
  userName: string;
  borrowedAt: string;
  returnedAt?: string;
  status: 'in_use' | 'available';
}

export default function RentalHistory() {
  const [records, setRecords] = useState<RentalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rental history data from Firebase
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query devices collection for items with borrowedAt field
        const devicesRef = collection(db, 'devices');
        const q = query(devicesRef);
        const querySnapshot = await getDocs(q);

        const rentalRecords: RentalRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Only include devices that have borrowedAt (rental history)
          if (data.borrowedAt) {
            // Convert Firestore Timestamp to Date
            const borrowedAtDate = data.borrowedAt instanceof Timestamp
              ? data.borrowedAt.toDate()
              : new Date(data.borrowedAt);

            const updatedAtDate = data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : new Date(data.updatedAt);

            // Format dates as YYYY-MM-DD HH:MM:SS
            const formatDate = (date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            };

            rentalRecords.push({
              id: doc.id,
              deviceId: doc.id,
              deviceName: data.modelName || 'Unknown Device',
              manufacturer: data.manufacturer || 'Unknown',
              modelName: data.modelName || 'Unknown',
              userId: data.currentUserId || 'Unknown',
              userName: data.currentUserName || 'Unknown User',
              borrowedAt: formatDate(borrowedAtDate),
              returnedAt: data.status === 'available' ? formatDate(updatedAtDate) : undefined,
              status: data.status || 'available',
            });
          }
        });

        // Sort by borrowedAt descending (newest first)
        rentalRecords.sort((a, b) => {
          const dateA = new Date(a.borrowedAt).getTime();
          const dateB = new Date(b.borrowedAt).getTime();
          return dateB - dateA;
        });

        setRecords(rentalRecords);
      } catch (err) {
        console.error('Error fetching rental history:', err);
        setError(err instanceof Error ? err.message : '貸出履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
                  <td>{record.manufacturer}</td>
                  <td>{record.userName}</td>
                  <td>{record.borrowedAt}</td>
                  <td>{record.returnedAt || '-'}</td>
                  <td>
                    <span className={`status-badge status-${record.status}`}>
                      {record.status === 'in_use' ? '貸出中' : '返却済み'}
                    </span>
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
