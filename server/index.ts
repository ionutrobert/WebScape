import { Server } from "socket.io";
import { createServer } from "http";

import { playerManager, AdminLevel } from "./players";
import { world, initializeWorld } from "./world";
import { setMovementTarget } from "./actions/movement";
import { startHarvest } from "./actions/harvest";
import { startCooking } from "./actions/cooking";
import { startAttack, processAttack } from "./actions/combat";
import {
  initTick,
  startTickLoop,
  getLastTickStartTime,
  getTickDuration,
} from "./tick";
import { getOrCreatePlayer, savePlayer } from "./database";

initializeWorld().then(() => {
  console.log("World loaded from database");
});

function findValidSpawnPosition(
  preferredX?: number,
  preferredY?: number,
): { x: number; y: number } {
  const width = world.getWidth();
  const height = world.getHeight();

  const isOccupied = (x: number, y: number) => {
    const players = playerManager.getAll();
    return players.some((p) => p.x === x && p.y === y);
  };

  if (preferredX !== undefined && preferredY !== undefined) {
    if (!world.isBlocked(preferredX, preferredY) && !isOccupied(preferredX, preferredY)) {
      return { x: preferredX, y: preferredY };
    }
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  for (let radius = 0; radius < Math.max(width, height); radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (
          x >= 0 &&
          x < width &&
          y >= 0 &&
          y < height &&
          !world.isBlocked(x, y) &&
          !isOccupied(x, y)
        ) {
          return { x, y };
        }
      }
    }
  }

  return { x: 0, y: 0 };
}

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

initTick(io);
startTickLoop(600);

io.on("connection", (socket) => {
  console.log("Connection:", socket.id);

  socket.on("join", async (username: string) => {
    const existingPlayers = playerManager.getAll();
    const existingPlayer = existingPlayers.find(p => p.username.toLowerCase() === username.toLowerCase());
    if (existingPlayer) {
      io.to(existingPlayer.id).emit("chat", { message: "You have been disconnected due to another login.", type: "system" });
      io.to(existingPlayer.id).emit("disconnect");
      playerManager.remove(existingPlayer.id);
      console.log(`Disconnected old session for ${username} due to new login`);
    }

    const dbPlayer = await getOrCreatePlayer(username);

    const currentPlayers = playerManager.getAll();
    const isPositionOccupied = (x: number, y: number) => {
      return currentPlayers.some((p) => p.x === x && p.y === y);
    };

    let spawnPos = { x: dbPlayer.x, y: dbPlayer.y };
    if (dbPlayer.x === undefined || dbPlayer.y === undefined || isPositionOccupied(dbPlayer.x, dbPlayer.y)) {
      spawnPos = findValidSpawnPosition(dbPlayer.x, dbPlayer.y);
    }

    const player = playerManager.create(socket.id, username, spawnPos.x, spawnPos.y);

    if (dbPlayer.inventory) {
      player.inventory = dbPlayer.inventory;
    }
    if (dbPlayer.skills) {
      player.skills = dbPlayer.skills;
      player.skillXp = { ...dbPlayer.skills };
    }

    const isAdmin = playerManager.isAdmin(username);

    socket.emit("init", {
      playerId: socket.id,
      players: playerManager.getAll(),
      worldObjects: world.getAll(),
      worldTiles: world.getTiles(),
      collisionMap: world.getCollisionMap(),
      tickStartTime: getLastTickStartTime(),
      tickDuration: getTickDuration(),
      worldWidth: world.getWidth(),
      worldHeight: world.getHeight(),
      isAdmin,
      inventory: player.inventory,
      skills: player.skills,
      skillXp: player.skillXp,
    });

    socket.broadcast.emit("player-joined", { id: socket.id, username });
    io.emit("players-update", {
      players: playerManager.getAll(),
      tickStartTime: getLastTickStartTime(),
    });
    
    socket.emit("collision-update", world.getCollisionMap());

    console.log(`${username} joined at (${spawnPos.x}, ${spawnPos.y})`);
  });

  socket.on("move-to", (target: { x: number; y: number }) => {
    const result = setMovementTarget(socket.id, target.x, target.y);
    if (!result.valid && result.reason) {
      socket.emit("chat", { message: result.reason, type: "system" });
    }
  });

  socket.on("harvest", (data: { x: number; y: number; objectId: string }) => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = startHarvest(socket.id, data.x, data.y, data.objectId);
    if (!result.valid && result.reason) {
      socket.emit("chat", { message: result.reason, type: "system" });
    } else if (result.valid) {
      socket.emit("harvest-started", {
        x: data.x,
        y: data.y,
        objectId: data.objectId,
      });
    }
  });

  socket.on("cook", (data: { x: number; y: number; itemId: string }) => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = startCooking(socket.id, data.itemId, data.x, data.y);
    if (!result.valid && result.reason) {
      socket.emit("chat", { message: result.reason, type: "system" });
    }
  });

  socket.on("attack", (data: { targetId: string; style?: "accurate" | "aggressive" | "defensive" }) => {
    const player = playerManager.get(socket.id);
    if (!player) return;

    const result = startAttack(socket.id, data.targetId, data.style || "accurate");
    if (!result.valid && result.reason) {
      socket.emit("chat", { message: result.reason, type: "system" });
    } else {
      const combatResult = processAttack(socket.id, data.targetId, data.style || "accurate", io);
      socket.emit("combat-result", {
        hit: combatResult.hit,
        damage: combatResult.damage,
        xp: combatResult.xp,
      });
    }
  });

  socket.on("admin", async (data: { command: string; args?: any }) => {
    const player = playerManager.get(socket.id);
    if (!player || !playerManager.isAdmin(player.username)) {
      socket.emit("chat", { message: "You are not an admin.", type: "system" });
      return;
    }

    const result = await playerManager.handleAdminCommand(
      socket.id,
      data.command,
      data.args,
      io,
    );
    if (!result.valid && result.reason) {
      socket.emit("chat", { message: result.reason, type: "system" });
    }
  });

  socket.on("chat", (message: string) => {
    const player = playerManager.get(socket.id);
    if (!player) return;
    io.emit("chat", { username: player.username, message, type: "player" });
  });

  socket.on("toggle-run", () => {
    const player = playerManager.get(socket.id);
    if (!player) return;
    const newRunningState = playerManager.toggleRun(socket.id);
    socket.emit("run-state-update", { 
      isRunning: newRunningState, 
      runEnergy: player.runEnergy 
    });
  });

  socket.on("disconnect", async () => {
    const player = playerManager.get(socket.id);
    if (player) {
      await savePlayer(player.username, { 
        x: player.x, 
        y: player.y,
        facing: player.facing,
        inventory: player.inventory,
        skills: player.skillXp,
      });
      socket.broadcast.emit("player-left", {
        id: socket.id,
        username: player.username,
      });
      console.log(
        `${player.username} disconnected, saved position (${player.x}, ${player.y}), inventory: ${JSON.stringify(player.inventory)}, skills: ${JSON.stringify(player.skillXp)}`,
      );
    }
    playerManager.remove(socket.id);
    io.emit("players-update", {
      players: playerManager.getAll(),
      tickStartTime: getLastTickStartTime(),
    });
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.GAME_PORT || 3001;
httpServer.listen(PORT, () => console.log(`Game server on ${PORT}`));
