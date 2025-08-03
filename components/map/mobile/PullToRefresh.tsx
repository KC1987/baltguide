"use client";

import { useState, useRef, ReactNode } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className = ""
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = () => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull-to-refresh if we're at the top of the container
    const container = containerRef.current;
    if (container && container.scrollTop === 0) {
      setIsPulling(true);
    }
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    const distance = Math.max(0, info.offset.y);
    setPullDistance(Math.min(distance, threshold * 1.5));
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing || !isPulling) return;

    setIsPulling(false);
    
    if (info.offset.y >= threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Reset position
      setPullDistance(0);
    }
  };

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowRefreshIndicator = isPulling || isRefreshing;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Refresh Indicator */}
      {shouldShowRefreshIndicator && (
        <div 
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-sm border-b border-gray-200"
          style={{ height: Math.max(pullDistance, isRefreshing ? threshold : 0) }}
        >
          <div className="flex items-center gap-2 text-gray-600">
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: refreshProgress * 360 }}
              transition={isRefreshing ? {
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              } : {
                duration: 0.1
              }}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </motion.div>
            <span className="text-sm font-medium">
              {isRefreshing 
                ? 'Refreshing...' 
                : refreshProgress >= 1 
                  ? 'Release to refresh' 
                  : 'Pull to refresh'
              }
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{
          y: isRefreshing ? threshold : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        style={{
          y: isPulling ? pullDistance : (isRefreshing ? threshold : 0)
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}