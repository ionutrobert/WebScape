'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { WorldObjectState } from '@/shared/types';
import { OBJECTS } from '@/data/objects';

const GRID_SIZE = 20;

interface ServerPlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
}

interface WorldProps {
  worldObjects: WorldObjectState[];
  otherPlayers?: ServerPlayer[];
  onMove: (x: number, y: number) => void;
  onHarvest: (x: number, y: number, objectId: string) => void;
}

function Tile({ x, y, isWalkable, onClick, children }: { 
  x: number; 
  y: number; 
  isWalkable: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  return (
    <mesh
      ref={meshRef}
      position={[x, 0, y]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <boxGeometry args={[0.95, 0.2, 0.95]} />
      <meshStandardMaterial 
        color={isWalkable ? '#4a5568' : '#2d3748'} 
      />
      {children}
    </mesh>
  );
}

function Player() {
  const { position, facing, currentAction } = useGameStore();
  
  const rotation = {
    north: Math.PI,
    south: 0,
    east: -Math.PI / 2,
    west: Math.PI / 2,
  }[facing];
  
  return (
    <group position={[position.x, 0.5, position.y]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
        <meshStandardMaterial color="#d69e2e" />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#f6e05e" />
      </mesh>
      <mesh 
        position={[0, 0.7, 0]} 
        rotation={[0, rotation, 0]}
      >
        <boxGeometry args={[0.15, 0.08, 0.3]} />
        <meshStandardMaterial color="#744210" />
      </mesh>
      {currentAction && currentAction.type === 'harvest' && (
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.1]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
}

function OtherPlayer({ player }: { player: ServerPlayer }) {
  const rotation = {
    north: Math.PI,
    south: 0,
    east: -Math.PI / 2,
    west: Math.PI / 2,
  }[player.facing] || 0;
  
  return (
    <group position={[player.x, 0.5, player.y]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <mesh 
        position={[0, 0.7, 0]} 
        rotation={[0, rotation, 0]}
      >
        <boxGeometry args={[0.15, 0.08, 0.3]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  );
}

function MiningRock({ x, y, isDepleted, onClick }: { x: number; y: number; isDepleted: boolean; onClick?: (e: any) => void }) {
  const colors: Record<string, string> = {
    copper_rock: '#b7791f',
    tin_rock: '#a0aec0',
    iron_rock: '#718096',
    coal_rock: '#1a202c',
    gold_rock: '#ecc94b',
  };
  
  return (
    <group position={[x, 0.3, y]} onClick={onClick}>
      <mesh castShadow>
        <boxGeometry args={[0.6, isDepleted ? 0.3 : 0.8, 0.5]} />
        <meshStandardMaterial color={isDepleted ? '#4a5568' : '#b7791f'} />
      </mesh>
      {!isDepleted && (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#b7791f" />
        </mesh>
      )}
    </group>
  );
}

function Tree({ x, y, isDepleted, treeType, onClick }: { x: number; y: number; isDepleted: boolean; treeType: string; onClick?: (e: any) => void }) {
  const trunkColor = treeType === 'oak_tree' ? '#744210' : '#5a4a3a';
  const leavesColor = treeType === 'oak_tree' ? '#276749' : '#2f855a';
  
  return (
    <group position={[x, 0, y]} onClick={onClick}>
      <mesh position={[0, isDepleted ? 0.2 : 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, isDepleted ? 0.4 : 1.2, 6]} />
        <meshStandardMaterial color={isDepleted ? '#5a4a3a' : trunkColor} />
      </mesh>
      {!isDepleted && (
        <>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.8, 1.5, 6]} />
            <meshStandardMaterial color={leavesColor} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[0.5, 1, 6]} />
            <meshStandardMaterial color={leavesColor} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function World({ worldObjects, otherPlayers, onMove, onHarvest }: WorldProps) {
  const { position } = useGameStore();
  
  const objectMap = new Map<string, WorldObjectState>();
  worldObjects.forEach(obj => objectMap.set(`${obj.position.x},${obj.position.y}`, obj));

  const handleTileClick = useCallback((x: number, y: number) => {
    const dist = Math.abs(position.x - x) + Math.abs(position.y - y);
    if (dist > 0) {
      onMove(x, y);
    }
  }, [position, onMove]);

  const handleResourceClick = useCallback((x: number, y: number, e: any) => {
    e.stopPropagation();
    const worldObj = objectMap.get(`${x},${y}`);
    const dist = Math.abs(position.x - x) + Math.abs(position.y - y);
    
    if (worldObj && worldObj.status === 'active' && dist <= 1) {
      onHarvest(x, y, worldObj.definitionId);
    }
  }, [position, objectMap, onHarvest]);

  const tiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const worldObj = objectMap.get(`${x},${y}`);
      const isActive = worldObj?.status === 'active';
      
      const getObjectVisual = () => {
        if (!worldObj || !OBJECTS[worldObj.definitionId]) return null;
        
        const isDepleted = worldObj.status === 'depleted';
        
        if (OBJECTS[worldObj.definitionId].toolRequired === 'pickaxe') {
          return <MiningRock x={x} y={y} isDepleted={isDepleted} onClick={(e) => handleResourceClick(x, y, e)} />;
        } else if (OBJECTS[worldObj.definitionId].toolRequired === 'axe') {
          return <Tree x={x} y={y} isDepleted={isDepleted} treeType={worldObj.definitionId} onClick={(e) => handleResourceClick(x, y, e)} />;
        }
        return null;
      };
      
      tiles.push(
        <Tile
          key={`${x},${y}`}
          x={x}
          y={y}
          isWalkable={!worldObj || !isActive}
          onClick={() => handleTileClick(x, y)}
        >
          {worldObj && getObjectVisual()}
        </Tile>
      );
    }
  }

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GRID_SIZE / 2 - 0.5, -0.1, GRID_SIZE / 2 - 0.5]} receiveShadow>
        <planeGeometry args={[GRID_SIZE + 5, GRID_SIZE + 5]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      {tiles}
      <Player />
      {(otherPlayers || []).map(player => (
        <OtherPlayer key={player.id} player={player} />
      ))}
    </group>
  );
}
