'use client';

import { useState } from 'react';
import { GAME_NAME } from '@/data/game';
import { useUIStore, ChatTab } from '@/client/stores/uiStore';
import { useGameStore } from '@/client/stores/gameStore';

const CHAT_TABS: { id: ChatTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'game', label: 'Game' },
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Private' },
  { id: 'clan', label: 'Clan' },
  { id: 'trade', label: 'Trade' },
];

export function ChatBox() {
  const { activeChatTab, setChatTab } = useUIStore();
  const { chatLog } = useGameStore();
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<typeof import('socket.io-client').io.prototype | null>(null);

  // This will be set by the parent
  const chatEndRef = { current: null };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Emit to socket - parent will handle this via ref or context
      window.dispatchEvent(new CustomEvent('chat-send', { detail: message.trim() }));
      setMessage('');
    }
  };

  return (
    <div className="w-[486px] h-[120px] pointer-events-auto">
      <div className="w-full h-full bg-[#d9c4a9] border-[3px] border-t-0 border-l-0 border-[#3e3529] relative">
        {/* Chat messages area */}
        <div className="absolute inset-[4px] bottom-[36px] overflow-y-auto bg-[#d9c4a9] pr-2">
          <div className="flex flex-col gap-0.5">
            {chatLog.length === 0 && (
              <span className="text-[#5c4e31] text-sm italic">Welcome to {GAME_NAME}!</span>
            )}
            {chatLog.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="text-[#3e3529]">:</span>
                <span className={msg.startsWith('[') ? 'text-[#5c4e31]' : 'text-[#000080] font-bold'}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Chat input */}
        <form onSubmit={handleSend} className="absolute bottom-[4px] left-[4px] right-[4px] h-[24px]">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Chat..."
            className="w-full h-full bg-[#c4b59e] border border-[#3e3529] px-2 text-sm text-[#3e3529] placeholder-[#9c8c71]"
          />
        </form>
        
        {/* Chat tabs */}
        <div className="absolute bottom-0 left-0 right-0 h-[28px] bg-[#4b4338] flex items-center px-1 gap-0.5">
          {CHAT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChatTab(tab.id)}
              className={`
                px-2 py-0.5 text-xs font-bold transition-none
                ${activeChatTab === tab.id 
                  ? 'bg-[#5a4d3d] text-[#ffd900] border-t border-[#9c8c71]' 
                  : 'bg-[#3e3529] text-[#d9c4a9] hover:bg-[#4b4338]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="px-2 py-0.5 text-xs font-bold bg-[#5e1e1e] text-white hover:bg-[#7a2828]">
            Report
          </button>
        </div>
      </div>
    </div>
  );
}
