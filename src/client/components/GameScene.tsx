'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import { World } from './World';
import { useGameStore } from '@/client/stores/gameStore';
import { Socket } from 'socket.io-client';
import * as THREE from 'three';
import { WorldObjectState } from '@/shared/types';

interface ServerPlayer {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
}

function CameraController() {
  const { position, camera: cameraState, setCamera } = useGameStore();
  const controlsRef = useRef<any>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const orbitSpeed = 0.03;
  const { camera } = useThree();
  
  const targetRef = useRef(new THREE.Vector3(10, 0, 10));
  const initialized = useRef(false);
  const prevCameraState = useRef(cameraState);

  useEffect(() => {
    if (initialized.current && 
        (prevCameraState.current.theta !== cameraState.theta || 
         prevCameraState.current.phi !== cameraState.phi ||
         prevCameraState.current.distance !== cameraState.distance)) {
      initialized.current = false;
    }
    prevCameraState.current = cameraState;
  }, [cameraState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!controlsRef.current) return;

    const playerPos = new THREE.Vector3(position.x, 0, position.y);
    
    if (!initialized.current) {
      targetRef.current.copy(playerPos);
      
      const spherical = new THREE.Spherical(cameraState.distance, cameraState.phi, cameraState.theta);
      const offset = new THREE.Vector3().setFromSpherical(spherical);
      camera.position.copy(playerPos).add(offset);
      camera.lookAt(playerPos);
      
      controlsRef.current.target.copy(playerPos);
      initialized.current = true;
    }

    const prevTarget = targetRef.current.clone();
    targetRef.current.copy(playerPos);
    controlsRef.current.target.copy(targetRef.current);

    const delta = playerPos.clone().sub(prevTarget);
    camera.position.add(delta);

    const keys = keysPressed.current;
    if (keys.size > 0) {
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position.clone().sub(targetRef.current));

      if (keys.has('ArrowUp')) spherical.phi = Math.max(0.1, spherical.phi - orbitSpeed);
      if (keys.has('ArrowDown')) spherical.phi = Math.min(Math.PI / 2 - 0.1, spherical.phi + orbitSpeed);
      if (keys.has('ArrowLeft')) spherical.theta += orbitSpeed;
      if (keys.has('ArrowRight')) spherical.theta -= orbitSpeed;

      const newPos = new THREE.Vector3().setFromSpherical(spherical).add(targetRef.current);
      camera.position.copy(newPos);
      camera.lookAt(targetRef.current);
      
      setCamera({ theta: spherical.theta, phi: spherical.phi, distance: spherical.radius });
    }
    
    const currentSpherical = new THREE.Spherical();
    currentSpherical.setFromVector3(camera.position.clone().sub(targetRef.current));
    if (Math.abs(currentSpherical.radius - cameraState.distance) > 0.1) {
      setCamera({ distance: currentSpherical.radius });
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enableRotate={true}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.1}
      zoomSpeed={1}
      minDistance={5}
      maxDistance={40}
      mouseButtons={{
        LEFT: undefined,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: undefined,
      }}
    />
  );
}

interface GameSceneProps {
  onMove: (x: number, y: number) => void;
  onHarvest: (x: number, y: number, objectId: string) => void;
  socket?: Socket | null;
  players: Record<string, { id: string; username: string; x: number; y: number; facing: string }>;
}

export function GameScene({ onMove, onHarvest, players }: GameSceneProps) {
  const { position, worldObjects } = useGameStore();

  return (
    <Canvas camera={{ position: [20, 18, 20], fov: 50 }} style={{ background: '#1a1a2e' }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      
      <Suspense fallback={null}>
        <World 
          worldObjects={worldObjects}
          otherPlayers={Object.values(players)}
          onMove={onMove}
          onHarvest={onHarvest}
        />
      </Suspense>
      
      <CameraController />
    </Canvas>
  );
}
