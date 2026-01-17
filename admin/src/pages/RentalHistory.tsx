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
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    userId: '',
    borrowedAt: new Date().toISOString().split('T')[0],
  });
  const [filters, setFilters] = useState({
    deviceName: '',
    userName: '',
    status: 'all',
    startDate: '',
    endDate: '',
  });

  // Fetch data using tRPC hooks
  const devicesQuery = trpc.devices.list.useQuery();
  const usersQuery = trpc.users.list.useQuery();
  const historyQuery = trpc.rentalHistory.list.useQuery();

  // Debug logging
  useEffect(() => {
    console.log('[RentalHistory] Devices Query:', {
      isLoading: devicesQuery.isLoading,
      isError: devicesQuery.isError,
      error: devicesQuery.error,
      dataLength: devicesQuery.data?.length,
      data: devicesQuery.data,
    });
  }, [devicesQuery.data, devicesQuery.isLoading, devicesQuery.isError, devicesQuery.error]);

  // Mutations
  const recordMutation = trpc.rentalHistory.record.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      setFormData({
        deviceId: '',
        userId: '',
        borrowedAt: new Date().toISOString().split('T')[0],
      });
      setShowModal(false);
      alert('貸出を記録しました');
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const returnMutation = trpc.rentalHistory.return.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      alert('返却を記録しました');
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const deleteMutation = trpc.rentalHistory.delete.useMutation({
    onSuccess: () => {
      historyQuery.refetch();
      alert('履歴を削除しました');
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecordRental = async () => {
    if (!formData.deviceId || !formData.userId) {
      alert('全ての項目を入力してください');
      return;
    }

    const selectedDevice = devicesQuery.data?.find(d => d.id === parseInt(formData.deviceId));
    const selectedUser = usersQuery.data?.find(u => u.id === formData.userId);

    if (!selectedDevice || !selectedUser) {
      alert('端末またはユーザーが見つかりません');
      return;
    }

    recordMutation.mutate({
      deviceId: parseInt(formData.deviceId),
      deviceName: selectedDevice.name,
      userId: formData.userId,
      userName: selectedUser.name,
      borrowedAt: new Date(formData.borrowedAt),
    });
  };

  const handleReturnDevice = (recordId: string) => {
    returnMutation.mutate({
      rentalHistoryId: recordId,
      returnedAt: new Date(),
    });
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
        <button className="btn-record" onClick={() => setShowModal(true)}>
          + 貸出を記録
        </button>
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
                    {record.status === 'borrowed' && (
                      <button
                        className="btn-return"
                        onClick={() => handleReturnDevice(record.id)}
                        disabled={returnMutation.isPending}
                      >
                        {returnMutation.isPending ? '処理中...' : '返却'}
                      </button>
                    )}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>貸出を記録</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>端末 *</label>
                <select
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {devicesQuery.data?.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.modelName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ユーザー *</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">選択してください</option>
                  {usersQuery.data?.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>貸出日 *</label>
                <input
                  type="date"
                  name="borrowedAt"
                  value={formData.borrowedAt}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={handleRecordRental}
                disabled={recordMutation.isPending}
              >
                {recordMutation.isPending ? '処理中...' : '記録'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
