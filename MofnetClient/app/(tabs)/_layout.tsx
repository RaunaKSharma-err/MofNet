import React from "react";
import { Tabs } from "expo-router";
import { useTheme } from "@/src/theme/ThemeProvider";
import { FloatingTabBar } from "@/src/components/FloatingTabBar";
import { OfflineBanner } from "@/src/components/OfflineBanner";
import { View, StyleSheet } from "react-native";

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="library" options={{ title: "Library" }} />
        <Tabs.Screen name="tutor" options={{ title: "AI Tutor" }} />
        <Tabs.Screen name="quiz" options={{ title: "Quiz" }} />
        <Tabs.Screen name="mesh" options={{ title: "Mesh" }} />
        <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
