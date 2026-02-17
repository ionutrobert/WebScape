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
│           ├── facing.ts        # Facing direction utilities
│           ├── usePositionInterpolation.ts  # Movement interpolation hook
│           ├── visualPositionRef.ts         # Shared visual position for camera
│           └── animations/      # Animation utilities (tick-synced)
│               ├── index.ts     # Exports
│               └── walk.ts      # Walk animation calculations
│
├── server/                       # Server-side (standalone, port 3001)
│   ├── index.ts                  # Entry point, Socket.IO setup
│   ├── tick.ts                   # 600ms tick loop
│   ├── config.ts                 # Server config (WORLD_SIZE, etc)
│   ├── types.ts                  # Server interfaces
│   ├── database.ts               # Prisma SQLite client with better-sqlite3 adapter
│   ├── world.ts                  # World state management
│   ├── collision.ts              # CollisionManager (grid-based)
│   ├── pathfinder.ts             # A* pathfinding algorithm
│   ├── facing.ts                 # Facing direction utilities
│   ├── players.ts                # Player session management
│   └── actions/
│       ├── movement.ts            # Movement logic (path-based)
│       └── harvest.ts            # Harvesting logic
│
├── map-editor/                    # Map Editor (separate Next.js app, port 3002)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/world/       # World data API
│   │   │   ├── page.tsx         # Editor entry point
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── EditorScene.tsx  # Three.js editor scene
│   │   │   ├── EditorWorld.tsx  # World rendering
│   │   │   ├── EditorCursor.tsx # Cursor/tile selection
│   │   │   └── EditorUI.tsx      # Editor toolbar
│   │   ├── stores/
│   │   │   └── editorStore.ts    # Editor state
│   │   ├── lib/
│   │   │   └── editorDb.ts      # World DB operations
│   │   └── types/
│   │       ├── editor.ts         # Editor types
│   │       └── objects.ts        # Object types
│   ├── prisma/
│   │   └── schema.prisma         # Prisma schema (references main db)
│   └── package.json
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
└── AGENTS.md                    # This file
```

## Key Architecture Decisions

1. **Server-authoritative**: Server handles all game logic; client is "dumb visualizer"
2. **600ms tick-based**: Server tick runs every 600ms
3. **Socket.IO multiplayer**: Real-time communication
4. **Three.js 3D rendering**: 3D browser game
5. **Client/Server separation**: Can run independently
6. **Shared database**: Map editor and game share the same SQLite database via Prisma

## Running the Project

```bash
# Terminal 1: Start game server (port 3001)
npm run server
# or: npx tsx server/index.ts

# Terminal 2: Start main game client (port 3000)
npm run dev

# Terminal 3: Start map editor (port 3002) - optional
npm run editor
```

## Dependencies (Latest - February 2026)

```json
{
  "next": "^16.1.6",
  "react": "^19.2.4",
  "prisma": "^7.4.0",
  "@prisma/client": "^7.4.0",
  "@prisma/adapter-better-sqlite3": "^7.4.0",
  "@react-three/fiber": "^9.5.0",
  "@react-three/drei": "^10.0.0",
  "three": "^0.172.0",
  "zustand": "^5.0.11",
  "socket.io": "^4.8.3",
  "better-sqlite3": "^12.6.2"
}
```

**Note:** Node.js 22+ required (use `@prisma/adapter-better-sqlite3` for Prisma 7)

## Databases

- **Server** (`server/database.ts`): SQLite via Prisma with better-sqlite3 adapter (`prisma/server.db`)
  - Persists: Player position, inventory, skills, equipment, world tiles, world objects
  - Load on join, save on disconnect
  
- **Client** (`src/client/lib/clientDb.ts`): IndexedDB
  - Per-account settings: Camera angle, zoom level, UI preferences

- **Map Editor**: Shares same database as game server via Prisma

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
- ✅ 8-directional facing
- ✅ Walking animation
- ✅ OSRS-style movement interpolation
- ✅ Map Editor (separate app)

## Player System

### PlayerModel (`src/client/components/players/PlayerModel.tsx`)
- 3D humanoid model with body, head, arms, legs, feet
- Equipment support (helm, chest, legs, mainHand)
- 8-directional rotation based on facing
- Walking animation synced to movement progress (tick-based)
- Position: `y = 0` (ground level, no floating)

### Movement System (OSRS-style)

**Server sends precise movement data:**
- `position-update`: `{ x, y, startX, startY, facing, tickStartTime }`
- `startX/startY`: Where movement started from
- `x/y`: Where movement ends
- `tickStartTime`: Unix timestamp when server tick began (critical for sync)

**Client interpolation:**
- `usePositionInterpolation` hook handles smooth movement
- Returns `movementProgress` (0.0 to 1.0) for animation sync
- Linear interpolation from start → end over exactly 600ms
- Same approach as OSRS ExactMove system

**Animation Synchronization:**
- Walk animation completes one full cycle per tile
- Uses `movementProgress` to calculate walk phase: `phase = progress * π * 2`
- See `SYSTEM_DESIGN.md` Section 8 for full animation system documentation

**Player Components**
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
| `init` | `{ playerId, worldObjects, tickStartTime, tickDuration, ... }` | Initial state |
| `world-update` | `WorldObject[]` | Resource states |
| `players-update` | `{ players, tickStartTime }` | All players with sync timing |
| `position-update` | `{ x, y, startX, startY, facing, tickStartTime }` | Own position (for interpolation) |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username, message, type }` | Chat message |

## Code Style

- TypeScript strict mode
- Types in `src/shared/types/`
- Components small and focused
- No game logic in client
- No `any` unless absolutely necessary
- ESM modules (package.json has `"type": "module"`)
