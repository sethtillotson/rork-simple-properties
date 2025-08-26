import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tenant } from '@/types/property';
import { useProperties } from '@/context/PropertiesContext';

const STORAGE_KEY = 'tenants';

export async function deleteTenantsByPropertyIdFromStorage(propertyId: string) {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    const list: Tenant[] = json ? (JSON.parse(json) as Tenant[]) : [];
    const filtered = list.filter(t => t.propertyId !== propertyId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log('[TenantsContext] deleteTenantsByPropertyIdFromStorage', { propertyId, removed: list.length - filtered.length });
  } catch (e) {
    console.error('[TenantsContext] deleteTenantsByPropertyIdFromStorage error', e);
  }
}

export const [TenantsProvider, useTenants] = createContextHook(() => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const { updatePropertyOccupancy } = useProperties();

  useEffect(() => {
    const load = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json) as unknown;
          if (Array.isArray(parsed)) {
            setTenants(parsed as Tenant[]);
            console.log('[TenantsContext] Loaded from storage', (parsed as unknown[]).length);
          }
        }
      } catch (e) {
        console.error('[TenantsContext] load error', e);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (items: Tenant[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[TenantsContext] Persisted', items.length);
    } catch (e) {
      console.error('[TenantsContext] persist error', e);
    }
  }, []);

  const addTenant = useCallback((tenant: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = { ...tenant, id: Date.now().toString() };
    setTenants(prev => {
      const updated = [...prev, newTenant];
      void persist(updated);
      return updated;
    });
    console.log('[TenantsContext] addTenant', newTenant);
  }, [persist]);

  const updateTenant = useCallback((id: string, updates: Partial<Omit<Tenant, 'id'>> ) => {
    setTenants(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      void persist(updated);
      return updated;
    });
    console.log('[TenantsContext] updateTenant', { id, updates });
  }, [persist]);

  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => {
      const target = prev.find(t => t.id === id);
      const updated = prev.filter(t => t.id !== id);
      void persist(updated);
      if (target?.propertyId) {
        updatePropertyOccupancy(target.propertyId, 'Vacant');
      }
      return updated;
    });
    console.log('[TenantsContext] deleteTenant', { id });
  }, [persist, updatePropertyOccupancy]);

  const deleteTenantsByPropertyId = useCallback((propertyId: string) => {
    setTenants(prev => {
      const updated = prev.filter(t => t.propertyId !== propertyId);
      void persist(updated);
      return updated;
    });
    console.log('[TenantsContext] deleteTenantsByPropertyId', { propertyId });
  }, [persist]);

  const getTenantById = useCallback((id: string) => {
    return tenants.find(t => t.id === id);
  }, [tenants]);

  const value = useMemo(() => ({ tenants, addTenant, updateTenant, deleteTenant, deleteTenantsByPropertyId, getTenantById }), [tenants, addTenant, updateTenant, deleteTenant, deleteTenantsByPropertyId, getTenantById]);
  return value;
});