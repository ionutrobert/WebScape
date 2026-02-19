# WebScape - Project Instructions

## IMPORTANT: Using Worker Agents

**Always use worker agents (Task tool) for parallel work:**
- When multiple independent tasks can be done in parallel, spawn worker agents
- This speeds up development significantly
- Document all work thoroughly in AGENTS.md

## User Preferences

- **Don't repeat yourself** - Read instructions carefully before asking or implementing
- **Easy debugging** - Provide copy-pasteable logs, clear error messages
- **Research first** - If unsure about OSRS mechanics, look up official docs/wiki
- **Send agents** - Use worker agents for parallel work
- **Consult instructions** - Always check AGENTS.md before implementing

## Current State (Feb 2026)

### Working Features
- ✅ 3D world rendering with tiles (grass, water, sand, etc.)
- ✅ Rocks and trees visible in game with depletion/respawn
- ✅ Player movement with A* pathfinding
- ✅ Diagonal movement support
- ✅ Collision detection (world objects block tiles)
- ✅ Resource harvesting (mining, woodcutting)
- ✅ Multiplayer (Socket.IO)
- ✅ Position persistence (SQLite)
- ✅ Inventory system (28 slots)
- ✅ Skills with XP and leveling
- ✅ Player model with equipment rendering
- ✅ 8-directional facing with smooth rotation
- ✅ Tick-synced walking animation
- ✅ OSRS-style position interpolation
- ✅ Debug panel (tick progress, true tile, collision map)
- ✅ Performance settings (view distance, shadows, FPS counter)
- ✅ Map Editor (port 3002)
- ✅ Admin commands (`/tp`, `/spawn`, `/give`, `/xp`, `/heal`, `/godmode`)
- ✅ Running mechanics (2 tiles per tick, OSRS-style)
- ✅ Run energy system (depletes when running, regenerates when walking)
- ✅ Player harvesting state visible to other players (isHarvesting)

### Latest Changes (Uncommitted)
- **Harvest rewards now given immediately** on each successful hit, not waiting for resource depletion
- **Added `isHarvesting` state** to ServerPlayer type - broadcasts when player is actively harvesting
- **Added `currentAction` tracking** in gameStore with `setAction()` for harvest progress
- **Added `ticksRemaining`** to track harvest timing per action
- **Improved run energy handling** - proper depletion and replenishment logic

### Known Issues

