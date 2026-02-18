"use client";

import { useGameStore } from "@/client/stores/gameStore";
import { useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { WorldObjectState, TILE_COLORS, TileType } from "@/shared/types";
import { OBJECTS } from "@/data/objects";
import { LocalPlayer, RemotePlayer } from "./players";

const CHUNK_SIZE = 16;
const FOG_START = 10;
const FOG_END = 14;

const TILE_COLORS_MAP: Record<string, number> = {
  grass: 0x4a7c23,
  sand: 0xd4b896,
  stone: 0x6b6b6b,
  water: 0x2d5aa0,
  snow: 0xe8e8e8,
};

interface ServerPlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  isRunning?: boolean;
  isHarvesting?: boolean;
}

interface WorldProps {
  worldObjects: WorldObjectState[];
  worldTiles: { x: number; y: number; tileType: string; height: number }[];
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

function getTileChunk(
  x: number,
  y: number,
): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE),
  };
}

function getDistanceToChunk(
  playerX: number,
  playerY: number,
  chunkX: number,
  chunkY: number,
): number {
  const chunkCenterX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const chunkCenterY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
  return Math.sqrt(
    Math.pow(playerX - chunkCenterX, 2) + Math.pow(playerY - chunkCenterY, 2),
  );
}

function Tile({
  x,
  y,
  tileType,
  isWalkable,
  opacity,
  onClick,
  children,
}: {
  x: number;
  y: number;
  tileType?: string;
  isWalkable: boolean;
  opacity: number;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const color = tileType ? TILE_COLORS_MAP[tileType] || 0x4a5568 : 0x4a5568;

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
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <boxGeometry args={[0.95, 0.2, 0.95]} />
      <meshStandardMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
      />
      {children}
    </mesh>
  );
}

function MiningRock({
  x,
  y,
  isDepleted,
  opacity,
  onClick,
}: {
  x: number;
  y: number;
  isDepleted: boolean;
  opacity: number;
  onClick?: (e: any) => void;
}) {
  return (
    <group position={[0, 0.3, 0]} onClick={onClick}>
      <mesh castShadow>
        <boxGeometry args={[0.6, isDepleted ? 0.3 : 0.8, 0.5]} />
        <meshStandardMaterial
          color={isDepleted ? "#4a5568" : "#b7791f"}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {!isDepleted && (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 0.3, 0.3]} />
          <meshStandardMaterial
            color="#b7791f"
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}
    </group>
  );
}

