import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "@/src/theme/ThemeProvider";
import { useSettingsStore } from "@/src/store/settingsStore";
import { useAuthStore } from "@/src/store/authStore";
import { useMeshStore } from "@/src/store/meshStore";
import { SplashScreen as MofNetSplash } from "@/src/components/SplashScreen";
import { OnboardingScreen } from "@/src/components/OnboardingScreen";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme, resolvedMode } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasCompletedOnboarding]);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (showSplash) {
    return <MofNetSplash onComplete={handleSplashComplete} duration={2400} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="lesson/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="analytics"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="signup"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="teacher-dashboard"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function AppInner() {
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const checkBackendConnection = useMeshStore((s) => s.checkBackendConnection);

  useEffect(() => {
    loadSettings();
    checkBackendConnection();

    const healthTimer = setInterval(() => {
      checkBackendConnection();
    }, 30000);

    const splashTimer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);

    return () => {
      clearInterval(healthTimer);
      clearTimeout(splashTimer);
    };
  }, [loadSettings, checkBackendConnection]);

  return <RootLayoutNav />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppInner />
        </GestureHandlerRootView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
