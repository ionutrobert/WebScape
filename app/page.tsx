'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '@/client/stores/gameStore';
import { SKILLS_CONFIG, xpToLevel, levelProgress } from '@/data/skills';
import { SkillKey } from '@/shared/types';
import { GameLoop } from '@/client/components/GameLoop';
import { GameScene } from '@/client/components/GameScene';
import { Backpack, User, Sword, Send } from 'lucide-react';
import { GAME_NAME } from '@/data/game';
import { io, Socket } from 'socket.io-client';

type TabType = 'inventory' | 'skills' | 'equipment';

export default function GamePage() {
  const [username, setUsername] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [mounted, setMounted] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  
  const { 
    xp, inventory, chatLog, isLoaded, players,
    setUsername: setStoreUsername, addChatMessage,
    setWorldObjects, setPosition, setInventory, setLoaded,
    setPlayerId, setPlayers, playerId, loadClientSettings,
    setTargetDestination, camera
  } = useGameStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatLog]);

  const handleLogin = () => {
    if (!username.trim() || isLoggingIn) return;
    setIsLoggingIn(true);
    
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
    });

    let myPlayerId: string | null = null;

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join', username);
    });

    newSocket.on('init', async (data: any) => {
      myPlayerId = data.playerId;
      setStoreUsername(username);
      setPlayerId(data.playerId);
      setWorldObjects(data.worldObjects);
      
      const me = data.players?.find((p: any) => p.id === data.playerId);
      setPosition(me ? { x: me.x, y: me.y } : { x: 10, y: 10 });
      
      setInventory(Array(28).fill(null));
      setIsLoggingIn(false);
      setSocket(newSocket);
      setLoaded(true);
      addChatMessage(`Welcome to ${GAME_NAME}, ${username}!`);
      
      await loadClientSettings();
    });

    newSocket.on('world-update', (world: any[]) => {
      setWorldObjects(world);
    });

    newSocket.on('players-update', (players: any[]) => {
      const playersMap: Record<string, { id: string; username: string; x: number; y: number; facing: string }> = {};
      players.forEach(p => {
        if (p.id !== myPlayerId) {
          playersMap[p.id] = p;
        }
      });
      setPlayers(playersMap);
    });

    newSocket.on('position-update', (pos: { x: number; y: number }) => {
      const state = useGameStore.getState();
      const targetDest = state.targetDestination;
      
      if (targetDest && pos.x === targetDest.x && pos.y === targetDest.y) {
        useGameStore.getState().setTargetDestination(null);
      }
      
      setPosition(pos);
    });

    newSocket.on('inventory-update', (inv: Record<string, number>) => {
      const invArray: ({ id: string; qty: number } | null)[] = Object.entries(inv).map(([id, qty]) => ({ id, qty }));
      while (invArray.length < 28) invArray.push(null);
      setInventory(invArray as any);
    });

    newSocket.on('chat', (data: { username?: string; message: string; type: string }) => {
      if (data.type === 'system') {
        addChatMessage(data.message);
      } else {
        addChatMessage(`${data.username}: ${data.message}`);
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      addChatMessage('Disconnected from server.');
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && socket) {
      socket.emit('chat', chatMessage.trim());
      setChatMessage('');
    }
  };

  const handleMove = (x: number, y: number) => {
    setTargetDestination({ x, y });
    socket?.emit('move-to', { x, y });
  };

  const handleHarvest = (x: number, y: number, objectId: string) => {
    socket?.emit('harvest', { x, y, objectId });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-amber-500">Loading...</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="bg-stone-800 border border-stone-700 p-8 rounded-lg w-96">
          <h1 className="text-3xl font-bold text-amber-500 mb-2 text-center">{GAME_NAME}</h1>
          <p className="text-stone-400 text-center mb-6">3D Browser RPG</p>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-stone-900 border border-stone-600 px-4 py-2 rounded mb-4 text-stone-200 placeholder-stone-500"
          />
          <button
            onClick={handleLogin}
            disabled={isLoggingIn || !username.trim()}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:bg-stone-600 text-white py-2 rounded font-bold"
          >
            {isLoggingIn ? 'Connecting...' : 'Play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <GameLoop />
      
      <div className="flex-1 relative">
        <GameScene 
          onMove={handleMove} 
          onHarvest={handleHarvest}
          players={players}
        />
        
        <div className="absolute top-4 left-4 bg-stone-900/90 border border-stone-700 rounded px-3 py-2 text-sm">
          <div className="text-amber-500 font-bold">{username}</div>
          <div className="text-stone-400 text-xs">
            {connected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
      </div>
      
      <div className="w-72 bg-stone-800 border-l border-stone-700 flex flex-col">
        {/* Compass */}
        <div className="h-16 flex items-center justify-center border-b border-stone-700 relative overflow-hidden">
          <div 
            className="relative w-12 h-12 rounded-full border-2 border-amber-600 bg-stone-900"
            style={{ transform: `rotate(${-camera.theta * (180 / Math.PI)}deg)` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-xs">N</div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-stone-500 font-bold text-xs">S</div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 text-stone-500 font-bold text-xs">E</div>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 text-stone-500 font-bold text-xs">W</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="flex border-b border-stone-700">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === 'inventory' ? 'bg-stone-700 text-amber-500' : 'text-stone-400 hover:bg-stone-750'}`}
          >
            <Backpack className="inline w-4 h-4 mr-1" />
            Inv
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === 'skills' ? 'bg-stone-700 text-amber-500' : 'text-stone-400 hover:bg-stone-750'}`}
          >
            <User className="inline w-4 h-4 mr-1" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === 'equipment' ? 'bg-stone-700 text-amber-500' : 'text-stone-400 hover:bg-stone-750'}`}
          >
            <Sword className="inline w-4 h-4 mr-1" />
            Equip
          </button>
        </div>
        
        <div className="flex-1 p-3 overflow-auto">
          {activeTab === 'inventory' && (
            <div className="grid grid-cols-4 gap-1">
              {(inventory || []).slice(0, 28).map((slot: any, i: number) => (
                <div
                  key={i}
                  className={`aspect-square bg-stone-900 border border-stone-600 rounded flex items-center justify-center ${slot ? 'border-stone-500' : ''}`}
                >
                  {slot && (
                    <div className="text-center">
                      <div className="text-xl">
                        {slot.id?.includes('ore') ? '🪨' : 
                         slot.id?.includes('log') ? '🪵' : 
                         slot.id === 'coins' ? '💰' : '📦'}
                      </div>
                      {slot.qty > 1 && (
                        <div className="text-xs text-stone-400">{slot.qty}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {activeTab === 'skills' && (
            <div className="space-y-2">
              {(Object.keys(SKILLS_CONFIG) as SkillKey[]).map((skill) => {
                const level = xpToLevel(xp[skill]);
                const progress = levelProgress(xp[skill]);
                return (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-300">{SKILLS_CONFIG[skill].name}</span>
                      <span className="text-amber-500 font-bold">{level}</span>
                    </div>
                    <div className="h-2 bg-stone-900 rounded overflow-hidden">
                      <div className="h-full bg-amber-700" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{xp[skill].toLocaleString()} XP</div>
                  </div>
                );
              })}
            </div>
          )}
          
          {activeTab === 'equipment' && (
            <div className="text-stone-400 text-sm">No equipment yet.</div>
          )}
        </div>
        
        <div className="h-48 border-t border-stone-700 flex flex-col bg-stone-900">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatLog.map((msg, i) => (
              <div key={i} className="text-stone-300 text-sm">{msg}</div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendChat} className="flex border-t border-stone-700 p-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={connected ? "Chat..." : "Connecting..."}
              disabled={!connected}
              className="flex-1 bg-stone-800 border border-stone-600 px-3 py-1 rounded text-stone-200 text-sm"
            />
            <button type="submit" disabled={!connected} className="ml-2 p-1 bg-amber-700 rounded">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
