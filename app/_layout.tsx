import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from 'react-native-paper';
import { PropertiesProvider } from '@/context/PropertiesContext';
import { ChecklistTemplatesProvider } from '@/context/ChecklistTemplatesContext';
import { TenantsProvider } from '@/context/TenantsContext';
import { MaintenanceProvider } from '@/context/MaintenanceContext';
import { FinancialsProvider } from '@/context/FinancialsContext';
import { theme } from '@/theme';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="maintenance/[id]" options={{ title: 'Maintenance Details' }} />
      <Stack.Screen name="checklists/builder" options={{ presentation: 'modal', title: 'Checklist Builder' }} />
      <Stack.Screen name="documents/viewer" options={{ title: 'Document Viewer', presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <PropertiesProvider>
          <ChecklistTemplatesProvider>
            <TenantsProvider>
              <GestureHandlerRootView>
                <MaintenanceProvider>
                  <FinancialsProvider>
                    <StatusBar style="dark" />
                    <RootLayoutNav />
                  </FinancialsProvider>
                </MaintenanceProvider>
              </GestureHandlerRootView>
            </TenantsProvider>
          </ChecklistTemplatesProvider>
        </PropertiesProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}