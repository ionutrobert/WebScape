'use client';

import { useRef, useEffect } from 'react';
import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';
import { usePositionInterpolation } from '@/client/lib/usePositionInterpolation';

interface RemotePlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
}

interface RemotePlayerProps {
  player: RemotePlayerData;
}

export function RemotePlayer({ player }: RemotePlayerProps) {
  const { x, y, isMoving } = usePositionInterpolation(player.x, player.y, true);
  
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
