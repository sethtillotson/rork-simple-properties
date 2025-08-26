import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export interface EmptyStateProps {
  icon?: React.ReactElement | null;
  title: string;
  message: string;
  testID?: string;
}

export default function EmptyState({ icon, title, message, testID }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container} testID={testID ?? 'emptyState'}>
      {icon ? (
        <View style={styles.iconWrap}>
          <Text accessibilityElementsHidden accessibilityLabel="">
            {icon}
          </Text>
        </View>
      ) : null}
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#ecf0f1',
  },
  title: {
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    textAlign: 'center',
    opacity: 0.9,
  },
});