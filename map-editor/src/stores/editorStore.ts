import { create } from 'zustand';
import { TileData, TileType, WorldObjectState } from '@/types/editor';

export type EditorTool = 
  | 'select' 
  | 'paint' 
  | 'place' 
  | 'delete'
  | 'raise' 
  | 'lower' 
  | 'smooth' 
  | 'flatten'
  | 'noise';

interface EditorState {
  isLoading: boolean;
  worldWidth: number;
  worldHeight: number;
  tiles: Map<string, TileData>;
  objects: WorldObjectState[];
  
  tool: EditorTool;
  selectedTileType: TileType;
  selectedObjectId: string;
  
  brushSize: number;
  brushStrength: number;
  flattenHeight: number;
  noiseRange: number;
  
  cursorTile: { x: number; y: number } | null;
  isDragging: boolean;
  showGrid: boolean;
  
  history: Array<{ tiles: Map<string, TileData>; objects: WorldObjectState[] }>;
  historyIndex: number;
  
  setLoading: (loading: boolean) => void;
  setWorldSize: (width: number, height: number) => void;
  setTiles: (tiles: Map<string, TileData>) => void;
  setObjects: (objects: WorldObjectState[]) => void;
  
  setTool: (tool: EditorTool) => void;
  setSelectedTileType: (type: TileType) => void;
  setSelectedObjectId: (id: string) => void;
  
  setBrushSize: (size: number) => void;
  setBrushStrength: (strength: number) => void;
  setFlattenHeight: (height: number) => void;
  setNoiseRange: (range: number) => void;
  
  setCursorTile: (tile: { x: number; y: number } | null) => void;
  setIsDragging: (dragging: boolean) => void;
  toggleGrid: () => void;
  
  updateTile: (x: number, y: number, updates: Partial<TileData>) => void;
  placeObject: (x: number, y: number, definitionId: string) => void;
  removeObject: (x: number, y: number) => void;
  
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const getTileKey = (x: number, y: number) => `${x},${y}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  isLoading: true,
  worldWidth: 20,
  worldHeight: 20,
  tiles: new Map(),
  objects: [],
  
  tool: 'paint',
  selectedTileType: 'grass',
  selectedObjectId: 'copper_rock',
  
  brushSize: 1,
  brushStrength: 0.5,
  flattenHeight: 0,
  noiseRange: 2,
  
  cursorTile: null,
  isDragging: false,
  showGrid: true,
  
  history: [],
  historyIndex: -1,
  
  setLoading: (loading) => set({ isLoading: loading }),
  setWorldSize: (width, height) => set({ worldWidth: width, worldHeight: height }),
  setTiles: (tiles) => set({ tiles }),
  setObjects: (objects) => set({ objects }),
  
  setTool: (tool) => set({ tool }),
  setSelectedTileType: (type) => set({ selectedTileType: type }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushStrength: (strength) => set({ brushStrength: strength }),
  setFlattenHeight: (height) => set({ flattenHeight: height }),
  setNoiseRange: (range) => set({ noiseRange: range }),
  
  setCursorTile: (tile) => set({ cursorTile: tile }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  
  updateTile: (x, y, updates) => {
    const { tiles } = get();
    const newTiles = new Map(tiles);
    const key = getTileKey(x, y);
    const existing = newTiles.get(key) || { x, y, tileType: 'grass' as TileType, height: 0 };
    newTiles.set(key, { ...existing, ...updates });
    set({ tiles: newTiles });
  },
  
  placeObject: (x, y, definitionId) => {
    const { objects } = get();
    const existingIndex = objects.findIndex(o => o.position.x === x && o.position.y === y);
    let newObjects: WorldObjectState[];
    
    if (existingIndex >= 0) {
      newObjects = [...objects];
      newObjects[existingIndex] = { ...newObjects[existingIndex], definitionId };
    } else {
      newObjects = [...objects, {
        position: { x, y },
        definitionId,
        status: 'active',
        ticksUntilRespawn: 0,
        harvestProgress: 0
      }];
    }
    set({ objects: newObjects });
  },
  
  removeObject: (x, y) => {
    const { objects } = get();
    set({ objects: objects.filter(o => o.position.x !== x || o.position.y !== y) });
  },
  
  saveToHistory: () => {
    const { tiles, objects, history, historyIndex } = get();
    const snapshot = {
      tiles: new Map(tiles),
      objects: [...objects]
    };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snapshot);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({ 
        tiles: new Map(prev.tiles), 
        objects: [...prev.objects],
        historyIndex: historyIndex - 1 
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({ 
        tiles: new Map(next.tiles), 
        objects: [...next.objects],
        historyIndex: historyIndex + 1 
      });
    }
  },
}));