#### Movement & Pathfinding
- ✅ Remote players now animate smoothly between tiles (FIXED in commit 3668f27)
- ⚙️ Player not walking to clicked resource (clicks don't trigger movement)
- ⚙️ Player not facing clicked resource/direction

#### Animation
- ⚙️ Animations are jumpy and janky (not smooth)
- ⚙️ Blue screen flash on first resource harvest after login
- ⚙️ Walk animation doesn't sync properly with movement

#### Harvesting
- ⚙️ Can mine/chop without required tools (pickaxe, axe)
- ✅ Player has default tools in inventory (FIXED)
- ⚙️ XP not awarded on harvest
- ⚙️ Resources don't visually deplete (trees should become stumps, rocks grey)
- ⚙️ No fishing spots or cooking fires in world for new skills

#### UI/UX
- ⚙️ Tick info progress bar not showing progress
- ⚙️ Run energy UI not working properly
- ✅ Click feedback working (FIXED)
- ⚙️ Hover tooltip not showing
- ⚙️ Right-click menu incomplete

#### Previous Known Issues (some may still apply)
- ✅ FPS drops over time (FIXED)
- ✅ Inventory persistence (FIXED)
- ✅ Duplicate login (FIXED)
- ✅ Welcome message (FIXED)
- ✅ Hydration errors (FIXED)
- ✅ Player ground alignment (FIXED)
- ⚙️ Map editor coordinate system inverted

### Next Priorities (COMPLETE LIST - Test Each)

#### Movement & Pathfinding (Working On)
- [x] Fix player diagonal walking (should walk orthogonal, not diagonal to resource) - DONE
- [x] Fix player teleporting during walk/run cycle - FIXED in commit 3668f27
- [x] Fix player facing resource when harvesting - DONE
- [x] Fix remote player movement not working properly - FIXED in commit 3668f27
- [x] Multiplayer: second player joins and both glitch/stop moving - FIXED in commit 3668f27
- [x] Multiplayer: chunk/visibility calculated around wrong player - Not fully tested yet

#### Harvesting & Skills
- [x] Fix rocks/trees depletion - become stumps (trees) or grey (rocks) - DONE
- [x] Fix XP not being awarded on harvest - DONE
- [x] Add default tools (bronze axe, bronze pickaxe) - DONE

#### UI/UX
- [x] Change XP drop from 3D to HUD overlay (OSRS style) - DONE
- [x] Add click feedback (yellow/red X) - DONE
- [x] Add hover tooltip (top-left of screen) - DONE
- [ ] Add right-click menu (Walk here, Mine, Chop, etc.) - NOT DONE
- [x] Mouse cursor normal arrow - DONE
- [ ] Add item icons/models for pickaxe, axe, and items - NOT DONE

#### Performance
- [x] Fix FPS drop (massive after short play time) - DONE

#### Animation
- [ ] Implement OSRS-style player models and animations - NOT DONE
- [ ] Fix harvest animation - NOT DONE

#### Run Energy
- [ ] Fix run energy time-based UI (OSRS-style looping circle) - NOT DONE

### Newly Reported Issues (Feb 2026)
- [ ] Local player teleports during walk/run cycle instead of smooth movement
- [ ] Multiplayer: second player joins and both glitch/stop moving
- [ ] Multiplayer: chunk/visibility calculated around wrong player (both see same area)

## IMPORTANT: Git Commits

**DO NOT commit changes to GitHub unless explicitly instructed by the user.**
- Always ask for permission before committing
- Never commit in your name without consent
- If in doubt, ask first

## OSRS Movement System (CRITICAL - READ THIS)

### How OSRS Movement Actually Works

**Server Tick (600ms):**
- Server runs on 600ms ticks
- All game actions synchronized to ticks
- When you click to move, server calculates the path
- Server knows your TRUE POSITION instantly at next tick start

**True Position vs Visual Position:**
- **True Position** = Where server thinks you are (used for game logic)
- **Visual Position** = Where your character model is rendered (purely cosmetic)
- When moving from tile A to tile B:
  - True position appears at tile B at START of next tick
  - Visual position smoothly animates from A to B over 600ms
  - The animation is CLIENT-SIDE ONLY, doesn't affect game logic

**ExactMove Mask (from osrs-docs):**
Server sends:
- `exactMoveFirstDeltaX/Z` - First movement delta
- `exactMoveSecondDeltaX/Z` - Second movement delta (for running)
- `exactMoveFirstTimespan` - Client tick when arriving at first coordinate
- `exactMoveSecondTimespan` - Client tick when arriving at second coordinate
- `exactMoveFacingDirection` - Direction during movement

**Client Tick (20ms):**
- 30 client ticks per server tick (30 × 20ms = 600ms)
- Used for precise animation timing

### How Our Implementation Should Work

1. **Server sends:**
   - `position` (x, y) = TRUE position (destination)
   - `startPosition` (startX, startY) = Where movement started
   - `tickStartTime` = When this movement began

2. **Client interpolates:**
   - Visual position: smooth lerp from startX,startY to x,y over 600ms
   - Animation: walk cycle that completes once per tile (600ms per cycle)
   - The interpolation should be CONTINUOUS - never reset or jump

3. **Key insight:**
   - Both local and remote players should use IDENTICAL rendering code
   - The only difference is WHERE the data comes from
   - Local: position-update event
   - Remote: players-update event

## Debug Info

**Tick Progress (0-100%):**
- Shows current position within the 600ms server tick cycle
- Uses modulo arithmetic: `(currentTime - tickStartTime) % 600ms`
- Cycles continuously 0→100%→0 every 600ms
- All clients see the same tick progress (synced to server)

**Collision Map Visualization:**
- Toggle in debug panel: "Show Collision Map"
- Walkable tiles: green overlay (semi-transparent)
- Blocked tiles: red overlay (semi-transparent)
- Server sends collision map on `init` and `collision-update` events
- Only renders when toggle is ON, within view distance
- Visualized as a progress bar in the debug panel

## Movement Animation Philosophy

**Global Server Tick:**
- The tick is set by the server and the tick timer never restarts on any player actions
- The tick timer cannot be reset in any way
- All clients just try to keep up/sync to it
- When players click to move at approximately the same time, they should be in sync as long as they clicked within the same 0.6s tick
- All clients use the same server tickStartTime for interpolation

**Client-side interpolation:**
- Client only cares about: start tile → destination tile
- Interpolate once between these two points over exactly 600ms (one tick)
- If player changes direction mid-walk, server sends new start/end positions
- The new start position becomes the new "from" point - animation continues smoothly
- Never interrupt or reset animation mid-tick - let interpolation complete

**Server-authoritative movement:**
- Server knows true position (one tile ahead during movement)
- Client receives position updates each tick with start/end positions
- Visual position interpolates; true tile shows server position
- Use debug settings to visualize the difference

## IMPORTANT: OSRS Mechanics Reference

### Tick System (600ms per tick)
- Server runs on 600ms ticks
- All game actions synchronized to ticks
- Movement: 1 tile per tick (walking), 2 tiles per tick (running)
- Mining/Woodcutting: Check for success every 4 ticks

### Mining Mechanics
- Player must be adjacent to rock (no diagonal)
- Same tick interval for all pickaxes (4 ticks between checks)
- Success chance = base chance + (pickaxe tier × 0.03) + skill bonus
- Base chance: 40% at same level, up to 80% at +20 levels
- Rock depletes after X successful hits (varies by rock tier)

### Woodcutting Mechanics
- Player must be adjacent to tree (no diagonal)
- Same tick interval for all axes (4 ticks between checks)
- Success chance = base chance + (axe tier × 0.03) + skill bonus
- Trees deplete after 1 successful chop

### Admin Commands
Admin users (username: admin, mod, dev) can use:
- `/tp <x> <y>` - Teleport to coordinates
- `/spawn <objectId> <x> <y>` - Spawn object
- `/give <itemId> <qty>` - Give item
- `/xp <skill> <amount>` - Add XP
- `/heal` - Restore HP
- `/godmode` - Toggle god mode

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
│       │       ├── DebugPanel.tsx # Debug & performance settings (in sidebar)
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

## Modular Architecture

Each system is isolated and can be worked on independently:

| System | Files | Can Modify Without Breaking |
|--------|-------|---------------------------|
| **Movement** | `server/actions/movement.ts`, `usePositionInterpolation.ts` | Server pathfinding, client interpolation |
| **Animation** | `PlayerModel.tsx`, `lib/animations/` | Walk cycles, idle, run animations |
| **Rendering** | `World.tsx`, `GameScene.tsx` | Tiles, objects, lighting, shadows |
| **UI** | `app/page.tsx`, `components/ui/` | Sidebar, chat, debug panel |
| **Networking** | `server/index.ts`, socket events in `page.tsx` | Protocol, event handling |
| **Skills** | `server/actions/harvest.ts`, `src/data/skills.ts` | Mining, woodcutting, XP |
| **World** | `server/world.ts`, `server/collision.ts` | Tile data, collision detection |

**State Flow:**
```
Server → Socket Events → Zustand Store → React Components → Three.js
                ↑                                        ↓
                └──────── User Actions (move, harvest) ─┘
```

**Key Principle:** Components are reactive - they read from Zustand store and render. They don't contain game logic.

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

- ✅ 3D world rendering with tiles (grass, water, sand, etc.)
- ✅ World objects (rocks, trees) with depletion/respawn
- ✅ Player movement (click to move with A* pathfinding)
- ✅ Diagonal movement support
- ✅ Collision detection (world objects block tiles)
- ✅ Resource harvesting (mining, woodcutting)
- ✅ Multiplayer (Socket.IO)
- ✅ Position persistence (SQLite)
- ✅ Camera settings persistence (IndexedDB)
- ✅ Inventory system (28 slots)
- ✅ Skills with XP and leveling
- ✅ Basic UI (sidebar with tabs)
- ✅ Player model with equipment rendering
- ✅ 8-directional facing with smooth rotation
- ✅ Walking animation (tick-synced)
- ✅ OSRS-style movement interpolation
- ✅ Debug panel (tick progress, true tile, collision map)
- ✅ Performance settings (view distance, shadows, FPS counter)
- ✅ Map Editor (separate app on port 3002)
- ✅ Admin commands for privileged users

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
| `admin` | `{ command, args? }` | Admin command (admin users only) |
| `toggle-run` | `{ }` | Toggle running on/off |

**Server → Client:**
| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ playerId, worldObjects, worldTiles, players, tickStartTime, tickDuration, worldWidth, worldHeight, isAdmin }` | Initial state |
| `world-update` | `WorldObject[]` | Resource states |
| `players-update` | `{ players, tickStartTime }` | All players with sync timing |
| `position-update` | `{ x, y, startX, startY, facing, tickStartTime, isRunning?, runEnergy? }` | Own position (for interpolation) |
| `harvest-started` | `{ x, y, objectId }` | Harvest action confirmed |
| `inventory-update` | `Record<string, number>` | Inventory |
| `chat` | `{ username?, message, type }` | Chat message |
| `player-joined` | `{ id, username }` | Player joined notification |
| `player-left` | `{ id, username }` | Player left notification |
| `run-state-update` | `{ isRunning, runEnergy }` | Run toggle response |

## Running Mechanics (OSRS-style)

### How Running Works
- Player moves **2 tiles per tick** instead of 1 when running
- Every other tile is **skipped** (not walked through)
- Path becomes: start → start+2 → start+4 (NOT start+1, start+2, start+3)
- Animation speed is **2x faster** when running

### Run Energy System
- **Max energy**: 100
- **Depletion**: 1 energy per tick while running
- **Restoration**: 0.5 energy per tick when standing still
- Running auto-disables when energy reaches 0

### Client Controls
- Press **R** key to toggle run
- Click the **run energy orb** in sidebar to toggle
- Visual indicator shows current energy and running state

### Server-side Logic (`server/actions/movement.ts`)
```typescript
const stepsToMove = isRunning ? 2 : 1;
// Process 2 steps in path instead of 1 when running
```

### Client-side State (`src/client/stores/gameStore.ts`)
- `runEnergy: number` - Current run energy (0-100)
- `isRunning: boolean` - Whether player is in running mode
- `toggleRun()` - Toggle running (respects energy)
- `setRunState(isRunning, runEnergy)` - Update from server

## Code Style

- TypeScript strict mode
- Types in `src/shared/types/`
- Components small and focused
- No game logic in client
- No `any` unless absolutely necessary
- ESM modules (package.json has `"type": "module"`)

---

## Animation System

The animation system syncs character animations to the 600ms server tick system for OSRS-style movement.

### Architecture

**Movement Progress (0 to 1)**
- Server sends `tickStartTime` with each position update
- `usePositionInterpolation` hook calculates `movementProgress` from 0.0 to 1.0 over exactly 600ms
- This progress drives all animation phases

**Animation State Machine**
- **Idle**: Arms at sides, slight breathing motion (2-second cycle)
- **Walk**: Leg swing + arm swing, one full cycle per tile (600ms)
- **Run**: Faster cycle (2x speed), more pronounced movement

### Key Formulas

```typescript
// Walk phase = progress * 2π (one full cycle per tile)
const walkPhase = movementProgress * Math.PI * 2;

