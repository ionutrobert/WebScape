'use client';

import { create } from 'zustand';

interface VisualPositionRef {
  x: number;
  y: number;
}

export const visualPositionRef: VisualPositionRef = { x: 10, y: 10 };

export const useVisualPositionRef = () => visualPositionRef;
