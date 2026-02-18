import { create } from 'zustand';

export type SidebarTab = 'combat' | 'skills' | 'quest' | 'inventory' | 'prayer' | 'magic' | 'friends' | 'logout';
export type ChatTab = 'all' | 'game' | 'public' | 'private' | 'clan' | 'trade';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  targetType: "ground" | "rock" | "tree" | "player" | null;
  targetX: number;
  targetY: number;
}

interface UIState {
  activeSidebarTab: SidebarTab;
  activeChatTab: ChatTab;
  chatMessages: { type: string; message: string; timestamp: number }[];
  contextMenu: ContextMenuState;
  
  setSidebarTab: (tab: SidebarTab) => void;
  setChatTab: (tab: ChatTab) => void;
  addChatMessage: (message: { type: string; message: string }) => void;
  clearChat: () => void;
  openContextMenu: (x: number, y: number, items: ContextMenuItem[], targetType: "ground" | "rock" | "tree" | "player" | null, targetX: number, targetY: number) => void;
  closeContextMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSidebarTab: 'inventory',
  activeChatTab: 'all',
  chatMessages: [],
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
    targetType: null,
    targetX: 0,
    targetY: 0,
  },
  
  setSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setChatTab: (tab) => set({ activeChatTab: tab }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, { ...message, timestamp: Date.now() }]
  })),
  clearChat: () => set({ chatMessages: [] }),
  openContextMenu: (x, y, items, targetType, targetX, targetY) => set({
    contextMenu: { isOpen: true, x, y, items, targetType, targetX, targetY }
  }),
  closeContextMenu: () => set((state) => ({
    contextMenu: { ...state.contextMenu, isOpen: false }
  })),
}));
