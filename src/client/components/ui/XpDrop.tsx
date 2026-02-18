"use client";

import { useGameStore, XpDrop } from "@/client/stores/gameStore";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

const SKILL_COLORS: Record<string, string> = {
  attack: "#ef4444",
  strength: "#ef4444",
  defense: "#ef4444",
  ranged: "#22c55e",
  magic: "#3b82f6",
  mining: "#a855f7",
  woodcutting: "#a855f7",
  fishing: "#a855f7",
  cooking: "#a855f7",
  firemaking: "#a855f7",
  smithing: "#a855f7",
  crafting: "#a855f7",
  fletching: "#a855f7",
  herblore: "#a855f7",
  agility: "#a855f7",
  thieving: "#a855f7",
  slayer: "#a855f7",
  farming: "#a855f7",
  construction: "#a855f7",
  prayer: "#a855f7",
  rc: "#a855f7",
};

function getSkillColor(skill: string): string {
  return SKILL_COLORS[skill] || "#a855f7";
}

function XpDropInstance({ drop }: { drop: XpDrop }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const removeXpDrop = useGameStore((state) => state.removeXpDrop);
  
  const initialY = 1.2;
  const duration = 2000;
  
  const color = useMemo(() => getSkillColor(drop.skill), [drop.skill]);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    try {
      const elapsed = performance.now() - drop.startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        removeXpDrop(drop.id);
        return;
      }
      
      meshRef.current.position.y = initialY + progress * 1.5;
      
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = 1 - progress;
      }
    } catch (e) {
      // Silently handle errors to prevent blue screen
    }
  });
  
  return (
    <mesh 
      ref={meshRef} 
      position={[drop.x, initialY, drop.y]} 
      renderOrder={999}
    >
      <planeGeometry args={[1.2, 0.4]} />
      <meshBasicMaterial transparent opacity={1} depthTest={false} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.25}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        +{drop.amount}
      </Text>
    </mesh>
  );
}

export function XpDropManager() {
  const xpDrops = useGameStore((state) => state.xpDrops);
  
  return (
    <>
      {xpDrops.map((drop) => (
        <XpDropInstance key={drop.id} drop={drop} />
      ))}
    </>
  );
}
