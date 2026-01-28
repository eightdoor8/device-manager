import { useState, useEffect } from 'react';
import { collection, query, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase-auth';
import '../styles/RentalHistory.css';

interface RentalHistoryRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  manufacturer: string;
  osName: string;
  osVersion: string;
  physicalMemory: string;
  userId: string;
  userName: string;
  action: 'borrow' | 'return';
  timestamp: string;
  createdAt: string;
}

export default function RentalHistory() {
  const [records, setRecords] = useState<RentalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rental history data from Firebase
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query rentalHistory collection, ordered by timestamp descending, limit 100
        const rentalHistoryRef = collection(db, 'rentalHistory');
        const q = query(
          rentalHistoryRef,
          orderBy('timestamp', 'desc'),
          limit(100)
        );
        const querySnapshot = await getDocs(q);

        const rentalRecords: RentalHistoryRecord[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Convert Firestore Timestamp to Date
          const timestampDate = data.timestamp instanceof Timestamp
            ? data.timestamp.toDate()
            : new Date(data.timestamp);

          // Format date as YYYY-MM-DD HH:MM:SS
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
            deviceId: data.deviceId || 'Unknown',
            deviceName: data.deviceName || 'Unknown Device',
            manufacturer: data.manufacturer || 'Unknown',
            osName: data.osName || 'Unknown',
            osVersion: data.osVersion || 'Unknown',
            physicalMemory: data.physicalMemory || 'Unknown',
            userId: data.userId || 'Unknown',
            userName: data.userName || 'Unknown User',
            action: data.action || 'unknown',
            timestamp: formatDate(timestampDate),
            createdAt: formatDate(timestampDate),
          });
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
              <th>アクション</th>
              <th>日時</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="loading">読み込み中...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">貸出履歴がありません</td>
              </tr>
            ) : (
              records.map((record: RentalHistoryRecord) => (
                <tr key={record.id}>
                  <td>{record.deviceName}</td>
                  <td>{record.manufacturer}</td>
                  <td>{record.userName}</td>
                  <td>
                    <span className={`action-badge action-${record.action}`}>
                      {record.action === 'borrow' ? '貸出' : '返却'}
                    </span>
                  </td>
                  <td>{record.timestamp}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
