import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaintenanceRequest } from '@/types/property';

export type NewMaintenanceRequest = {
  propertyId: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
};

const STORAGE_KEY = 'maintenanceRequests';

export async function deleteMaintenanceByPropertyIdFromStorage(propertyId: string) {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const list: MaintenanceRequest[] = json ? (JSON.parse(json) as MaintenanceRequest[]) : [];
    const filtered = list.filter(r => r.propertyId !== propertyId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[MaintenanceContext] deleteMaintenanceByPropertyIdFromStorage', { propertyId, removed: list.length - filtered.length });
  } catch (e) {
    console.error('[MaintenanceContext] deleteMaintenanceByPropertyIdFromStorage error', e);
  }
}

export const [MaintenanceProvider, useMaintenance] = createContextHook(() => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json) as unknown;
          if (Array.isArray(parsed)) {
            setRequests(parsed as MaintenanceRequest[]);
            console.log('[MaintenanceContext] Loaded from storage', (parsed as unknown[]).length);
          }
        }
      } catch (e) {
        console.error('[MaintenanceContext] load error', e);
      }
    };
    void load();
  }, []);

  const persist = useCallback(async (items: MaintenanceRequest[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[MaintenanceContext] Persisted', items.length);
    } catch (e) {
      console.error('[MaintenanceContext] persist error', e);
    }
  }, []);

  const addMaintenanceRequest = useCallback((data: NewMaintenanceRequest) => {
    const now = new Date().toISOString();
    const req: MaintenanceRequest = {
      id: Date.now().toString(),
      propertyId: data.propertyId,
      title: data.description.length > 60 ? `${data.description.slice(0, 57)}...` : data.description,
      description: data.description,
      priority: data.priority,
      status: 'pending',
      createdAt: now,
    };
    setRequests(prev => {
      const updated = [req, ...prev];
      void persist(updated);
      return updated;
    });
    console.log('[MaintenanceContext] addMaintenanceRequest', req);
  }, [persist]);

  const updateMaintenanceRequest = useCallback((id: string, updates: Partial<MaintenanceRequest>) => {
    setRequests(prev => {
      const updated = prev.map(r => (r.id === id ? { ...r, ...updates, title: updates.description != null ? (updates.description.length > 60 ? `${updates.description.slice(0,57)}...` : updates.description) : r.title } : r));
      void persist(updated);
      return updated;
    });
    console.log('[MaintenanceContext] updateMaintenanceRequest', { id, updates });
  }, [persist]);

  const deleteMaintenanceRequest = useCallback((id: string) => {
    setRequests(prev => {
      const updated = prev.filter(r => r.id !== id);
      void persist(updated);
      return updated;
    });
    console.log('[MaintenanceContext] deleteMaintenanceRequest', { id });
  }, [persist]);

  const deleteMaintenanceByPropertyId = useCallback((propertyId: string) => {
    setRequests(prev => {
      const updated = prev.filter(r => r.propertyId !== propertyId);
      void persist(updated);
      return updated;
    });
    console.log('[MaintenanceContext] deleteMaintenanceByPropertyId', { propertyId });
  }, [persist]);

  const getRequestById = useCallback((id: string) => {
    return requests.find(r => r.id === id);
  }, [requests]);

  const value = useMemo(() => ({ requests, addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, deleteMaintenanceByPropertyId, getRequestById }), [requests, addMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, deleteMaintenanceByPropertyId, getRequestById]);
  return value;
});