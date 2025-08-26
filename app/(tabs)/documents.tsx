import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View, ScrollView } from 'react-native';
import { Button, Divider, List, SegmentedButtons, Surface, Text } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { useDocumentTemplates } from '@/context/DocumentTemplatesContext';
import { useFilledDocuments } from '@/context/FilledDocumentsContext';
import { useProperties } from '@/context/PropertiesContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DocumentsMainScreen() {
  const [segment, setSegment] = useState<'templates' | 'saved'>('templates');
  const { allTemplates, deleteTemplate, addCustomTemplate } = useDocumentTemplates();
  const { records, deleteRecord } = useFilledDocuments();
  const { properties } = useProperties();
  const insets = useSafeAreaInsets();

  const propertyLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of properties ?? []) {
      if (p?.id) {
        map[p.id] = [p.address, p.city].filter(Boolean).join(', ');
      }
    }
    return map;
  }, [properties]);

  const onEditTemplate = useCallback((id: string) => {
    console.log('[Documents] Edit template', id);
    router.push({ pathname: '/documents/builder', params: { templateId: id } });
  }, []);

  const defaultTemplates = useMemo(() => (allTemplates ?? []).filter(t => t.id?.startsWith('default-')), [allTemplates]);
  const customTemplates = useMemo(() => (allTemplates ?? []).filter(t => !t.id?.startsWith('default-')), [allTemplates]);

  const onDeleteTemplate = useCallback((id: string) => {
    Alert.alert('Delete Template', 'Are you sure you want to delete this template?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { console.log('[Documents] Delete template', id); deleteTemplate(id); } },
    ]);
  }, [deleteTemplate]);

  const onDeleteRecord = useCallback((id: string) => {
    Alert.alert('Delete Document', 'Delete this saved document from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { console.log('[Documents] Delete record', id); deleteRecord(id); } },
    ]);
  }, [deleteRecord]);

  const [viewer, setViewer] = useState<{ id: string; title: string; text: string } | null>(null);

  const renderTemplateItem = ({ item, isDefault }: { item: { id: string; name: string; content?: string }; isDefault?: boolean }) => (
    <List.Item
      testID={`template-${item.id}`}
      title={item.name}
      onPress={() => onEditTemplate(item.id)}
      right={() => (
        <View style={styles.row}>
          {isDefault ? (
            <Button
              mode="text"
              onPress={() => {
                try {
                  console.log('[Documents] Duplicate template', item.id);
                  const name = `Copy of ${item.name}`;
                  const content = (item as any).content ?? '';
                  addCustomTemplate({ name, content });
                } catch (e) {
                  console.error('Duplicate failed', e);
                }
              }}
              testID={`duplicate-${item.id}`}
            >
              <Text>Duplicate</Text>
            </Button>
          ) : (
            <>
              <Button mode="text" onPress={() => onEditTemplate(item.id)} testID={`edit-${item.id}`}>
                <Text>Edit</Text>
              </Button>
              <Button mode="text" onPress={() => onDeleteTemplate(item.id)} testID={`delete-${item.id}`}>
                <Text>Delete</Text>
              </Button>
            </>
          )}
        </View>
      )}
    />
  );

  const renderRecordItem = ({ item }: { item: { id: string; templateName: string; propertyId?: string; createdAt: string; filledText: string } }) => {
    const subtitleParts: string[] = [];
    if (item.propertyId && propertyLookup[item.propertyId]) subtitleParts.push(propertyLookup[item.propertyId]);
    const date = new Date(item.createdAt);
    subtitleParts.push(date.toLocaleString());
    const subtitle = subtitleParts.join(' • ');

    return (
      <List.Item
        testID={`record-${item.id}`}
        title={item.templateName}
        description={subtitle}
        onPress={() => setViewer({ id: item.id, title: item.templateName, text: item.filledText })}
        right={() => (
          <Button mode="text" onPress={() => onDeleteRecord(item.id)} testID={`delete-record-${item.id}`}>
            <Text>Delete</Text>
          </Button>
        )}
      />
    );
  };

  const [stdExpanded, setStdExpanded] = useState<boolean>(false);
  const [customExpanded, setCustomExpanded] = useState<boolean>(false);

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]} contentContainerStyle={{ paddingBottom: 32 }} testID="documentsScroll">
      <Stack.Screen options={{ title: 'Documents' }} />

      <View testID="documentsSegmented">
        <SegmentedButtons
          value={segment}
          onValueChange={(v) => setSegment((v as 'templates' | 'saved') ?? 'templates')}
          buttons={[
            { value: 'templates', label: 'My Templates' },
            { value: 'saved', label: 'Saved Documents' },
          ]}
          style={{ marginBottom: 12 }}
        />
      </View>

      {segment === 'templates' ? (
        <Surface style={styles.card} elevation={1} testID="templatesView">
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text variant="titleMedium">My Templates</Text>
            <Button
              mode="contained"
              onPress={() => router.push('/documents/builder')}
              testID="createTemplateBtn"
            >
              <Text>Create New Template</Text>
            </Button>
          </View>
          <Divider />
          <List.Section>
            <List.Accordion
              title="Standard Templates"
              expanded={stdExpanded}
              onPress={() => setStdExpanded(e => !e)}
              id="std-accordion"
            >
              {defaultTemplates.length > 0 ? (
                defaultTemplates.map((item) => (
                  <View key={item.id}>
                    {renderTemplateItem({ item, isDefault: true })}
                    <Divider />
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={styles.subtitle}>No standard templates available.</Text>
                </View>
              )}
            </List.Accordion>

            <List.Accordion
              title="My Custom Templates"
              expanded={customExpanded}
              onPress={() => setCustomExpanded(e => !e)}
              id="custom-accordion"
            >
              {customTemplates.length > 0 ? (
                customTemplates.map((item) => (
                  <View key={item.id}>
                    {renderTemplateItem({ item })}
                    <Divider />
                  </View>
                ))
              ) : (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={styles.subtitle}>No custom templates yet. Create your first template.</Text>
                </View>
              )}
            </List.Accordion>
          </List.Section>
        </Surface>
      ) : (
        <Surface style={styles.card} elevation={1} testID="savedDocsView">
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Saved Documents</Text>
          <Divider />
          {(records ?? []).length > 0 ? (
            (records ?? []).map((rec) => (
              <View key={rec.id}>
                {renderRecordItem({ item: rec })}
                <Divider />
              </View>
            ))
          ) : (
            <View style={{ paddingVertical: 24 }}>
              <Text style={styles.subtitle}>No saved documents yet.</Text>
            </View>
          )}
        </Surface>
      )}

      {viewer ? (
        <Surface style={styles.viewer} elevation={2} testID="documentViewer">
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text variant="titleMedium">{viewer.title}</Text>
            <Button mode="text" onPress={() => setViewer(null)} testID="closeViewer">
              <Text>Close</Text>
            </Button>
          </View>
          <Divider />
          <View style={{ paddingTop: 8 }}>
            <Text selectable>{viewer.text}</Text>
          </View>
        </Surface>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f4f6f8' },
  card: { padding: 12, gap: 12, borderRadius: 12, backgroundColor: '#fff', flex: 1 },
  title: { fontWeight: '700' as const },
  subtitle: { color: '#6b7280' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    maxHeight: 360,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
});
