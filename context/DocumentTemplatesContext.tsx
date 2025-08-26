import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';

export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'document_templates_v1';

export const [DocumentTemplatesProvider, useDocumentTemplates] = createContextHook(() => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed: DocumentTemplate[] = raw ? JSON.parse(raw) : [];
      setTemplates(Array.isArray(parsed) ? parsed : []);
      setError(null);
    } catch (e) {
      console.error('Failed to load document templates', e);
      setError('Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback(async (next: DocumentTemplate[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to persist document templates', e);
      Alert.alert('Error', 'Could not save templates.');
    }
  }, []);

  const addTemplate = useCallback((input: { name: string; content: string; }): DocumentTemplate => {
    const now = new Date().toISOString();
    const t: DocumentTemplate = { id: Math.random().toString(36).slice(2), name: input.name, content: input.content, createdAt: now, updatedAt: now };
    const next = [t, ...templates];
    setTemplates(next);
    void persist(next);
    return t;
  }, [persist, templates]);

  const addCustomTemplate = useCallback((input: { name: string; content: string; }): DocumentTemplate => {
    return addTemplate(input);
  }, [addTemplate]);

  const updateTemplate = useCallback((id: string, patch: { name?: string; content?: string; }) => {
    const next = templates.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
    setTemplates(next);
    void persist(next);
  }, [persist, templates]);

  const deleteTemplate = useCallback((id: string) => {
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    void persist(next);
  }, [persist, templates]);

  const getById = useCallback((id: string) => templates.find(t => t.id === id), [templates]);

  return { templates, isLoading, error, addTemplate, addCustomTemplate, updateTemplate, deleteTemplate, getById, reload: load };
});

export type DocumentTemplatesContextType = ReturnType<typeof useDocumentTemplates>;
