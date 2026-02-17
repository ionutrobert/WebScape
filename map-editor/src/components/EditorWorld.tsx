'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/stores/editorStore';
import { TILE_COLORS, TileType } from '@/types/editor';

function getTileColor(tileType: TileType): THREE.Color {
  return new THREE.Color(TILE_COLORS[tileType] || TILE_COLORS.grass);
}

export function EditorWorld() {
  const { tiles, worldWidth, worldHeight } = useEditorStore();
  
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(worldWidth, worldHeight, worldWidth, worldHeight);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor(positions[i] + worldWidth / 2);
      const y = Math.floor(positions[i + 1] + worldHeight / 2);
      
      const key = `${x},${y}`;
      const tile = tiles.get(key);
      
      if (tile) {
        positions[i + 2] = tile.height;
        const color = getTileColor(tile.tileType);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      } else {
        positions[i + 2] = 0;
        const color = getTileColor('grass');
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    
    return geo;
  }, [tiles, worldWidth, worldHeight]);
  
  const waterGeometry = useMemo(() => {
    const waterTiles: { x: number; y: number; height: number }[] = [];
    tiles.forEach((tile, key) => {
      if (tile.tileType === 'water') {
        const [x, y] = key.split(',').map(Number);
        waterTiles.push({ x, y, height: tile.height });
      }
    });
    
    if (waterTiles.length === 0) return null;
    
    const geo = new THREE.PlaneGeometry(worldWidth, worldHeight, worldWidth, worldHeight);
    const positions = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor(positions[i] + worldWidth / 2);
      const y = Math.floor(positions[i + 1] + worldHeight / 2);
      
      const waterTile = waterTiles.find(w => w.x === x && w.y === y);
      if (waterTile) {
        positions[i + 2] = waterTile.height + 0.1;
      } else {
        positions[i + 2] = -1000;
      }
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [tiles, worldWidth, worldHeight]);
  
  return (
    <group>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial vertexColors flatShading={false} roughness={0.8} metalness={0.1} />
      </mesh>
      
      {waterGeometry && (
        <mesh geometry={waterGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <meshStandardMaterial 
            color="#2d5aa0" 
            transparent 
            opacity={0.7} 
            roughness={0.1} 
            metalness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}
