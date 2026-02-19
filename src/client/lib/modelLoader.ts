// 3D Model loader utility for WebScape
// Supports loading GLB/GLTF models from local assets or URLs

import { useGLTF, useAnimations } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface ModelAsset {
  url: string;
  name: string;
}

export interface AnimationClip {
  name: string;
  duration: number;
}

// Pre-configured character models
// These are placeholders - download actual models to add
export const CHARACTER_MODELS: Record<string, ModelAsset> = {
  default: {
    url: '/assets/models/character.glb',
    name: 'Default Character',
  },
  knight: {
    url: '/assets/models/knight.glb',
    name: 'Knight',
  },
  wizard: {
    url: '/assets/models/wizard.glb',
    name: 'Wizard',
  },
  archer: {
    url: '/assets/models/archer.glb',
    name: 'Archer',
  },
};

// Animation names that we expect from imported models
export const ANIMATION_NAMES = {
  IDLE: 'idle',
  WALK: 'walk',
  RUN: 'run',
  ATTACK: 'attack',
  HARVEST: 'harvest',
  DEATH: 'death',
} as const;

// Load a GLB model with animations
export function useModelLoader(url: string) {
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, scene);
  
  return {
    scene,
    animations,
    actions,
    animationNames: names,
    isLoaded: true,
  };
}

// Play a specific animation with optional fade time
export function playAnimation(
  actions: Record<string, THREE.AnimationAction>,
  animationName: string,
  fadeTime: number = 0.2
) {
  // First fade out all actions
  Object.values(actions).forEach(action => {
    if (action) {
      action.fadeOut(fadeTime);
    }
  });
  
  // Then play the target animation
  const targetAction = actions[animationName];
  if (targetAction) {
    targetAction.reset().fadeIn(fadeTime).play();
    return targetAction;
  }
  
  return null;
}

// Crossfade between two animations
export function crossfadeAnimation(
  actions: Record<string, THREE.AnimationAction>,
  fromName: string,
  toName: string,
  fadeTime: number = 0.3
) {
  const from = actions[fromName];
  const to = actions[toName];
  
  if (from && to) {
    from.crossFadeTo(to, fadeTime, true);
    to.reset().play();
    return true;
  }
  
  return false;
}

// Get animation duration by name
export function getAnimationDuration(
  animations: THREE.AnimationClip[],
  name: string
): number {
  const clip = animations.find(c => c.name === name);
  return clip?.duration ?? 0;
}

// Animation mixer hook for custom animation control
export function useAnimationMixer(
  animations: THREE.AnimationClip[],
  isMoving: boolean,
  isRunning: boolean = false
) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  
  useEffect(() => {
    if (!animations.length) return;
    
    // This would be connected to a parent AnimationMixer
    // Implementation depends on your specific setup
    
  }, [animations, isMoving, isRunning]);
  
  return {
    mixer: mixerRef.current,
    currentAction: currentActionRef.current,
  };
}

// Placeholder function to preload models
export function preloadModels(urls: string[]) {
  urls.forEach(url => {
    useGLTF.preload(url);
  });
}

// Model loading error boundary helper
export interface ModelLoadState {
  loading: boolean;
  error: Error | null;
  model: THREE.Object3D | null;
}

export function createModelLoadState(): ModelLoadState {
  return {
    loading: false,
    error: null,
    model: null,
  };
}