// Running doubles the speed
const runPhase = movementProgress * Math.PI * 2 * 2;

// Leg rotation using sine wave
const legAngle = Math.sin(walkPhase) * maxLegAngle; // maxLegAngle = 0.5 (walk), 0.8 (run)

// Arm rotation (opposite phase to legs)
const armAngle = -Math.sin(walkPhase) * maxArmAngle; // maxArmAngle = 0.4 (walk), 0.6 (run)

// Vertical bob synced to walk
const bob = Math.abs(Math.sin(walkPhase)) * bobAmount; // bobAmount = 0.05 (walk), 0.08 (run)
```

### Components

| File | Purpose |
|------|---------|
| `PlayerModel.tsx` | Renders 3D humanoid with procedural animations |
| `LocalPlayer.tsx` | Passes movement state to PlayerModel |
| `RemotePlayer.tsx` | Renders other players with interpolated positions |
| `usePositionInterpolation.ts` | Calculates movement progress from server tick |
| `lib/animations/walk.ts` | Animation utility functions |
| `lib/animations/index.ts` | Exports animation utilities |

### PlayerModel Props

```typescript
interface PlayerModelProps {
  x: number;              // Visual X position
  y: number;             // Visual Y position
  facing: FacingDirection; // 8-directional facing
  appearance: PlayerAppearance;
  isMoving?: boolean;     // Whether player is moving
  isRunning?: boolean;    // Whether running (2x speed)
  movementProgress?: number; // 0 to 1 progress within current tick
  isLocalPlayer?: boolean;
}
```

### Implementation Notes

1. **State persistence**: Animation state stored in refs to maintain continuity across renders
2. **Phase continuity**: Walk phase accumulates continuously (0 → 2π → 4π → etc) through tile boundaries - NOT reset at each tile
3. **Breathing**: Idle animation uses 2-second sine wave cycle for subtle arm/body movement
4. **Position**: Player Y position = 0.5 (ground level) + vertical bob when moving
5. **Smooth rotation**: Player facing direction interpolates smoothly (~300ms) when changing direction
6. **Interpolation**: Visual position continues smoothly when new tick arrives mid-animation (no jumping)
7. **Body group reset**: During walking, `bodyGroupRef.position.y` must be reset to 0 to prevent head jitter from residual breathing offset

---

# Known Issues

## Recently Fixed (Feb 2026 - Commit 3668f27)
- ✅ Multiplayer player movement - both players now spawn at different locations
- ✅ Remote player animation - smooth interpolation between tiles
- ✅ Local player movement - using interpolated position correctly

## Issues Needing Testing (Feb 2026)

### Movement & Pathfinding
- [ ] Remote player movement - verify smooth animation when other player moves
- [ ] Player teleporting during walk/run cycle - should animate smoothly
- [ ] Multiplayer: second player joins - both should work without glitches
- [ ] Multiplayer: chunk/visibility calculated around correct player

### Harvesting & Skills
- [ ] Resources don't visually deplete (trees should become stumps, rocks grey)
- [ ] Can mine/chop without required tools (should check for pickaxe, axe)
- [ ] XP not awarded on harvest (needs verification)
- [ ] No fishing spots or cooking fires in world for new skills

### UI/UX
- [ ] Tick info progress bar not showing progress in debug panel
- [ ] Run energy UI not working properly
- [ ] Hover tooltip not showing
- [ ] Right-click menu incomplete (Walk here, Mine, Chop, etc.)
- [ ] Right-click menu: Add inventory options (Use, Drop, Equip, Examine)
- [ ] Equipment tab: Add all 14 OSRS equipment slots
- [ ] Equipment bonuses not displayed in UI

### Animation
- [ ] Blue screen flash on first resource harvest after login
- [ ] Walk animation doesn't sync properly with movement
- [ ] OSRS models not imported (using procedural models)

### Performance
- [ ] FPS drops over time (suspected memory leak)
- [ ] Performance issues reported by users

### Previously Fixed (may still apply)
- ✅ FPS drops (FIXED in earlier commit)
- ✅ Inventory persistence (FIXED)
- ✅ Duplicate login (FIXED)
- ✅ Welcome message (FIXED)
- ✅ Hydration errors (FIXED - need verification)
- ✅ Player ground alignment (FIXED - need verification)

## Critical (Blocking)

### 1. Map Editor Coordinate System
- **Issue**: Painting/placement happens on opposite side of cursor
- **Location**: `map-editor/src/components/EditorCursor.tsx` and `EditorWorld.tsx`
- **Cause**: Coordinate transformation between Three.js world space and tile grid is inverted
- **Fix needed**: The z-axis flip in coordinate conversion is incorrect

### 2. Player Floating in 3D World
- **Issue**: Players float above the ground instead of standing on tiles
- **Location**: `src/client/components/players/PlayerModel.tsx`
- **Cause**: Y position not aligned with terrain height

### 3. Hydration Errors
- **Issue**: Server/client HTML mismatch errors in both game and map editor
- **Locations**: Various components rendering differently on server vs client
- **Cause**: Possibly Math.random, Date.now, or other client-specific code in SSR

### 4. Saved Maps Not Loading in Game
- **Issue**: Maps saved in map editor don't appear in game
- **Cause**: Game server loads world once on startup, doesn't reload on save

## High Priority

### 5. Player Starts at Wrong Position
- **Issue**: New players spawn at incorrect coordinates
- **Location**: Server player spawn logic

### 6. World Objects Not Rendering
- **Issue**: Trees and rocks from map editor don't appear in game
- **Cause**: Object loading in World.tsx doesn't use database objects

### 7. Map Editor Object Placement Doesn't Work
- **Issue**: Place tool doesn't place objects when clicking
- **Location**: `map-editor/src/components/EditorCursor.tsx`
- **Cause**: Tool not fully wired up

---

# Features to Implement

## New Features Priority (Feb 2026)

### Right-Click Menu System
- **Context-sensitive menu** appearing on right-click
- **Inventory right-click options:**
  - "Use" - Use item (eat food, drink potions, etc.)
  - "Drop" - Drop item on ground
  - "Equip" - Equip item (weapons, armor, tools)
  - "Examine" - Show item description
- **Ground right-click options:**
  - "Walk here" - Walk to tile
  - "Examine" - Show tile/object info
- **Resource right-click options:**
  - "Mine" - Start mining
  - "Chop" - Start woodcutting
  - "Walk here" - Approach resource
- **Player right-click options:**
  - "Walk here" - Walk to player
  - "Trade" - Request trade
  - "Follow" - Follow player

### Full Equipment System (OSRS-style)
- **14 Equipment slots:**
  1. Head (Helm)
  2. Cape
  3. Neck (Amulet)
  4. Main Hand (Weapon)
  5. Body (Chest)
  6. Off Hand (Shield)
  7. Legs
  8. Hands (Gloves)
  9. Feet (Boots)
  10. Ring
  11. Ammunition (Arrows, bolts)
  12. Quiver (for ranged)
  13. Aura (cosmetic)
  14. Pocket (cosmetic)
- **Two-handed weapons** occupy Main Hand + Off Hand slots
- **Equipment bonuses** displayed in equipment tab
- **Equipment overlays** on player model

### OSRS 3D Models & Animations
- **Easy Sources (No Export Required):**
  - **Free GLB Models**: https://opensource3dassets.com/ - 991+ CC0 3D assets
  - **Polygonal Mind**: https://github.com/ToxSam/cc0-models-Polygonal-Mind - CC0 models
  - **Sketchfab**: Search "medieval knight" → filter "Downloadable" → free
  - **Mixamo** (https://mixamo.com): Upload any character → auto-rigged → add animations → export GLB
- **Advanced (Requires Extraction):**
  - RuneLite Model Exporter plugin: https://runelite.phyce.dev/model-exporter
  - RuneBlend Blender add-on: https://github.com/tamateea/runeblend
- **Required animations:**
  - Idle (breathing)
  - Walk (1 tile per 600ms tick)
  - Run (2 tiles per tick)
  - Attack (melee, ranged, magic)
  - Harvest (mining, woodcutting)
  - Emotes
- **Implementation:**
  - Use `@react-three/drei useGLTF` for model loading
  - Use `useAnimations` hook for animation clips
  - Blend between animations smoothly
  - Models go in: `public/assets/models/`
  - Use `src/client/lib/modelLoader.ts` for loading

### OSRS 2D Item Icons
- **Easy Source:**
  - OSRS Wiki: `https://oldschool.runescape.wiki/images/{ItemName}.png`
  - Use `src/client/lib/osrsIcons.ts` to get icon URLs
