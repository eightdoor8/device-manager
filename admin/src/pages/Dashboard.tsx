import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase-auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import '../styles/Dashboard.css';

interface Device {
  id: string;
  name: string;
  status: 'available' | 'in_use' | 'maintenance';
  [key: string]: any;
}

interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

interface DashboardProps {
  user?: any;
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Firestore からデバイス情報を取得
        const devicesRef = collection(db, 'devices');
        const devicesSnapshot = await getDocs(devicesRef);
        const devicesData = devicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Device[];
        setDevices(devicesData);

        // Firestore からユーザー情報を取得
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);

        console.log('[Dashboard] Loaded devices:', devicesData.length);
        console.log('[Dashboard] Loaded users:', usersData.length);
      } catch (err: any) {
        console.error('[Dashboard] Error loading data:', err);
        setError(err.message || 'データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="ダッシュボードを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const deviceCount = devices.length;
  const userCount = users.length;
  const availableDevices = devices.filter((d) => d.status === 'available').length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>ダッシュボード</h1>
        <p>Device Manager 管理画面へようこそ</p>
      </div>

      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => handleCardClick('/devices')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick('/devices');
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
          onClick={() => navigate('/devices?status=available')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate('/devices?status=available');
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
          onClick={() => handleCardClick('/users')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleCardClick('/users');
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