function Tree({
  x,
  y,
  isDepleted,
  treeType,
  opacity,
  onClick,
}: {
  x: number;
  y: number;
  isDepleted: boolean;
  treeType: string;
  opacity: number;
  onClick?: (e: any) => void;
}) {
  const trunkColor = treeType === "oak_tree" ? "#744210" : "#5a4a3a";
  const leavesColor = treeType === "oak_tree" ? "#276749" : "#2f855a";

  return (
    <group position={[0, 0, 0]} onClick={onClick}>
      <mesh position={[0, isDepleted ? 0.2 : 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, isDepleted ? 0.4 : 1.2, 6]} />
        <meshStandardMaterial
          color={isDepleted ? "#5a4a3a" : trunkColor}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      {!isDepleted && (
        <>
          <mesh position={[0, 1.5, 0]} castShadow>
            <coneGeometry args={[0.8, 1.5, 6]} />
            <meshStandardMaterial
              color={leavesColor}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <coneGeometry args={[0.5, 1, 6]} />
            <meshStandardMaterial
              color={leavesColor}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

export function World({
  worldObjects,
  worldTiles,
  otherPlayers,
  worldWidth,
  worldHeight,
  onMove,
  onHarvest,
}: WorldProps) {
  const { position, performanceSettings, debugSettings, collisionMap } =
    useGameStore();
  const viewDistance = performanceSettings.viewDistance;

  const objectMap = useMemo(() => {
    const map = new Map<string, WorldObjectState>();
    worldObjects.forEach((obj) =>
      map.set(`${obj.position.x},${obj.position.y}`, obj),
    );
    return map;
  }, [worldObjects]);

  const tileMap = useMemo(() => {
    const map = new Map<string, string>();
    worldTiles.forEach((tile) => map.set(`${tile.x},${tile.y}`, tile.tileType));
    return map;
  }, [worldTiles]);

  const tilesToRender = useMemo(() => {
    const result: {
      x: number;
      y: number;
      tileType: string;
      opacity: number;
    }[] = [];

    const minX = Math.max(0, Math.floor(position.x - viewDistance));
    const maxX = Math.min(worldWidth - 1, Math.ceil(position.x + viewDistance));
    const minY = Math.max(0, Math.floor(position.y - viewDistance));
    const maxY = Math.min(
      worldHeight - 1,
      Math.ceil(position.y + viewDistance),
    );

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt(
          Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2),
        );

        let opacity = 1;
        if (dist > FOG_END) {
          opacity = 0;
        } else if (dist > FOG_START) {
          opacity = 1 - (dist - FOG_START) / (FOG_END - FOG_START);
        }

        if (opacity > 0) {
          const tileType = tileMap.get(`${x},${y}`) || "grass";
          result.push({ x, y, tileType, opacity });
        }
      }
    }

    return result;
  }, [position.x, position.y, worldWidth, worldHeight, tileMap, viewDistance]);

  const objectsToRender = useMemo(() => {
    const result: {
      x: number;
      y: number;
      obj: WorldObjectState;
      opacity: number;
    }[] = [];
    const viewDist = viewDistance;

    for (const obj of worldObjects) {
      const dx = position.x - obj.position.x;
      const dy = position.y - obj.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= viewDist) {
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
    }

    return result;
  }, [worldObjects, position.x, position.y, viewDistance]);

  const collisionTilesToRender = useMemo(() => {
    if (!debugSettings.showCollisionMap || collisionMap.length === 0) return [];

    const result: { x: number; y: number; isBlocked: boolean }[] = [];

    const minX = Math.max(0, Math.floor(position.x - viewDistance));
    const maxX = Math.min(worldWidth - 1, Math.ceil(position.x + viewDistance));
    const minY = Math.max(0, Math.floor(position.y - viewDistance));
    const maxY = Math.min(
      worldHeight - 1,
      Math.ceil(position.y + viewDistance),
    );

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dist = Math.sqrt(
          Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2),
        );
        if (dist <= viewDistance) {
          const isBlocked = collisionMap[y]?.[x] ?? false;
          result.push({ x, y, isBlocked });
        }
      }
    }

    return result;
  }, [
    debugSettings.showCollisionMap,
    collisionMap,
    position.x,
    position.y,
    worldWidth,
    worldHeight,
    viewDistance,
  ]);

  const handleTileClick = useCallback(
    (x: number, y: number) => {
      const dist = Math.abs(position.x - x) + Math.abs(position.y - y);
      if (dist > 0) {
        onMove(x, y);
      }
    },
    [position, onMove],
  );

  const handleResourceClick = useCallback(
    (x: number, y: number, e: any) => {
      e.stopPropagation();
      const worldObj = objectMap.get(`${x},${y}`);
      const dist = Math.abs(position.x - x) + Math.abs(position.y - y);

      if (worldObj && worldObj.status === "active" && dist <= 1) {
        onHarvest(x, y, worldObj.definitionId);
      }
    },
    [position, objectMap, onHarvest],
  );

  const renderObject = (
    x: number,
    y: number,
    worldObj: WorldObjectState,
    opacity: number,
  ) => {
    if (!OBJECTS[worldObj.definitionId]) return null;

    const isDepleted = worldObj.status === "depleted";
    const def = OBJECTS[worldObj.definitionId];

    if (def.toolRequired === "pickaxe") {
      return (
        <MiningRock
          key={`${x},${y}`}
          x={x}
          y={y}
          isDepleted={isDepleted}
          opacity={opacity}
          onClick={(e) => handleResourceClick(x, y, e)}
        />
      );
    } else if (def.toolRequired === "axe") {
      return (
        <Tree
          key={`${x},${y}`}
          x={x}
          y={y}
          isDepleted={isDepleted}
          treeType={worldObj.definitionId}
          opacity={opacity}
          onClick={(e) => handleResourceClick(x, y, e)}
        />
      );
    }
    return null;
  };

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[worldWidth / 2 - 0.5, -0.1, worldHeight / 2 - 0.5]}
        receiveShadow
      >
        <planeGeometry args={[worldWidth + 5, worldHeight + 5]} />
        <meshStandardMaterial color="#1a202c" />
      </mesh>

      {tilesToRender.map(({ x, y, tileType, opacity }) => {
        const worldObj = objectMap.get(`${x},${y}`);
        const isActive = worldObj?.status === "active";

        return (
          <Tile
            key={`${x},${y}`}
            x={x}
            y={y}
            tileType={tileType}
            isWalkable={!worldObj || !isActive}
            opacity={opacity}
            onClick={() => handleTileClick(x, y)}
          >
            {worldObj && renderObject(x, y, worldObj, opacity)}
          </Tile>
        );
      })}

      {collisionTilesToRender.map(({ x, y, isBlocked }) => (
        <mesh
          key={`collision-${x}-${y}`}
          position={[x, 0.11, y]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.95, 0.95]} />
          <meshBasicMaterial
            color={isBlocked ? 0xff0000 : 0x00ff00}
            transparent
            opacity={0.3}
            depthWrite={false}
          />
        </mesh>
      ))}

      <LocalPlayer />
      {(otherPlayers || []).map((player) => (
        <RemotePlayer key={player.id} player={player} />
      ))}
    </group>
  );
}
