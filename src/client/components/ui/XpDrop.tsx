"use client";

import { useGameStore, XpDrop } from "@/client/stores/gameStore";
import { useEffect, useState, useRef } from "react";

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

function XpDropItem({ drop, index, onRemove }: { drop: XpDrop; index: number; onRemove: () => void }) {
  const [opacity, setOpacity] = useState(1);
  const [offsetY, setOffsetY] = useState(0);
  const startTimeRef = useRef(Date.now());
  
  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 1800; // Shorter duration
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(interval);
        onRemove();
        return;
      }
      
      setOpacity(1 - progress);
      setOffsetY(progress * 40);
    }, 50);
    
    return () => clearInterval(interval);
  }, [onRemove]);
  
  const color = getSkillColor(drop.skill);
  
  return (
    <div
      style={{
        position: "absolute",
        right: "20px",
        bottom: `${80 + (index * 30)}px`, // Stack from bottom up
        transform: `translateY(${offsetY}px)`,
        opacity,
        pointerEvents: "none",
        fontSize: "18px",
        fontWeight: "bold",
        color,
        textShadow: "1px 1px 0 #000, -1px -1px 0 #000",
        whiteSpace: "nowrap",
        zIndex: 1000,
        transition: "opacity 0.1s",
      }}
    >
      +{drop.amount} {drop.skill}
    </div>
  );
}

export function XpDropManager() {
  const xpDrops = useGameStore((state) => state.xpDrops);
  const removeXpDrop = useGameStore((state) => state.removeXpDrop);
  
  // Only show the most recent XP drops (max 5)
  const visibleDrops = xpDrops.slice(-5);
  
  return (
    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "200px", pointerEvents: "none" }}>
      {visibleDrops.map((drop, idx) => (
        <XpDropItem 
          key={drop.id} 
          drop={drop} 
          index={idx}
          onRemove={() => removeXpDrop(drop.id)} 
        />
      ))}
    </div>
  );
}