- **Advanced:**
  - osrsbox-db (GitHub): Full item database with PNG icons
  - https://github.com/osrsbox/osrsbox-db

## Movement & Combat

### Running
- Implement "running" where players move 2 tiles per tick instead of 1
- OSRS running mechanics:
  - Player can toggle run (hotkey)
  - Run energy depletes over time
  - Every other tile is skipped during run
  - Path becomes: start → start+2 → start+4 (not start+1, start+2, start+3)
- Server-side: Change movement logic to skip tiles when running
- Client-side: Add run toggle button, show run energy bar

### Pathfinding Improvements
- Diagonal movement already supported
- Add running path calculation (every-other-tile)
- Optimize for longer paths

### Combat System
- **Melee combat**: Attack range, hit chance, damage formulas
- **Magic combat**: Spells, runes, spellbook
- **Ranged combat**: Bows, crossbows, arrows, bolts
- **Armor system**: Defense bonuses, equipment slots
- **Combat styles**: Accurate, Aggressive, Defensive (OSRS-style)
- **Hit detection**: Based on tick timing

## Skills & Gathering

### Skill System Improvements
- Woodcutting: Trees regrow after depletion (already partially working)
- Mining: Rocks regrow after depletion (already partially working)
- Fishing: Add fishing spots, rods, bait
- Firemaking: Light logs, use tinderbox
- Cooking: Raw food → cooked food
- Smithing: Smelt ores at furnace, smith items
- Crafting: Make items from materials
- Fletching: Make bows and arrows
- Herblore: Potions from herbs

