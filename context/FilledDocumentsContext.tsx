import React, { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface FilledDocumentRecord {
  id: string;
  templateId: string;
  templateName: string;
  filledText: string;
  propertyId?: string;
  tenantId?: string;
  createdAt: string;
}

const STORAGE_KEY = 'filled_documents_v1';

export const [FilledDocumentsProvider, useFilledDocuments] = createContextHook(() => {
  const [records, setRecords] = useState<FilledDocumentRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: FilledDocumentRecord[] = raw ? JSON.parse(raw) : [];
        setRecords(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to load filled documents', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: FilledDocumentRecord[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to persist filled documents', e);
    }
  }, []);

  const addRecord = useCallback((input: Omit<FilledDocumentRecord, 'id' | 'createdAt'>) => {
    const rec: FilledDocumentRecord = {
      ...input,
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    };
    const next = [rec, ...records];
    setRecords(next);
    void persist(next);
    return rec;
  }, [persist, records]);

  const deleteRecord = useCallback((id: string) => {
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    void persist(next);
  }, [persist, records]);

  const getByTenant = useCallback((tenantId: string) => records.filter(r => r.tenantId === tenantId), [records]);
  const getByProperty = useCallback((propertyId: string) => records.filter(r => r.propertyId === propertyId), [records]);

  return { records, isLoaded, addRecord, deleteRecord, getByTenant, getByProperty };
});

export type FilledDocumentsContextType = ReturnType<typeof useFilledDocuments>;
