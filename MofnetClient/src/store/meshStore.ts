import { create } from 'zustand';
import { mockMeshNodes } from '@/src/mocks';
import type { MeshNode, ConnectionStatus } from '@/src/types';
import { checkBackendHealth } from '@/src/services/backendService';

interface MeshState {
  nodes: MeshNode[];
  status: ConnectionStatus;
  isSyncing: boolean;
  lastSync: number;
  meshHealth: number;
  contentSynced: number;
  selectedNodeId: string | null;
  syncHistory: SyncEvent[];
  setSyncing: (v: boolean) => void;
  triggerSync: () => Promise<void>;
  selectNode: (id: string | null) => void;
  setStatus: (s: ConnectionStatus) => void;
  checkBackendConnection: () => Promise<boolean>;
}

interface SyncEvent {
  id: string;
  timestamp: number;
  type: 'auto' | 'manual';
  items: number;
  status: 'success' | 'partial' | 'failed';
  from: string;
}

export const useMeshStore = create<MeshState>((set, get) => ({
  nodes: mockMeshNodes,
  status: 'mesh',
  isSyncing: false,
  lastSync: Date.now() - 1000 * 60 * 5,
  meshHealth: 88,
  contentSynced: 94,
  selectedNodeId: null,
  syncHistory: [
    { id: 'sync_1', timestamp: Date.now() - 1000 * 60 * 5, type: 'auto', items: 12, status: 'success', from: 'Shree Saraswati School' },
    { id: 'sync_2', timestamp: Date.now() - 1000 * 60 * 60 * 3, type: 'auto', items: 8, status: 'partial', from: 'Janata Higher Secondary' },
    { id: 'sync_3', timestamp: Date.now() - 1000 * 60 * 60 * 24, type: 'manual', items: 24, status: 'success', from: 'Rural Community Center' },
  ],
  setSyncing: (v) => set({ isSyncing: v }),
  triggerSync: async () => {
    if (get().isSyncing) return;
    set({ isSyncing: true });
    await new Promise((r) => setTimeout(r, 2200));
    const newEvent: SyncEvent = {
      id: `sync_${Date.now()}`,
      timestamp: Date.now(),
      type: 'manual',
      items: Math.floor(Math.random() * 15) + 5,
      status: 'success',
      from: 'School Hub — Edge AI',
    };
    set((state) => ({
      isSyncing: false,
      lastSync: Date.now(),
      syncHistory: [newEvent, ...state.syncHistory],
      contentSynced: Math.min(100, state.contentSynced + 3),
      meshHealth: Math.min(100, state.meshHealth + 2),
      nodes: state.nodes.map((n) =>
        n.status === 'offline' ? n : { ...n, lastSync: Date.now(), contentSynced: Math.min(100, n.contentSynced + 5) }
      ),
    }));
  },
  selectNode: (id) => set({ selectedNodeId: id }),
  setStatus: (s) => set({ status: s }),
  checkBackendConnection: async () => {
    const healthy = await checkBackendHealth();
    set({ status: healthy ? 'online' : 'mesh' });
    return healthy;
  },
}));
