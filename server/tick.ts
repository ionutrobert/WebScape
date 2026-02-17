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
      io.to(player.id).emit('position-update', { x: result.newX, y: result.newY });
    }
  }
  
  broadcastPlayers();
  
  if (worldChanged) {
    broadcastWorld();
  }
}

function broadcastPlayers() {
  io.emit('players-update', playerManager.getAll());
}

function broadcastWorld() {
  io.emit('world-update', world.getAll());
}

export function startTickLoop(intervalMs: number = 600) {
  setInterval(tick, intervalMs);
}
