import createContextHook from '@nkzw/create-context-hook';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checklistTemplates, ChecklistTemplate } from '@/utils/checklistTemplates';

export interface CustomChecklistTemplate extends ChecklistTemplate {
  id: string;
  isCustom: true;
}

export type AnyChecklistTemplate = ChecklistTemplate | CustomChecklistTemplate;

const STORAGE_KEY = 'customChecklistTemplates';

export const [ChecklistTemplatesProvider, useChecklistTemplates] = createContextHook(() => {
  const [customTemplates, setCustomTemplates] = useState<CustomChecklistTemplate[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed)) {
            const safe = (parsed as any[]).map((t) => ({
              id: String(t.id ?? Date.now()),
              name: String(t.name ?? 'Untitled'),
              isCustom: true as const,
              items: Array.isArray(t.items)
                ? t.items.map((it: any, idx: number) => ({
                    id: String(it.id ?? `${t.id}-item-${idx}`),
                    text: String(it.text ?? ''),
                  }))
                : [],
            })) as CustomChecklistTemplate[];
            setCustomTemplates(safe);
            console.log('[ChecklistTemplates] loaded', safe.length);
          }
        }
      } catch (e) {
        console.error('[ChecklistTemplates] load error', e);
      }
    };
    void load();
  }, []);

  const persist = useCallback(async (items: CustomChecklistTemplate[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log('[ChecklistTemplates] persisted', items.length);
    } catch (e) {
      console.error('[ChecklistTemplates] persist error', e);
    }
  }, []);

  const addCustomTemplate = useCallback((tpl: Omit<CustomChecklistTemplate, 'id' | 'isCustom'> & Partial<Pick<CustomChecklistTemplate, 'id'>>) => {
    const newTpl: CustomChecklistTemplate = {
      id: tpl.id ?? Date.now().toString(),
      name: tpl.name,
      isCustom: true,
      items: tpl.items.map((it, idx) => ({ id: it.id ?? `${Date.now()}-${idx}`, text: it.text })),
    };
    setCustomTemplates((prev) => {
      const next = [...prev, newTpl];
      void persist(next);
      return next;
    });
    return newTpl;
  }, [persist]);

  const updateCustomTemplate = useCallback((id: string, updates: Partial<CustomChecklistTemplate>) => {
    setCustomTemplates((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      void persist(next);
      return next;
    });
  }, [persist]);

  const deleteCustomTemplate = useCallback((id: string) => {
    setCustomTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      void persist(next);
      return next;
    });
  }, [persist]);

  const allTemplates: AnyChecklistTemplate[] = useMemo(() => {
    return [
      ...checklistTemplates,
      ...customTemplates,
    ];
  }, [customTemplates]);

  return {
    defaultTemplates: checklistTemplates,
    customTemplates,
    allTemplates,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
  };
});