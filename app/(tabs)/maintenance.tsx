import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaintenanceScreen from '@/components/MaintenanceScreen';

export default function MaintenanceTab() {
  const insets = useSafeAreaInsets();
  console.log('[Tabs/maintenance] insets', insets);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="maintenanceTab-container">
      <MaintenanceScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});