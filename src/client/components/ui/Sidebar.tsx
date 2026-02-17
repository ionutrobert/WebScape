'use client';

import { useUIStore, SidebarTab } from '@/client/stores/uiStore';
import { useGameStore } from '@/client/stores/gameStore';
import { Minimap } from './Minimap';

interface SidebarButton {
  id: SidebarTab;
  label: string;
  icon: string;
}

const SIDEBAR_BUTTONS: SidebarButton[] = [
  { id: 'combat', label: 'Combat', icon: '⚔' },
  { id: 'skills', label: 'Skills', icon: '⛏' },
  { id: 'quest', label: 'Quest', icon: '📜' },
  { id: 'inventory', label: 'Inventory', icon: '🎒' },
  { id: 'prayer', label: 'Prayer', icon: '✨' },
  { id: 'magic', label: 'Magic', icon: '🔮' },
  { id: 'friends', label: 'Friends', icon: '👥' },
  { id: 'logout', label: 'Logout', icon: '🚪' },
];

function SidebarButton({ button, isActive, onClick }: { button: SidebarButton; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-[54px] h-[36px] text-xs font-bold
        transition-none select-none
        ${isActive 
          ? 'bg-[#3e3529] text-[#ffd900] border-t-2 border-[#ff0000]' 
          : 'bg-[#4b4338] text-[#d9c4a9] hover:bg-[#5a4d3d]'
        }
      `}
    >
      <span className="text-sm">{button.icon}</span>
      <span className="text-[9px] leading-none mt-0.5">{button.label}</span>
    </button>
  );
}

export function Sidebar() {
  const { activeSidebarTab, setSidebarTab } = useUIStore();
  const { inventory, xp } = useGameStore();

  const handleLogout = () => {
    window.location.reload();
  };

  const renderPanelContent = () => {
    switch (activeSidebarTab) {
      case 'inventory':
        return (
          <div className="p-2">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-[#2a2520] border-2 border-[#5a4d3d] flex items-center justify-center"
                >
                  {inventory[i] && (
                    <div className="w-8 h-8 bg-[#4a6741] rounded flex items-center justify-center text-[8px]">
                      {inventory[i]?.id || '?'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className="p-2 space-y-1">
            {Object.entries(xp).map(([skill, value]) => (
              <div key={skill} className="flex items-center gap-2 text-xs">
                <span className="w-16 capitalize text-[#d9c4a9]">{skill}</span>
                <div className="flex-1 h-3 bg-[#2a2520] border border-[#5a4d3d]">
                  <div 
                    className="h-full bg-[#ffd900]" 
                    style={{ width: `${Math.min(100, (value / 1000) * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-[#d9c4a9]">{Math.floor(value / 100)}</span>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full text-[#9c8c71] text-sm">
            {SIDEBAR_BUTTONS.find(b => b.id === activeSidebarTab)?.label}
          </div>
        );
    }
  };

  return (
    <div className="w-[214px] h-full flex flex-col bg-[#3e3529]">
      {/* Minimap */}
      <div className="flex-shrink-0">
        <Minimap />
      </div>
      
      {/* Control Panel */}
      <div className="flex-1 bg-[#4b4338] border-l-4 border-[#3e3529] flex flex-col">
        {/* Top row icons */}
        <div className="flex justify-center gap-0.5 pt-1 bg-[#3e3529]">
          {SIDEBAR_BUTTONS.slice(0, 4).map((button) => (
            <SidebarButton
              key={button.id}
              button={button}
              isActive={activeSidebarTab === button.id}
              onClick={() => button.id === 'logout' ? handleLogout() : setSidebarTab(button.id)}
            />
          ))}
        </div>
        
        {/* Center panel */}
        <div className="flex-1 bg-[#4b4338] border-y-2 border-[#3e3529] min-h-[200px] overflow-hidden">
          {renderPanelContent()}
        </div>
        
        {/* Bottom row icons */}
        <div className="flex justify-center gap-0.5 pb-1 bg-[#3e3529]">
          {SIDEBAR_BUTTONS.slice(4).map((button) => (
            <SidebarButton
              key={button.id}
              button={button}
              isActive={activeSidebarTab === button.id}
              onClick={() => button.id === 'logout' ? handleLogout() : setSidebarTab(button.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
