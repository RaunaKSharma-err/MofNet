import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/src/theme/ThemeProvider";

interface SettingsState {
  language: "en" | "ne";
  themeMode: ThemeMode;
  speechRate: number;
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  autoDownload: boolean;
  notifySchool: boolean;
  notifyHomework: boolean;
  notifyLearning: boolean;
  notifyQuiz: boolean;
  setLanguage: (lang: "en" | "ne") => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSpeechRate: (rate: number) => void;
  setHaptics: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setAutoDownload: (enabled: boolean) => void;
  setNotifySchool: (v: boolean) => void;
  setNotifyHomework: (v: boolean) => void;
  setNotifyLearning: (v: boolean) => void;
  setNotifyQuiz: (v: boolean) => void;
  loadSettings: () => Promise<void>;
  persistSettings: () => Promise<void>;
}

const SETTINGS_KEY = "mofnet_settings";

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: "en",
  themeMode: "light",
  speechRate: 1.0,
  hapticsEnabled: true,
  reducedMotion: false,
  autoDownload: true,
  notifySchool: true,
  notifyHomework: true,
  notifyLearning: true,
  notifyQuiz: true,
  setLanguage: (lang) => {
    set({ language: lang });
    get().persistSettings();
  },
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    get().persistSettings();
  },
  setSpeechRate: (rate) => {
    set({ speechRate: rate });
    get().persistSettings();
  },
  setHaptics: (enabled) => {
    set({ hapticsEnabled: enabled });
    get().persistSettings();
  },
  setReducedMotion: (enabled) => {
    set({ reducedMotion: enabled });
    get().persistSettings();
  },
  setAutoDownload: (enabled) => {
    set({ autoDownload: enabled });
    get().persistSettings();
  },
  setNotifySchool: (v) => {
    set({ notifySchool: v });
    get().persistSettings();
  },
  setNotifyHomework: (v) => {
    set({ notifyHomework: v });
    get().persistSettings();
  },
  setNotifyLearning: (v) => {
    set({ notifyLearning: v });
    get().persistSettings();
  },
  setNotifyQuiz: (v) => {
    set({ notifyQuiz: v });
    get().persistSettings();
  },
  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(parsed);
      }
    } catch (e) {
      // silent fail — use defaults
    }
  },
  persistSettings: async () => {
    try {
      const s = get();
      const data = {
        language: s.language,
        themeMode: s.themeMode,
        speechRate: s.speechRate,
        hapticsEnabled: s.hapticsEnabled,
        reducedMotion: s.reducedMotion,
        autoDownload: s.autoDownload,
        notifySchool: s.notifySchool,
        notifyHomework: s.notifyHomework,
        notifyLearning: s.notifyLearning,
        notifyQuiz: s.notifyQuiz,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (e) {
      // silent fail
    }
  },
}));
