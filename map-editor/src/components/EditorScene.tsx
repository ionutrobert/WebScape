'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { EditorWorld } from './EditorWorld';
import { EditorCursor } from './EditorCursor';
import { useEditorStore } from '@/stores/editorStore';
import { Suspense } from 'react';

export function EditorScene() {
  const { worldWidth, worldHeight, showGrid } = useEditorStore();
  
  const centerX = worldWidth / 2;
  const centerZ = worldHeight / 2;
  
  return (
    <Canvas
      camera={{ position: [centerX, 30, centerZ + 20], fov: 50 }}
      style={{ background: '#1a1a2e' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[20, 30, 10]} intensity={1} castShadow />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} />
      
      <Suspense fallback={null}>
        <EditorWorld />
        <EditorCursor />
      </Suspense>
      
      {showGrid && (
        <Grid
          position={[centerX - 0.5, 0.01, centerZ - 0.5]}
          args={[worldWidth, worldHeight]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={100}
          infiniteGrid
        />
      )}
      
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={100}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      <fog attach="fog" args={['#1a1a2e', 40, 100]} />
    </Canvas>
  );
}
