import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'prisma/server.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
export const serverDb = new PrismaClient({ adapter: adapter as any });

export async function getWorldConfig(): Promise<{ width: number; height: number } | null> {
  const config = await serverDb.worldConfig.findFirst({ where: { id: 'default' } });
  return config ? { width: config.width, height: config.height } : null;
}

export async function getWorldObjects(): Promise<any[]> {
  const objects = await serverDb.worldObject.findMany();
  return objects.map(o => ({
    position: { x: o.x, y: o.y },
    definitionId: o.definitionId,
    status: o.status,
    ticksUntilRespawn: 0,
    harvestProgress: 0
  }));
}

export async function getTileHeight(x: number, y: number): Promise<number> {
  const tile = await serverDb.worldTile.findUnique({
    where: { x_y: { x, y } }
  });
  return tile?.height ?? 0;
}

export interface PlayerData {
  id: string;
  username: string;
  x: number;
  y: number;
  facing: string;
  skills: Record<string, number>;
  inventory: Record<string, number>;
}

export async function loadPlayer(username: string): Promise<PlayerData | null> {
  const player = await serverDb.player.findUnique({
    where: { username },
    include: {
      skills: true,
      inventory: true,
    },
  });

  if (!player) return null;

  return {
    id: player.id,
    username: player.username,
    x: player.x,
    y: player.y,
    facing: player.facing,
    skills: player.skills.reduce((acc, s) => ({ ...acc, [s.skill]: s.xp }), {}),
    inventory: player.inventory.reduce((acc, s) => s.itemId ? { ...acc, [s.itemId]: s.quantity } : acc, {}),
  };
}

export async function savePlayer(username: string, data: Partial<PlayerData>) {
  const player = await serverDb.player.findUnique({ where: { username } });
  if (!player) return;

  const updateData: any = {
    ...(data.x !== undefined && { x: data.x }),
    ...(data.y !== undefined && { y: data.y }),
    ...(data.facing !== undefined && { facing: data.facing }),
  };

  if (data.skills) {
    for (const [skill, xp] of Object.entries(data.skills)) {
      await serverDb.playerSkill.upsert({
        where: { playerId_skill: { playerId: player.id, skill } },
        create: { playerId: player.id, skill, xp },
        update: { xp },
      });
    }
  }

  if (data.inventory) {
    await serverDb.inventorySlot.deleteMany({ where: { playerId: player.id } });
    const slots = Object.entries(data.inventory)
      .filter(([, qty]) => (qty as number) > 0)
      .map(([itemId, quantity], index) => ({
        playerId: player.id,
        slotIndex: index,
        itemId,
        quantity: quantity as number,
      }));
    if (slots.length > 0) {
      await serverDb.inventorySlot.createMany({ data: slots });
    }
  }

  await serverDb.player.update({
    where: { username },
    data: updateData,
  });
}

export async function createPlayer(username: string): Promise<PlayerData> {
  const defaultSkills = [
    { skill: 'attack', xp: 0 },
    { skill: 'strength', xp: 0 },
    { skill: 'defense', xp: 0 },
    { skill: 'mining', xp: 0 },
    { skill: 'woodcutting', xp: 0 },
    { skill: 'fishing', xp: 0 },
    { skill: 'cooking', xp: 0 },
  ];

  const player = await serverDb.player.create({
    data: {
      username,
      skills: {
        create: defaultSkills,
      },
      inventory: {
        create: Array.from({ length: 28 }, (_, i) => ({
          slotIndex: i,
          itemId: '',
          quantity: 0,
        })),
      },
      equipment: {
        create: {},
      },
    },
    include: {
      skills: true,
      inventory: true,
    },
  });

  return {
    id: player.id,
    username: player.username,
    x: player.x,
    y: player.y,
    facing: player.facing,
    skills: defaultSkills.reduce((acc, s) => ({ ...acc, [s.skill]: 0 }), {}),
    inventory: {},
  };
}

export async function getOrCreatePlayer(username: string): Promise<PlayerData> {
  const existing = await loadPlayer(username);
  if (existing) return existing;
  return createPlayer(username);
}
