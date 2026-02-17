# WebScape - Project Instructions

## Always Reference These Files

Before making any changes or answering questions about this project, always reference:
- **SPEC.md** - Game specifications and features
- **SYSTEM_DESIGN.md** - Architecture blueprint and technical decisions

These files define what we're building and how. Keep them updated as the project evolves.

## Project Structure

```
C:\Work\Projects\WebScape\
├── src/
│   ├── data/                      # Pure game configuration (no logic)
│   │   ├── game.ts               # Game name and settings
│   │   ├── items.ts              # Item definitions
│   │   ├── skills.ts             # Skill definitions + XP calculations
│   │   └── objects.ts            # World object definitions (rocks, trees)
│   │
│   ├── shared/
│   │   └── types/
│   │       └── index.ts          # Shared TypeScript interfaces
│   │
│   └── client/                   # Client-side code (Next.js)
│       ├── components/
│       │   ├── GameScene.tsx     # Three.js canvas + camera controller
│       │   ├── World.tsx        # 3D world rendering (terrain, objects)
│       │   ├── GameLoop.tsx     # Client-side game loop
│       │   ├── players/         # Player rendering components
│       │   │   ├── PlayerModel.tsx    # 3D humanoid with equipment
│       │   │   ├── LocalPlayer.tsx    # Local player wrapper
│       │   │   ├── RemotePlayer.tsx   # Remote player wrapper
│       │   │   └── index.ts
│       │   └── ui/               # UI components
│       │       ├── HUD.tsx       # Main HUD wrapper
│       │       ├── ChatBox.tsx   # Chat interface
│       │       ├── Sidebar.tsx   # Right sidebar + tabs
│       │       └── Minimap.tsx   # Canvas minimap
│       ├── stores/               # Zustand state
│       │   ├── gameStore.ts     # Main game state
│       │   └── uiStore.ts       # UI state (tabs, etc)
│       └── lib/                 # Client utilities
│           ├── clientDb.ts      # IndexedDB for settings
│           └── facing.ts        # Facing direction utilities
│
├── server/                       # Server-side (standalone, port 3001)
│   ├── index.ts                  # Entry point, Socket.IO setup
│   ├── tick.ts                   # 600ms tick loop
│   ├── config.ts                 # Server config (WORLD_SIZE, etc)
│   ├── types.ts                  # Server interfaces
│   ├── database.ts               # Prisma SQLite client
│   ├── world.ts                  # World state management
│   ├── collision.ts              # CollisionManager (grid-based)
│   ├── pathfinder.ts             # A* pathfinding algorithm
│   ├── facing.ts                 # Facing direction utilities
│   ├── players.ts                # Player session management
│   └── actions/
│       ├── movement.ts            # Movement logic (path-based)
│       └── harvest.ts             # Harvesting logic
│
├── prisma/
│   └── server.schema.prisma       # Database schema
│
├── app/                          # Next.js app (port 3000)
│   ├── page.tsx                  # Main game page + socket setup
│   ├── layout.tsx
│   └── globals.css
│
├── SPEC.md                       # Game specifications
├── SYSTEM_DESIGN.md              # Architecture blueprint
└── AGENTS.md                     # This file
```

## Key Architecture Decisions

1. **Server-authoritative**: Server handles all game logic; client is "dumb visualizer"
2. **600ms tick-based**: Server tick runs every 600ms
3. **Socket.IO multiplayer**: Real-time communication
4. **Three.js 3D rendering**: 3D browser game
5. **Client/Server separation**: Can run independently

## Running the Project

```bash
# Terminal 1: Start server (port 3001)
npm run server
# or: npx tsx server/index.ts

# Terminal 2: Start client (port 3000)
npm run dev
```

## Databases

- **Server** (`server/database.ts`): SQLite via Prisma (`prisma/server.db`)
  - Persists: Player position, inventory, skills, equipment
  - Load on join, save on disconnect
  
- **Client** (`src/client/lib/clientDb.ts`): IndexedDB
  - Per-account settings: Camera angle, zoom level, UI preferences

## Game Config

All game configuration is in `src/data/`:
- `game.ts` - Game name and settings
- `items.ts` - Item definitions
- `skills.ts` - Skill definitions
- `objects.ts` - World object definitions

## Current Features

- ✅ 3D world with rocks and trees
- ✅ Player movement (click to move with A* pathfinding)
- ✅ Diagonal movement support
- ✅ Collision detection (world objects block tiles)
- ✅ Resource harvesting (click adjacent resources)
- ✅ Multiplayer (Socket.IO)
- ✅ Position persistence (SQLite)
- ✅ Camera settings persistence (IndexedDB)
- ✅ Inventory system
- ✅ Skills with XP
- ✅ Basic UI (sidebar with tabs)
- ✅ Player model with equipment support
- ✅ 8-directional facing (corrected)
- ✅ Walking animation
- ✅ Path-based facing direction

## Player System

### PlayerModel (`src/client/components/players/PlayerModel.tsx`)
- 3D humanoid model with body, head, arms, legs, feet
- Equipment support (helm, chest, legs, mainHand)
- 8-directional rotation based on facing
- Walking animation (leg swing, arm swing, bobbing)
- Position: `y = 0` (ground level)

### Facing System
- Server: `server/facing.ts` - `calculateFacing(fromX, fromY, toX, toY)`
- Client: `src/client/lib/facing.ts` - `getRotationForFacing(facing)`
- 8 directions: north, south, east, west, northeast, southeast, southwest, northwest
- **Important**: Facing is dictated by the previous tick's position to the current position (the actual step taken)

### Player Components
- `LocalPlayer` - Renders the local player with equipment from store
- `RemotePlayer` - Renders other players
- World.tsx only renders terrain and objects - players are separate

## Pathfinding System

### CollisionManager (`server/collision.ts`)
- Grid-based blocking where each tile (x, y) has an `isBlocked` boolean
- Active world objects block tiles, depleted objects don't
- `getNeighbors()` returns adjacent tiles with diagonal support

### Pathfinder (`server/pathfinder.ts`)
- A* algorithm with Manhattan distance heuristic
- `findPath(start, end)` - Returns array of {x, y} steps
- `findNearestAccessibleTile()` - Finds closest walkable tile to blocked target
- Diagonal movement: Valid if both corner tiles are unblocked

### Movement Flow
1. Player clicks target tile → Server calculates A* path
2. Each 600ms tick → Player moves to next path tile
3. Facing calculated from prev position to current position (not target)
4. If target is a resource → Pathfinding finds nearest adjacent tile

## Camera Controls

- Middle mouse = orbit
- Arrow keys = orbit
- Scroll = zoom

## UI Layout (`app/page.tsx`)

Flexbox layout:
- Left: Game canvas (flex-1)
- Right: Sidebar (w-72) with:
  - Top: Tab buttons (Inventory, Stats, Equip)
  - Middle: Tab content
  - Bottom: Chat + input

## Socket Events

**Client → Server:**
| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{ username }` | Player joins |
| `move-to` | `{ x, y }` | Request movement |
| `harvest` | `{ x, y, objectId }` | Harvest resource |
| `chat` | `{ message }` | Send message |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, ... }` | Initial state |
| `world-update` | `WorldObject[]` | Resource states |
| `players-update` | `Player[]` | All players |
| `position-update` | `{ x, y, facing }` | Own position |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username, message, type }` | Chat message |

## Code Style

- TypeScript strict mode
- Types in `src/shared/types/`
- Components small and focused
- No game logic in client
- No `any` unless absolutely necessary
