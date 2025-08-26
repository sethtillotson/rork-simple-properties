import { MD3LightTheme as DefaultTheme, MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#366696',
    onPrimary: '#FFFFFF',
    secondary: '#2c3e50',
    tertiary: '#3498db',
    background: '#f4f6f8',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    onSurface: '#000000',
    onSurfaceVariant: '#7f8c8d',
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f8f9fa',
      level3: '#f4f6f8',
      level4: '#ecf0f1',
      level5: '#e8eaed',
    },
  },
  fonts: {
    ...DefaultTheme.fonts,
    headlineSmall: {
      ...DefaultTheme.fonts.headlineSmall,
      fontWeight: '600' as const,
    },
    titleMedium: {
      ...DefaultTheme.fonts.titleMedium,
      fontWeight: '500' as const,
    },
  },
  roundness: 12,
};