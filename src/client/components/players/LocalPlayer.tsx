'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';

export function LocalPlayer() {
  const { position, facing, equipment, isMoving } = useGameStore();
  
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    mainHand: equipment.mainHand || undefined,
    chest: equipment.chest || undefined,
    legs: equipment.legs || undefined,
    helm: equipment.helm || undefined,
  };
  
  return (
    <PlayerModel
      x={position.x}
      y={position.y}
      facing={facing}
      appearance={appearance}
      isMoving={isMoving}
      isLocalPlayer={true}
    />
  );
}
