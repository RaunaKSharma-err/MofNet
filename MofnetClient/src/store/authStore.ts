import { create } from "zustand";
import { mockUser } from "@/src/mocks";
import type { UserProfile, Grade, Language } from "@/src/types";

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  setUser: (user: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  setOnboardingComplete: (
    grade: Grade,
    language: Language,
    name: string,
  ) => void;
  setOnboarded: (value: boolean) => void;
  logout: () => void;
  addXp: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockUser,
  isAuthenticated: true,
  hasCompletedOnboarding: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  updateProfile: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  setOnboardingComplete: (grade, language, name) =>
    set({
      hasCompletedOnboarding: true,
      isAuthenticated: true,
      user: {
        ...mockUser,
        name,
        grade,
        language,
        joinedAt: Date.now(),
        xp: 0,
        streak: 0,
        badges: [],
      },
    }),
  setOnboarded: (value) => set({ hasCompletedOnboarding: value }),
  logout: () => set({ user: null, isAuthenticated: false }),
  addXp: (amount) =>
    set((state) => ({
      user: state.user ? { ...state.user, xp: state.user.xp + amount } : null,
    })),
}));
