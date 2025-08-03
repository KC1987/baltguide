"use client";

import { Button } from '@heroui/react';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface FloatingFABProps {
  onPress: () => void;
  isActive?: boolean;
  className?: string;
}

export default function FloatingFAB({
  onPress,
  isActive = false,
  className = ""
}: FloatingFABProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={className}
    >
      <Button
        isIconOnly
        size="lg"
        color={isActive ? "primary" : "default"}
        variant={isActive ? "solid" : "flat"}
        onPress={onPress}
        className={`
          w-16 h-16 min-w-16 rounded-full shadow-2xl
          bg-white/95 backdrop-blur-sm border-2
          ${isActive 
            ? 'border-blue-500 bg-blue-500 text-white' 
            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
          }
          transition-all duration-200
        `}
        aria-label="Open filters"
      >
        <motion.div
          animate={isActive ? { rotate: 180 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >
          <FunnelIcon className="w-6 h-6" />
        </motion.div>
      </Button>

      {/* Pulse animation for emphasis */}
      {!isActive && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-blue-500"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}
    </motion.div>
  );
}