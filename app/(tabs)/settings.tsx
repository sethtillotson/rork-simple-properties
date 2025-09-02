import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, Surface } from 'react-native-paper';
import { getConfig, setConfig, pingGateway } from '@/services/gatewayClient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    (async () => {
      const cfg = await getConfig();
      setBaseUrl(cfg.baseUrl ?? '');
      setApiToken(cfg.apiToken ?? '');
    })();
  }, []);

  const onSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setStatus(null);
      const trimmed = baseUrl.trim();
      if (!trimmed) {
        setError('Gateway URL is required');
        return;
      }
      if (!/^https?:\/\//.test(trimmed)) {
        setError('Gateway URL must start with http:// or https://');
        return;
      }
      await setConfig({ baseUrl: trimmed, apiToken: apiToken.trim() || undefined });
      const ping = await pingGateway();
      setStatus(ping.ok ? 'Gateway reachable' : `Gateway not reachable: ${ping.detail ?? 'unknown error'}`);
    } catch (e) {
      setError((e as Error)?.message ?? 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [baseUrl, apiToken]);

  const onPing = useCallback(async () => {
    setStatus(null);
    setError(null);
    const ping = await pingGateway();
    setStatus(ping.ok ? 'Gateway reachable' : `Gateway not reachable: ${ping.detail ?? 'unknown error'}`);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} edges={['top', 'bottom']}>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium">AI Gateway Settings</Text>
        <ScrollView style={{ marginTop: 12 }} contentContainerStyle={{ gap: 12 }}>
          <TextInput
            label="Gateway URL"
            mode="outlined"
            placeholder="https://pi4.local"
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            label="API Token (optional)"
            mode="outlined"
            placeholder="Bearer token"
            value={apiToken}
            onChangeText={setApiToken}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
          {error && (
            <HelperText type="error" visible>
              <Text>{error}</Text>
            </HelperText>
          )}
          {status && (
            <HelperText type="info" visible>
              <Text>{status}</Text>
            </HelperText>
          )}
          <View style={styles.row}>
            <Button mode="contained" onPress={onSave} loading={saving} style={{ flex: 1 }}>
              <Text>Save</Text>
            </Button>
            <Button mode="outlined" onPress={onPing} style={{ flex: 1 }}>
              <Text>Test Connection</Text>
            </Button>
          </View>
        </ScrollView>
      </Surface>
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
});
