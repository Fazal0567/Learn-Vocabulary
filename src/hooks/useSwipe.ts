import { useEffect, useRef, useCallback } from 'react';

interface UseSwipeOptions {
  onNext: () => void;
  onPrev: () => void;
  enabled?: boolean;
  threshold?: number;
  cooldownMs?: number;
}

export function useSwipe({
  onNext,
  onPrev,
  enabled = true,
  threshold = 35,
  cooldownMs = 300,
}: UseSwipeOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isLocked = useRef<boolean>(false);
  const lockTimer = useRef<NodeJS.Timeout | null>(null);

  const lockNavigation = useCallback(() => {
    isLocked.current = true;
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      isLocked.current = false;
    }, cooldownMs);
  }, [cooldownMs]);

  // Touch start
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled) return;
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      touchStartTime.current = Date.now();
    },
    [enabled]
  );

  // Touch end
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || touchStartY.current === null) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchEndY - touchStartY.current;
      const deltaX = touchEndX - (touchStartX.current ?? touchEndX);
      const deltaTime = Date.now() - touchStartTime.current;

      touchStartY.current = null;
      touchStartX.current = null;

      if (isLocked.current) return;

      // Check if gesture is predominantly vertical or horizontal
      const isVertical = Math.abs(deltaY) > Math.abs(deltaX);
      const isDistanceMet = isVertical
        ? Math.abs(deltaY) >= threshold
        : Math.abs(deltaX) >= threshold;

      // Allow quick flick gestures (small distance but fast speed)
      const isQuickFlick = isVertical
        ? deltaTime < 250 && Math.abs(deltaY) >= 20
        : deltaTime < 250 && Math.abs(deltaX) >= 20;

      if (isDistanceMet || isQuickFlick) {
        if (isVertical) {
          if (deltaY < 0) {
            // Swiped UP -> Show NEXT word
            lockNavigation();
            onNext();
          } else {
            // Swiped DOWN -> Show PREVIOUS word
            lockNavigation();
            onPrev();
          }
        } else {
          if (deltaX < 0) {
            // Swiped LEFT -> Show NEXT word
            lockNavigation();
            onNext();
          } else {
            // Swiped RIGHT -> Show PREVIOUS word
            lockNavigation();
            onPrev();
          }
        }
      }
    },
    [enabled, threshold, lockNavigation, onNext, onPrev]
  );

  // Wheel / Trackpad handler
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!enabled) return;

      // Always prevent default page scrolling when wheeling in learning reel
      e.preventDefault();

      if (isLocked.current) return;

      // Ignore micro drift
      if (Math.abs(e.deltaY) < 15) return;

      if (e.deltaY > 0) {
        // Scroll DOWN (momentum moving forward) -> NEXT WORD
        lockNavigation();
        onNext();
      } else {
        // Scroll UP (momentum moving back) -> PREVIOUS WORD
        lockNavigation();
        onPrev();
      }
    },
    [enabled, lockNavigation, onNext, onPrev]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || isLocked.current) return;

      // Do not capture if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Next Word keys: ArrowRight, ArrowDown, PageDown, Space, 'j', 'J'
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.code === 'Space' ||
        e.key === 'PageDown' ||
        e.key === 'j' ||
        e.key === 'J'
      ) {
        e.preventDefault();
        lockNavigation();
        onNext();
      }
      // Previous Word keys: ArrowLeft, ArrowUp, PageUp, 'k', 'K'
      else if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageUp' ||
        e.key === 'k' ||
        e.key === 'K'
      ) {
        e.preventDefault();
        lockNavigation();
        onPrev();
      }
    },
    [enabled, lockNavigation, onNext, onPrev]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, [handleKeyDown]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onWheel: handleWheel,
  };
}
