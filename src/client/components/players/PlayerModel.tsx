import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FacingDirection } from "@/shared/types";
import { getRotationForFacing } from "@/client/lib/facing";
import { visualPositionRef } from "@/client/lib/visualPositionRef";

export interface PlayerAppearance {
  bodyColor: string;
  headColor: string;
  legsColor: string;
  helm?: string;
  chest?: string;
  legs?: string;
  mainHand?: string;
}

export interface PlayerModelProps {
  x?: number;
  y?: number;
  facing: FacingDirection;
  appearance: PlayerAppearance;
  isMoving?: boolean;
  isRunning?: boolean;
  isHarvesting?: boolean;
  movementProgress?: number;
  isLocalPlayer?: boolean;
}

const ITEM_COLORS: Record<string, string> = {
  bronze_sword: "#cd7f32",
  iron_sword: "#a0a0a0",
  steel_sword: "#707070",
  Mithril_sword: "#4a90d9",
  adamant_sword: "#2ecc71",
  rune_sword: "#3498db",
  dragon_sword: "#e74c3c",
  bronze_helm: "#cd7f32",
  iron_helm: "#a0a0a0",
  steel_helm: "#707070",
  bronze_chest: "#cd7f32",
  iron_chest: "#a0a0a0",
  steel_chest: "#707070",
  bronze_legs: "#cd7f32",
  iron_legs: "#a0a0a0",
  steel_legs: "#707070",
};

function getItemColor(itemId?: string): string {
  if (!itemId) return "#888888";
  return ITEM_COLORS[itemId] || "#888888";
}

