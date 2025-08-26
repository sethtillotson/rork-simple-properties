import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DocumentsTab() {
  const insets = useSafeAreaInsets();
  console.log('[Tabs/documents] insets', insets);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="documentsTab-container">
      <View style={styles.center}>
        <Text style={styles.placeholder}>Documents</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '600',
  },
});