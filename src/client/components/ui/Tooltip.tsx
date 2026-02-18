"use client";

import { useGameStore } from "@/client/stores/gameStore";

export function Tooltip() {
  const { hoverInfo } = useGameStore();

  if (!hoverInfo.type) {
    return null;
  }

  let text = "";

  switch (hoverInfo.type) {
    case "ground":
      text = "Walk here";
      break;
    case "rock":
      text = `Mine ${hoverInfo.name} rock`;
      break;
    case "tree":
      text = `Chop down ${hoverInfo.name} tree`;
      break;
    case "player":
      text = "Walk here";
      break;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "8px",
        left: "8px",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        color: "#ffffff",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "14px",
        fontFamily: "sans-serif",
        pointerEvents: "none",
        zIndex: 1000,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}