export function PlayerModel({
  x = 0,
  y = 0,
  facing,
  appearance,
  isMoving,
  isRunning,
  isHarvesting,
  movementProgress,
  isLocalPlayer,
}: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animationState = useRef({
    walkPhase: 0,
    breathePhase: 0,
    prevMovementProgress: 0,
    lastMoveTime: 0,
    amplitude: 0,
  });
  const legLeftGroupRef = useRef<THREE.Group>(null);
  const legRightGroupRef = useRef<THREE.Group>(null);
  const armLeftGroupRef = useRef<THREE.Group>(null);
  const armRightGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);

  const rotation = getRotationForFacing(facing);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = rotation;
  }, [rotation]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const anim = animationState.current;
    const now = performance.now();

    if (isLocalPlayer) {
      groupRef.current.position.x = visualPositionRef.x;
      groupRef.current.position.z = visualPositionRef.y;
    } else {
      groupRef.current.position.x = x ?? 0;
      groupRef.current.position.z = y ?? 0;
    }

    const progress = movementProgress ?? 0;

    if (isMoving && progress < 1) {
      anim.lastMoveTime = now;
    }

    const timeSinceMove = now - anim.lastMoveTime;
    const isGracePeriod = !isMoving && timeSinceMove < 100;
    const isCurrentlyMoving = (isMoving && progress < 1) || isGracePeriod;

    const transitionSpeed = 8;
    if (isCurrentlyMoving) {
      anim.amplitude = Math.min(anim.amplitude + delta * transitionSpeed, 1);
    } else {
      anim.amplitude = Math.max(anim.amplitude - delta * transitionSpeed, 0);
    }

    if (anim.amplitude > 0.01) {
      let deltaProgress: number;

      if (isGracePeriod) {
        deltaProgress = delta / 0.6;
      } else {
        deltaProgress = progress - anim.prevMovementProgress;

        if (deltaProgress < -0.5) {
          deltaProgress = progress + (1 - anim.prevMovementProgress);
        }
      }

      const speedMultiplier = isRunning ? 2 : 1;
      anim.walkPhase += deltaProgress * Math.PI * 2 * speedMultiplier;
      if (!isGracePeriod) {
        anim.prevMovementProgress = progress;
      }

      const walkPhase = anim.walkPhase;
      const maxLegAngle = isRunning ? 0.8 : 0.5;
      const maxArmAngle = isRunning ? 0.6 : 0.4;

      if (legLeftGroupRef.current && legRightGroupRef.current) {
        legLeftGroupRef.current.rotation.x = Math.sin(walkPhase) * maxLegAngle * anim.amplitude;
        legRightGroupRef.current.rotation.x =
          Math.sin(walkPhase + Math.PI) * maxLegAngle * anim.amplitude;
      }

      if (armLeftGroupRef.current && armRightGroupRef.current) {
        armLeftGroupRef.current.rotation.x = -Math.sin(walkPhase) * maxArmAngle * anim.amplitude;
        armRightGroupRef.current.rotation.x =
          -Math.sin(walkPhase + Math.PI) * maxArmAngle * anim.amplitude;
      }

      const bobAmount = isRunning ? 0.08 : 0.05;
      const bob = Math.abs(Math.sin(walkPhase)) * bobAmount * anim.amplitude;
      groupRef.current.position.y = 0.31 + bob;

      if (bodyGroupRef.current) bodyGroupRef.current.position.y = 0;
    } else {
      anim.prevMovementProgress = 0;
      anim.breathePhase += delta * 2;

      const breathe = Math.sin(anim.breathePhase);

      if (legLeftGroupRef.current) legLeftGroupRef.current.rotation.x = 0;
      if (legRightGroupRef.current) legRightGroupRef.current.rotation.x = 0;
      if (armLeftGroupRef.current)
        armLeftGroupRef.current.rotation.x = breathe * 0.02;

      if (isHarvesting) {
        const chopSpeed = 10;
        const chop = Math.sin((now / 1000) * chopSpeed);
        if (armRightGroupRef.current) {
          armRightGroupRef.current.rotation.x = -1.5 + chop * 0.8;
        }
      } else {
        if (armRightGroupRef.current)
          armRightGroupRef.current.rotation.x = breathe * 0.02;
      }

      if (bodyGroupRef.current)
        bodyGroupRef.current.position.y = breathe * 0.02;

      groupRef.current.position.y = 0.31;
    }
  });

  const helmColor = appearance.helm ? getItemColor(appearance.helm) : null;
  const chestColor = appearance.chest
    ? getItemColor(appearance.chest)
    : appearance.bodyColor;
  const legsColor = appearance.legs
    ? getItemColor(appearance.legs)
    : appearance.legsColor;
  const weaponColor = appearance.mainHand
    ? getItemColor(appearance.mainHand)
    : null;

  return (
    <group ref={groupRef} position={[x, 0.31, y]}>
      <group ref={bodyGroupRef}>
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.25]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>

        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.42, 0.05, 0.26]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>

        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>

        {helmColor && (
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.34, 0.25, 0.34]} />
            <meshStandardMaterial color={helmColor} />
          </mesh>
        )}

        <group position={[0, 0.87, 0.15]}>
          <mesh position={[-0.06, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.06, 0.02, 0.02]}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>

          <mesh position={[0.06, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.06, 0.02, 0.02]}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
        </group>

        <mesh position={[0, 0.8, 0.18]} castShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>

        <mesh position={[0, 0.74, 0.15]}>
          <boxGeometry args={[0.12, 0.03, 0.02]} />
          <meshStandardMaterial color="#1a202c" />
        </mesh>
      </group>

      <group ref={armLeftGroupRef} position={[-0.26, 0.6, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>
        <mesh castShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
      </group>

      <group ref={armRightGroupRef} position={[0.26, 0.6, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>
        <mesh castShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
        {weaponColor && (
          <mesh
            position={[0, -0.6, 0.15]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color={weaponColor} />
          </mesh>
        )}
      </group>

      <group ref={legLeftGroupRef} position={[-0.1, 0.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color={legsColor} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
          <meshStandardMaterial color="#3d3229" />
        </mesh>
      </group>

      <group ref={legRightGroupRef} position={[0.1, 0.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color={legsColor} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
          <meshStandardMaterial color="#3d3229" />
        </mesh>
      </group>
    </group>
  );
}

export const DEFAULT_APPEARANCE: PlayerAppearance = {
  bodyColor: "#1e40af",
  headColor: "#f6e05e",
  legsColor: "#2d3748",
};
