import { create } from 'zustand';
import { mockLessons } from '@/src/mocks';
import type { Lesson, SubjectKey } from '@/src/types';

interface LibraryState {
  lessons: Lesson[];
  searchQuery: string;
  activeFilter: 'all' | SubjectKey | 'downloaded' | 'bookmarked';
  setSearch: (q: string) => void;
  setFilter: (f: 'all' | SubjectKey | 'downloaded' | 'bookmarked') => void;
  toggleBookmark: (id: string) => void;
  toggleDownload: (id: string) => void;
  setProgress: (id: string, progress: number) => void;
  getFiltered: () => Lesson[];
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  lessons: mockLessons,
  searchQuery: '',
  activeFilter: 'all',
  setSearch: (q) => set({ searchQuery: q }),
  setFilter: (f) => set({ activeFilter: f }),
  toggleBookmark: (id) =>
    set((state) => ({
      lessons: state.lessons.map((l) =>
        l.id === id ? { ...l, bookmarked: !l.bookmarked } : l
      ),
    })),
  toggleDownload: (id) =>
    set((state) => ({
      lessons: state.lessons.map((l) =>
        l.id === id ? { ...l, downloaded: !l.downloaded } : l
      ),
    })),
  setProgress: (id, progress) =>
    set((state) => ({
      lessons: state.lessons.map((l) =>
        l.id === id ? { ...l, progress } : l
      ),
    })),
  getFiltered: () => {
    const { lessons, searchQuery, activeFilter } = get();
    return lessons.filter((l) => {
      if (activeFilter !== 'all' && activeFilter !== 'downloaded' && activeFilter !== 'bookmarked') {
        if (l.subject !== activeFilter) return false;
      }
      if (activeFilter === 'downloaded' && !l.downloaded) return false;
      if (activeFilter === 'bookmarked' && !l.bookmarked) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  },
}));
