import { create } from 'zustand';

export type SidebarTab = 'combat' | 'skills' | 'quest' | 'inventory' | 'prayer' | 'magic' | 'friends' | 'logout';
export type ChatTab = 'all' | 'game' | 'public' | 'private' | 'clan' | 'trade';

interface UIState {
  activeSidebarTab: SidebarTab;
  activeChatTab: ChatTab;
  chatMessages: { type: string; message: string; timestamp: number }[];
  
  setSidebarTab: (tab: SidebarTab) => void;
  setChatTab: (tab: ChatTab) => void;
  addChatMessage: (message: { type: string; message: string }) => void;
  clearChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeSidebarTab: 'inventory',
  activeChatTab: 'all',
  chatMessages: [],
  
  setSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setChatTab: (tab) => set({ activeChatTab: tab }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, { ...message, timestamp: Date.now() }]
  })),
  clearChat: () => set({ chatMessages: [] }),
}));
