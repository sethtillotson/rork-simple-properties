import React, { useMemo } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Surface, Text, Button, useTheme, Divider, Avatar, Portal, Modal } from 'react-native-paper';
import { useTenants } from '@/context/TenantsContext';
import { useProperties } from '@/context/PropertiesContext';
import { Mail, Phone, HomeIcon, Calendar, User } from 'lucide-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { documentTemplates, type DocumentTemplate } from '@/utils/documentTemplates';

export default function TenantDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTenantById, deleteTenant } = useTenants();
  const { properties } = useProperties();

  const tenant = getTenantById(String(id));
  const property = useMemo(() => properties.find(p => p.id === tenant?.propertyId), [properties, tenant?.propertyId]);
  const [docModalVisible, setDocModalVisible] = React.useState<boolean>(false);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: tenant?.name ?? 'Tenant Details' }} />

      <Surface style={styles.card} elevation={1} testID="tenantDetailsCard">
        <View style={styles.headerRow}>
          <Avatar.Icon size={56} icon={() => <User size={28} color={'white'} />} style={{ backgroundColor: theme.colors.primary }} />
          <View style={styles.headerText}>
            <Text variant="headlineSmall" style={styles.name}>{tenant?.name ?? 'Unknown Tenant'}</Text>
            <Text variant="bodyMedium" style={styles.subtle}>{property ? `${property.address}, ${property.city}` : 'No property assigned'}</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.row}>
          <Mail size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.value}>{tenant?.email ?? '-'}</Text>
        </View>
        <View style={styles.row}>
          <Phone size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.value}>{tenant?.phone ?? '-'}</Text>
        </View>
        <View style={styles.row}>
          <HomeIcon size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.value}>{property ? `${property.address}, ${property.city}` : '-'}</Text>
        </View>
        <View style={styles.row}>
          <Calendar size={18} color={theme.colors.onSurfaceVariant} />
          <Text variant="bodyMedium" style={styles.value}>Lease ends: {tenant?.leaseEndDate ?? '-'}</Text>
        </View>

        <View style={styles.actions}>
          <Button
            testID="editTenantBtn"
            mode="contained"
            onPress={() => router.push({ pathname: '/(tabs)/tenants', params: { mode: 'edit', id: String(id) } })}
            textColor={theme.colors.onPrimary}
          >
            <Text>Edit</Text>
          </Button>
          <Button
            testID="generateTenantDocBtn"
            mode="outlined"
            onPress={() => setDocModalVisible(true)}
          >
            <Text>Generate Document</Text>
          </Button>
          <Button
            testID="deleteTenantBtn"
            mode="contained"
            style={styles.deleteBtn}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onPrimary}
            onPress={() => {
              Alert.alert(
                'Delete Tenant',
                'Are you sure you want to delete this tenant? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      if (typeof id === 'string') {
                        deleteTenant(id);
                        router.replace('/(tabs)/tenants');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Text>Delete</Text>
          </Button>
        </View>
      </Surface>
      <Portal>
        <Modal visible={docModalVisible} onDismiss={() => setDocModalVisible(false)} contentContainerStyle={{ backgroundColor: '#fff', margin: 20, padding: 16, borderRadius: 12 }}>
          {!tenant ? (
            <View />
          ) : (
            <View>
              <Text variant="titleMedium" style={{ marginBottom: 12 }}>Select a Template</Text>
              <KeyboardAwareScrollView enableOnAndroid={true} keyboardShouldPersistTaps="handled" extraScrollHeight={12}>
                <View style={{ gap: 8 }}>
                  {documentTemplates.map((tpl: DocumentTemplate) => (
                    <Button
                      key={tpl.name}
                      mode="outlined"
                      testID={`tenantDocTpl-${tpl.name.replace(/\s+/g, '-')}`}
                      onPress={() => {
                        const t = tenant;
                        const p = property;
                        const prompt = `You are an expert real-estate assistant generating a professional document.\n\nTemplate: ${tpl.name}\nPurpose: ${tpl.content}\n\nContext: Tenant Basics:\n- Name: ${t?.name ?? '-'}\n- Email: ${t?.email ?? '-'}\n- Phone: ${t?.phone ?? '-'}\n- Lease End: ${t?.leaseEndDate ?? '-'}\nProperty: ${p ? `${p.address}, ${p.city}, ${p.province} ${p.postalCode}` : 'N/A'}\n\nInstructions:\n- Write clear, structured sections.\n- Include relevant specifics from context.\n- Keep to 1-2 pages equivalent.`;
                        setDocModalVisible(false);
                        router.push({ pathname: '/documents/viewer', params: { prompt } });
                      }}
                    >
                      <Text>{tpl.name}</Text>
                    </Button>
                  ))}
                </View>
              </KeyboardAwareScrollView>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <Button mode="text" onPress={() => setDocModalVisible(false)}>
                  <Text>Close</Text>
                </Button>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 16,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontWeight: '600' as const,
    color: '#2c3e50',
  },
  subtle: {
    color: '#7f8c8d',
  },
  divider: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    color: '#34495e',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
  },
});
