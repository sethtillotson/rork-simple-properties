import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TenantsScreen from '@/components/TenantsScreen';

export default function TenantsTab() {
  const insets = useSafeAreaInsets();
  console.log('[Tabs/tenants] insets', insets);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="tenantsTab-container">
      <TenantsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});