'use client';

import { ChatBox } from './ChatBox';
import { Sidebar } from './Sidebar';
import { Tooltip } from './Tooltip';

export function HUD() {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* Tooltip - top left */}
      <div className="absolute top-0 left-0 pointer-events-none">
        <Tooltip />
      </div>
      
      {/* Sidebar - right side */}
      <div className="absolute right-0 top-0 bottom-0 pointer-events-auto">
        <Sidebar />
      </div>
      
      {/* Chat Box - bottom left */}
      <div className="absolute bottom-0 left-0 pointer-events-auto">
        <ChatBox />
      </div>
    </div>
  );
}
