import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Button, Text, useTheme, Snackbar, IconButton, Menu } from 'react-native-paper';
import { generateDocument } from '@/services/onDeviceAiService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
// Using gateway for DOCX conversion for fidelity and smaller app size
import { convertHtmlToDocx } from '@/services/gatewayClient';

export default function DocumentViewerScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ content?: string; prompt?: string }>();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [rawMode, setRawMode] = useState<boolean>(false);
  const PLACEHOLDER = 'AI response will appear here.';

  const isHtml = useMemo(() => {
    const s = content?.trim() || '';
    if (!s) return false;
    // Heuristic: common HTML markers
    return /<!DOCTYPE|<html|<body|<div|<span|<script|<head/i.test(s);
  }, [content]);
  const isAdminerHtml = useMemo(() => isHtml && /Adminer\s*\d|<title>Adminer/i.test(content || ''), [isHtml, content]);

  const fullHtmlDoc = useMemo(() => {
    const body = content || '';
    // If it's already a full doc, return as is
    if (/<!DOCTYPE|<html[\s>]/i.test(body)) return body;
    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${body}</body></html>`;
  }, [content]);

  const isPlaceholder = useMemo(() => (content || '').trim() === PLACEHOLDER, [content]);

  // Prefer Render view by default; fallback to Raw is manual via toggle.

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
      // Strip code fences and any preface before first HTML tag
      let cleaned = result || '';
      cleaned = cleaned.replace(/```[a-zA-Z]*\n?[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z]*\n?|```/g, ''));
      const idx = cleaned.search(/<!DOCTYPE|<html|<body|<div|<h1|<p/i);
      if (idx > 0) cleaned = cleaned.slice(idx);
      setContent(cleaned.trim());
          setLoading(false);
        })
        .catch((e) => {
          console.error('[DocumentViewer] generation error', e);
          if (cancelled) return;
          setError((e as Error)?.message || 'Failed to generate document');
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Overlay header matching details pages */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            height: insets.top + 72,
            backgroundColor: '#ffffff',
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="headlineSmall" numberOfLines={1} style={styles.headerTitle}>Document Viewer</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Helpers to export/save on device */}
          {/* Print to system dialog */}
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={<Button mode="contained" onPress={() => setMenuVisible(true)} testID="exportMenuBtn"><Text>Export</Text></Button>}
          >
            <Menu.Item onPress={async () => {
              try {
                const copyText = isHtml ? content.replace(/<[^>]+>/g, '') : content;
                if (Platform.OS === 'web' && navigator?.clipboard) {
                  await navigator.clipboard.writeText(copyText);
                } else {
                  await Clipboard.setStringAsync(copyText);
                }
                setSnack({ visible: true, text: 'Copied' });
              } catch (e) {
                setSnack({ visible: true, text: 'Copy failed' });
              } finally { setMenuVisible(false); }
            }} title="Copy" />
            <Menu.Item onPress={async () => {
              try {
                if (Platform.OS === 'web') {
                  const win = window.open('', 'printwin');
                  if (win) { win.document.write(fullHtmlDoc); win.document.close(); win.focus(); win.print(); }
                } else {
                  await Print.printAsync({ html: fullHtmlDoc });
                }
              } catch (e) {
                setSnack({ visible: true, text: 'Print failed' });
              } finally { setMenuVisible(false); }
            }} title="Print" />
            <Menu.Item onPress={async () => {
              try {
                // Make PDF first
                const pdf = await Print.printToFileAsync({ html: fullHtmlDoc, base64: true });
                let base64 = (pdf as any).base64 as string | undefined;
                if (!base64) {
                  base64 = await FileSystem.readAsStringAsync(pdf.uri, { encoding: FileSystem.EncodingType.Base64 });
                }
                const filename = `document-${Date.now()}.pdf`;
                if (Platform.OS === 'android') {
                  const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  if (!perm.granted) { setSnack({ visible: true, text: 'Storage permission denied' }); return; }
                  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'application/pdf');
                  // write base64 to content URI
                  // @ts-ignore - writeAsStringAsync exists under StorageAccessFramework
                  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, base64 ?? '', { encoding: FileSystem.EncodingType.Base64 });
                  setSnack({ visible: true, text: 'Saved PDF to selected folder' });
                } else if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(pdf.uri, { UTI: 'com.adobe.pdf', mimeType: 'application/pdf' });
                } else {
                  setSnack({ visible: true, text: 'Sharing not available' });
                }
              } catch (e) {
                console.error('[Export] save PDF error', e);
                setSnack({ visible: true, text: 'Save PDF failed' });
              } finally { setMenuVisible(false); }
            }} title="Download .pdf" />
            <Menu.Item onPress={async () => {
              try {
                const text = isHtml ? content.replace(/<[^>]+>/g, '') : content;
                const filename = `document-${Date.now()}.txt`;
                if (Platform.OS === 'android') {
                  const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  if (!perm.granted) { setSnack({ visible: true, text: 'Storage permission denied' }); return; }
                  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'text/plain');
                  // @ts-ignore
                  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, text, { encoding: FileSystem.EncodingType.UTF8 });
                  setSnack({ visible: true, text: 'Saved TXT to selected folder' });
                } else if (await Sharing.isAvailableAsync()) {
                  const tmp = `${FileSystem.cacheDirectory}${filename}`;
                  await FileSystem.writeAsStringAsync(tmp, text, { encoding: FileSystem.EncodingType.UTF8 });
                  await Sharing.shareAsync(tmp, { mimeType: 'text/plain' });
                }
              } catch (e) {
                setSnack({ visible: true, text: 'Save TXT failed' });
              } finally { setMenuVisible(false); }
            }} title="Download .txt" />
            <Menu.Item onPress={async () => {
              try {
                const filename = `document-${Date.now()}.html`;
                if (Platform.OS === 'android') {
                  const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  if (!perm.granted) { setSnack({ visible: true, text: 'Storage permission denied' }); return; }
                  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'text/html');
                  // @ts-ignore
                  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, fullHtmlDoc, { encoding: FileSystem.EncodingType.UTF8 });
                  setSnack({ visible: true, text: 'Saved HTML to selected folder' });
                } else if (await Sharing.isAvailableAsync()) {
                  const tmp = `${FileSystem.cacheDirectory}${filename}`;
                  await FileSystem.writeAsStringAsync(tmp, fullHtmlDoc, { encoding: FileSystem.EncodingType.UTF8 });
                  await Sharing.shareAsync(tmp, { mimeType: 'text/html' });
                }
              } catch (e) {
                setSnack({ visible: true, text: 'Save HTML failed' });
              } finally { setMenuVisible(false); }
            }} title="Download .html" />
            <Menu.Item onPress={async () => {
              try {
                const { base64, filename } = await convertHtmlToDocx(fullHtmlDoc, `document-${Date.now()}.docx`);
                if (Platform.OS === 'android') {
                  const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                  if (!perm.granted) { setSnack({ visible: true, text: 'Storage permission denied' }); return; }
                  const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                  // @ts-ignore
                  await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                  setSnack({ visible: true, text: 'Saved DOCX to selected folder' });
                } else if (await Sharing.isAvailableAsync()) {
                  const uri = `${FileSystem.cacheDirectory}${filename}`;
                  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
                  await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                }
              } catch (e) {
                console.error('[Export] save DOCX error', e);
                setSnack({ visible: true, text: 'Save DOCX failed' });
              } finally { setMenuVisible(false); }
            }} title="Download .docx" />
          </Menu>
        </View>
      </View>

      {loading ? (
        <View style={[styles.loadingWrap, { marginTop: insets.top + 72 }]}> 
          <ActivityIndicator animating size={'large'} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <ScrollView style={[styles.scroll, { marginTop: insets.top + 72 }]} contentContainerStyle={styles.scrollContent}>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderTitle}>Generation failed</Text>
            <Text style={styles.placeholderText}>{error}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="contained" onPress={() => {
                const p = typeof params.prompt === 'string' ? params.prompt : '';
                if (!p) return;
                setError(null);
                setLoading(true);
                generateDocument(p)
                  .then((result) => setContent(result))
                  .catch((e) => setError((e as Error)?.message || 'Failed again'))
                  .finally(() => setLoading(false));
              }}>Retry</Button>
              <Button mode="outlined" onPress={() => router.push('/(tabs)/settings')}>Open Settings</Button>
            </View>
          </View>
        </ScrollView>
  ) : isHtml ? (
        isAdminerHtml ? (
          <ScrollView style={[styles.scroll, { marginTop: insets.top + 72 }]} contentContainerStyle={styles.scrollContent}>
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderTitle}>Gateway URL looks incorrect</Text>
              <Text style={styles.placeholderText}>
                The response appears to be an Adminer page. Update Settings → Gateway URL to include the gateway port, e.g. http://192.168.0.252:8082
              </Text>
              <Button mode="contained" onPress={() => router.push('/(tabs)/settings')}>Open Settings</Button>
              <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => setRawMode(true)}>Show Raw</Button>
            </View>
          </ScrollView>
        ) : (
        <View style={[styles.webviewWrap, { marginTop: insets.top + 72 }]}>            
          <WebView
            originWhitelist={["*"]}
            source={{ html: isHtml ? (content.match(/<!DOCTYPE|<html/i) ? content : fullHtmlDoc) : fullHtmlDoc }}
            startInLoadingState
            scalesPageToFit
            javaScriptEnabled={false}
            domStorageEnabled={false}
            setSupportMultipleWindows={false}
            allowsInlineMediaPlayback
            onShouldStartLoadWithRequest={(req) => {
              if (/^https?:\/\//i.test(req.url)) {
                Linking.openURL(req.url).catch(() => {});
                return false;
              }
              return true;
            }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
          />
        </View>
  )
      ) : (
        <ScrollView style={[styles.scroll, { marginTop: insets.top + 72 }]} contentContainerStyle={styles.scrollContent}>
          {isPlaceholder ? (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderTitle}>AI response unavailable</Text>
              <Text style={styles.placeholderText}>Gateway is reachable, but the AI backend returned a placeholder response. Try again, and check your Ollama/LLM service if it persists.</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button mode="contained" onPress={() => {
                  const p = typeof params.prompt === 'string' ? params.prompt : '';
                  if (!p) return;
                  setLoading(true);
                  generateDocument(p)
                    .then((result) => setContent(result))
                    .catch(() => setContent(PLACEHOLDER))
                    .finally(() => setLoading(false));
                }}>Retry</Button>
                <Button mode="outlined" onPress={() => router.push('/(tabs)/settings')}>Open Settings</Button>
              </View>
            </View>
          ) : (
            <Text selectable>{content}</Text>
          )}
        </ScrollView>
      )}

      <Snackbar visible={snack.visible} onDismiss={() => setSnack({ visible: false, text: '' })} duration={2000}>
        {snack.text}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#6b7280' },
  scroll: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 24 },
  webviewWrap: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { maxWidth: 220 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hint: { color: '#6b7280', marginBottom: 8 },
  placeholderBox: { gap: 12, padding: 16, borderRadius: 8, backgroundColor: '#fff', borderColor: '#eee', borderWidth: 1 },
  placeholderTitle: { fontWeight: '600', fontSize: 16, color: '#111827' },
  placeholderText: { color: '#374151', marginBottom: 4 },
});
