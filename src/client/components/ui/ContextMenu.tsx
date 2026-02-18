"use client";

import { useUIStore, ContextMenuItem } from "@/client/stores/uiStore";
import { useEffect, useRef } from "react";

export function ContextMenu() {
  const { contextMenu, closeContextMenu } = useUIStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  if (!contextMenu.isOpen) return null;

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled) return;
    item.action();
    closeContextMenu();
  };

  let adjustedX = contextMenu.x;
  let adjustedY = contextMenu.y;

  if (menuRef.current) {
    const menuWidth = 160;
    const menuHeight = contextMenu.items.length * 28 + 8;
    
    if (adjustedX + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10;
    }
    if (adjustedY + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10;
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#1a1a1a] border border-[#4a4a4a] rounded-sm shadow-lg min-w-[140px]"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      {contextMenu.items.map((item, index) => (
        <button
          key={index}
          onClick={() => handleItemClick(item)}
          disabled={item.disabled}
          className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
            item.disabled
              ? "text-[#666] cursor-not-allowed"
              : "text-[#e0e0e0] hover:bg-[#4a4a4a] cursor-pointer"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
