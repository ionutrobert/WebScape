'use client';

import { useGameStore } from '@/client/stores/gameStore';
import { useEffect, useRef } from 'react';

export function ClickFeedback() {
  const { clickFeedbacks, cleanupClickFeedbacks } = useGameStore();
  const cleanupRef = useRef<number | null>(null);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    cleanupRef.current = window.setInterval(cleanupClickFeedbacks, 100);
    return () => {
      if (cleanupRef.current) {
        clearInterval(cleanupRef.current);
      }
    };
  }, [cleanupClickFeedbacks]);

  useEffect(() => {
    clickFeedbacks.forEach((fb) => {
      if (processedRef.current.has(fb.id)) return;
      processedRef.current.add(fb.id);
      setTimeout(() => {
        processedRef.current.delete(fb.id);
        cleanupClickFeedbacks();
      }, 200);
    });
  }, [clickFeedbacks, cleanupClickFeedbacks]);

  if (clickFeedbacks.length === 0) return null;

  return (
    <>
      {clickFeedbacks.map((fb) => (
        <div
          key={fb.id}
          className="click-feedback"
          style={{
            left: fb.screenX,
            top: fb.screenY,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className={`click-x ${fb.type}`}
          >
            <path
              d="M5 5L19 19M19 5L5 19"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
      <style jsx global>{`
        .click-feedback {
          position: fixed;
          pointer-events: none;
          z-index: 50;
          transform: translate(-50%, -50%);
          animation: clickFlash 200ms ease-out forwards;
        }
        .click-x {
          stroke: #fbbf24;
        }
        .click-x.action {
          stroke: #ef4444;
        }
        @keyframes clickFlash {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }
      `}</style>
    </>
  );
}
