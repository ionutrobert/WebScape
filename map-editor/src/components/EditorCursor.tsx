'use client';

import { useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore, EditorTool } from '@/stores/editorStore';
import { TILE_COLORS } from '@/types/editor';

export function EditorCursor() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const { camera, raycaster, pointer } = useThree();
  
  const {
    tiles,
    worldWidth,
    worldHeight,
    tool,
    selectedTileType,
    selectedObjectId,
    brushSize,
    brushStrength,
    flattenHeight,
    noiseRange,
    cursorTile,
    setCursorTile,
    isDragging,
    setIsDragging,
    updateTile,
    placeObject,
    removeObject,
    saveToHistory
  } = useEditorStore();
  
  const applyTool = useCallback((x: number, y: number) => {
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) return;
    
    const key = `${x},${y}`;
    const currentTile = tiles.get(key) || { x, y, tileType: 'grass' as const, height: 0 };
    
    switch (tool) {
      case 'paint': {
        updateTile(x, y, { tileType: selectedTileType });
        break;
      }
      case 'raise': {
        const newHeight = currentTile.height + brushStrength * 0.5;
        updateTile(x, y, { height: newHeight });
        break;
      }
      case 'lower': {
        const newHeight = currentTile.height - brushStrength * 0.5;
        updateTile(x, y, { height: newHeight });
        break;
      }
      case 'smooth': {
        let sum = 0;
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < worldWidth && ny >= 0 && ny < worldHeight) {
              const neighbor = tiles.get(`${nx},${ny}`) || { height: 0 };
              sum += neighbor.height;
              count++;
            }
          }
        }
        const avg = sum / count;
        const smoothed = currentTile.height + (avg - currentTile.height) * brushStrength;
        updateTile(x, y, { height: smoothed });
        break;
      }
      case 'flatten': {
        const diff = flattenHeight - currentTile.height;
        const newHeight = currentTile.height + diff * brushStrength;
        updateTile(x, y, { height: newHeight });
        break;
      }
      case 'noise': {
        const randomOffset = (Math.random() - 0.5) * brushStrength * noiseRange;
        const newHeight = currentTile.height + randomOffset;
        updateTile(x, y, { height: newHeight });
        break;
      }
      case 'place': {
        placeObject(x, y, selectedObjectId);
        break;
      }
      case 'delete': {
        removeObject(x, y);
        break;
      }
    }
  }, [tiles, worldWidth, worldHeight, tool, selectedTileType, selectedObjectId, brushSize, brushStrength, flattenHeight, noiseRange, updateTile, placeObject, removeObject]);
  
  const applyBrush = useCallback((centerX: number, centerY: number) => {
    const radius = brushSize;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          applyTool(centerX + dx, centerY + dy);
        }
      }
    }
  }, [brushSize, applyTool]);
  
  useFrame(() => {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersect = new THREE.Vector3();
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, intersect);
    
    if (intersect) {
      const x = Math.floor(intersect.x + worldWidth / 2);
      const y = Math.floor(intersect.z + worldHeight / 2);
      
      if (x >= 0 && x < worldWidth && y >= 0 && y < worldHeight) {
        setCursorTile({ x, y });
        
        if (isDragging && (tool === 'paint' || tool === 'raise' || tool === 'lower' || tool === 'smooth' || tool === 'flatten' || tool === 'noise')) {
          applyBrush(x, y);
        }
      } else {
        setCursorTile(null);
      }
    }
  });
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (cursorTile) {
      saveToHistory();
      setIsDragging(true);
      applyBrush(cursorTile.x, cursorTile.y);
    }
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
  };
  
  if (!cursorTile) return null;
  
  const worldX = cursorTile.x - worldWidth / 2 + 0.5;
  const worldZ = cursorTile.y - worldHeight / 2 + 0.5;
  const tile = tiles.get(`${cursorTile.x},${cursorTile.y}`);
  const worldY = (tile?.height || 0) + 0.05;
  
  const toolColor = 
    tool === 'paint' ? TILE_COLORS[selectedTileType] :
    tool === 'place' ? 0xffaa00 :
    tool === 'delete' ? 0xff4444 :
    tool === 'raise' || tool === 'lower' || tool === 'smooth' || tool === 'flatten' || tool === 'noise' ? 0x44aaff :
    0xffffff;
  
  return (
    <group>
      <mesh
        ref={meshRef}
        position={[worldX, worldY, worldZ]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <boxGeometry args={[brushSize * 2, 0.2, brushSize * 2]} />
        <meshStandardMaterial color={toolColor} transparent opacity={0.5} />
      </mesh>
      
      <mesh
        ref={ringRef}
        position={[worldX, worldY + 0.1, worldZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[brushSize - 0.1, brushSize, 32]} />
        <meshBasicMaterial color={toolColor} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
