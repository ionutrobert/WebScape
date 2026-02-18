'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { useEffect, useState, useRef } from 'react';

export function DebugPanel() {
  const debugSettings = useGameStore((s) => s.debugSettings);
  const setDebugSettings = useGameStore((s) => s.setDebugSettings);
  const performanceSettings = useGameStore((s) => s.performanceSettings);
  const setPerformanceSettings = useGameStore((s) => s.setPerformanceSettings);
  const position = useGameStore((s) => s.position);
  const tickStartTime = useGameStore((s) => s.tickStartTime);
  const tickDuration = useGameStore((s) => s.tickDuration);
  
  const [tickProgress, setTickProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (debugSettings.showTickInfo) {
      intervalRef.current = window.setInterval(() => {
        const store = useGameStore.getState();
        const ts = store.tickStartTime;
        const td = store.tickDuration;
        if (ts > 0) {
          const elapsed = Date.now() - ts;
          const progress = Math.max(0, Math.min(100, (elapsed % td) / td * 100));
          setTickProgress(progress);
        }
      }, 50);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setTickProgress(0);
    }
  }, [debugSettings.showTickInfo]);

  const hasAnyEnabled = debugSettings.showTrueTile || debugSettings.showTickInfo || debugSettings.showCollisionMap;
  
  return (
    <div 
      className={`absolute top-16 right-4 bg-black/95 border-2 p-4 rounded-lg text-xs font-mono z-50 w-72 transition-opacity ${hasAnyEnabled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ borderColor: '#ef4444' }}
    >
      <div className="font-bold text-red-300 mb-3 flex justify-between items-center text-sm">
        <span>Debug & Performance</span>
        <button 
          onClick={() => {
            setDebugSettings({ showTrueTile: false, showTickInfo: false, showCollisionMap: false });
          }}
          className="text-red-400 hover:text-white text-lg leading-none"
        >
          ✕
        </button>
      </div>
      
      {debugSettings.showTickInfo && (
        <div className="mb-3 pb-2 border-b border-red-800">
          <div className="font-bold text-red-300 mb-1">Tick Info</div>
          <div className="flex items-center gap-2 mb-1">
            <span>Progress:</span>
            <div className="flex-1 bg-stone-700 rounded h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full"
                style={{ width: `${tickProgress}%` }}
              />
            </div>
            <span className="w-10 text-right">{Math.round(tickProgress)}%</span>
          </div>
          <div>Duration: {tickDuration}ms</div>
          <div>Visual: ({position.x.toFixed(2)}, {position.y.toFixed(2)})</div>
        </div>
      )}
      
      {debugSettings.showTrueTile && (
        <div className="mb-3 pb-2 border-b border-red-800">
          <div className="font-bold text-yellow-400 mb-1">True Tile</div>
          <div>Server pos: ({position.x}, {position.y})</div>
        </div>
      )}
      
      <div className="mb-3 pb-2 border-b border-red-800">
        <div className="font-bold text-blue-300 mb-2">Performance</div>
        
        <div className="mb-2">
          <label className="block mb-1">View Distance: {performanceSettings.viewDistance}</label>
          <input
            type="range"
            min="5"
            max="25"
            value={performanceSettings.viewDistance}
            onChange={(e) => setPerformanceSettings({ viewDistance: parseInt(e.target.value) })}
            className="w-full accent-blue-500"
          />
        </div>
        
        <label className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={performanceSettings.shadowsEnabled}
            onChange={(e) => setPerformanceSettings({ shadowsEnabled: e.target.checked })}
            className="accent-blue-500"
          />
          Shadows
        </label>
        
        <label className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={performanceSettings.smoothCamera}
            onChange={(e) => setPerformanceSettings({ smoothCamera: e.target.checked })}
            className="accent-blue-500"
          />
          Smooth Camera
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={performanceSettings.showFps}
            onChange={(e) => setPerformanceSettings({ showFps: e.target.checked })}
            className="accent-blue-500"
          />
          Show FPS
        </label>
      </div>
      
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debugSettings.showTrueTile}
            onChange={(e) => setDebugSettings({ showTrueTile: e.target.checked })}
            className="accent-red-500"
          />
          Show True Tile
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debugSettings.showTickInfo}
            onChange={(e) => setDebugSettings({ showTickInfo: e.target.checked })}
            className="accent-red-500"
          />
          Show Tick Info
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={debugSettings.showCollisionMap}
            onChange={(e) => setDebugSettings({ showCollisionMap: e.target.checked })}
            className="accent-red-500"
          />
          Show Collision Map
        </label>
      </div>
    </div>
  );
}
