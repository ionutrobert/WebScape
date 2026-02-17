'use client';

import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';
import { usePositionInterpolation } from '@/client/lib/usePositionInterpolation';
import { useGameStore } from '@/client/stores/gameStore';

interface RemotePlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  startX?: number;
  startY?: number;
  facing: string;
}

interface RemotePlayerProps {
  player: RemotePlayerData;
}

export function RemotePlayer({ player }: RemotePlayerProps) {
  const startX = player.startX ?? player.x;
  const startY = player.startY ?? player.y;
  const tickStartTime = useGameStore((state) => state.tickStartTime);
  const tickDuration = useGameStore((state) => state.tickDuration);
  
  const { x, y, isMoving } = usePositionInterpolation(
    player.x, 
    player.y, 
    startX, 
    startY, 
    true,
    tickStartTime,
    tickDuration
  );
  
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    bodyColor: '#dc2626',
  };
  
  return (
    <PlayerModel
      x={x}
      y={y}
      facing={player.facing as any}
      appearance={appearance}
      isMoving={isMoving}
      isLocalPlayer={false}
    />
  );
}
