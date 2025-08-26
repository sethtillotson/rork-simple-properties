import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useChecklistTemplates } from '@/context/ChecklistTemplatesContext';

interface ItemDraft { id: string; text: string; }

export default function ChecklistBuilderScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId?: string }>();
  const { addCustomTemplate } = useChecklistTemplates();

  const [name, setName] = useState<string>('');
  const [items, setItems] = useState<ItemDraft[]>([{ id: Date.now().toString(), text: '' }]);

  const canSave = useMemo(() => name.trim().length > 0 && items.some(i => i.text.trim().length > 0), [name, items]);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: Date.now().toString(), text: '' }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateItem = useCallback((id: string, text: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, text } : i)));
  }, []);

  const onSave = useCallback(() => {
    if (!canSave) return;
    const cleanItems = items
      .map((i, idx) => ({ id: i.id || `${Date.now()}-${idx}`, text: i.text.trim() }))
      .filter((i) => i.text.length > 0);
    const saved = addCustomTemplate({ name: name.trim(), items: cleanItems });
    if (propertyId) {
      router.back();
      setTimeout(() => {
        router.push({ pathname: '/property/[id]', params: { id: String(propertyId) } });
      }, 0);
    } else {
      router.back();
    }
  }, [addCustomTemplate, canSave, items, name, propertyId]);

  return (
    <>
      <Stack.Screen options={{ title: 'Checklist Builder' }} />
      <KeyboardAwareScrollView style={styles.container} contentContainerStyle={styles.content} enableOnAndroid={true} extraScrollHeight={12}>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium" style={styles.mb12}>Create Custom Checklist</Text>
          <TextInput label="Checklist Name" value={name} onChangeText={setName} style={styles.mb12} testID="builderNameInput" />
          <View style={{ gap: 12 }}>
            {items.map((it, idx) => (
              <View key={it.id} style={styles.itemRow}>
                <TextInput
                  label={`Item ${idx + 1}`}
                  value={it.text}
                  onChangeText={(t) => updateItem(it.id, t)}
                  style={styles.flex}
                  testID={`builderItem-${idx}`}
                />
                <Button mode="text" onPress={() => removeItem(it.id)} disabled={items.length <= 1} testID={`removeItem-${idx}`}>
                  <Text>Remove</Text>
                </Button>
              </View>
            ))}
            <Button mode="outlined" onPress={addItem} testID="addItemBtn">
              <Text>Add Item</Text>
            </Button>
          </View>
          <View style={styles.footer}>
            <Button mode="text" onPress={() => router.back()} testID="cancelBuilderBtn">
              <Text>Cancel</Text>
            </Button>
            <Button mode="contained" onPress={onSave} disabled={!canSave} testID="saveTemplateBtn">
              <Text>Save Template</Text>
            </Button>
          </View>
        </Surface>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  content: { padding: 20, paddingBottom: 40 },
  card: { borderRadius: 12, padding: 16, backgroundColor: '#fff' },
  mb12: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
});