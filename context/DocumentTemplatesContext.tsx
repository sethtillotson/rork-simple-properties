import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Alert } from 'react-native';
import { defaultDocumentTemplates } from '@/utils/documentTemplates';

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

  const mapDefaultToDocs = useCallback((): DocumentTemplate[] => {
    const base = new Date(0).toISOString();
    return defaultDocumentTemplates.map((t, idx) => ({
      id: `default-${idx}-${t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`,
      name: t.name,
      content: t.content,
      createdAt: base,
      updatedAt: base,
    }));
  }, []);

  const defaultMapped = useMemo(() => mapDefaultToDocs(), [mapDefaultToDocs]);

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
    if (id.startsWith('default-')) {
      Alert.alert('Not allowed', 'Default templates cannot be edited. Please duplicate it as a custom template.');
      return;
    }
    const next = templates.map(t => t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
    setTemplates(next);
    void persist(next);
  }, [persist, templates]);

  const deleteTemplate = useCallback((id: string) => {
    if (id.startsWith('default-')) {
      Alert.alert('Not allowed', 'Default templates cannot be deleted.');
      return;
    }
    const next = templates.filter(t => t.id !== id);
    setTemplates(next);
    void persist(next);
  }, [persist, templates]);

  const allTemplates = useMemo<DocumentTemplate[]>(() => {
    return [...defaultMapped, ...templates];
  }, [defaultMapped, templates]);

  const getById = useCallback((id: string) => allTemplates.find(t => t.id === id), [allTemplates]);

  return { templates, allTemplates, isLoading, error, addTemplate, addCustomTemplate, updateTemplate, deleteTemplate, getById, reload: load };
});

export type DocumentTemplatesContextType = ReturnType<typeof useDocumentTemplates>;
