# WebScape - System Design Document

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Three.js    │  │ React UI    │  │ Zustand Store       │  │
│  │ 3D Render  │  │ Sidebar     │  │ Local State         │  │
│  └──────┬──────┘  └──────┬─────┘  └─────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │ Socket.IO                         │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                      SERVER (Node.js)                           │
│                           │                                     │
│  ┌─────────────┐  ┌───────┴───────┐  ┌──────────────────┐    │
│  │ Tick Loop  │  │ Actions       │  │ World Manager    │    │
│  │ 600ms     │  │ Movement/Harv │  │ Objects/Players │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Socket.IO Server                        │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│                     DATABASE (SQLite)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Players  │  │ Inventory│  │ Skills   │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
WebScape/
├── src/
│   ├── data/                    # Game configuration
│   │   ├── game.ts             # Game settings
│   │   ├── items.ts            # Item definitions
│   │   ├── skills.ts           # Skill definitions + XP
│   │   └── objects.ts          # World object definitions
│   │
│   ├── shared/
│   │   └── types/
│   │       └── index.ts        # Shared interfaces
│   │
│   └── client/
│       ├── components/         # React components
│       │   ├── GameScene.tsx  # Three.js canvas
│       │   ├── World.tsx       # 3D world
│       │   ├── GameLoop.tsx   # Client tick
│       │   ├── players/       # Player rendering
│       │   └── ui/            # UI components
│       ├── stores/            # Zustand stores
│       │   ├── gameStore.ts  # Main game state
│       │   └── uiStore.ts   # UI state
│       └── lib/              # Utilities
│           ├── clientDb.ts   # IndexedDB
│           └── facing.ts     # Facing utilities
│
├── server/                     # Game server
│   ├── index.ts              # Entry point
│   ├── tick.ts              # 600ms tick loop
│   ├── config.ts            # Server config
│   ├── types.ts             # Server types
│   ├── database.ts          # Prisma client
│   ├── world.ts            # World management
│   ├── collision.ts        # Collision system
│   ├── pathfinder.ts       # A* pathfinding
│   ├── facing.ts          # Facing utilities
│   ├── players.ts         # Player management
│   └── actions/
│       ├── movement.ts    # Movement logic
│       └── harvest.ts     # Harvesting logic
│
├── prisma/
│   └── server.schema.prisma  # Database schema
│
└── app/                      # Next.js
    ├── page.tsx            # Main page
    ├── layout.tsx
    └── globals.css
```

---

## 3. Core Systems

### 3.1 Tick System (600ms)

```typescript
function tick() {
  // 1. Process harvests
  processHarvests();
  
  // 2. Process player movements
  for (const player of playerManager.getAll()) {
    const result = processMovement(player.id);
    if (result?.moved) {
      io.to(player.id).emit('position-update', { 
        x: result.newX, 
        y: result.newY,
        facing: player.facing 
      });
    }
  }
  
  // 3. Broadcast players
  broadcastPlayers();
  
  // 4. Broadcast world if changed
  if (worldChanged) {
    broadcastWorld();
  }
}
```

### 3.2 Pathfinding

**CollisionManager** - Grid-based blocking
- Each tile has `isBlocked` boolean
- Active world objects block tiles
- Depleted objects don't block

**Pathfinder** - A* algorithm
- Manhattan distance heuristic
- Supports diagonal movement
- Returns array of {x, y} steps

### 3.3 Facing System

**Server** (`server/facing.ts`)
- Calculates facing from previous position to current position
- 8 directions: north, south, east, west, NE, NW, SE, SW

**Client** (`src/client/lib/facing.ts`)
- Converts facing direction to Three.js rotation angles

---

## 4. Database Schema (Prisma)

```prisma
model Player {
  id           String   @id
  username     String   @unique
  x            Int      @default(10)
  y            Int      @default(10)
  facing       String   @default("south")
  inventory    String   @default("{}")
  skills       String   @default("{}")
  equipment    String   @default("{}")
}
```

---

## 5. Network Protocol

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | Player joins |
| `move-to` | `{ x, y }` | Movement request |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `chat` | `{ message }` | Send message |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, players }` | Initial state |
| `world-update` | `WorldObject[]` | Resource states |
| `players-update` | `Player[]` | All players |
| `position-update` | `{ x, y, facing }` | Own position |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username, message, type }` | Chat message |

---

## 6. Camera System

```typescript
interface CameraState {
  theta: number;    // Horizontal rotation
  phi: number;      // Vertical rotation
  distance: number; // Zoom level
}

// Controls
// - Middle mouse: orbit
// - Arrow keys: orbit  
// - Scroll: zoom
```

---

## 7. Client State (Zustand)

```typescript
interface GameState {
  // Connection
  playerId: string | null;
  username: string | null;
  
  // Player
  position: { x: number; y: number };
  facing: FacingDirection;
  isMoving: boolean;
  
  // Inventory
  inventory: (InventorySlot | null)[];
  equipment: Record<string, string | null>;
  
  // Skills
  xp: Record<SkillKey, number>;
  
  // World
  worldObjects: WorldObjectState[];
  players: Record<string, Player>;
  
