'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';
import { usePositionInterpolation } from '@/client/lib/usePositionInterpolation';
import { visualPositionRef } from '@/client/lib/visualPositionRef';
import { useEffect } from 'react';

export function LocalPlayer() {
  const { position, facing, equipment, isMoving } = useGameStore();
  
  const visualPos = usePositionInterpolation(position.x, position.y, isMoving);
  
  useEffect(() => {
    if (visualPos) {
      visualPositionRef.x = visualPos.x;
      visualPositionRef.y = visualPos.y;
    }
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
      x={visualPos?.x ?? position.x}
      y={visualPos?.y ?? position.y}
      facing={facing}
      appearance={appearance}
      isMoving={isMoving}
      isLocalPlayer={true}
    />
  );
}
