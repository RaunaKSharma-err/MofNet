import { create } from 'zustand';
import type { ChatMessage, ChatSession } from '@/src/types';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isStreaming: boolean;
  isListening: boolean;
  voiceMode: boolean;
  createSession: () => string;
  setActiveSession: (id: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, partial: Partial<ChatMessage>) => void;
  toggleBookmark: (sessionId: string, messageId: string) => void;
  setStreaming: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setVoiceMode: (v: boolean) => void;
  deleteSession: (id: string) => void;
}

const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  isStreaming: false,
  isListening: false,
  voiceMode: false,
  createSession: () => {
    const id = `sess_${Date.now()}`;
    const session: ChatSession = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ sessions: [session, ...state.sessions], activeSessionId: id }));
    return id;
  },
  setActiveSession: (id) => set({ activeSessionId: id }),
  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const messages = [...s.messages, message];
        const title = s.messages.length === 0 && message.role === 'user'
          ? message.content.slice(0, 30)
          : s.title;
        return { ...s, messages, title, updatedAt: Date.now() };
      }),
    })),
  updateMessage: (sessionId, messageId, partial) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, ...partial } : m
              ),
              updatedAt: Date.now(),
            }
      ),
    })),
  toggleBookmark: (sessionId, messageId) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id !== sessionId
          ? s
          : {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, bookmarked: !m.bookmarked } : m
              ),
            }
      ),
    })),
  setStreaming: (v) => set({ isStreaming: v }),
  setListening: (v) => set({ isListening: v }),
  setVoiceMode: (v) => set({ voiceMode: v }),
  deleteSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),
}));

export { generateId };
