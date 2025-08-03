"use client";

import { useState, useRef, ReactNode, useEffect } from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Button } from '@heroui/react';

export type BottomSheetSnapPoint = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  initialSnapPoint?: BottomSheetSnapPoint;
  onSnapPointChange?: (snapPoint: BottomSheetSnapPoint) => void;
  className?: string;
}

const SNAP_POINTS = {
  peek: '25%',
  half: '50%', 
  full: '85%'
} as const;

const SNAP_POINTS_PX = {
  peek: 0.25,
  half: 0.5,
  full: 0.85
} as const;

export default function BottomSheet({
  children,
  isOpen = true,
  onClose,
  initialSnapPoint = 'peek',
  onSnapPointChange,
  className = ''
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState<BottomSheetSnapPoint>(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const controls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          if (currentSnapPoint === 'peek') {
            snapTo('half');
          } else if (currentSnapPoint === 'half') {
            snapTo('full');
          }
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (currentSnapPoint === 'full') {
            snapTo('half');
          } else if (currentSnapPoint === 'half') {
            snapTo('peek');
          }
          break;
        case 'Escape':
          if (onClose) {
            onClose();
          }
          break;
      }
    };

    if (sheetRef.current) {
      sheetRef.current.addEventListener('keydown', handleKeyDown);
      return () => {
        sheetRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, currentSnapPoint, onClose]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const threshold = 50; // Minimum drag distance to change snap point
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    let newSnapPoint: BottomSheetSnapPoint = currentSnapPoint;

    // Determine snap point based on drag direction and velocity
    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0 || velocity > 0) {
        // Dragging down
        if (currentSnapPoint === 'full') {
          newSnapPoint = 'half';
        } else if (currentSnapPoint === 'half') {
          newSnapPoint = 'peek';
        }
      } else {
        // Dragging up
        if (currentSnapPoint === 'peek') {
          newSnapPoint = 'half';
        } else if (currentSnapPoint === 'half') {
          newSnapPoint = 'full';
        }
      }
    }

    // Animate to new snap point
    controls.start({
      height: SNAP_POINTS[newSnapPoint],
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    });

    setCurrentSnapPoint(newSnapPoint);
    onSnapPointChange?.(newSnapPoint);
  };

  const snapTo = (snapPoint: BottomSheetSnapPoint) => {
    controls.start({
      height: SNAP_POINTS[snapPoint],
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    });
    setCurrentSnapPoint(snapPoint);
    onSnapPointChange?.(snapPoint);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none z-20"
    >
      <motion.div
        ref={sheetRef}
        className={`
          absolute bottom-0 left-0 right-0 
          bg-white/95 backdrop-blur-sm 
          rounded-t-2xl shadow-2xl 
          pointer-events-auto
          focus:outline-none
          ${className}
        `}
        initial={{ height: SNAP_POINTS[initialSnapPoint] }}
        animate={controls}
        drag="y"
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{
          height: SNAP_POINTS[currentSnapPoint],
        }}
        tabIndex={0}
        role="dialog"
        aria-label="Results panel"
        aria-expanded={currentSnapPoint !== 'peek'}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div 
            className={`
              w-9 h-1.5 bg-gray-300 rounded-full 
              transition-colors duration-200
              ${isDragging ? 'bg-gray-400' : 'bg-gray-300'}
            `}
          />
        </div>

        {/* Quick Snap Controls (Development Helper) */}
        <div className="flex justify-center gap-2 pb-3">
          <Button
            size="sm"
            variant={currentSnapPoint === 'peek' ? 'solid' : 'light'}
            onPress={() => snapTo('peek')}
            className="text-xs h-6 min-w-12"
          >
            Peek
          </Button>
          <Button
            size="sm"
            variant={currentSnapPoint === 'half' ? 'solid' : 'light'}
            onPress={() => snapTo('half')}
            className="text-xs h-6 min-w-12"
          >
            Half
          </Button>
          <Button
            size="sm"
            variant={currentSnapPoint === 'full' ? 'solid' : 'light'}
            onPress={() => snapTo('full')}
            className="text-xs h-6 min-w-12"
          >
            Full
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 pb-safe-bottom">
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}