### Skill Experience Curves
- Use OSRS XP curve: `xp = floor((level - 1) * (level - 1) * (level - 1) * 100 / 125000)`
- Each skill has level requirements for items

## Items & Equipment

### Equipment System
- Equipment slots: Helm, Chest, Legs, Cape, Shield, Main Hand, Ammo
- Equipment bonuses: Attack stab/slash/crush, Defense, Ranged strength, Magic damage
- Item degradation: Some items degrade over time
- Equipment spawns: Monsters drop items

### Item Categories
- Weapons: All combat styles
- Armor: All slots
- Tools: Pickaxe (mining), Axe (woodcutting), etc.
- Consumables: Food, potions
- Materials: Ores, logs, bars, etc.
- Runes: For magic
- Ammo: Arrows, bolts

### Inventory System
- 28 slots (OSRS standard)
- Stackable items
- Bank system (save items when logging out)

## World & Environment

### Terrain
- Different tile types: Grass, water, sand, rock, etc. (from map editor)
- Terrain height variations: Hills, valleys
- Water as obstacle (can't walk through without water walking)
- Walkable surfaces by tile type

### World Objects
- Trees: Oak, willow, maple, yew, magic (different XP, respawn times)
- Rocks: Copper, tin, iron, coal, gold, mithril, adamant, rune
- Fishing spots: Shrimp, trout, salmon, etc.
- Nature objects: Flowers, bushes, etc.

### Locations (Villages/Cities)
- Lumbridge-style starter area
- Al Kharid (desert)
- Varrock (main city)
- Falador (white knights)
- Edgeville (PVP area)
- Each with:
  - NPCs (shopkeepers, quest givers)
  - Banks
  - Equipment stores
  - Skill locations

### Roads
- Path tiles that connect locations
- Auto-walk to destination

### Random Events
- Random events that spawn during skilling (like OSRS)
- Mysterious stranger, tree spirit, etc.

## NPCs & Quests

### NPC System
- Shop NPCs: Buy/sell items
- Quest NPCs: Give quests, dialogue
- Monster NPCs: Spawn in world, can be killed for drops

### Quest System
- Quest definitions (requirements, steps, rewards)
- Quest journal
- Quest books

### Economy
- Grand Exchange / Marketplace
- Player trading
- Shop prices

## User Interface

### Minimap
- Already exists, needs improvement
- Add world map view
- Add waypoint markers

### Settings
- Audio on/off
- Chat filters
- Display options

### Equipment Screen
- Show equipped items
- Show combat stats
- Item right-click menu

## Multiplayer

### Friends List
- Add/remove friends
- See when friends are online
- Quick teleport to friends

### Clans
- Clan chat
- Clan management
- Clan wars

## Technical Improvements

### Performance
- Object pooling for entities
- LOD (level of detail) for distant objects
- Chunk-based world loading
- Frustum culling

### Network
- Client-side prediction improvements
- Lag compensation
- Packet compression

---

# OSRS UI/UX Reference

## Mouse Cursor & Click Feedback

OSRS uses specific visual feedback for mouse interactions:
- **Normal cursor**: Standard arrow pointer (not click cursor)
- **Yellow X**: Shown briefly when clicking to walk/move somewhere
- **Red X**: Shown briefly when clicking to perform an action (mining, woodcutting, combat)
- Duration: ~200ms flash, then disappears

## Hover Tooltip (Top-Left)

OSRS displays context-sensitive text in the top-left corner:
- Hovering empty ground: "Walk here"
- Hovering resource: "Mine Iron rock" / "Chop down tree"
- Hovering NPC: "Talk to [Name]" / "Attack [Name]"
- Hovering player: "Walk here" / "Trade with [Name]" / "Attack"
- Uses "Mouseover text" setting to enable/disable

## Right-Click Menu

OSRS uses right-click for context menus:
- Right-click on ground: "Walk here"
- Right-click on resource: "Mine", "Chop down"
- Right-click on NPC: "Talk to", "Attack", "Trade"
- Right-click on player: "Follow", "Trade", "Attack"
- "Cancel" option always available

## XP Drops

OSRS shows floating XP numbers when gaining experience:
- Appears near player character
- Floats upward and fades out
- Shows amount: "+25" for 25 XP
- Different skills have different colors:
  - Combat (Attack/Strength/Defense): Red
  - Ranged: Green
  - Magic: Blue
  - Skills: Purple/pink
- XP drops appear even if chat effects disabled
- Can customize in RuneLite: size, color, duration

## Run Energy UI

OSRS run energy orb:
- Circular indicator next to run button
- **Depletes**: 1 energy per tick while running
- **Restores**: Only when standing COMPLETELY STILL
- **Restoration timing**: Fills up over 2 ticks (1.2s), then adds 1 energy
- Visual: Empty circle fills gradually, then energy increments
- At 0: Running auto-disables

---

# OSRS Reference Points

- **Tick System**: 600ms per tick (implemented)
- **Coordinate System**: Grid-based, (0,0) top-left
- **Walking**: 1 tile per tick
- **Running**: 2 tiles per tick, every other tile (skipping tiles)
- **Facing**: 8 directions (N, NE, E, SE, S, SW, W, NW)
- **Equipment**: 14 slots
- **Inventory**: 28 slots
- **XP Curve**: Formula: `xp = floor((level - 1)^3 * 100 / 125000)`
- **Combat**: Hit calculation based on levels and bonuses

---

# OSRS Detailed Mechanics

## Tick System (600ms)

The game engine runs on "ticks" - each tick lasts 0.6 seconds (600ms). This is the fundamental unit of time:

- **Movement**: 1 tile per tick (walking), 2 tiles per tick (running)
- **Skilling**: Actions complete on tick boundaries
- **Combat**: Attacks occur on tick boundaries
- **Server broadcasts**: State updates happen at tick boundaries

### Running Mechanics

When running:
- Player moves 2 tiles per tick instead of 1
- Every other tile is SKIPPED (not walked through)
- Path becomes: start → start+2 → start+4 (NOT start+1, start+2, start+3)
- Run energy depletes over time
- Player can toggle run with hotkey

### Tick Manipulation

Advanced players can optimize actions by clicking at specific times within a tick:
- Reduces effective time per action
- Used in skilling (mining, woodcutting) and combat
- Requires precise timing

## Combat System

### Attack Roll
```
maxAttackRoll = effectiveAttackLevel × (attackBonus + 64) × prayerMultiplier
```
- EffectiveAttackLevel = floor(AttackLevel × boosts × voidBonus + 8 + styleBonus)
- Prayer multipliers: Piety=1.2, Incredible Reflexes=1.15
- Void: 1.1, Slayer Helm: 1.15, Salve Amulet: 1.15/1.2

### Defense Roll
```
maxDefenseRoll = (defenseLevel + 64) × equipmentDefenseBonus
```

### Hit Chance
- If attackRoll > defenseRoll: hit lands
- If defenseRoll >= attackRoll: miss (0 damage)
- Magic attacks "splash" on miss

### Damage Roll
- Random number from 0 to maxHit
- Max hit calculated from effective strength + equipment bonuses
- Some monsters have minimum hits

### Combat Styles (OSRS-style)

| Style | XP Given | Bonus |
|-------|----------|-------|
| Accurate | Attack | +3 to effective attack |
| Aggressive | Strength | +3 to effective strength |
| Defensive | Defense | +3 to effective defense |
| Controlled | All three | +1 each |

### Equipment Slots (14 total)

1. **Head** (Helm)
2. **Cape**
3. **Neck** (Amulet)
4. **Main Hand** (Weapon)
5. **Body** (Chest)
6. **Off Hand** (Shield)
7. **Legs**
8. **Hands** (Gloves)
9. **Feet** (Boots)
10. **Ring**
11. **Ammunition** (Arrows, bolts)

Two-handed weapons take slot 4 + 6 (no shield)

### Equipment Bonuses

**Attack bonuses:**
- Stab, Slash, Crush (melee)
- Ranged
- Magic

**Defense bonuses:**
- Stab, Slash, Crush (melee)
- Ranged Defense
- Magic Defense

**Other bonuses:**
- Strength (increases max hit)
- Ranged Strength
- Magic Damage %
- Prayer (enhances prayers)
- Weight (affects run energy)

## Experience & Leveling

### XP Curve Formula
```
xpForLevel(n) = floor((n-1)³ × 100 / 125000)
```

### XP Table (Partial)
| Level | Total XP |
|-------|----------|
| 1 | 0 |
| 10 | 1,154 |
| 20 | 4,470 |
| 30 | 13,363 |
| 50 | 101,333 |
| 70 | 814,445 |
| 90 | 4,298,677 |
| 99 | 13,034,431 |

### Skill Requirements for Items

**Axes (Woodcutting):**
- Bronze/Iron: Level 1
- Steel: Level 6
- Black: Level 11
- Mithril: Level 21
- Adamant: Level 31
- Rune: Level 41
- Dragon: Level 61
- Crystal/Elder: Level 81+

**Pickaxes (Mining):**
- Same tier progression as axes
- Also requires Attack level to wield

## Skills Details

### Mining
- **Mechanic**: Click rock to mine, rolls for success each tick
- **Success rate**: Based on Mining level + pickaxe speed
- **Tick timing**: Bronze=8 ticks, Iron=6, Steel=4, Mithril=3, Rune=2
- **Affects**: Time between possible resource rolls

### Woodcutting
- **Mechanic**: Click tree to chop, rolls for success each tick
- **Axe tier**: Higher tier = faster chance at logs
- **Trees**: Regular → Oak (15) → Willow (30) → Maple (45) → Yew (60) → Magic (75)

### Fishing
- **Equipment**: Fishing rod, net, harpoon
- **Spots**: Different fish at different levels
- **Fish types**: Shrimp (1) → Trout (20) → Salmon (30) → Tuna (35) → Lobster (40) → Swordfish (50) → Shark (76) → Anglerfish (82)

### Cooking
- **Raw items**: Must be cooked on range/fire
- **Burn chance**: Decreases with level and using Chef's hat
- **Types**: Shrimp → Trout → Salmon → Tuna → Lobster → Swordfish → Shark

### Smithing
- **Ores**: Copper+Tin → Bronze → Iron → Steel → Mithril → Adamant → Rune → Dragon
- **Furnace**: Smelt ores into bars
- **Anvil**: Smith bars into equipment

### Other Skills
- **Firemaking**: Light logs (needs tinderbox)
- **Fletching**: Make bows, arrows from logs
- **Crafting**: Make leather, glass, jewelry
- **Herblore**: Make potions from herbs
- **Agility**: Shortcuts, run energy regeneration
- **Thieving**: Pickpocket, chest locks

## Inventory & Banking

### Inventory
- **Capacity**: 28 slots
- **Stackable items**: Coins, runes, arrows, ores, etc. take 1 slot regardless of qty
- **Non-stackable**: Take 1 slot each

### Bank
- **Capacity**: 400 (F2P), 800 (members)
- **Features**: Tabs, deposit/withdraw all, note withdrawal
- **Bank PIN**: Adds security +8 storage

## World & Environment

### Tile Types (from map editor)
- Grass (default walkable)
- Water (obstacle, needs boat/水中)
- Sand (walkable, slower?)
- Stone (walkable)
- Snow (walkable)
- Dungeon/Cave (underground areas)

### Terrain Height
- Map editor allows raising/lowering tiles
- Affects player visual position
- Pathfinding considers height differences

### World Objects

**Trees (Woodcutting):**
| Tree | Level | XP | Respawn |
|------|-------|-----|---------|
| Regular | 1 | 25 | Fast |
| Oak | 15 | 37.5 | Medium |
| Willow | 30 | 67.5 | Medium |
| Maple | 45 | 100 | Slow |
| Yew | 60 | 175 | Slow |
| Magic | 75 | 250 | Very Slow |

**Rocks (Mining):**
| Rock | Level | XP | Respawn |
|------|-------|-----|---------|
| Copper | 1 | 17.5 | Fast |
| Tin | 1 | 17.5 | Fast |
| Iron | 15 | 35 | Medium |
| Coal | 30 | 50 | Medium |
| Mithril | 55 | 80 | Slow |
| Adamant | 70 | 120 | Very Slow |
| Rune | 85 | 200 | Very Slow |
| Dragon | 92 | 300 | Extremely Slow |

### Locations (Future)

- **Lumbridge**: Starter area, tutorial, cow pens, wheat fields
- **Varrock**: Main city, bank, shops, castle
- **Edgeville**: PVP area, bank
- **Falador**: White knights, smithing guild
- **Al Kharid**: Desert, desert amulet teleports

### Roads
- Path tiles connecting locations
- Auto-walk between destinations

## NPCs & Quests

### NPC Types
- **Shop NPCs**: Buy/sell items, different stock per shop
- **Quest givers**: Start/complete quests
- **Monsters**: Spawn in world, drop items, have HP/levels
- **Bankers**: Access to bank interface

### Quest System
- Prerequisites (level, items, other quests)
- Steps (talk to NPC, gather items, kill monsters)
- Rewards (XP, items, access)

## Economy

- **Grand Exchange**: Central marketplace
- **Player Trading**: Direct trade, trade requests
- **Shop Prices**: Fixed prices, some dynamic
- **Alchemy**: High Alchemy (green magic), Low Alchemy

## Random Events

- Mysterious stranger
- Tree spirit
- Coin spinner
- Evil turnkey
- Behavior based on skill being trained

---

# Animation System (Critical Implementation Details)

## The Problem with Current Implementation

The current implementation has broken walking animation because:
1. Animation is not synced to the 600ms server tick
2. Walk cycle doesn't complete exactly once per tile moved
3. Client uses its own timing instead of server tick timestamps

## Correct Animation Sync System

### OSRS-Style Tick Animation

The server sends: `{ x, y, startX, startY, tickStartTime }` where:
- `tickStartTime`: Unix timestamp when the server tick started
- Movement from startX,startY to x,y takes exactly ONE tick (600ms)

### Client Interpolation Formula

```typescript
// In usePositionInterpolation hook:
function getMovementProgress(tickStartTime: number, tickDuration: number): number {
  const now = performance.now();
  const elapsed = now - (tickStartTime + timeOffset); // timeOffset = client - server
  const progress = elapsed / tickDuration; // 0.0 to 1.0 over exactly 600ms
  return Math.min(Math.max(progress, 0), 1);
}
```

### Walk Animation Phase

```typescript
// One full walk cycle = one tile movement
// Using sine wave for leg swing
const walkPhase = movementProgress * Math.PI * 2; // 0 to 2π per tile
const leftLegAngle = Math.sin(walkPhase) * maxLegAngle;
const rightLegAngle = Math.sin(walkPhase + Math.PI) * maxLegAngle;
```

### Key Points

1. **One cycle per tile**: Complete walk animation takes exactly 600ms (one tick)
2. **Phase = progress × 2π**: When progress=0, phase=0. When progress=1, phase=2π
3. **Linear interpolation**: Position lerps from start → end over the same 600ms
4. **tickStartTime is critical**: Must use server's tickStartTime for sync

### Animation Components

- **Idle**: Arms at sides, slight breathing
- **Walking**: Legs alternate, arms swing opposite to legs
- **Running**: Faster leg cycle, more arm swing
- **Equipment affects animation**: Different walk cycles with weapons

### Resources

- **Mixamo** (mixamo.com): Free character models and animations
- **@react-three/drei useAnimations**: Hook for GLTF animations
- **three.js AnimationMixer**: Controls animation playback
- **State machine**: Idle → Walk → Run transitions

---

# Network & Interpolation

## Client-Side Prediction

For responsive feel, client predicts movement immediately:
1. Player clicks → Client immediately starts visual movement
2. Server processes on next tick → Sends authoritative position
3. Client reconciles → If different, snap to server position

## Entity Interpolation (Remote Players)

For other players:
1. Server sends positions at tick boundaries (every 600ms)
2. Client interpolates smoothly between known positions
3. Always render "in the past" by one tick to allow interpolation

## Timing

- **Server tick**: 600ms (fixed)
- **Client tick**: 20ms (for smooth rendering)
- **30 client ticks per server tick**

### OSRS ExactMove System

The server sends:
- `movementType`: walk or run
- `startX, startY`: Position at tick start
- `endX, endY`: Position at tick end  
- `tickStartTime`: When movement started
- `delays`: [delay1, delay2] for start/end animation timing

---

# Three.js & React Three Fiber Resources

## Character Animation

- **@react-three/drei useGLTF**: Load GLTF/GLB models
- **@react-three/drei useAnimations**: Extract and play animations
- **three.js AnimationMixer**: Controls animation clips

## Example Animation Loading

```typescript
const { scene, animations } = useGLTF('/character.glb');
const { actions } = useAnimations(animations, group);

// Play animation
actions.Walk?.play();

// Crossfade between animations
actions.Idle?.fadeOut(0.2);
actions.Walk?.reset().fadeIn(0.2).play();
```

## Character Controllers

- **pmndrs/ecctrl**: Floating rigidbody character controller
- **thomas-rooty/r3f-character-controls**: Boilerplate for R3F movement
- **pmndrs/BVHEcctrl**: BVH-based character controller

## Mixamo Workflow

1. Create/upload character to mixamo.com
2. Auto-rig character (free)
3. Download animations (walk, run, idle, etc.)
4. Export as GLB with embedded animations
5. Load in Three.js with AnimationMixer

---

# Claude Code / AI Agent Resources

## Official Anthropic Skills

- **anthropics/skills** (GitHub): Official Agent Skills repository
- Contains folder-based instructions for specialized tasks

## Community Skills

- **travisvn/awesome-claude-skills**: Curated list of Claude Skills
- **jezweb/claude-skills**: Production-ready skills (React, Cloudflare, Tailwind)
- **CloudAI-X/threejs-skills**: Three.js specific skills

## Claude Code Configuration

- **CLAUDE.md**: Project-specific instructions (in project root)
- **Slash commands**: Custom commands invoked with `/command`
- **Subagents**: Specialized agents with their own context

## Key Resources

- **Gabriel Gambetta**: Client-side prediction & server reconciliation articles
- **Fish-Net Networking**: NetworkTickSmoother documentation
- **Unity Netcode**: Client-side interpolation patterns

---

# WebScape Godot Test Version

## Overview

This section documents the `webscape-godot/` folder - an experimental Godot-based client for testing as an alternative to Three.js.

## IMPORTANT: This Folder Should NOT Be Committed to Git

The `webscape-godot/` and `server-godot/` folders are for **testing purposes only**:
- Used to evaluate Godot as an alternative game framework
- Should NOT be committed to the main git repository
- Can be deleted at any time if Godot approach is abandoned

## Related Folders

| Folder | Purpose |
|--------|---------|
| `webscape-godot/` | Godot 4.x game client project |
| `server-godot/` | WebSocket server for Godot client |
| `app/` | Original Three.js client (main) |
| `server/` | Original Socket.IO server (main) |

## Key Differences from Main Version

| Aspect | Three.js (Main) | Godot (Test) |
|--------|-----------------|--------------|
| Framework | Three.js + React | Godot 4.x |
| Language | TypeScript/JavaScript | GDScript |
| Network | Socket.IO | WebSocket |
| Memory | Manual management | Engine handles |
| Export | npm build | Godot export |

## Development Workflow

1. Run main server: `npm run server` (port 3001)
2. Run Godot server: `cd server-godot && npm run dev` (port 3003)
3. Open `webscape-godot/` in Godot editor
4. Test and compare both clients against same game logic

## For AI Agent Reference

When working on webscape-godot/:
- Use the Godot skill in `.claude/skills/godot/`
- Check the AGENTS.md inside webscape-godot/ for detailed instructions
- Reference the Three.js version only for feature parity - do not modify main code
