import React, { useCallback } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { Card, FAB, Text, Chip, Surface, useTheme } from 'react-native-paper';
import { useProperties } from '@/context/PropertiesContext';
import { Property } from '@/types/property';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import EmptyState from '@/components/EmptyState';
import { Home } from 'lucide-react-native';

export default function PropertiesScreen() {
  const { properties } = useProperties();
  const theme = useTheme();

  const onOpenDetails = useCallback((id: string) => {
    console.log('[PropertiesScreen] Navigate to property details', id);
    router.push(`/property/${id}`);
  }, []);

  const renderProperty = ({ item }: { item: Property }) => (
    <Card
      style={styles.card}
      mode="elevated"
      elevation={1}
      onPress={() => onOpenDetails(item.id)}
      testID={`propertyCard-${item.id}`}
    >
      <Card.Cover source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.address}>
          {item.address}
        </Text>
        <Text variant="bodyMedium" style={styles.cityState}>
          {item.city}, {item.province} {item.postalCode} · {item.country}
        </Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text variant="labelSmall" style={styles.detailLabel}>Beds</Text>
            <Text variant="bodyLarge" style={styles.detailValue}>{item.bedrooms || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall" style={styles.detailLabel}>Baths</Text>
            <Text variant="bodyLarge" style={styles.detailValue}>{item.bathrooms || '-'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text variant="labelSmall" style={styles.detailLabel}>Sq Ft</Text>
            <Text variant="bodyLarge" style={styles.detailValue}>
              {item.squareFeet ? item.squareFeet.toLocaleString() : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Chip 
            mode="flat" 
            style={[
              styles.statusChip,
              { backgroundColor: item.isOccupied ? theme.colors.primaryContainer : theme.colors.tertiaryContainer }
            ]}
            textStyle={styles.chipText}
          >
            {item.isOccupied ? 'Occupied' : 'Vacant'}
          </Chip>
          {item.monthlyRent && (
            <Text variant="titleMedium" style={styles.rent}>
              ${item.monthlyRent.toLocaleString()}/mo
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <Surface style={styles.headerSurface} elevation={0}>
      <Text variant="headlineMedium" style={styles.headerTitle}>
        Your Properties
      </Text>
      <Text variant="bodyMedium" style={styles.headerSubtitle}>
        {properties.length} {properties.length === 1 ? 'property' : 'properties'}
      </Text>
    </Surface>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            testID="propertiesEmpty"
            icon={<Home size={28} color={theme.colors.primary} />}
            title="No Properties Found"
            message="Tap the '+' button to add your first property."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/modal')}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  listContent: {
    paddingBottom: 100,
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
  cardImage: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  address: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 4,
  },
  cityState: {
    color: '#7f8c8d',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    color: '#95a5a6',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  detailValue: {
    fontWeight: '500' as const,
    color: '#34495e',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  rent: {
    fontWeight: '600' as const,
    color: '#34495e',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 20,
  },
});