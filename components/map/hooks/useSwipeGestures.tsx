"use client";

import { useState, useRef } from 'react';
import { PanInfo } from 'framer-motion';

interface SwipeGestureConfig {
  threshold?: number;
  velocity?: number;
  enabled?: boolean;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

export function useSwipeGestures(
  callbacks: SwipeCallbacks,
  config: SwipeGestureConfig = {}
) {
  const {
    threshold = 50,
    velocity = 500,
    enabled = true
  } = config;

  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasDraggedRef = useRef(false);

  const handleDragStart = () => {
    if (!enabled) return;
    
    setIsDragging(true);
    hasDraggedRef.current = false;
    
    // Start long press timer
    if (callbacks.onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (!hasDraggedRef.current) {
          callbacks.onLongPress?.();
        }
      }, 500);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (!enabled) return;

    hasDraggedRef.current = true;
    
    // Clear long press timer if user starts dragging
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    // Determine dominant direction
    if (absX > absY) {
      setDragDirection(offset.x > 0 ? 'right' : 'left');
    } else {
      setDragDirection(offset.y > 0 ? 'down' : 'up');
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!enabled) return;

    setIsDragging(false);
    setDragDirection(null);
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const { offset, velocity: dragVelocity } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    const absVelocityX = Math.abs(dragVelocity.x);
    const absVelocityY = Math.abs(dragVelocity.y);

    // Check if it's a tap (minimal movement)
    if (!hasDraggedRef.current && absX < 5 && absY < 5) {
      callbacks.onTap?.();
      return;
    }

    // Determine if it's a valid swipe
    const isHorizontalSwipe = absX > absY;
    const isValidDistance = (isHorizontalSwipe ? absX : absY) > threshold;
    const isValidVelocity = (isHorizontalSwipe ? absVelocityX : absVelocityY) > velocity;

    if (isValidDistance || isValidVelocity) {
      if (isHorizontalSwipe) {
        if (offset.x > 0) {
          callbacks.onSwipeRight?.();
        } else {
          callbacks.onSwipeLeft?.();
        }
      } else {
        if (offset.y > 0) {
          callbacks.onSwipeDown?.();
        } else {
          callbacks.onSwipeUp?.();
        }
      }
    }
  };

  const gestureHandlers = {
    drag: "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: 0.2,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
  };

  return {
    gestureHandlers,
    isDragging,
    dragDirection,
    // For manual control
    setEnabled: (value: boolean) => {
      if (!value && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };
}

// Haptic feedback utilities
export const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 100, 100, 100, 100]);
    }
  }
};