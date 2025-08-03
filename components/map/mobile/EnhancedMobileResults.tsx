"use client";

import { useState } from 'react';
import { ScrollShadow, Button, Card, CardBody, Chip } from "@heroui/react";
import { MapPinIcon, StarIcon, HeartIcon, ShareIcon, DirectionsIcon } from "@heroicons/react/24/solid";
import { HeartIcon as HeartOutlineIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeGestures, hapticFeedback } from '../hooks/useSwipeGestures';
import PullToRefresh from './PullToRefresh';

interface EnhancedMobileResultsProps {
  markers: any[];
  activeMarker?: string;
  setActiveMarker?: (id: string) => void;
  onRefresh?: () => Promise<void>;
  onSaveLocation?: (locationId: string) => void;
  onShareLocation?: (location: any) => void;
  savedLocations?: string[];
}

interface LocationCardProps {
  location: any;
  isActive: boolean;
  onPress: () => void;
  onSave: () => void;
  onShare: () => void;
  isSaved: boolean;
}

function LocationCard({ 
  location, 
  isActive, 
  onPress, 
  onSave, 
  onShare, 
  isSaved 
}: LocationCardProps) {
  const [showActions, setShowActions] = useState(false);

  const { gestureHandlers, isDragging, dragDirection } = useSwipeGestures({
    onSwipeLeft: () => {
      setShowActions(true);
      hapticFeedback.light();
    },
    onSwipeRight: () => {
      if (showActions) {
        setShowActions(false);
        hapticFeedback.light();
      }
    },
    onTap: () => {
      onPress();
      hapticFeedback.light();
    },
    onLongPress: () => {
      setShowActions(!showActions);
      hapticFeedback.medium();
    }
  });

  return (
    <div className="relative overflow-hidden">
      <motion.div
        {...gestureHandlers}
        className={`
          relative z-10
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        animate={{
          x: showActions ? -120 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
      >
        <Card
          className={`
            shadow-sm border-2 transition-all duration-200
            ${isActive 
              ? 'border-blue-500 bg-blue-50/50' 
              : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
            }
            ${isDragging ? 'scale-102' : ''}
          `}
        >
          <CardBody className="p-4">
            {/* Location Name */}
            <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight">
              {location.name}
            </h3>

            {/* City & Rating */}
            <div className="flex items-center justify-between mb-3">
              {location.city && (
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm">{location.city}</span>
                </div>
              )}
              
              {location.rating && (
                <div className="flex items-center">
                  <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">{location.rating}</span>
                </div>
              )}
            </div>

            {/* Categories */}
            {location.categories && location.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {location.categories.slice(0, 3).map((category: string, index: number) => (
                  <Chip
                    key={index}
                    size="sm"
                    variant="flat"
                    className="text-xs"
                  >
                    {category.replace('-', ' & ')}
                  </Chip>
                ))}
                {location.categories.length > 3 && (
                  <Chip size="sm" variant="flat" className="text-xs">
                    +{location.categories.length - 3} more
                  </Chip>
                )}
              </div>
            )}

            {/* Quick Info */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              {location.free_entry && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  🆓 Free
                </span>
              )}
              {location.family_friendly && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  👨‍👩‍👧‍👦 Family
                </span>
              )}
              {location.open_24hrs && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  🕒 24/7
                </span>
              )}
            </div>

            {/* Main Action Button */}
            <Button 
              as={Link}
              href={`/location/${location.slug}`}
              color="primary"
              size="md"
              className="w-full min-h-11 font-medium"
              radius="lg"
            >
              View Details
            </Button>

            {/* Swipe Hint */}
            {!showActions && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-400">← Swipe for actions</span>
              </div>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Action Buttons (revealed on swipe) */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: showActions ? 1 : 0,
            scale: showActions ? 1 : 0.8
          }}
          transition={{ delay: 0.1 }}
        >
          <Button
            isIconOnly
            color={isSaved ? "danger" : "primary"}
            variant="flat"
            size="lg"
            onPress={() => {
              onSave();
              hapticFeedback.success();
            }}
            className="w-12 h-12"
          >
            {isSaved ? (
              <HeartIcon className="w-5 h-5" />
            ) : (
              <HeartOutlineIcon className="w-5 h-5" />
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: showActions ? 1 : 0,
            scale: showActions ? 1 : 0.8
          }}
          transition={{ delay: 0.2 }}
        >
          <Button
            isIconOnly
            color="secondary"
            variant="flat"
            size="lg"
            onPress={() => {
              onShare();
              hapticFeedback.light();
            }}
            className="w-12 h-12"
          >
            <ShareIcon className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

export default function EnhancedMobileResults({
  markers,
  activeMarker,
  setActiveMarker,
  onRefresh,
  onSaveLocation,
  onShareLocation,
  savedLocations = []
}: EnhancedMobileResultsProps) {
  
  const handleRefresh = async () => {
    if (onRefresh) {
      hapticFeedback.medium();
      await onRefresh();
      hapticFeedback.success();
    }
  };

  const handleSaveLocation = (locationId: string) => {
    onSaveLocation?.(locationId);
  };

  const handleShareLocation = (location: any) => {
    if (navigator.share) {
      navigator.share({
        title: location.name,
        text: `Check out ${location.name} in ${location.city}`,
        url: `${window.location.origin}/location/${location.slug}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/location/${location.slug}`);
      hapticFeedback.success();
    }
    onShareLocation?.(location);
  };

  if (markers.length === 0) {
    return (
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <MapPinIcon className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No locations found
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button 
            color="primary" 
            variant="flat"
            onPress={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="px-1 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {markers.length} {markers.length === 1 ? 'Location' : 'Locations'} Found
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Swipe left on cards for quick actions
        </p>
      </div>

      {/* Results List with Pull-to-Refresh */}
      <PullToRefresh onRefresh={handleRefresh} className="flex-1">
        <ScrollShadow className="px-1">
          <div className="space-y-3 py-4">
            <AnimatePresence>
              {markers.map((location, index) => (
                <motion.div
                  key={location.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <LocationCard
                    location={location}
                    isActive={activeMarker === location.slug}
                    onPress={() => setActiveMarker?.(location.slug)}
                    onSave={() => handleSaveLocation(location.uid)}
                    onShare={() => handleShareLocation(location)}
                    isSaved={savedLocations.includes(location.uid)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Bottom padding for safe area */}
          <div className="h-16" />
        </ScrollShadow>
      </PullToRefresh>
    </div>
  );
}