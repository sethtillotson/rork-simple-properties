import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FinancialsScreen from '@/components/FinancialsScreen';

export default function FinancialsTab() {
  const insets = useSafeAreaInsets();
  console.log('[Tabs/financials] insets', insets);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="financialsTab-container">
      <FinancialsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});