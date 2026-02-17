import { Server } from 'socket.io';
import { createServer } from 'http';

import { playerManager } from './players';
import { world } from './world';
import { setMovementTarget } from './actions/movement';
import { startHarvest } from './actions/harvest';
import { initTick, startTickLoop, getLastTickStartTime, getTickDuration } from './tick';
import { getOrCreatePlayer, savePlayer } from './database';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

initTick(io);
startTickLoop(600);

io.on('connection', (socket) => {
  console.log('Connection:', socket.id);
  
  socket.on('join', async (username: string) => {
    const dbPlayer = await getOrCreatePlayer(username);
    
    playerManager.create(socket.id, username, dbPlayer.x, dbPlayer.y);
    
    socket.emit('init', {
      playerId: socket.id,
      players: playerManager.getAll(),
      worldObjects: world.getAll(),
      tickStartTime: getLastTickStartTime(),
      tickDuration: getTickDuration(),
    });
    
    socket.broadcast.emit('player-joined', { id: socket.id, username });
    io.emit('players-update', playerManager.getAll());
    
    console.log(`${username} joined at (${dbPlayer.x}, ${dbPlayer.y})`);
  });
  
  socket.on('move-to', (target: { x: number; y: number }) => {
    const result = setMovementTarget(socket.id, target.x, target.y);
    if (!result.valid && result.reason) {
      socket.emit('chat', { message: result.reason, type: 'system' });
    }
  });
  
  socket.on('harvest', (data: { x: number; y: number; objectId: string }) => {
    const result = startHarvest(socket.id, data.x, data.y, data.objectId);
    if (!result.valid && result.reason) {
      socket.emit('chat', { message: result.reason, type: 'system' });
    }
  });
  
  socket.on('chat', (message: string) => {
    const player = playerManager.get(socket.id);
    if (!player) return;
    io.emit('chat', { username: player.username, message, type: 'player' });
  });
  
  socket.on('disconnect', async () => {
    const player = playerManager.get(socket.id);
    if (player) {
      await savePlayer(player.username, { x: player.x, y: player.y });
      socket.broadcast.emit('player-left', { id: socket.id, username: player.username });
      console.log(`${player.username} disconnected, saved position (${player.x}, ${player.y})`);
    }
    playerManager.remove(socket.id);
    io.emit('players-update', playerManager.getAll());
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.GAME_PORT || 3001;
httpServer.listen(PORT, () => console.log(`Game server on ${PORT}`));
