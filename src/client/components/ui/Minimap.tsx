'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { useEffect, useRef } from 'react';

const MINIMAP_SIZE = 196;

export function Minimap() {
  const { position, worldObjects, players, worldWidth, worldHeight } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL_SIZE = MINIMAP_SIZE / Math.max(worldWidth, worldHeight);

    // Clear with parchment color
    ctx.fillStyle = '#c9b896';
    ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Draw grid
    ctx.strokeStyle = '#a89878';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= worldWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, MINIMAP_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(MINIMAP_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw resources (rocks, trees)
    worldObjects.forEach((obj) => {
      const x = obj.position.x * CELL_SIZE + CELL_SIZE / 2;
      const y = obj.position.y * CELL_SIZE + CELL_SIZE / 2;
      
      if (obj.status === 'active') {
        ctx.fillStyle = '#4a6741'; // Green for trees
        if (obj.definitionId.includes('rock')) {
          ctx.fillStyle = '#6b6b6b'; // Grey for rocks
        }
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw other players
    Object.values(players).forEach((p) => {
      const x = p.x * CELL_SIZE + CELL_SIZE / 2;
      const y = p.y * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillStyle = '#0000ff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player (red dot)
    const px = position.x * CELL_SIZE + CELL_SIZE / 2;
    const py = position.y * CELL_SIZE + CELL_SIZE / 2;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction indicator
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 6);
    ctx.stroke();

  }, [position, worldObjects, players, worldWidth, worldHeight]);

  return (
    <div className="w-[196px] h-[196px] bg-[#3e3529] p-[6px] pointer-events-auto">
      <div className="relative w-full h-full border-2 border-[#9c8c71]">
        <canvas
          ref={canvasRef}
          width={MINIMAP_SIZE}
          height={MINIMAP_SIZE}
          className="w-full h-full"
        />
        
        {/* Compass icon */}
        <div className="absolute top-1 left-1 w-4 h-4 flex items-center justify-center">
          <span className="text-[10px] font-bold text-[#3e3529]">N</span>
        </div>
        
        {/* Circular mask overlay corners */}
        <div className="absolute inset-0 border-2 border-[#3e3529] pointer-events-none" 
             style={{ borderRadius: '2px' }} />
      </div>
    </div>
  );
}
