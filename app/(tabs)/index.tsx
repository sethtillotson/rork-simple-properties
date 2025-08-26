import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PropertiesScreen from '@/components/PropertiesScreen';

export default function PropertiesTab() {
  const insets = useSafeAreaInsets();
  console.log('[Tabs/index] insets', insets);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="propertiesTab-container">
      <PropertiesScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});