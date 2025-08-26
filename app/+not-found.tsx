import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Surface, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Stack } from 'expo-router';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Page Not Found" }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Surface style={styles.content} elevation={1}>
          <Home size={48} color={theme.colors.primary} style={styles.icon} />
          <Text variant="headlineSmall" style={styles.title}>
            Page Not Found
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            The page you&apos;re looking for doesn&apos;t exist in your property management app.
          </Text>
          <Link href="/" asChild>
            <Button mode="contained" style={styles.button}>
              <Text style={styles.buttonText}>Go to Properties</Text>
            </Button>
          </Link>
        </Surface>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '600' as const,
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#34495e',
  },
  buttonText: {
    color: '#ffffff',
  },
});