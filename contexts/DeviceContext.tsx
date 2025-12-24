import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Device } from '@/types/device';
import { getDevices } from '@/services/device-service';

interface DeviceContextType {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  updateDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  addDevice: (device: Device) => void;
  syncDevices: () => Promise<void>;
  loading: boolean;
  lastSyncTime: number;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(0);

  // デバイスを同期（サーバーから最新データを取得）
  const syncDevices = useCallback(async () => {
    try {
      console.log('[DeviceContext] Syncing devices from server...');
      setLoading(true);
      const data = await getDevices({});
      setDevices(data);
      setLastSyncTime(Date.now());
      console.log('[DeviceContext] Sync completed, devices:', data.length);
    } catch (error) {
      console.error('[DeviceContext] Sync error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ローカル状態を更新
  const updateDevice = useCallback((updatedDevice: Device) => {
    console.log('[DeviceContext] Updating device:', updatedDevice.id);
    setDevices((prev) =>
      prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
    );
  }, []);

  // デバイスを削除
  const removeDevice = useCallback((deviceId: string) => {
    console.log('[DeviceContext] Removing device:', deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  }, []);

  // デバイスを追加
  const addDevice = useCallback((device: Device) => {
    console.log('[DeviceContext] Adding device:', device.id);
    setDevices((prev) => [device, ...prev]);
  }, []);

  // 定期的に同期（10秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      syncDevices();
    }, 10000);

    return () => clearInterval(interval);
  }, [syncDevices]);

  const value: DeviceContextType = {
    devices,
    setDevices,
    updateDevice,
    removeDevice,
    addDevice,
    syncDevices,
    loading,
    lastSyncTime,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within DeviceProvider');
  }
  return context;
}
