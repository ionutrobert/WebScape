'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';
import { usePositionInterpolation } from '@/client/lib/usePositionInterpolation';
import { visualPositionRef } from '@/client/lib/visualPositionRef';
import { useEffect } from 'react';

export function LocalPlayer() {
  const { position, startPosition, facing, equipment } = useGameStore();
  
  const { x, y, isMoving } = usePositionInterpolation(
    position.x, 
    position.y, 
    startPosition.x, 
    startPosition.y, 
    true
  );
  
  useEffect(() => {
    visualPositionRef.x = x;
    visualPositionRef.y = y;
  });
  
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    mainHand: equipment.mainHand || undefined,
    chest: equipment.chest || undefined,
    legs: equipment.legs || undefined,
    helm: equipment.helm || undefined,
  };
  
  return (
    <PlayerModel
      x={x}
      y={y}
      facing={facing}
      appearance={appearance}
      isMoving={isMoving}
      isLocalPlayer={true}
    />
  );
}
