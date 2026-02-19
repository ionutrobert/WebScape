"use client";

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "@/client/stores/gameStore";
import { SKILLS_CONFIG, xpToLevel, levelProgress } from "@/data/skills";
import {
  SkillKey,
  PositionUpdate,
  PlayersUpdate,
  InitData,
} from "@/shared/types";
import { GameLoop } from "@/client/components/GameLoop";
import { GameScene } from "@/client/components/GameScene";
import { XpDropManager } from "@/client/components/ui/XpDrop";
import { ClickFeedback } from "@/client/components/ui/ClickFeedback";
import { getCachedItemIcon } from "@/client/lib/osrsIcons";
import { GAME_NAME } from "@/data/game";
import { OBJECTS } from "@/data/objects";
import { calculateFacing } from "@/client/lib/facing";
import { io, Socket } from "socket.io-client";
import { Backpack, User, Sword, Send, Activity } from "lucide-react";
import { useFrame } from "@react-three/fiber";

type TabType = "inventory" | "skills" | "equipment" | "debug";

function FPSCounter() {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const updateFPS = () => {
      frames.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      if (delta >= 1000) {
        setFps(Math.round((frames.current * 1000) / delta));
        frames.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-stone-900/90 border border-stone-700 rounded px-3 py-2 text-sm">
      <div className="text-green-500 font-bold">FPS: {fps}</div>
    </div>
  );
}

export default function GamePage() {
  const [username, setUsername] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const [mounted, setMounted] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [tickProgress, setTickProgress] = useState(0);

  const {
    xp,
    inventory,
    chatLog,
    isLoaded,
    players,
    setUsername: setStoreUsername,
    addChatMessage,
    setWorldObjects,
    setWorldSize,
    setWorldTiles,
    setCollisionMap,
    setPosition,
    setInventory,
    setLoaded,
    setPlayerId,
    setPlayers,
    playerId,
    loadClientSettings,
    setIsAdmin,
    setTargetDestination,
    camera,
    cameraRestored,
    debugSettings,
    setDebugSettings,
    performanceSettings,
    setPerformanceSettings,
    position,
    runEnergy,
    isRunning,
    isMoving,
    setRunState,
    toggleRun,
    setFacing,
  } = useGameStore();

  const [fillProgress, setFillProgress] = useState(0);
  const [displayEnergy, setDisplayEnergy] = useState(100);
  const fillStartTime = useRef<number | null>(null);
  const lastRunEnergy = useRef(runEnergy);
  const currentDisplayEnergy = useRef(displayEnergy);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    currentDisplayEnergy.current = displayEnergy;
  }, [displayEnergy]);

  useEffect(() => {
    if (runEnergy !== lastRunEnergy.current) {
      setDisplayEnergy(runEnergy);
      lastRunEnergy.current = runEnergy;
      setFillProgress(0);
      fillStartTime.current = null;
    }
  }, [runEnergy]);

  useEffect(() => {
    if (isMoving) {
      setFillProgress(0);
      fillStartTime.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    if (currentDisplayEnergy.current >= 100) {
      setFillProgress(0);
      fillStartTime.current = null;
      return;
    }

    if (fillStartTime.current === null) {
      fillStartTime.current = performance.now();
    }

    const animate = () => {
      if (fillStartTime.current === null) return;
      
      const elapsed = performance.now() - fillStartTime.current;
      const newProgress = Math.min(100, (elapsed / 1200) * 100);
      setFillProgress(newProgress);

      if (newProgress >= 100) {
        setDisplayEnergy((prev) => Math.min(100, prev + 1));
        fillStartTime.current = performance.now();
        setFillProgress(0);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMoving]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLog]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const handleLogin = () => {
    if (!username.trim() || isLoggingIn) return;
    setIsLoggingIn(true);

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket", "polling"],
    });

    let myPlayerId: string | null = null;

    newSocket.on("connect", () => {
      setConnected(true);
      newSocket.emit("join", username);
    });

    newSocket.on(
      "init",
      async (data: InitData & { collisionMap?: boolean[][] }) => {
        myPlayerId = data.playerId;
        setStoreUsername(username);
        setPlayerId(data.playerId);
        
        setWorldObjects(data.worldObjects);
        setWorldSize(data.worldWidth, data.worldHeight);
        setWorldTiles(data.worldTiles || []);
        if (data.collisionMap) {
          setCollisionMap(data.collisionMap);
        }
        setIsAdmin(data.isAdmin || false);

        // Debug: verify we found ourselves in the players list
        const me = data.players?.find((p) => p.id === data.playerId);
        if (me) {
          console.log(`[Init] Setting position to (${me.x}, ${me.y}) for player ${data.playerId}`);
          setPosition({ x: me.x, y: me.y });
        } else {
          console.warn(`[Init] Could not find self in players list, using default position`);
          setPosition({ x: 10, y: 10 });
        }

        useGameStore.getState().tickStartTime = data.tickStartTime;
        useGameStore.getState().tickDuration = data.tickDuration;

        if (data.inventory) {
          const inventory: { id: string; qty: number }[] = Array(28).fill(null);
          let slotIndex = 0;
          for (const [itemId, quantity] of Object.entries(data.inventory)) {
            if (slotIndex < 28 && quantity > 0) {
              inventory[slotIndex] = { id: itemId, qty: quantity as number };
              slotIndex++;
            }
          }
          setInventory(inventory);
        } else {
          setInventory(Array(28).fill(null));
        }

        if (data.skillXp) {
          useGameStore.getState().setXp(data.skillXp as any);
        }

        setIsLoggingIn(false);
        setSocket(newSocket);
        setLoaded(true);
        addChatMessage(`Welcome to ${GAME_NAME}, ${username}! Click to move, R to toggle run.`);

        await loadClientSettings();
      },
    );

    newSocket.on("world-update", (world: any[]) => {
      setWorldObjects(world);
    });

    newSocket.on(
      "harvest-started",
      (data: { x: number; y: number; objectId: string }) => {
        const objDef = OBJECTS[data.objectId];
        useGameStore.getState().setAction({
          type: "harvest",
          targetX: data.x,
          targetY: data.y,
          objectId: data.objectId,
          progress: 0,
          ticksRemaining: objDef?.depletionTicks || 4,
        });
      },
    );

    newSocket.on("players-update", (data: PlayersUpdate) => {
      console.log(`[Players-Update] Received ${data.players.length} players, myPlayerId: ${myPlayerId}`);
      const playersMap: Record<
        string,
        {
          id: string;
          username: string;
          x: number;
          y: number;
          startX?: number;
          startY?: number;
          facing: string;
          isRunning?: boolean;
          isHarvesting?: boolean;
        }
      > = {};
      data.players.forEach((p) => {
        if (p.id !== myPlayerId) {
          playersMap[p.id] = {
            id: p.id,
            username: p.username,
            x: p.x,
            y: p.y,
            startX: p.startX,
            startY: p.startY,
            facing: p.facing,
            isRunning: p.isRunning,
            isHarvesting: p.isHarvesting,
          };
        }
      });
      setPlayers(playersMap, data.tickStartTime);
    });

    newSocket.on("position-update", (pos: PositionUpdate) => {
      const state = useGameStore.getState();
      const targetDest = state.targetDestination;

      if (targetDest && pos.x === targetDest.x && pos.y === targetDest.y) {
        useGameStore.getState().setTargetDestination(null);
      }

      console.log(`[Position-Update] Moving to (${pos.x}, ${pos.y}) from (${pos.startX}, ${pos.startY})`);
      setPosition({ x: pos.x, y: pos.y }, { x: pos.startX, y: pos.startY }, pos.tickStartTime);
      if (pos.facing) {
        useGameStore.getState().setFacing(pos.facing as any);
      }
      if (pos.runEnergy !== undefined) {
        useGameStore
          .getState()
          .setRunState(pos.isRunning ?? false, pos.runEnergy);
      }
    });

    newSocket.on(
      "run-state-update",
      (data: { isRunning: boolean; runEnergy: number }) => {
        useGameStore.getState().setRunState(data.isRunning, data.runEnergy);
      },
    );

    newSocket.on("inventory-update", (inv: Record<string, number>) => {
      const invArray: ({ id: string; qty: number } | null)[] = Object.entries(
        inv,
      ).map(([id, qty]) => ({ id, qty }));
      while (invArray.length < 28) invArray.push(null);
      setInventory(invArray as any);
    });

    newSocket.on(
      "chat",
      (data: { username?: string; message: string; type: string }) => {
        if (data.type === "system") {
          addChatMessage(data.message);
        } else {
          addChatMessage(`${data.username}: ${data.message}`);
        }
      },
    );

    newSocket.on("disconnect", () => {
      setConnected(false);
      addChatMessage("Disconnected from server.");
    });

    newSocket.on("collision-update", (map: boolean[][]) => {
      setCollisionMap(map);
    });

    newSocket.on("xp-gain", (data: { skill: string; amount: number }) => {
      const pos = useGameStore.getState().position;
      useGameStore.getState().addXpDrop(data.skill as any, data.amount, pos.x, pos.y);
    });

    newSocket.on("skill-update", (data: { skill: string; xp: number }) => {
      useGameStore.getState().setXp({ [data.skill]: data.xp } as any);
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim() && socket) {
      socket.emit("chat", chatMessage.trim());
      setChatMessage("");
    }
  };

  const handleMove = (x: number, y: number, screenX?: number, screenY?: number) => {
    if (screenX !== undefined && screenY !== undefined) {
      useGameStore.getState().addClickFeedback("move", screenX, screenY);
    }
    setTargetDestination({ x, y });
    socket?.emit("move-to", { x, y });
  };

  const handleHarvest = (x: number, y: number, objectId: string, screenX?: number, screenY?: number) => {
    if (screenX !== undefined && screenY !== undefined) {
      useGameStore.getState().addClickFeedback("action", screenX, screenY);
    }
    const facing = calculateFacing(position.x, position.y, x, y);
    setFacing(facing);
    socket?.emit("harvest", { x, y, objectId });
  };

  const handleToggleRun = () => {
    socket?.emit("toggle-run");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && !e.repeat) {
        handleToggleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [socket]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-amber-500">Loading...</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="bg-stone-800 border border-stone-700 p-8 rounded-lg w-96">
          <h1 className="text-3xl font-bold text-amber-500 mb-2 text-center">
            {GAME_NAME}
          </h1>
          <p className="text-stone-400 text-center mb-6">3D Browser RPG</p>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-stone-900 border border-stone-600 px-4 py-2 rounded mb-4 text-stone-200 placeholder-stone-500"
          />
          <button
            onClick={handleLogin}
            disabled={isLoggingIn || !username.trim()}
            className="w-full bg-amber-700 hover:bg-amber-600 disabled:bg-stone-600 text-white py-2 rounded font-bold"
          >
            {isLoggingIn ? "Connecting..." : "Play"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      <GameLoop />

      <div className="flex-1 relative">
        <ClickFeedback />
        <XpDropManager />
        <GameScene
          onMove={handleMove}
          onHarvest={handleHarvest}
          players={players}
        />

        {performanceSettings.showFps && <FPSCounter />}

        <div className="absolute top-4 left-4 bg-stone-900/90 border border-stone-700 rounded px-3 py-2 text-sm">
          <div className="text-amber-500 font-bold">{username}</div>
          <div className="text-stone-400 text-xs">
            {connected ? "🟢 Online" : "🔴 Offline"}
          </div>
        </div>
      </div>

      <div className="w-72 bg-stone-800 border-l border-stone-700 flex flex-col">
        {/* Compass */}
        <div className="h-16 flex items-center justify-center border-b border-stone-700 relative overflow-hidden">
          <div
            className="relative w-12 h-12 rounded-full border-2 border-amber-600 bg-stone-900"
            style={{
              transform: cameraRestored
                ? `rotate(${-camera.theta * (180 / Math.PI)}deg)`
                : undefined,
            }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-amber-500 font-bold text-xs">
              N
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-stone-500 font-bold text-xs">
              S
            </div>
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 text-stone-500 font-bold text-xs">
              E
            </div>
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 text-stone-500 font-bold text-xs">
              W
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
          </div>
        </div>

        <button
          onClick={handleToggleRun}
          className={`w-full p-2 border-b border-stone-700 flex items-center gap-2 ${isRunning ? "bg-green-900/30" : "bg-stone-800"}`}
        >
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="#44403c"
                strokeWidth="3"
              />
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke={isMoving || displayEnergy >= 100 ? (displayEnergy > 0 ? "#22c55e" : "#78716c") : "#78716c"}
                strokeWidth="3"
                strokeDasharray={`${(isMoving ? runEnergy : (displayEnergy >= 100 ? 100 : fillProgress)) / 100 * 87.96} 87.96`}
                transform="rotate(-90 16 16)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-stone-300">
              {Math.round(isMoving ? runEnergy : displayEnergy)}
            </span>
          </div>
          <div className="flex-1 text-left">
            <div
              className={`text-sm font-bold ${isRunning ? "text-green-400" : "text-stone-400"}`}
            >
              {isRunning ? "Running" : "Walking"}
            </div>
            <div className="text-xs text-stone-500">Press R to toggle</div>
          </div>
        </button>

        <div className="flex border-b border-stone-700">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === "inventory" ? "bg-stone-700 text-amber-500" : "text-stone-400 hover:bg-stone-750"}`}
          >
            <Backpack className="inline w-4 h-4 mr-1" />
            Inv
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === "skills" ? "bg-stone-700 text-amber-500" : "text-stone-400 hover:bg-stone-750"}`}
          >
            <User className="inline w-4 h-4 mr-1" />
            Stats
          </button>
          <button
            onClick={() => setActiveTab("equipment")}
            className={`flex-1 py-2 px-3 text-sm font-bold ${activeTab === "equipment" ? "bg-stone-700 text-amber-500" : "text-stone-400 hover:bg-stone-750"}`}
          >
            <Sword className="inline w-4 h-4 mr-1" />
            Equip
          </button>
          <button
            onClick={() => setActiveTab("debug")}
            className={`flex-1 py-2 px-2 text-sm font-bold ${activeTab === "debug" ? "bg-stone-700 text-amber-500" : "text-stone-400 hover:bg-stone-750"}`}
          >
            <Activity className="inline w-4 h-4 mr-1" />
            Debug
          </button>
        </div>

        <div className="flex-1 p-3 overflow-auto">
          {activeTab === "inventory" && (
            <div className="grid grid-cols-4 gap-1">
              {(inventory || []).slice(0, 28).map((slot: any, i: number) => {
                const iconUrl = slot ? getCachedItemIcon(slot.id) : null;
                return (
                <div
                  key={i}
                  className={`aspect-square bg-stone-900 border border-stone-600 rounded flex items-center justify-center ${slot ? "border-stone-500" : ""}`}
                >
                  {slot && (
                    <div className="text-center">
                      {iconUrl ? (
                        <img 
                          src={iconUrl} 
                          alt={slot.id}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            // Fallback to emoji on error
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-xl">
                          {slot.id?.includes("ore")
                            ? "🪨"
                            : slot.id?.includes("log")
                              ? "🪵"
                              : slot.id === "coins"
                                ? "💰"
                                : "📦"}
                        </div>
                      )}
                      {slot.qty > 1 && (
                        <div className="text-xs text-stone-400">{slot.qty}</div>
                      )}
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-2">
              {(Object.keys(SKILLS_CONFIG) as SkillKey[]).map((skill) => {
                const level = xpToLevel(xp[skill]);
                const progress = levelProgress(xp[skill]);
                return (
                  <div key={skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-stone-300">
                        {SKILLS_CONFIG[skill].name}
                      </span>
                      <span className="text-amber-500 font-bold">{level}</span>
                    </div>
                    <div className="h-2 bg-stone-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-amber-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {(xp[skill] ?? 0).toLocaleString()} XP
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "equipment" && (
            <div className="text-stone-400 text-sm">No equipment yet.</div>
          )}

          {activeTab === "debug" && (
            <div className="space-y-4">
              <div className="bg-stone-900 border border-stone-700 rounded p-3">
                <div className="font-bold text-amber-500 mb-2 text-sm">
                  Tick Info
                </div>
                <div className="space-y-1 text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    <span>Progress:</span>
                    <div className="flex-1 bg-stone-700 rounded h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${tickProgress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right">
                      {Math.round(tickProgress)}%
                    </span>
                  </div>
                  <div>Duration: {useGameStore.getState().tickDuration}ms</div>
                  <div>
                    Visual: ({position.x.toFixed(2)}, {position.y.toFixed(2)})
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-700 rounded p-3">
                <div className="font-bold text-amber-500 mb-2 text-sm">
                  Performance
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-stone-400 mb-1">
                    View Distance: {performanceSettings.viewDistance}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    value={performanceSettings.viewDistance}
                    onChange={(e) =>
                      setPerformanceSettings({
                        viewDistance: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-amber-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={performanceSettings.shadowsEnabled}
                      onChange={(e) =>
                        setPerformanceSettings({
                          shadowsEnabled: e.target.checked,
                        })
                      }
                      className="accent-amber-600"
                    />
                    Shadows
                  </label>

                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={performanceSettings.smoothCamera}
                      onChange={(e) =>
                        setPerformanceSettings({
                          smoothCamera: e.target.checked,
                        })
                      }
                      className="accent-amber-600"
                    />
                    Smooth Camera
                  </label>

                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={performanceSettings.showFps}
                      onChange={(e) =>
                        setPerformanceSettings({ showFps: e.target.checked })
                      }
                      className="accent-amber-600"
                    />
                    Show FPS
                  </label>
                </div>
              </div>

              <div className="bg-stone-900 border border-stone-700 rounded p-3">
                <div className="font-bold text-amber-500 mb-2 text-sm">
                  Debug Overlays
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={debugSettings.showTrueTile}
                      onChange={(e) =>
                        setDebugSettings({
                          ...debugSettings,
                          showTrueTile: e.target.checked,
                        })
                      }
                      className="accent-amber-600"
                    />
                    Show True Tile
                  </label>

                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={debugSettings.showTickInfo}
                      onChange={(e) =>
                        setDebugSettings({
                          ...debugSettings,
                          showTickInfo: e.target.checked,
                        })
                      }
                      className="accent-amber-600"
                    />
                    Show Tick Info
                  </label>

                  <label className="flex items-center gap-2 text-xs text-stone-400">
                    <input
                      type="checkbox"
                      checked={debugSettings.showCollisionMap}
                      onChange={(e) =>
                        setDebugSettings({
                          ...debugSettings,
                          showCollisionMap: e.target.checked,
                        })
                      }
                      className="accent-amber-600"
                    />
                    Show Collision Map
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-48 border-t border-stone-700 flex flex-col bg-stone-900">
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatLog.map((msg, i) => (
              <div key={i} className="text-stone-300 text-sm">
                {msg}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form
            onSubmit={handleSendChat}
            className="flex border-t border-stone-700 p-2"
          >
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder={connected ? "Chat..." : "Connecting..."}
              disabled={!connected}
              className="flex-1 bg-stone-800 border border-stone-600 px-3 py-1 rounded text-stone-200 text-sm"
            />
            <button
              type="submit"
              disabled={!connected}
              className="ml-2 p-1 bg-amber-700 rounded"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
