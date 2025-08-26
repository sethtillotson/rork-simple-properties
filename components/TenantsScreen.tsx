import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Text, Surface, List, Avatar, Divider, useTheme, FAB, Modal, Portal, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Mail, Phone, Calendar, Plus, Users } from 'lucide-react-native';
import { useTenants } from '@/context/TenantsContext';
import { useProperties } from '@/context/PropertiesContext';
import { Tenant } from '@/types/property';
import { router, useLocalSearchParams } from 'expo-router';
import EmptyState from '@/components/EmptyState';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function TenantsScreen() {
  const theme = useTheme();
  const { tenants, addTenant, updateTenant, getTenantById } = useTenants();
  const { properties, updatePropertyOccupancy } = useProperties();

  const params = useLocalSearchParams<{ mode?: string; id?: string }>();

  const [visible, setVisible] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [leaseEndDate, setLeaseEndDate] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const vacantProperties = useMemo(() => properties.filter(p => !p.isOccupied || p.id === selectedPropertyId), [properties, selectedPropertyId]);

  const openModal = useCallback(() => setVisible(true), []);
  const closeModal = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const isEdit = (params.mode ?? '') === 'edit' && typeof params.id === 'string' && params.id.length > 0;
    if (isEdit) {
      const t = getTenantById(params.id as string);
      console.log('[TenantsScreen] Open edit modal for tenant', params.id, t);
      if (t) {
        setEditingId(t.id);
        setName(t.name ?? '');
        setEmail(t.email ?? '');
        setPhone(t.phone ?? '');
        setSelectedPropertyId(t.propertyId ?? '');
        setLeaseEndDate(t.leaseEndDate ?? '');
        setVisible(true);
      }
    }
  }, [params.mode, params.id, getTenantById]);

  const onSaveTenant = useCallback(() => {
    if (!name.trim() || !email.trim() || !phone.trim() || !selectedPropertyId) return;
    const payload: Omit<Tenant, 'id'> = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      propertyId: selectedPropertyId,
      leaseEndDate: leaseEndDate || new Date().toISOString().slice(0, 10),
    };
    if (editingId) {
      const prev = getTenantById(editingId);
      updateTenant(editingId, payload);
      if (prev?.propertyId && prev.propertyId !== selectedPropertyId) {
        updatePropertyOccupancy(prev.propertyId, 'Vacant');
        updatePropertyOccupancy(selectedPropertyId, 'Occupied');
      }
      setEditingId(null);
      router.replace('/(tabs)/tenants');
    } else {
      addTenant(payload);
      updatePropertyOccupancy(selectedPropertyId, 'Occupied');
    }
    setName(''); setEmail(''); setPhone(''); setSelectedPropertyId(''); setLeaseEndDate('');
    closeModal();
  }, [name, email, phone, selectedPropertyId, leaseEndDate, addTenant, updateTenant, getTenantById, updatePropertyOccupancy, editingId, closeModal]);

  const Header = useCallback(() => (
    <View style={styles.headerSurface}>
      <Text variant="headlineMedium" style={styles.headerTitle}>
        Tenants
      </Text>
      <Text variant="bodyMedium" style={styles.headerSubtitle}>
        {tenants.length} active tenants
      </Text>
    </View>
  ), [tenants.length]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        testID="tenantsList"
        data={tenants}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <List.Item
            testID={`tenant-${item.id}`}
            title={item.name}
            description={
              <View style={styles.tenantDetails}>
                <Text variant="bodySmall" style={styles.propertyText}>
                  {properties.find(p => p.id === item.propertyId)?.address ?? 'Property'}
                </Text>
                <View style={styles.contactInfo}>
                  <View style={styles.contactRow}>
                    <Mail size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={styles.contactText}>
                      {item.email}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Phone size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={styles.contactText}>
                      {item.phone}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Calendar size={14} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={styles.contactText}>
                      Lease ends: {item.leaseEndDate}
                    </Text>
                  </View>
                </View>
              </View>
            }
            left={() => (
              <Avatar.Icon 
                size={48} 
                icon={() => <User size={24} color="white" />}
                style={{ backgroundColor: theme.colors.primary }}
              />
            )}
            onPress={() => router.push(`/tenant/${item.id}`)}
            style={styles.listItem}
            titleStyle={styles.tenantName}
          />
        )}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <EmptyState
            testID="tenantsEmpty"
            icon={<Users size={28} color={theme.colors.primary} />}
            title="No Tenants Yet"
            message="You can add tenants after you've added a property."
          />
        }
        ListHeaderComponent={<Header />}
        contentContainerStyle={styles.listContent}
      />

      <FAB
        testID="addTenantFab"
        icon={() => <Plus size={20} color={theme.colors.onPrimary} />}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={openModal}
      />

      <Portal>
        <Modal visible={visible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <Surface style={styles.modalCard} elevation={2}>
            <Text variant="headlineSmall" style={styles.modalTitle}>{editingId ? 'Edit Tenant' : 'Add New Tenant'}</Text>
            <KeyboardAwareScrollView enableOnAndroid={true} extraScrollHeight={12} keyboardOpeningTime={0}>
              <TextInput label="Full Name" value={name} onChangeText={setName} style={styles.input} testID="tenantName" />
              <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" testID="tenantEmail" />
              <TextInput label="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" testID="tenantPhone" />

              <Text style={styles.selectorLabel}>Assign to Property</Text>
              <Surface style={styles.dropdown} elevation={0}>
                {vacantProperties.length === 0 ? (
                  <Text variant="bodySmall" style={styles.emptyText}>No vacant properties available</Text>
                ) : (
                  vacantProperties.map(p => (
                    <List.Item
                      key={p.id}
                      title={`${p.address}, ${p.city}`}
                      onPress={() => setSelectedPropertyId(p.id)}
                      right={() => (
                        <View style={styles.radioMark}>{selectedPropertyId === p.id ? <View style={styles.radioDot} /> : null}</View>
                      )}
                    />
                  ))
                )}
              </Surface>

              <TextInput label="Lease End Date (YYYY-MM-DD)" value={leaseEndDate} onChangeText={setLeaseEndDate} style={styles.input} placeholder={new Date().toISOString().slice(0,10)} testID="leaseEndDate" />
            </KeyboardAwareScrollView>

            <Button mode="contained" onPress={onSaveTenant} disabled={!name || !email || !phone || !selectedPropertyId} testID="saveTenantBtn">
              <Text>{editingId ? 'Save Changes' : 'Save Tenant'}</Text>
            </Button>
            <Button onPress={() => { setEditingId(null); setName(''); setEmail(''); setPhone(''); setSelectedPropertyId(''); setLeaseEndDate(''); closeModal(); }} style={styles.cancelBtn}><Text>Cancel</Text></Button>
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
  listContent: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff00',
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
  },
  tenantName: {
    fontWeight: '600' as const,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 4,
  },
  tenantDetails: {
    marginTop: 4,
  },
  propertyText: {
    color: '#34495e',
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  contactInfo: {
    gap: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    color: '#7f8c8d',
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
  },
  emptyText: {
    color: '#7f8c8d',
    padding: 12,
  },
  radioMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#34495e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34495e',
  },
  cancelBtn: {
    marginTop: 4,
  }
});