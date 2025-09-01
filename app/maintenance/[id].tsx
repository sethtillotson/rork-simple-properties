import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from 'react-native-paper';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Button, Chip, SegmentedButtons, Surface, Text, useTheme } from 'react-native-paper';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useProperties } from '@/context/PropertiesContext';

export default function MaintenanceDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getRequestById, updateMaintenanceRequest, deleteMaintenanceRequest } = useMaintenance();
  const { properties } = useProperties();

  const request = useMemo(() => (typeof id === 'string' ? getRequestById(id) : undefined), [id, getRequestById]);

  const [localStatus, setLocalStatus] = useState<'pending' | 'in-progress' | 'completed'>(request?.status ?? 'pending');

  const onChangeStatus = useCallback((value: string) => {
    const v = (value as 'pending' | 'in-progress' | 'completed');
    setLocalStatus(v);
    if (request) {
      updateMaintenanceRequest(request.id, { status: v, completedAt: v === 'completed' ? new Date().toISOString() : undefined });
    }
  }, [request, updateMaintenanceRequest]);

  const onEdit = useCallback(() => {
    if (!request) return;
    router.push({ pathname: '/maintenance', params: { editId: request.id } });
  }, [request]);

  const onDelete = useCallback(() => {
    if (!request) return;
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this maintenance request? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteMaintenanceRequest(request.id);
              router.back();
            } catch (e) {
              console.error('[MaintenanceDetails] delete error', e);
            }
          }
        }
      ],
      { cancelable: true }
    );
  }, [request, deleteMaintenanceRequest]);

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

  <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: insets.top, height: insets.top + 72, paddingHorizontal: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#eee', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text variant="headlineSmall">{request?.title ?? 'Maintenance'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button onPress={onEdit} compact>
            <Text>Edit</Text>
          </Button>
          <Button onPress={onDelete} compact textColor={theme.colors.error}>
            <Text>Delete</Text>
          </Button>
        </View>
      </View>

  <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 72 }] }>
        {!request ? (
          <Surface style={styles.missing} elevation={0}>
            <Text variant="titleMedium">Request not found</Text>
            <Button mode="text" onPress={() => router.back()} style={styles.mt8}>
              <Text>Go Back</Text>
            </Button>
          </Surface>
        ) : (
          <Surface style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.label}>Description</Text>
            <Text style={styles.value}>{request.description}</Text>

            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Text variant="titleMedium" style={styles.label}>Property</Text>
                <Text style={styles.value}>{properties.find(p => p.id === request.propertyId)?.address ?? 'Property'}</Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.priorityChip]}
                textStyle={{ fontSize: 12, fontWeight: '500' as const }}
              >
                {request.priority}
              </Chip>
            </View>

            <Text variant="titleMedium" style={styles.label}>Status</Text>
            <SegmentedButtons
              value={localStatus}
              onValueChange={onChangeStatus}
              buttons={[
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />

            <View style={styles.inlineActions}>
              <Button mode="contained" onPress={onEdit} style={styles.flex1} textColor={theme.colors.onPrimary}>
                <Text>Edit</Text>
              </Button>
              <Button mode="outlined" onPress={onDelete} style={styles.flex1} textColor={theme.colors.error}>
                <Text>Delete</Text>
              </Button>
            </View>
          </Surface>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  content: { paddingBottom: 40 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 },
  card: { margin: 20, borderRadius: 12, padding: 16, backgroundColor: '#fff', gap: 12 },
  label: { fontWeight: '600' as const, color: '#2c3e50' },
  value: { color: '#34495e' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flex: 1 },
  priorityChip: { height: 28 },
  inlineActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  flex1: { flex: 1 },
  missing: { margin: 20, padding: 16, borderRadius: 12 },
  mt8: { marginTop: 8 },
});