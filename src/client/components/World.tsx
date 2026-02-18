'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { WorldObjectState } from '@/shared/types';
import { OBJECTS } from '@/data/objects';
import { LocalPlayer, RemotePlayer } from './players';

const CHUNK_SIZE = 32;
const VIEW_DISTANCE = 14;
const FOG_START = 10;
const FOG_END = 14;

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
  worldWidth: number;
  worldHeight: number;
  onMove: (x: number, y: number) => void;
  onHarvest: (x: number, y: number, objectId: string) => void;
}

interface ChunkData {
  chunkX: number;
  chunkY: number;
  tiles: { x: number; y: number }[];
}

function getChunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

function getTileChunk(x: number, y: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE),
  };
}

function getDistanceToChunk(
  playerX: number,
  playerY: number,
  chunkX: number,
  chunkY: number
): number {
  const chunkCenterX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const chunkCenterY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
  return Math.sqrt(
    Math.pow(playerX - chunkCenterX, 2) + Math.pow(playerY - chunkCenterY, 2)
  );
}

function Tile({ x, y, isWalkable, opacity, onClick, children }: { 
  x: number; 
  y: number; 
  isWalkable: boolean;
  opacity: number;
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
        transparent={opacity < 1}
        opacity={opacity}
      />
      {children}
    </mesh>
  );
}

function MiningRock({ x, y, isDepleted, opacity, onClick }: { x: number; y: number; isDepleted: boolean; opacity: number; onClick?: (e: any) => void }) {
  return (
    <group position={[x, 0.3, y]} onClick={onClick}>
      <mesh castShadow>
        <boxGeometry args={[0.6, isDepleted ? 0.3 : 0.8, 0.5]} />
        <meshStandardMaterial color={isDepleted ? '#4a5568' : '#b7791f'} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {!isDepleted && (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial color="#b7791f" transparent={opacity < 1} opacity={opacity} />
        </mesh>
      )}
    </group>
  );
}

function Tree({ x, y, isDepleted, treeType, opacity, onClick }: { x: number; y: number; isDepleted: boolean; treeType: string; opacity: number; onClick?: (e: any) => void }) {
  const trunkColor = treeType === 'oak_tree' ? '#744210' : '#5a4a3a';
  const leavesColor = treeType === 'oak_tree' ? '#276749' : '#2f855a';
  
  return (
    <group position={[x, 0, y]} onClick={onClick}>
      <mesh position={[0, isDepleted ? 0.2 : 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, isDepleted ? 0.4 : 1.2, 6]} />
        <meshStandardMaterial color={isDepleted ? '#5a4a3a' : trunkColor} transparent={opacity < 1} opacity={opacity} />
      </mesh>
      {!isDepleted && (
        <>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.8, 1.5, 6]} />
            <meshStandardMaterial color={leavesColor} transparent={opacity < 1} opacity={opacity} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[0.5, 1, 6]} />
            <meshStandardMaterial color={leavesColor} transparent={opacity < 1} opacity={opacity} />
          </mesh>
        </>
      )}
    </group>
  );
}

