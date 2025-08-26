import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Surface, Text, TextInput, Dialog, Portal, Snackbar } from 'react-native-paper';
import { useDocumentTemplates } from '@/context/DocumentTemplatesContext';
import { useFilledDocuments } from '@/context/FilledDocumentsContext';
import { useTenants } from '@/context/TenantsContext';
import { useProperties } from '@/context/PropertiesContext';
import { SafeAreaView } from 'react-native-safe-area-context';

function fillPlaceholders(template: string, data: Record<string, string | number | undefined>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_: string, key: string) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`;
  });
}

export default function FillDocumentScreen() {
  const { templateId, tenantId, propertyId } = useLocalSearchParams<{ templateId?: string; tenantId?: string; propertyId?: string }>();
  const { getById } = useDocumentTemplates();
  const { addRecord } = useFilledDocuments();
  const { getTenantById } = useTenants();
  const { properties } = useProperties();

  const template = getById(String(templateId ?? ''));
  const tenant = tenantId ? getTenantById(String(tenantId)) : undefined;
  const property = propertyId ? properties.find(p => p.id === propertyId) : tenant ? properties.find(p => p.id === tenant.propertyId) : undefined;

  const data = useMemo(() => ({
    property_address: property ? `${property.address}, ${property.city}` : undefined,
    tenant_name: tenant?.name ?? (tenantId ? undefined : '[Unoccupied]'),
    current_date: new Date().toLocaleDateString(),
  }), [property, tenant, tenantId]);

  const initial = template ? fillPlaceholders(template.content, data) : '';
  const [text, setText] = useState<string>(initial);
  const [showAmountDialog, setShowAmountDialog] = useState<boolean>(false);
  const [amountDue, setAmountDue] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [savedVisible, setSavedVisible] = useState<boolean>(false);

  useEffect(() => {
    if (template?.content && /{{\s*amount_due\s*}}/.test(template.content)) {
      setShowAmountDialog(true);
      console.log('[FillDocument] amount_due placeholder detected, opening dialog');
    }
  }, [template?.content]);

  const applyAmountDue = () => {
    const trimmed = amountDue.trim();
    if (!trimmed) {
      setAmountError('Please enter an amount.');
      return;
    }
    setAmountError(null);

    const country = property?.country; // 'US' | 'UK' | undefined
    const symbol: string = country === 'US' ? '$' : country === 'UK' ? '£' : '';
    const formatted = symbol ? `${symbol}${trimmed}` : trimmed;

    const next = text.replace(/{{\s*amount_due\s*}}/g, formatted);
    setText(next);
    setShowAmountDialog(false);
    console.log('[FillDocument] amount_due applied:', formatted);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Filled Document' }} />
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium">{template?.name ?? 'Template'}</Text>
        <ScrollView style={{ maxHeight: 400 }}>
          <TextInput
            testID="filledText"
            mode="outlined"
            multiline
            value={text}
            onChangeText={setText}
            style={styles.textarea}
          />
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            testID="reopenAmountDialog"
            mode="outlined"
            onPress={() => setShowAmountDialog(true)}
          >
            <Text>Set Amount Due</Text>
          </Button>
          <Button
            testID="saveFilledDocument"
            mode="contained"
            onPress={() => {
              if (!template) return;
              addRecord({ templateId: template.id, templateName: template.name, filledText: text, tenantId: tenant?.id, propertyId: property?.id });
              setSavedVisible(true);
            }}
          >
            <Text>Save to History</Text>
          </Button>
        </View>
      </Surface>

      <Portal>
        <Dialog visible={showAmountDialog} onDismiss={() => setShowAmountDialog(false)}>
          <Dialog.Title><Text>Enter Amount Due</Text></Dialog.Title>
          <Dialog.Content>
            <TextInput
              testID="amountDueInput"
              label="Amount Due"
              mode="outlined"
              keyboardType="numeric"
              value={amountDue}
              onChangeText={(v) => setAmountDue(v)}
            />
            {amountError ? <Text style={{ color: '#b00020', marginTop: 6 }}>{amountError}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAmountDialog(false)}>
              <Text>Cancel</Text>
            </Button>
            <Button onPress={applyAmountDue}>
              <Text>Apply</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={savedVisible}
        duration={3000}
        onDismiss={() => setSavedVisible(false)}
        style={{ backgroundColor: '#d4edda' }}
      >
        <Text style={{ color: '#1f2937' }}>Document saved successfully.</Text>
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  card: { padding: 12, gap: 12, borderRadius: 12, backgroundColor: '#fff' },
  textarea: { minHeight: 280, textAlignVertical: 'top' as const },
});