  // UI
  uiTab: 'inventory' | 'skills' | 'equipment';
  chatLog: string[];
  camera: CameraState;
}
```

---

## 8. Animation Synchronization System

### 8.1 Core Principles

All game animations must be **synchronized to server ticks**. The server is authoritative for timing, and the client interpolates visually.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICK TIMELINE (600ms)                         │
│                                                                  │
│  0ms        150ms       300ms       450ms       600ms           │
│   │          │           │           │           │              │
│   ▼          ▼           ▼           ▼           ▼              │
│   ├──────────┼───────────┼───────────┼───────────┤              │
│   │   Animation Progress: 0% → 25% → 50% → 75% → 100%          │
│   │                                                             │
│   │  Server: Processes movement at 0ms, sends update            │
│   │  Client: Receives at ~50-100ms (network latency)            │
│   │  Client: Calculates remaining time and interpolates         │
│   │  Result: Character arrives at tile exactly at 600ms         │
│   │                                                             │
└───┴─────────────────────────────────────────────────────────────┘
```

### 8.2 Server Responsibilities

**Send tick timing with every update:**
```typescript
// server/tick.ts
export function tick() {
  const tickStartTime = Date.now();  // When THIS tick started
  
  // ... process movement ...
  
  io.to(player.id).emit('position-update', {
    x: result.newX,
    y: result.newY,
    startX: result.prevX,
    startY: result.prevY,
    facing: player.facing,
    tickStartTime  // Critical for sync
  });
}
```

**Tick timing data:**
- `tickStartTime`: Unix timestamp when the server tick began
- `tickDuration`: 600ms (configurable)
- Client uses these to calculate animation progress

### 8.3 Client Responsibilities

**Position Interpolation** (`src/client/lib/usePositionInterpolation.ts`):
```typescript
interface InterpolationResult {
  x: number;              // Visual X position (interpolated)
  y: number;              // Visual Y position (interpolated)
  isMoving: boolean;      // Currently animating
  movementProgress: number; // 0.0 to 1.0 - critical for animation sync
}

// Usage:
const { x, y, isMoving, movementProgress } = usePositionInterpolation(
  targetX, targetY, startX, startY,
  true, tickStartTime, tickDuration
);
```

**Animation Sync Formula:**
```typescript
// Calculate elapsed time since tick started
const elapsed = Date.now() - tickStartTime;

// Calculate progress (0.0 to 1.0)
const progress = Math.min(1, elapsed / tickDuration);

// Use progress for visual interpolation
const visualX = startX + (targetX - startX) * progress;
const visualY = startY + (targetY - startY) * progress;

// Use progress for animation phases
const walkCyclePhase = progress * Math.PI * 2;  // One full cycle per tile
```

### 8.4 Walk Animation Sync

**The walk animation must complete exactly one cycle per tile:**

```typescript
// PlayerModel.tsx
useFrame(() => {
  if (isMoving && movementProgress !== undefined) {
    // One complete walk cycle (2π) per tile movement
    const walkPhase = movementProgress * Math.PI * 2;
    
    // Leg swing: -0.5 to +0.5 radians, complete cycle per tile
    const legSwing = Math.sin(walkPhase) * 0.5;
    legLeftGroupRef.current.rotation.x = legSwing;
    legRightGroupRef.current.rotation.x = -legSwing;
    
    // Arm swing: opposite to legs, slightly less amplitude
    const armSwing = Math.sin(walkPhase) * 0.4;
    armLeftGroupRef.current.rotation.x = -armSwing;
    armRightGroupRef.current.rotation.x = armSwing;
    
    // Body bob: up/down motion synced to walk
    const bob = Math.abs(Math.sin(walkPhase)) * 0.05;
    groupRef.current.position.y = baseY + bob;
  }
});
```

### 8.5 Animation Rules

1. **One cycle per tile**: Walk animation completes one full cycle (left leg forward → right leg forward → center) per tile moved
2. **Progress-based, not time-based**: Use `movementProgress` (0.0-1.0) instead of `delta * speed`
3. **Server timing is authority**: Always use `tickStartTime` from server, not client clock
4. **Handle latency**: If update arrives late, animation catches up or snaps to position
5. **Smooth interpolation**: Linear interpolation for position, sinusoidal for natural feel

### 8.6 Extending for Other Animations

**Mining Animation Example:**
```typescript
interface MiningAnimationProps {
  progress: number;  // 0.0 to 1.0 over the mining duration
  ticksTotal: number;
}

function useMiningAnimation(progress: number) {
  // Swing pickaxe: 2 cycles per mining tick
  const swingPhase = progress * Math.PI * 4;
  const armAngle = Math.sin(swingPhase) * 1.2;
  
  return { armAngle };
}
```

**Combat Animation Example:**
```typescript
function useAttackAnimation(tickProgress: number, attackSpeed: number) {
  // attackSpeed = ticks per attack
  const attackPhase = tickProgress * Math.PI * 2;
  
  // Wind up -> strike -> recover
  const swingAngle = Math.sin(attackPhase) * 1.5;
  
  return { swingAngle };
}
```

### 8.7 Animation Module Structure

```
src/client/lib/
├── usePositionInterpolation.ts  # Core interpolation hook
├── animations/
│   ├── index.ts                 # Export all animations
│   ├── walk.ts                  # Walk animation utilities
│   ├── harvest.ts               # Mining/woodcutting animations
│   └── combat.ts                # Attack/defense animations
```

---

## 9. Future Features

- Combat System (melee/ranged)
- Quest System
- Banking
- Player Trading
- Clans/Groups

---

*Document Version: 3.0*
*Architecture: Server-Authoritative MMORPG*
*Tick Rate: 600ms*
*Animation System: Tick-Synchronized Progress-Based*
