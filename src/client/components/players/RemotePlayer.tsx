'use client';

import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';

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
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    bodyColor: '#dc2626',
  };
  
  return (
    <PlayerModel
      x={player.x}
      y={player.y}
      facing={player.facing as any}
      appearance={appearance}
      isMoving={false}
      isLocalPlayer={false}
    />
  );
}