export function World({ worldObjects, otherPlayers, worldWidth, worldHeight, onMove, onHarvest }: WorldProps) {
  const { position } = useGameStore();
  
  const objectMap = useMemo(() => {
    const map = new Map<string, WorldObjectState>();
    worldObjects.forEach(obj => map.set(`${obj.position.x},${obj.position.y}`, obj));
    return map;
  }, [worldObjects]);

  const visibleChunks = useMemo(() => {
    const chunks = new Set<string>();
    const playerChunkX = Math.floor(position.x / CHUNK_SIZE);
    const playerChunkY = Math.floor(position.y / CHUNK_SIZE);
    
    const viewChunks = Math.ceil(VIEW_DISTANCE / CHUNK_SIZE) + 1;
    
    for (let dy = -viewChunks; dy <= viewChunks; dy++) {
      for (let dx = -viewChunks; dx <= viewChunks; dx++) {
        const chunkX = playerChunkX + dx;
        const chunkY = playerChunkY + dy;
        
        const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
        const centerY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
        const dist = Math.sqrt(Math.pow(position.x - centerX, 2) + Math.pow(position.y - centerY, 2));
        
        if (dist <= VIEW_DISTANCE * 1.5) {
          chunks.add(getChunkKey(chunkX, chunkY));
        }
      }
    }
    
    return chunks;
  }, [position.x, position.y]);

  const tilesToRender = useMemo(() => {
    const result: { x: number; y: number; opacity: number }[] = [];
    
    for (const chunkKey of visibleChunks) {
      const [chunkXStr, chunkYStr] = chunkKey.split(',');
      const chunkX = parseInt(chunkXStr);
      const chunkY = parseInt(chunkYStr);
      
      const startX = chunkX * CHUNK_SIZE;
      const startY = chunkY * CHUNK_SIZE;
      
      for (let y = startY; y < startY + CHUNK_SIZE && y < worldHeight; y++) {
        for (let x = startX; x < startX + CHUNK_SIZE && x < worldWidth; x++) {
          const dist = Math.sqrt(Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2));
          
          let opacity = 1;
          if (dist > FOG_END) {
            opacity = 0;
          } else if (dist > FOG_START) {
            opacity = 1 - (dist - FOG_START) / (FOG_END - FOG_START);
          }
          
          if (opacity > 0) {
            result.push({ x, y, opacity });
          }
        }
      }
    }
    
    return result;
  }, [visibleChunks, worldWidth, worldHeight, position.x, position.y]);

  const objectsToRender = useMemo(() => {
    const result: { x: number; y: number; obj: WorldObjectState; opacity: number }[] = [];
    
    for (const obj of worldObjects) {
      const dist = Math.sqrt(
        Math.pow(position.x - obj.position.x, 2) + 
        Math.pow(position.y - obj.position.y, 2)
      );
      
      let opacity = 1;
      if (dist > FOG_END) {
        opacity = 0;
      } else if (dist > FOG_START) {
        opacity = 1 - (dist - FOG_START) / (FOG_END - FOG_START);
      }
      
      if (opacity > 0) {
        result.push({ x: obj.position.x, y: obj.position.y, obj, opacity });
      }
    }
    
    return result;
  }, [worldObjects, position.x, position.y]);

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

  const renderObject = (x: number, y: number, worldObj: WorldObjectState, opacity: number) => {
    if (!OBJECTS[worldObj.definitionId]) return null;
    
    const isDepleted = worldObj.status === 'depleted';
    const def = OBJECTS[worldObj.definitionId];
    
    if (def.toolRequired === 'pickaxe') {
      return <MiningRock key={`${x},${y}`} x={x} y={y} isDepleted={isDepleted} opacity={opacity} onClick={(e) => handleResourceClick(x, y, e)} />;
    } else if (def.toolRequired === 'axe') {
      return <Tree key={`${x},${y}`} x={x} y={y} isDepleted={isDepleted} treeType={worldObj.definitionId} opacity={opacity} onClick={(e) => handleResourceClick(x, y, e)} />;
    }
    return null;
  };

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[worldWidth / 2 - 0.5, -0.1, worldHeight / 2 - 0.5]} receiveShadow>
        <planeGeometry args={[worldWidth + 5, worldHeight + 5]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>
      
      {tilesToRender.map(({ x, y, opacity }) => {
        const worldObj = objectMap.get(`${x},${y}`);
        const isActive = worldObj?.status === 'active';
        
        return (
          <Tile
            key={`${x},${y}`}
            x={x}
            y={y}
            isWalkable={!worldObj || !isActive}
            opacity={opacity}
            onClick={() => handleTileClick(x, y)}
          >
            {worldObj && renderObject(x, y, worldObj, opacity)}
          </Tile>
        );
      })}
      
      <LocalPlayer />
      {(otherPlayers || []).map(player => (
        <RemotePlayer key={player.id} player={player} />
      ))}
    </group>
  );
}
