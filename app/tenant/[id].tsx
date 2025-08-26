import React, { useMemo } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Surface, Text, Button, useTheme, Divider, Avatar } from 'react-native-paper';
import { useTenants } from '@/context/TenantsContext';
import { useProperties } from '@/context/PropertiesContext';
import { Mail, Phone, HomeIcon, Calendar, User } from 'lucide-react-native';

export default function TenantDetailsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTenantById, deleteTenant } = useTenants();
  const { properties } = useProperties();

  const tenant = getTenantById(String(id));
  const property = useMemo(() => properties.find(p => p.id === tenant?.propertyId), [properties, tenant?.propertyId]);

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
