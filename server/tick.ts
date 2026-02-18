import { Server } from "socket.io";
import { playerManager } from "./players";
import { world } from "./world";
import { processMovement } from "./actions/movement";
import { processHarvests, getActiveHarvests } from "./actions/harvest";
import { processCooking, getActiveCookings, COOKING_CONFIG } from "./actions/cooking";
import { processCombatTicks } from "./actions/combat";
import { OBJECTS_CONFIG } from "./config";

let io: Server;
let lastTickStartTime = 0;
const TICK_DURATION_MS = 600;

export function initTick(serverIo: Server) {
  io = serverIo;
}

export function getLastTickStartTime(): number {
  return lastTickStartTime;
}

export function getTickDuration(): number {
  return TICK_DURATION_MS;
}

export function tick() {
  lastTickStartTime = Date.now();
  const tickStartTime = lastTickStartTime;

  processCombatTicks();

  const { completed, successes } = processHarvests();

  const { cooked, burnt } = processCooking();

  for (const cooking of cooked) {
    const config = COOKING_CONFIG[cooking.itemId];
    io.to(cooking.playerId).emit(
      "inventory-update",
      playerManager.getInventory(cooking.playerId),
    );
    io.to(cooking.playerId).emit("chat", {
      message: "You successfully cook the fish!",
      type: "system",
    });
    io.to(cooking.playerId).emit("xp-gain", {
      skill: "cooking",
      amount: config?.xp || 0,
    });
  }

  for (const burn of burnt) {
    io.to(burn.playerId).emit(
      "inventory-update",
      playerManager.getInventory(burn.playerId),
    );
    io.to(burn.playerId).emit("chat", {
      message: "You accidentally burn the fish!",
      type: "system",
    });
  }

  for (const harvest of successes) {
    const config = OBJECTS_CONFIG[harvest.objectId];
    io.to(harvest.playerId).emit(
      "inventory-update",
      playerManager.getInventory(harvest.playerId),
    );
    io.to(harvest.playerId).emit("chat", {
      message: `You get ${config.resource}.`,
      type: "system",
    });
    io.to(harvest.playerId).emit("xp-gain", {
      skill: config.skillType || "mining",
      amount: config.xp,
    });
  }

  for (const harvest of completed) {
    // Optional: send depletion message
    // io.to(harvest.playerId).emit('chat', { message: `The ${OBJECTS_CONFIG[harvest.objectId].name} is depleted.`, type: 'system' });
  }

  const worldChanged = world.tick();

  for (const player of playerManager.getAll()) {
    const isRunning = playerManager.isRunning(player.id);
    const result = processMovement(player.id, isRunning);
    if (result?.moved) {
      if (isRunning) {
        playerManager.depleteRunEnergy(player.id, 1);
      }
      io.to(player.id).emit("position-update", {
        x: result.newX,
        y: result.newY,
        startX: result.prevX,
        startY: result.prevY,
        facing: player.facing,
        tickStartTime,
        isRunning,
        runEnergy: playerManager.getRunEnergy(player.id),
      });
    } else if (!playerManager.hasTarget(player.id)) {
      playerManager.restoreRunEnergy(player.id, 0.5);
    }
  }

  broadcastPlayers();

  if (worldChanged) {
    broadcastWorld();
  }
}

function broadcastPlayers() {
  const activeHarvests = Array.from(getActiveHarvests().values());
  const players = playerManager.getAll().map((p) => ({
    id: p.id,
    username: p.username,
    x: p.x,
    y: p.y,
    startX: p.prevX ?? p.x,
    startY: p.prevY ?? p.y,
    facing: p.facing,
    isRunning: p.isRunning,
    runEnergy: p.runEnergy,
    isHarvesting: activeHarvests.some((h) => h.playerId === p.id),
  }));
  io.emit("players-update", { players, tickStartTime: lastTickStartTime });
}

function broadcastWorld() {
  io.emit("world-update", world.getAll());
}

export function startTickLoop(intervalMs: number = 600) {
  setInterval(tick, intervalMs);
}
