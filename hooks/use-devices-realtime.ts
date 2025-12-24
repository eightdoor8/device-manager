import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Device } from '@/types/device';

/**
 * Firestoreのリアルタイムリスナーを使用して端末一覧を取得
 * データベースの変更を自動的に検知し、UIを即座に更新
 * 
 * 注意：複合インデックスの問題を避けるため、
 * すべてのフィルタリングはクライアント側で行う
 */
export function useDevicesRealtime(
  statusFilter?: string,
  searchQuery?: string,
  osFilter?: string,
  manufacturerFilter?: string
) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      console.error('[useDevicesRealtime] Firebase not initialized');
      setError(new Error('Firebase not initialized'));
      setLoading(false);
      return;
    }

    try {
      console.log('[useDevicesRealtime] Setting up listener for all devices');
      
      // すべてのデバイスを取得（フィルタなし）
      const q = query(collection(db, 'devices'));

      // リアルタイムリスナーを設定
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('[useDevicesRealtime] Snapshot received, docs:', snapshot.size);
          
          const allData: Device[] = [];
          snapshot.forEach((doc) => {
            allData.push({
              id: doc.id,
              ...doc.data(),
            } as Device);
          });

          // クライアント側でフィルタリング
          let filtered = allData;

          // ステータスフィルタ
          if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(d => d.status === statusFilter);
            console.log('[useDevicesRealtime] After status filter:', filtered.length);
          }

          // OSフィルタ
          if (osFilter && osFilter !== 'all') {
            filtered = filtered.filter(d => d.osName === osFilter);
            console.log('[useDevicesRealtime] After OS filter:', filtered.length);
          }

          // メーカーフィルタ
          if (manufacturerFilter && manufacturerFilter !== 'all') {
            filtered = filtered.filter(d => d.manufacturer === manufacturerFilter);
            console.log('[useDevicesRealtime] After manufacturer filter:', filtered.length);
          }

          // 検索フィルタ
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
              (device) =>
                device.modelName?.toLowerCase().includes(query) ||
                device.manufacturer?.toLowerCase().includes(query) ||
                device.osName?.toLowerCase().includes(query) ||
                device.osVersion?.toLowerCase().includes(query) ||
                device.uuid?.toLowerCase().includes(query)
            );
            console.log('[useDevicesRealtime] After search filter:', filtered.length);
          }

          // ステータスで並べ替え（availableが先）
          filtered.sort((a, b) => {
            if (a.status === 'available' && b.status !== 'available') return -1;
            if (a.status !== 'available' && b.status === 'available') return 1;
            // 同じステータス内ではupdatedAtで降順
            return (
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          });

          console.log('[useDevicesRealtime] Final filtered devices:', filtered.length);
          setDevices(filtered);
          setLoading(false);
        },
        (err) => {
          console.error('[useDevicesRealtime] Snapshot error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // クリーンアップ：コンポーネントがアンマウントされたときにリスナーを削除
      return () => {
        console.log('[useDevicesRealtime] Cleaning up listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('[useDevicesRealtime] Setup error:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [statusFilter, searchQuery, osFilter, manufacturerFilter]);

  return { devices, loading, error };
}

/**
 * 特定ユーザーの借りた端末をリアルタイムで取得
 */
export function useUserDevicesRealtime(userId: string) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db || !userId) {
      console.log('[useUserDevicesRealtime] No db or userId');
      setLoading(false);
      return;
    }

    try {
      console.log('[useUserDevicesRealtime] Setting up listener for user:', userId);
      
      // すべてのデバイスを取得してクライアント側でフィルタ
      const q = query(collection(db, 'devices'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('[useUserDevicesRealtime] Snapshot received, docs:', snapshot.size);
          
          const allData: Device[] = [];
          snapshot.forEach((doc) => {
            allData.push({
              id: doc.id,
              ...doc.data(),
            } as Device);
          });

          // ユーザーが借りた端末のみフィルタ
          const userDevices = allData.filter(d => d.currentUserId === userId);
          console.log('[useUserDevicesRealtime] User devices:', userDevices.length);

          // borrowedAtで降順に並べ替え
          userDevices.sort((a, b) => {
            if (!a.borrowedAt || !b.borrowedAt) return 0;
            return (
              new Date(b.borrowedAt).getTime() -
              new Date(a.borrowedAt).getTime()
            );
          });

          setDevices(userDevices);
          setLoading(false);
        },
        (err) => {
          console.error('[useUserDevicesRealtime] Snapshot error:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => {
        console.log('[useUserDevicesRealtime] Cleaning up listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('[useUserDevicesRealtime] Setup error:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  return { devices, loading, error };
}
