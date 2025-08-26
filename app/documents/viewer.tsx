import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Button, Text, useTheme, Snackbar } from 'react-native-paper';
import { generateDocument } from '@/services/onDeviceAiService';

export default function DocumentViewerScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ content?: string; prompt?: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });

  useEffect(() => {
    const initial = typeof params.content === 'string' ? params.content : '';
    const prompt = typeof params.prompt === 'string' ? params.prompt : '';
    if (initial && initial.length > 0) {
      setContent(initial);
      setLoading(false);
      return;
    }
    if (prompt && prompt.length > 0) {
      let cancelled = false;
      setLoading(true);
      generateDocument(prompt)
        .then((result) => {
          if (cancelled) return;
          setContent(result);
          setLoading(false);
        })
        .catch((e) => {
          console.error('[DocumentViewer] generation error', e);
          if (cancelled) return;
          setContent('Failed to generate document. Please try again.');
          setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setLoading(true);
    }
  }, [params.content, params.prompt]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Document Viewer' }} />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator animating size={'large'} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Generating Document...</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text selectable>{content}</Text>
          </ScrollView>
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={async () => {
                try {
                  if (Platform.OS === 'web') {
                    await navigator.clipboard.writeText(content);
                    setSnack({ visible: true, text: 'Copied to clipboard' });
                  } else {
                    setSnack({ visible: true, text: 'Copy not available in Expo Go. Long-press to select and copy.' });
                  }
                } catch (e) {
                  console.error('[DocumentViewer] copy error', e);
                  setSnack({ visible: true, text: 'Failed to copy' });
                }
              }}
              testID="copyDocBtn"
            >
              <Text>Copy Text</Text>
            </Button>
            <Button mode="contained" onPress={() => router.back()} testID="closeDocBtn">
              <Text>Close</Text>
            </Button>
          </View>
          <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, text: '' })} duration={2000}>
            {snack.text}
          </Snackbar>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
  scroll: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 24 },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
});
