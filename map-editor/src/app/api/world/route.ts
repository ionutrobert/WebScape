import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), '../prisma/server.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapter as any });

export async function GET() {
  try {
    const config = await prisma.worldConfig.findFirst({
      where: { id: 'default' }
    });
    
    if (!config) {
      return NextResponse.json({ width: 32, height: 32, tiles: [], objects: [] });
    }
    
    const tiles = await prisma.worldTile.findMany();
    const objects = await prisma.worldObject.findMany();
    
    return NextResponse.json({
      width: config.width,
      height: config.height,
      tiles: tiles.map(t => ({ x: t.x, y: t.y, tileType: t.tileType, height: t.height })),
      objects: objects.map(o => ({
        position: { x: o.x, y: o.y },
        definitionId: o.definitionId,
        status: o.status,
        ticksUntilRespawn: 0,
        harvestProgress: 0
      }))
    });
  } catch (err) {
    console.error('Error loading world:', err);
    return NextResponse.json({ error: 'Failed to load world' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { width, height, tiles, objects } = body;
    
    await prisma.worldConfig.upsert({
      where: { id: 'default' },
      update: { width, height },
      create: { id: 'default', width, height }
    });
    
    await prisma.$transaction([
      prisma.worldTile.deleteMany({}),
      prisma.worldObject.deleteMany({})
    ]);
    
    if (tiles && tiles.length > 0) {
      await prisma.worldTile.createMany({
        data: tiles.map((t: any) => ({
          x: t.x,
          y: t.y,
          tileType: t.tileType,
          height: t.height
        }))
      });
    }
    
    if (objects && objects.length > 0) {
      await prisma.worldObject.createMany({
        data: objects.map((o: any) => ({
          x: o.position.x,
          y: o.position.y,
          definitionId: o.definitionId,
          heightOffset: 0,
          status: o.status
        }))
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error saving world:', err);
    return NextResponse.json({ error: 'Failed to save world' }, { status: 500 });
  }
}
