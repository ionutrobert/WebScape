export interface AnimationState {
  walkPhase: number;
  breathePhase: number;
  prevMovementProgress: number;
}

export const createAnimationState = (): AnimationState => ({
  walkPhase: 0,
  breathePhase: 0,
  prevMovementProgress: 0,
});

export function updateWalkAnimation(
  state: AnimationState,
  movementProgress: number,
  isRunning: boolean
): {
  legLeftRotation: number;
  legRightRotation: number;
  armLeftRotation: number;
  armRightRotation: number;
  verticalBob: number;
} {
  const deltaProgress = movementProgress - state.prevMovementProgress;
  
  if (deltaProgress < -0.5) {
    state.walkPhase = 0;
  } else {
    const speedMultiplier = isRunning ? 2 : 1;
    state.walkPhase += deltaProgress * Math.PI * 2 * speedMultiplier;
  }
  state.prevMovementProgress = movementProgress;
  
  const walkPhase = state.walkPhase;
  const maxLegAngle = isRunning ? 0.8 : 0.5;
  const maxArmAngle = isRunning ? 0.6 : 0.4;
  
  return {
    legLeftRotation: Math.sin(walkPhase) * maxLegAngle,
    legRightRotation: Math.sin(walkPhase + Math.PI) * maxLegAngle,
    armLeftRotation: -Math.sin(walkPhase) * maxArmAngle,
    armRightRotation: -Math.sin(walkPhase + Math.PI) * maxArmAngle,
    verticalBob: Math.abs(Math.sin(walkPhase)) * (isRunning ? 0.08 : 0.05),
  };
}

export function updateIdleAnimation(
  state: AnimationState,
  delta: number
): {
  armRotation: number;
  bodyYOffset: number;
} {
  state.breathePhase += delta * 2;
  
  const breathe = Math.sin(state.breathePhase);
  
  return {
    armRotation: breathe * 0.02,
    bodyYOffset: breathe * 0.04,
  };
}

export function calculateWalkPhase(movementProgress: number, isRunning: boolean = false): number {
  const speedMultiplier = isRunning ? 2 : 1;
  return movementProgress * Math.PI * 2 * speedMultiplier;
}
