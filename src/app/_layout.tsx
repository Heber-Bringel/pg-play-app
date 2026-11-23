import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeProvider, useTheme, type AppTokens } from '@/view/theme';

const LayoutShell = () => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);

  return (
    <SafeAreaProvider>
      <StatusBar style={activeTokens.mode === 'dark' ? 'light' : 'dark'} />
      <Head>
        <title>PG PLAY</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style type="text/css">{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          body, html, * {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          :focus:not(:focus-visible) {
            outline: none;
          }
        `}</style>
      </Head>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: activeTokens.semantic.color.surface },
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export const RootLayout = () => {
  useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  return (
    <ThemeProvider>
      <LayoutShell />
    </ThemeProvider>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: activeTokens.semantic.color.surface,
    },
  });

export default RootLayout;
