import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'prisma/server.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const db = new PrismaClient({ adapter: adapter as any });

const WORLD_SIZE = 100;

const TILE_TYPES = ['grass', 'sand', 'stone', 'water', 'snow'];

const RESOURCES = [
  { id: 'copper_rock', weight: 30 },
  { id: 'tin_rock', weight: 25 },
  { id: 'iron_rock', weight: 20 },
  { id: 'coal_rock', weight: 15 },
  { id: 'gold_rock', weight: 10 },
];

const TREES = [
  { id: 'oak_tree', weight: 40 },
  { id: 'willow_tree', weight: 30 },
  { id: 'maple_tree', weight: 20 },
  { id: 'decorative_tree', weight: 10 },
];

const DECORATIONS = [
  'rock_small', 'rock_medium', 'rock_large',
  'bush', 'flower_red', 'flower_blue', 'grass_tuft',
];

function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function noise2D(x: number, y: number, scale: number, random: () => number): number {
  const nx = x / scale;
  const ny = y / scale;
  return (Math.sin(nx * 2.1 + ny * 1.3) + Math.cos(nx * 1.7 - ny * 2.9) + random() * 0.5) / 2.5;
}

function pickWeighted<T>(items: T[], weights: number[], random: () => number): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

async function generateWorld() {
  console.log('Generating random world...');
  
  const random = seededRandom(Date.now());
  
  console.log('Clearing existing world data...');
  await db.worldObject.deleteMany({});
  await db.worldTile.deleteMany({});
  await db.worldConfig.deleteMany({});
  
  console.log('Generating terrain tiles...');
  const tiles = [];
  for (let y = 0; y < WORLD_SIZE; y++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      const elevation = noise2D(x, y, 20, random);
      const moisture = noise2D(x, y, 15, random);
      
      let tileType: string;
      if (elevation < -0.2) {
        tileType = 'water';
      } else if (elevation < 0) {
        tileType = moisture > 0.3 ? 'grass' : 'sand';
      } else if (elevation < 0.3) {
        tileType = 'grass';
      } else if (elevation < 0.5) {
        tileType = 'stone';
      } else {
        tileType = 'snow';
      }
      
      const height = elevation < -0.2 ? -0.5 : elevation * 0.5;
      
      tiles.push({ x, y, tileType, height });
    }
  }
  
  console.log(`Inserting ${tiles.length} tiles...`);
  await db.worldTile.createMany({ data: tiles });
  
  console.log('Generating world objects...');
  const occupied = new Set<string>();
  const objects: { x: number; y: number; definitionId: string; status: string }[] = [];
  
  const resourceSpots: { x: number; y: number; type: 'rock' | 'tree' }[] = [];
  
  for (let i = 0; i < 300; i++) {
    const x = Math.floor(random() * WORLD_SIZE);
    const y = Math.floor(random() * WORLD_SIZE);
    
    const isRock = random() < 0.5;
    resourceSpots.push({ x, y, type: isRock ? 'rock' : 'tree' });
  }
  
  for (const spot of resourceSpots) {
    const key = `${spot.x},${spot.y}`;
    if (occupied.has(key)) continue;
    
    const tile = tiles.find(t => t.x === spot.x && t.y === spot.y);
    if (!tile || tile.tileType === 'water') continue;
    
    occupied.add(key);
    
    if (spot.type === 'rock') {
      const rocks = RESOURCES.map(r => r.id);
      const weights = RESOURCES.map(r => r.weight);
      objects.push({
        x: spot.x,
        y: spot.y,
        definitionId: pickWeighted(rocks, weights, random),
        status: 'active',
      });
    } else {
      const trees = TREES.map(t => t.id);
      const weights = TREES.map(t => t.weight);
      objects.push({
        x: spot.x,
        y: spot.y,
        definitionId: pickWeighted(trees, weights, random),
        status: 'active',
      });
    }
  }
  
  for (let i = 0; i < 500; i++) {
    const x = Math.floor(random() * WORLD_SIZE);
    const y = Math.floor(random() * WORLD_SIZE);
    
    const key = `${x},${y}`;
    if (occupied.has(key)) continue;
    
    const tile = tiles.find(t => t.x === x && t.y === y);
    if (!tile || tile.tileType === 'water') continue;
    
    occupied.add(key);
    
    objects.push({
      x,
      y,
      definitionId: pickWeighted(DECORATIONS, DECORATIONS.map(() => 1), random),
      status: 'active',
    });
  }
  
  console.log(`Inserting ${objects.length} objects...`);
  await db.worldObject.createMany({ data: objects });
  
  console.log('Setting world config...');
  await db.worldConfig.create({
    data: {
      id: 'default',
      width: WORLD_SIZE,
      height: WORLD_SIZE,
    },
  });
  
  const tileCount = await db.worldTile.count();
  const objectCount = await db.worldObject.count();
  
  console.log('\n✅ World generated successfully!');
  console.log(`   Tiles: ${tileCount} (${WORLD_SIZE}x${WORLD_SIZE})`);
  console.log(`   Objects: ${objectCount} resources + decorations`);
  
  const tileTypeCounts = await db.worldTile.groupBy({
    by: ['tileType'],
    _count: { tileType: true },
  });
  console.log('\nTerrain distribution:');
  for (const tc of tileTypeCounts) {
    console.log(`   ${tc.tileType}: ${tc._count.tileType}`);
  }
  
  const rockCounts = await db.worldObject.groupBy({
    by: ['definitionId'],
    _count: { definitionId: true },
    where: { definitionId: { in: RESOURCES.map(r => r.id) } },
  });
  console.log('\nResources:');
  for (const rc of rockCounts) {
    console.log(`   ${rc.definitionId}: ${rc._count.definitionId}`);
  }
}

generateWorld()
  .catch(console.error)
  .finally(() => db.$disconnect());
