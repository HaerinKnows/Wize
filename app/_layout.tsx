import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { fontFamily } from '@/design/tokens';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

function RootStack() {
  const { resolvedTheme, colors } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const syncNavigationBar = async () => {
      try {
        await NavigationBar.setPositionAsync('absolute');
        await NavigationBar.setBackgroundColorAsync('#00000000');
        await NavigationBar.setBorderColorAsync('#00000000');
        await NavigationBar.setButtonStyleAsync(resolvedTheme === 'dark' ? 'light' : 'dark');
      } catch {
        // Ignore unsupported navigation bar APIs on non-standard Android environments.
      }
    };

    void syncNavigationBar();
  }, [resolvedTheme]);

  return (
    <>
      <StatusBar
        style={resolvedTheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={colors.bg}
        translucent={false}
      />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth-choice" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="two-factor" />
        <Stack.Screen name="mpin" />
        <Stack.Screen name="biometric-enroll" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="total-details" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="scan-sms" />
        <Stack.Screen name="budgets" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="history" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="goal-setter" />
        <Stack.Screen name="smart-tips" />
        <Stack.Screen name="security" />
        <Stack.Screen name="appearance" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="shared-account" />
        <Stack.Screen name="premium" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fontFamily.base]: require('../assets/fonts/Raleway-VariableFont_wght.ttf'),
    [fontFamily.regular]: require('../assets/fonts/Raleway-Regular.ttf'),
    [fontFamily.variable]: require('../assets/fonts/Raleway-VariableFont_wght.ttf'),
    [fontFamily.italic]: require('../assets/fonts/Raleway-Italic.ttf'),
    [fontFamily.italicVariable]: require('../assets/fonts/Raleway-Italic-VariableFont_wght.ttf'),
    [fontFamily.thin]: require('../assets/fonts/Raleway-Thin.ttf'),
    [fontFamily.thinItalic]: require('../assets/fonts/Raleway-ThinItalic.ttf'),
    [fontFamily.extraLight]: require('../assets/fonts/Raleway-ExtraLight.ttf'),
    [fontFamily.extraLightItalic]: require('../assets/fonts/Raleway-ExtraLightItalic.ttf'),
    [fontFamily.light]: require('../assets/fonts/Raleway-Light.ttf'),
    [fontFamily.lightItalic]: require('../assets/fonts/Raleway-LightItalic.ttf'),
    [fontFamily.regularItalic]: require('../assets/fonts/Raleway-Italic.ttf'),
    [fontFamily.medium]: require('../assets/fonts/Raleway-Medium.ttf'),
    [fontFamily.mediumItalic]: require('../assets/fonts/Raleway-MediumItalic.ttf'),
    [fontFamily.semibold]: require('../assets/fonts/Raleway-SemiBold.ttf'),
    [fontFamily.semiboldItalic]: require('../assets/fonts/Raleway-SemiBoldItalic.ttf'),
    [fontFamily.bold]: require('../assets/fonts/Raleway-Bold.ttf'),
    [fontFamily.boldItalic]: require('../assets/fonts/Raleway-BoldItalic.ttf'),
    [fontFamily.extraBold]: require('../assets/fonts/Raleway-ExtraBold.ttf'),
    [fontFamily.extraBoldItalic]: require('../assets/fonts/Raleway-ExtraBoldItalic.ttf'),
    [fontFamily.black]: require('../assets/fonts/Raleway-Black.ttf'),
    [fontFamily.blackItalic]: require('../assets/fonts/Raleway-BlackItalic.ttf')
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
