import createContextHook from "@nkzw/create-context-hook";
import { useColorScheme } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { darkColors, lightColors, type ThemeColors } from "./color";
import { typography, type Typography } from "./typography";
import {
  spacing,
  radius,
  layout,
  TOUCH_TARGET,
  TAB_BAR_HEIGHT,
} from "./spacing";
import { shadows, getShadow } from "./shadows";
import { useSettingsStore } from "@/src/store/settingsStore";

export type ThemeMode = "light" | "dark" | "system";

export interface Theme {
  mode: "light" | "dark";
  colors: ThemeColors;
  typography: Typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  shadows: typeof shadows;
  touchTarget: number;
  tabBarHeight: number;
  getShadow: (key: keyof typeof shadows) => ReturnType<typeof getShadow>;
}

const buildTheme = (mode: "light" | "dark"): Theme => ({
  mode,
  colors: mode === "dark" ? darkColors : lightColors,
  typography,
  spacing,
  radius,
  layout,
  shadows,
  touchTarget: TOUCH_TARGET,
  tabBarHeight: TAB_BAR_HEIGHT,
  getShadow: (key) => getShadow(key, mode === "dark"),
});

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const savedThemeMode = useSettingsStore((s) => s.themeMode);
  const [mode, setMode] = useState<ThemeMode>(savedThemeMode);

  useEffect(() => {
    setMode(savedThemeMode);
  }, [savedThemeMode]);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const theme = buildTheme(resolvedMode);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  return { mode, resolvedMode, theme, toggleTheme, setThemeMode };
});
