'use client';

import { useRef, useEffect, useState } from 'react';
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
  const prevPos = useRef({ x: player.x, y: player.y });
  const [isMoving, setIsMoving] = useState(false);
  
  useEffect(() => {
    if (player.x !== prevPos.current.x || player.y !== prevPos.current.y) {
      setIsMoving(true);
      prevPos.current = { x: player.x, y: player.y };
      
      const timer = setTimeout(() => {
        setIsMoving(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [player.x, player.y]);
  
  const visualPos = usePositionInterpolation(player.x, player.y, isMoving);
  
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    bodyColor: '#dc2626',
  };
  
  return (
    <PlayerModel
      x={visualPos?.x ?? player.x}
      y={visualPos?.y ?? player.y}
      facing={player.facing as any}
      appearance={appearance}
      isMoving={isMoving}
      isLocalPlayer={false}
    />
  );
}
