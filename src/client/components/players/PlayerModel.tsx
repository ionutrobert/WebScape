import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FacingDirection } from '@/shared/types';
import { getRotationForFacing } from '@/client/lib/facing';

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
  x: number;
  y: number;
  facing: FacingDirection;
  appearance: PlayerAppearance;
  isMoving?: boolean;
  isRunning?: boolean;
  movementProgress?: number;
  isLocalPlayer?: boolean;
}

const ITEM_COLORS: Record<string, string> = {
  bronze_sword: '#cd7f32',
  iron_sword: '#a0a0a0',
  steel_sword: '#707070',
  Mithril_sword: '#4a90d9',
  adamant_sword: '#2ecc71',
  rune_sword: '#3498db',
  dragon_sword: '#e74c3c',
  bronze_helm: '#cd7f32',
  iron_helm: '#a0a0a0',
  steel_helm: '#707070',
  bronze_chest: '#cd7f32',
  iron_chest: '#a0a0a0',
  steel_chest: '#707070',
  bronze_legs: '#cd7f32',
  iron_legs: '#a0a0a0',
  steel_legs: '#707070',
};

function getItemColor(itemId?: string): string {
  if (!itemId) return '#888888';
  return ITEM_COLORS[itemId] || '#888888';
}

export function PlayerModel({ x, y, facing, appearance, isMoving, isRunning, movementProgress, isLocalPlayer }: PlayerModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const animationState = useRef({
    walkPhase: 0,
    breathePhase: 0,
    prevMovementProgress: 0,
    lastMoveTime: 0,
  });
  const legLeftGroupRef = useRef<THREE.Group>(null);
  const legRightGroupRef = useRef<THREE.Group>(null);
  const armLeftGroupRef = useRef<THREE.Group>(null);
  const armRightGroupRef = useRef<THREE.Group>(null);
  const bodyGroupRef = useRef<THREE.Group>(null);
  
  const rotation = getRotationForFacing(facing);
  
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    groupRef.current.rotation.y = rotation;
    
    const anim = animationState.current;
    const progress = movementProgress ?? 0;
    const now = performance.now();
    
    // Track when we were last moving
    if (isMoving && progress < 1) {
      anim.lastMoveTime = now;
    }
    
    // Keep animating for 100ms after movement stops (grace period for tick transitions)
    const timeSinceMove = now - anim.lastMoveTime;
    const isCurrentlyMoving = (isMoving && progress < 1) || timeSinceMove < 100;
    
    if (isCurrentlyMoving) {
      let deltaProgress = progress - anim.prevMovementProgress;
      
      // Handle wraparound from ~1.0 to 0 when new tick starts
      if (deltaProgress < -0.5) {
        deltaProgress = progress + (1 - anim.prevMovementProgress);
      }
      
      const speedMultiplier = isRunning ? 2 : 1;
      anim.walkPhase += deltaProgress * Math.PI * 2 * speedMultiplier;
      anim.prevMovementProgress = progress;
      
      const walkPhase = anim.walkPhase;
      const maxLegAngle = isRunning ? 0.8 : 0.5;
      const maxArmAngle = isRunning ? 0.6 : 0.4;
      
      if (legLeftGroupRef.current && legRightGroupRef.current) {
        legLeftGroupRef.current.rotation.x = Math.sin(walkPhase) * maxLegAngle;
        legRightGroupRef.current.rotation.x = Math.sin(walkPhase + Math.PI) * maxLegAngle;
      }
      
      if (armLeftGroupRef.current && armRightGroupRef.current) {
        armLeftGroupRef.current.rotation.x = -Math.sin(walkPhase) * maxArmAngle;
        armRightGroupRef.current.rotation.x = -Math.sin(walkPhase + Math.PI) * maxArmAngle;
      }
      
      const bobAmount = isRunning ? 0.08 : 0.05;
      const bob = Math.abs(Math.sin(walkPhase)) * bobAmount;
      groupRef.current.position.y = 0.5 + bob;
    } else {
      anim.prevMovementProgress = 0;
      anim.walkPhase = 0;
      anim.breathePhase += delta * 2;
      
      const breathe = Math.sin(anim.breathePhase) * 0.02;
      
      if (legLeftGroupRef.current) legLeftGroupRef.current.rotation.x = 0;
      if (legRightGroupRef.current) legRightGroupRef.current.rotation.x = 0;
      if (armLeftGroupRef.current) armLeftGroupRef.current.rotation.x = breathe;
      if (armRightGroupRef.current) armRightGroupRef.current.rotation.x = breathe;
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = breathe * 2;
      
      groupRef.current.position.y = 0.5;
    }
  });
  
  const helmColor = appearance.helm ? getItemColor(appearance.helm) : null;
  const chestColor = appearance.chest ? getItemColor(appearance.chest) : appearance.bodyColor;
  const legsColor = appearance.legs ? getItemColor(appearance.legs) : appearance.legsColor;
  const weaponColor = appearance.mainHand ? getItemColor(appearance.mainHand) : null;
  
  return (
    <group ref={groupRef} position={[x, 0.5, y]}>
      {/* Body group for breathing animation */}
      <group ref={bodyGroupRef}>
        {/* Body - torso */}
        <mesh castShadow position={[0, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.5, 0.25]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>
        
        {/* Belt */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.42, 0.05, 0.26]} />
          <meshStandardMaterial color="#4a3728" />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
        
        {/* Helmet (if equipped) */}
        {helmColor && (
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.34, 0.25, 0.34]} />
            <meshStandardMaterial color={helmColor} />
          </mesh>
        )}
        
        {/* Face - eyes */}
        <group position={[0, 0.87, 0.15]}>
          {/* Left eye - white */}
          <mesh position={[-0.06, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Left pupil */}
          <mesh position={[-0.06, 0.02, 0.02]}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
          
          {/* Right eye - white */}
          <mesh position={[0.06, 0.02, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.02]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Right pupil */}
          <mesh position={[0.06, 0.02, 0.02]}>
            <boxGeometry args={[0.04, 0.04, 0.02]} />
            <meshStandardMaterial color="#1a202c" />
          </mesh>
        </group>
        
        {/* Nose */}
        <mesh position={[0, 0.8, 0.18]} castShadow>
          <boxGeometry args={[0.08, 0.1, 0.08]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
        
        {/* Mouth */}
        <mesh position={[0, 0.74, 0.15]}>
          <boxGeometry args={[0.12, 0.03, 0.02]} />
          <meshStandardMaterial color="#1a202c" />
        </mesh>
      </group>
      
      {/* Left Arm - shoulder group */}
      <group ref={armLeftGroupRef} position={[-0.26, 0.6, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>
        {/* Hand */}
        <mesh castShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
      </group>
      
      {/* Right Arm - shoulder group */}
      <group ref={armRightGroupRef} position={[0.26, 0.6, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={chestColor} />
        </mesh>
        {/* Hand */}
        <mesh castShadow position={[0, -0.45, 0]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={appearance.headColor} />
        </mesh>
        {/* Weapon in hand */}
        {weaponColor && (
          <mesh position={[0, -0.6, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color={weaponColor} />
          </mesh>
        )}
      </group>
      
      {/* Left Leg - hip group */}
      <group ref={legLeftGroupRef} position={[-0.1, 0.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color={legsColor} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
          <meshStandardMaterial color="#3d3229" />
        </mesh>
      </group>
      
      {/* Right Leg - hip group */}
      <group ref={legRightGroupRef} position={[0.1, 0.15, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color={legsColor} />
        </mesh>
        {/* Foot */}
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.14, 0.08, 0.2]} />
          <meshStandardMaterial color="#3d3229" />
        </mesh>
      </group>
    </group>
  );
}

export const DEFAULT_APPEARANCE: PlayerAppearance = {
  bodyColor: '#1e40af',
  headColor: '#f6e05e',
  legsColor: '#2d3748',
};
