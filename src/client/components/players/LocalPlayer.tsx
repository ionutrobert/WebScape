'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { PlayerModel, DEFAULT_APPEARANCE, PlayerAppearance } from './PlayerModel';
import { usePositionInterpolation } from '@/client/lib/usePositionInterpolation';
import { visualPositionRef } from '@/client/lib/visualPositionRef';
import { useEffect } from 'react';

export function LocalPlayer() {
  const { position, startPosition, facing, equipment, tickStartTime, tickDuration, debugSettings } = useGameStore();
  
  const { x, y, isMoving, movementProgress } = usePositionInterpolation(
    position.x, 
    position.y, 
    startPosition.x, 
    startPosition.y, 
    true,
    tickStartTime,
    tickDuration
  );
  
  useEffect(() => {
    visualPositionRef.x = x;
    visualPositionRef.y = y;
  }, [x, y]);
  
  const appearance: PlayerAppearance = {
    ...DEFAULT_APPEARANCE,
    mainHand: equipment.mainHand || undefined,
    chest: equipment.chest || undefined,
    legs: equipment.legs || undefined,
    helm: equipment.helm || undefined,
  };
  
  return (
    <>
      <PlayerModel
        x={x}
        y={y}
        facing={facing}
        appearance={appearance}
        isMoving={isMoving}
        movementProgress={movementProgress}
        isLocalPlayer={true}
      />
      {debugSettings.showTrueTile && (
        <mesh position={[position.x, 0.5, position.y]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="yellow" transparent opacity={0.8} />
        </mesh>
      )}
    </>
  );
}
