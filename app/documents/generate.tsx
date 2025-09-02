import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Surface, Text, Divider, ActivityIndicator } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useDocumentTemplates } from '@/context/DocumentTemplatesContext';
import { useProperties } from '@/context/PropertiesContext';
import { useTenants } from '@/context/TenantsContext';
import { generateDocument } from '@/services/onDeviceAiService';
import { buildDocVariables } from '@/utils/docVariables';

interface Params {
  templateId?: string;
  propertyId?: string;
  tenantId?: string;
}

function stringify(obj: unknown): string {
  try {
    return JSON.stringify(obj ?? null, null, 2);
  } catch {
    return String(obj);
  }
}

export default function GenerateDocumentScreen() {
  const params = useLocalSearchParams();
  const templateId = (params as Record<string, string | string[] | undefined>).templateId as string | undefined;
  const propertyId = (params as Record<string, string | string[] | undefined>).propertyId as string | undefined;
  const tenantId = (params as Record<string, string | string[] | undefined>).tenantId as string | undefined;
  const { getById } = useDocumentTemplates();
  const { properties } = useProperties();
  const { getTenantById } = useTenants();

  const template = useMemo(() => getById(String(templateId ?? '')), [getById, templateId]);
  const tenant = useMemo(() => (tenantId ? getTenantById(String(tenantId)) : undefined), [getTenantById, tenantId]);
  const property = useMemo(() => {
    if (propertyId) return properties.find(p => p.id === propertyId);
    if (tenant?.propertyId) return properties.find(p => p.id === tenant.propertyId);
    return undefined;
  }, [properties, propertyId, tenant]);

  const [prompt, setPrompt] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constructPrompt = () => {
      const blocks: string[] = [];
      const vars = buildDocVariables(property, tenant);
      blocks.push(`# Task\nGenerate a professional real-estate document in VALID HTML based on the selected template and variables.`);
      blocks.push(`## Template (Markdown)\nName: ${template?.name ?? 'Unknown'}\n---\n${template?.content ?? ''}`);
      blocks.push(`## Variables (JSON)\n${stringify(vars)}`);
  blocks.push(`## Output Requirements\n- Return ONLY a complete HTML5 document starting with <!doctype html> and enclosing <html><head>...</head><body>...</body></html>.\n- Do NOT include any explanations, prefaces, or code fences in the response. Output the HTML document only.\n- Convert any Markdown in the template to styled HTML (use <h1>-<h3>, <p>, <ul>, <li>, <strong>, <em>, <table> if needed).\n- Interpolate variables where appropriate; if a variable is missing, leave a bracketed placeholder like [TENANT_NAME].\n- Use semantic, mobile-friendly formatting and reasonable spacing.`);
      return blocks.join('\n\n');
    };
    setPrompt(constructPrompt());
  }, [template?.name, template?.content, property, tenant]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await generateDocument(prompt);
        if (!cancelled) setOutput(res);
      } catch (e) {
        console.error('[GenerateScreen] generation error', e);
        if (!cancelled) setError('Failed to generate document. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (prompt) void run();
    return () => { cancelled = true; };
  }, [prompt]);

  const onCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(output ?? '');
      console.log('[GenerateScreen] Copied to clipboard');
    } catch (e) {
      console.error('[GenerateScreen] copy error', e);
    }
  }, [output]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Generate Document' }} />
      <Surface style={styles.card} elevation={1} testID="aiGenCard">
        <Text variant="titleMedium" testID="aiGenTitle">{template?.name ?? 'Document'}</Text>
        <Divider style={{ marginVertical: 8 }} />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator animating={true} />
            <Text style={styles.muted}>Generating...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <Button mode="contained" onPress={() => setPrompt(prompt + '\n')} testID="retryBtn"><Text>Retry</Text></Button>
          </View>
        ) : (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text selectable testID="aiGenOutput">{output}</Text>
            </ScrollView>
            <View style={styles.row}>
              <Button mode="contained" onPress={onCopy} testID="copyBtn" style={{ flex: 1, marginRight: 8 }}>
                <Text>Copy Text</Text>
              </Button>
              <Button mode="outlined" onPress={() => setOutput('')} testID="clearBtn" style={{ flex: 1 }}>
                <Text>Clear</Text>
              </Button>
            </View>
          </>
        )}
      </Surface>

      <Surface style={styles.promptSurface} elevation={0} testID="promptPreview">
        <Text variant="labelMedium" style={styles.muted}>Prompt (debug)</Text>
        <ScrollView style={styles.promptScroll}>
          <Text selectable>{prompt}</Text>
        </ScrollView>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  card: { margin: 16, padding: 12, borderRadius: 12, backgroundColor: '#fff', flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  muted: { color: '#6b7280' },
  error: { color: '#b91c1c' },
  scroll: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  promptSurface: { marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: '#fff' },
  promptScroll: { maxHeight: 160 },
});