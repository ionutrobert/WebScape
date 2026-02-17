import { PrismaClient } from '@prisma/client';

export const serverDb = new PrismaClient();

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
  await serverDb.player.update({
    where: { username },
    data: {
      ...(data.x !== undefined && { x: data.x }),
      ...(data.y !== undefined && { y: data.y }),
      ...(data.facing !== undefined && { facing: data.facing }),
    },
  });
}

export async function createPlayer(username: string): Promise<PlayerData> {
  const defaultSkills = [
    { skill: 'attack', xp: 0 },
    { skill: 'strength', xp: 0 },
    { skill: 'defense', xp: 0 },
    { skill: 'mining', xp: 0 },
    { skill: 'woodcutting', xp: 0 },
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
