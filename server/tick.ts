import { Server } from 'socket.io';
import { playerManager } from './players';
import { world } from './world';
import { processMovement } from './actions/movement';
import { processHarvests } from './actions/harvest';
import { OBJECTS_CONFIG } from './config';

let io: Server;

export function initTick(serverIo: Server) {
  io = serverIo;
}

export function tick() {
  const { completed } = processHarvests();
  
  for (const harvest of completed) {
    const config = OBJECTS_CONFIG[harvest.objectId];
    io.to(harvest.playerId).emit('inventory-update', playerManager.getInventory(harvest.playerId));
    io.to(harvest.playerId).emit('chat', { message: `You get ${config.resource}.`, type: 'system' });
  }
  
  const worldChanged = world.tick();
  
  for (const player of playerManager.getAll()) {
    const result = processMovement(player.id);
    if (result?.moved) {
      io.to(player.id).emit('position-update', { 
        x: result.newX, 
        y: result.newY, 
        startX: result.prevX,
        startY: result.prevY,
        facing: player.facing 
      });
    }
  }
  
  broadcastPlayers();
  
  if (worldChanged) {
    broadcastWorld();
  }
}

function broadcastPlayers() {
  const players = playerManager.getAll().map(p => ({
    id: p.id,
    username: p.username,
    x: p.x,
    y: p.y,
    startX: p.prevX ?? p.x,
    startY: p.prevY ?? p.y,
    facing: p.facing
  }));
  io.emit('players-update', players);
}

function broadcastWorld() {
  io.emit('world-update', world.getAll());
}

export function startTickLoop(intervalMs: number = 600) {
  setInterval(tick, intervalMs);
}
