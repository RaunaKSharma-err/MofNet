import { create } from "zustand";
import { mockAnnouncements } from "@/src/mocks";
import type { Announcement } from "@/src/types";

interface AnnouncementState {
  announcements: Announcement[];
  searchQuery: string;
  activeCategory: "all" | Announcement["category"];
  markRead: (id: string) => void;
  markAllRead: () => void;
  togglePin: (id: string) => void;
  setSearch: (q: string) => void;
  setCategory: (c: "all" | Announcement["category"]) => void;
  getFiltered: () => Announcement[];
  unreadCount: () => number;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: mockAnnouncements,
  searchQuery: "",
  activeCategory: "all",
  markRead: (id) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, read: true } : a,
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      announcements: state.announcements.map((a) => ({ ...a, read: true })),
    })),
  togglePin: (id) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, pinned: !a.pinned } : a,
      ),
    })),
  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ activeCategory: c }),
  getFiltered: () => {
    const { announcements, searchQuery, activeCategory } = get();
    return announcements
      .filter((a) => activeCategory === "all" || a.category === activeCategory)
      .filter((a) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.createdAt - a.createdAt;
      });
  },
  unreadCount: () => get().announcements.filter((a) => !a.read).length,
}));
