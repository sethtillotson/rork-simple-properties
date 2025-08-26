import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button, Chip, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useDocumentTemplates } from '@/context/DocumentTemplatesContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLACEHOLDERS = [
  '{{property_address}}',
  '{{tenant_name}}',
  '{{current_date}}',
  '{{amount_due}}',
] as const;

type Placeholder = typeof PLACEHOLDERS[number];

export default function TemplateBuilderScreen() {
  const theme = useTheme();
  const { addCustomTemplate, getById, updateTemplate } = useDocumentTemplates();
  const params = useLocalSearchParams<{ templateId?: string }>();
  const [name, setName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.templateId ? String(params.templateId) : undefined;
    if (id) {
      const existing = getById(id);
      if (existing) {
        setName(existing.name ?? '');
        setContent(existing.content ?? '');
        console.log('[TemplateBuilder] Prefilled template', id);
      }
    }
  }, [getById, params.templateId]);

  const canSave = useMemo(() => name.trim().length > 0 && content.trim().length > 0, [name, content]);

  const insert = useCallback((p: Placeholder) => {
    setContent(prev => (prev ? prev + ' ' + p : p));
  }, []);

  const onSave = useCallback(() => {
    if (!canSave) {
      setError('Please enter a template name and content.');
      return;
    }
    setError(null);
    const id = params.templateId ? String(params.templateId) : undefined;
    if (id && getById(id)) {
      updateTemplate(id, { name: name.trim(), content: content.trim() });
      console.log('[TemplateBuilder] updated', id);
    } else {
      const t = addCustomTemplate({ name: name.trim(), content: content.trim() });
      console.log('[TemplateBuilder] saved', t.id);
    }
    router.back();
  }, [addCustomTemplate, canSave, content, getById, name, params.templateId, updateTemplate]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Template Builder' }} />
      <Surface style={styles.card} elevation={1}>
        <TextInput
          testID="templateName"
          label="Template Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
        />

        <View style={styles.placeholderBar}>
          {PLACEHOLDERS.map(p => (
            <Chip key={p} onPress={() => insert(p)} style={styles.chip}>
              <Text>{p}</Text>
            </Chip>
          ))}
        </View>

        <TextInput
          testID="templateContent"
          label="Template Content"
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={12}
          style={styles.textarea}
        />

        {error ? <Text style={{ color: theme.colors.error }}>{error}</Text> : null}

        <Button mode="contained" onPress={onSave}>
          <Text>Save Template</Text>
        </Button>
      </Surface>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  card: { padding: 12, gap: 12, borderRadius: 12, backgroundColor: '#fff' },
  placeholderBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginRight: 4 },
  textarea: { minHeight: 200, textAlignVertical: 'top' as const },
});
