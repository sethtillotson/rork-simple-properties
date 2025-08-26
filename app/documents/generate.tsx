import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Button, Surface, Text, TextInput, Divider, Portal, Modal } from 'react-native-paper';
import { useDocumentTemplates } from '@/context/DocumentTemplatesContext';
import { useProperties } from '@/context/PropertiesContext';
import { useTenants } from '@/context/TenantsContext';
import { SafeAreaView } from 'react-native-safe-area-context';

function extractPlaceholders(template: string): string[] {
  const set = new Set<string>();
  const re = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    set.add(m[1]);
  }
  return Array.from(set);
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function fillTemplate(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match: string, key: string) => {
    const v = values[key];
    return v != null ? String(v) : `{{${key}}}`;
  });
}

export default function GenerateDocumentScreen() {
  const { templateId, propertyId, tenantId } = useLocalSearchParams<{ templateId?: string; propertyId?: string; tenantId?: string }>();
  const { getById } = useDocumentTemplates();
  const { properties } = useProperties();
  const { getTenantById } = useTenants();

  const template = useMemo(() => getById(String(templateId ?? '')) , [getById, templateId]);
  const tenant = useMemo(() => (tenantId ? getTenantById(String(tenantId)) : undefined), [getTenantById, tenantId]);
  const property = useMemo(() => {
    if (propertyId) return properties.find(p => p.id === propertyId);
    if (tenant?.propertyId) return properties.find(p => p.id === tenant.propertyId);
    return undefined;
  }, [properties, propertyId, tenant]);

  const knownValues = useMemo<Record<string, string | number | undefined>>(() => {
    const country = property?.country;
    const currency = country === 'US' ? '$' : country === 'UK' ? '£' : '';
    const monthly = property?.monthlyRent != null ? `${currency}${property?.monthlyRent}` : undefined;
    return {
      property_address: property ? [property.address, property.city].filter(Boolean).join(', ') : undefined,
      tenant_name: tenant?.name ?? undefined,
      monthly_rent: monthly,
      current_date: new Date().toLocaleDateString(),
    };
  }, [property, tenant]);

  const placeholders = useMemo<string[]>(() => extractPlaceholders(template?.content ?? ''), [template?.content]);
  const unknownKeys = useMemo<string[]>(() => placeholders.filter(k => knownValues[k] == null), [placeholders, knownValues]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    setAnswers({});
  }, [templateId]);

  const onChangeAnswer = useCallback((key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const onPreview = useCallback(() => {
    const completed = fillTemplate(template?.content ?? '', { ...knownValues, ...answers });
    setPreview(completed);
    setShowPreview(true);
    console.log('[Generator] Preview prepared', { keys: Object.keys({ ...knownValues, ...answers }).length });
  }, [template?.content, knownValues, answers]);

  const onContinue = useCallback(() => {
    setShowPreview(false);
    router.push({ pathname: '/documents/fill', params: { templateId: String(templateId ?? ''), propertyId: property?.id ?? '', tenantId: tenant?.id ?? '', prefilledText: preview } });
  }, [templateId, property?.id, tenant?.id, preview]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Generate Document' }} />
      <Surface style={styles.card} elevation={1} testID="generatorCard">
        <Text variant="titleMedium" testID="generatorTitle">{template?.name ?? 'Template'}</Text>
        <Divider />
        {unknownKeys.length === 0 ? (
          <View style={{ paddingVertical: 12 }}>
            <Text style={styles.helper} testID="noQuestions">No questions needed. Tap Preview to review the completed document.</Text>
          </View>
        ) : (
          <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 24 }}>
            {unknownKeys.map((key) => (
              <View key={key} style={styles.field} testID={`field-${key}`}>
                <Text style={styles.label}>{humanize(key)}</Text>
                <TextInput
                  mode="outlined"
                  value={answers[key] ?? ''}
                  onChangeText={(t) => onChangeAnswer(key, t)}
                  placeholder={`Enter ${humanize(key)}`}
                  style={styles.input}
                />
              </View>
            ))}
          </ScrollView>
        )}
        <Button mode="contained" onPress={onPreview} testID="previewBtn">
          <Text>Preview Document</Text>
        </Button>
      </Surface>

      <Portal>
        <Modal visible={showPreview} onDismiss={() => setShowPreview(false)} contentContainerStyle={styles.modalWrap}>
          <Surface elevation={2} style={styles.modalSurface} testID="previewModal">
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <Text variant="titleMedium">Preview</Text>
              <Button mode="text" onPress={() => setShowPreview(false)} testID="closePreview"><Text>Close</Text></Button>
            </View>
            <Divider />
            <ScrollView style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text selectable>{preview}</Text>
            </ScrollView>
            <Button mode="contained" onPress={onContinue} testID="continueBtn" style={{ marginTop: 12 }}>
              <Text>Continue</Text>
            </Button>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 16 },
  card: { padding: 12, gap: 12, borderRadius: 12, backgroundColor: '#fff', flex: 1 },
  helper: { color: '#6b7280' },
  form: { maxHeight: 420 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, color: '#374151' },
  input: { backgroundColor: '#ffffff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  modalWrap: { margin: 12 },
  modalSurface: { padding: 16, borderRadius: 16, backgroundColor: '#fff', height: '85%' },
  modalScroll: { marginTop: 8 },
});