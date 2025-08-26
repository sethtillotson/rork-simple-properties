import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Text, Surface, Card, Chip, useTheme, FAB, Portal, Modal, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertCircle, Clock, CheckCircle, Plus, Wrench } from 'lucide-react-native';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useProperties } from '@/context/PropertiesContext';
import { useLocalSearchParams, router } from 'expo-router';
import EmptyState from '@/components/EmptyState';

function withOpacity(color: string, alpha: number): string {
  try {
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    if (color.startsWith('rgb')) {
      const match = color.match(/rgba?\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)(?:,\s*([\d\.]+)\s*)?\)/);
      if (match) {
        const r = parseInt(match[1].trim(), 10);
        const g = parseInt(match[2].trim(), 10);
        const b = parseInt(match[3].trim(), 10);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
  } catch (e) {
    console.log('withOpacity parse error', e);
  }
  return color;
}

export default function MaintenanceScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ editId?: string }>();
  const { requests, addMaintenanceRequest, updateMaintenanceRequest, getRequestById } = useMaintenance();
  const { properties } = useProperties();

  const activeRequests = useMemo(() => requests.filter(r => r.status !== 'completed'), [requests]);

  const [visible, setVisible] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [propertyId, setPropertyId] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editingId, setEditingId] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setEditingId(null);
    setVisible(true);
  }, []);
  const closeModal = useCallback(() => setVisible(false), []);

  const getPriorityColor = (p: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.tertiary;
      case 'low': return theme.colors.primary;
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'pending': return <AlertCircle size={16} color={theme.colors.error} />;
      case 'in-progress': return <Clock size={16} color={theme.colors.tertiary} />;
      case 'completed': return <CheckCircle size={16} color={theme.colors.primary} />;
      default: return null;
    }
  };

  const onSave = useCallback(() => {
    if (!description.trim() || !propertyId) return;
    if (editingId) {
      updateMaintenanceRequest(editingId, { description: description.trim(), priority, propertyId });
    } else {
      addMaintenanceRequest({ propertyId, description: description.trim(), priority });
    }
    setDescription('');
    setPropertyId('');
    setPriority('medium');
    setEditingId(null);
    closeModal();
    try {
      if (router.canGoBack()) {
        // no-op navigation changes here
      }
    } catch (e) {
      console.log('[MaintenanceScreen] router check error', e);
    }
  }, [description, propertyId, priority, addMaintenanceRequest, updateMaintenanceRequest, editingId, closeModal]);

  useEffect(() => {
    if (params.editId && typeof params.editId === 'string') {
      const existing = getRequestById(params.editId);
      console.log('[MaintenanceScreen] Open edit modal for', params.editId, existing);
      if (existing) {
        setEditingId(existing.id);
        setDescription(existing.description ?? '');
        setPropertyId(existing.propertyId);
        setPriority(existing.priority);
        setVisible(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.editId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Surface style={styles.headerSurface} elevation={0}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Maintenance
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle} testID="activeCount">
            {activeRequests.length} active requests
          </Text>
        </Surface>

        {requests.length === 0 ? (
          <EmptyState
            testID="maintenanceEmpty"
            icon={<Wrench size={28} color={theme.colors.primary} />}
            title="No Maintenance Requests"
            message="Requests for your properties will appear here."
          />
        ) : (
          requests.map((request) => (
            <Card
              key={request.id}
              style={styles.card}
              mode="elevated"
              elevation={1}
              testID={`request-${request.id}`}
              onPress={() => {
                console.log('[MaintenanceScreen] Navigate to details', request.id);
                try {
                  router.push(`/maintenance/${request.id}`);
                } catch (e) {
                  console.error('[MaintenanceScreen] navigation error', e);
                }
              }}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.statusContainer}>
                    {getStatusIcon(request.status)}
                    <Text variant="labelMedium" style={styles.statusText}>
                      {request.status.replace('-', ' ')}
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={[
                      styles.priorityChip,
                      { backgroundColor: withOpacity(getPriorityColor(request.priority), 0.12) },
                    ]}
                    textStyle={[
                      styles.priorityText,
                      { fontSize: 12, fontWeight: '500' as const, color: getPriorityColor(request.priority) },
                    ]}
                    testID={`priority-chip-${request.id}`}
                  >
                    {request.priority}
                  </Chip>
                </View>

                <Text variant="titleMedium" style={styles.requestTitle}>
                  {request.title}
                </Text>

                <Text variant="bodySmall" style={styles.propertyText}>
                  {properties.find(p => p.id === request.propertyId)?.address ?? 'Property'}
                </Text>

                <View style={styles.cardFooter}>
                  <Text variant="bodySmall" style={styles.dateText}>
                    {new Date(request.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        testID="addRequestFab"
        icon={() => <Plus size={20} color={theme.colors.onPrimary} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openModal}
      />

      <Portal>
        <Modal visible={visible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <Surface style={styles.modalCard} elevation={2}>
            <Text variant="headlineSmall" style={styles.modalTitle}>{editingId ? 'Edit Maintenance Request' : 'Add Maintenance Request'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={12} keyboardOpeningTime={0}>
              <TextInput
                label="Problem description"
                value={description}
                onChangeText={setDescription}
                multiline
                style={styles.input}
                testID="requestDescription"
              />

              <Text style={styles.selectorLabel}>Select Property</Text>
              <Surface style={styles.dropdown} elevation={0}>
                {properties.length === 0 ? (
                  <Text variant="bodySmall" style={styles.emptyText}>No properties available</Text>
                ) : (
                  properties.map(p => (
                    <View key={p.id} style={styles.dropdownItem}>
                      <Button
                        mode={propertyId === p.id ? 'contained' : 'text'}
                        onPress={() => setPropertyId(p.id)}
                        testID={`prop-${p.id}`}
                      >
                        <Text>{p.address}, {p.city}</Text>
                      </Button>
                    </View>
                  ))
                )}
              </Surface>

              <Text style={styles.selectorLabel}>Priority</Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}
                buttons={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
            </KeyboardAwareScrollView>

            <Button mode="contained" onPress={onSave} disabled={!description.trim() || !propertyId} testID="saveRequestBtn">
              <Text>Save Request</Text>
            </Button>
            <Button onPress={closeModal} style={styles.cancelBtn}><Text>Cancel</Text></Button>
          </Surface>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  headerSurface: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f4f6f8',
  },
  headerTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#7f8c8d',
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    textTransform: 'capitalize',
    color: '#7f8c8d',
  },
  priorityChip: {
    height: 28,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
  },
  requestTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 8,
  },
  propertyText: {
    color: '#7f8c8d',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateText: {
    color: '#95a5a6',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
  modalContainer: {
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontWeight: '600' as const,
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#ffffff',
  },
  selectorLabel: {
    color: '#2c3e50',
    fontWeight: '500' as const,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 10,
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingHorizontal: 4,
  },
  emptyText: {
    color: '#7f8c8d',
    padding: 12,
  },
  cancelBtn: {
    marginTop: 4,
  },
});