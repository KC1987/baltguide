"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualizedResultsListProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

export default function VirtualizedResultsList({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  overscan = 5,
  onScroll,
  className = ""
}: VirtualizedResultsListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <AnimatePresence initial={false}>
            {visibleItems.map(({ item, index }) => (
              <motion.div
                key={item.uid || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, delay: (index % 10) * 0.02 }}
                style={{ height: itemHeight }}
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Hook for intersection observer-based lazy loading
export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  onIntersect: () => void,
  threshold = 0.1
) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect();
          }
        });
      },
      { threshold }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [onIntersect, threshold]);
}

// Component for infinite loading
interface InfiniteLoadTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  className?: string;
}

export function InfiniteLoadTrigger({
  onLoadMore,
  hasMore,
  isLoading,
  className = ""
}: InfiniteLoadTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useIntersectionObserver(
    triggerRef,
    () => {
      if (hasMore && !isLoading) {
        onLoadMore();
      }
    },
    0.5
  );

  if (!hasMore) return null;

  return (
    <div
      ref={triggerRef}
      className={`flex items-center justify-center py-8 ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-sm">Loading more locations...</span>
        </div>
      ) : (
        <div className="text-gray-400 text-sm">
          Scroll to load more
        </div>
      )}
    </div>
  );
}