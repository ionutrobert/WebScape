import { TileData, TileType, WorldObjectState } from '@/types/editor';

export interface WorldData {
  width: number;
  height: number;
  tiles: TileData[];
  objects: WorldObjectState[];
}

export async function loadWorldFromDb(): Promise<WorldData | null> {
  try {
    const response = await fetch('/api/world', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Failed to load world');
    }
    return response.json();
  } catch (err) {
    console.error('Error loading world:', err);
    return null;
  }
}

export async function initializeWorld(width: number, height: number): Promise<void> {
  const tiles: TileData[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      tiles.push({ x, y, tileType: 'grass', height: 0 });
    }
  }
  
  try {
    const response = await fetch('/api/world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, height, tiles, objects: [] })
    });
    
    if (!response.ok) {
      throw new Error('Failed to initialize world');
    }
    
    console.log(`Initialized world: ${width}x${height}`);
  } catch (err) {
    console.error('Error initializing world:', err);
    throw err;
  }
}

export async function saveWorldToDb(
  tiles: Map<string, TileData>,
  objects: WorldObjectState[],
  worldWidth: number,
  worldHeight: number
): Promise<void> {
  try {
    const tilesArray = Array.from(tiles.values());
    
    const response = await fetch('/api/world', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        width: worldWidth,
        height: worldHeight,
        tiles: tilesArray,
        objects
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save world');
    }
    
    console.log(`Saved world: ${tilesArray.length} tiles, ${objects.length} objects`);
  } catch (err) {
    console.error('Error saving world:', err);
    throw err;
  }
}

export async function resizeWorld(newWidth: number, newHeight: number): Promise<void> {
  const data = await loadWorldFromDb();
  
  const tiles: TileData[] = [];
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const existing = data?.tiles.find(t => t.x === x && t.y === y);
      tiles.push(existing || { x, y, tileType: 'grass', height: 0 });
    }
  }
  
  const objects = data?.objects.filter(
    o => o.position.x < newWidth && o.position.y < newHeight
  ) || [];
  
  const response = await fetch('/api/world', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ width: newWidth, height: newHeight, tiles, objects })
  });
  
  if (!response.ok) {
    throw new Error('Failed to resize world');
  }
}
