"use client";

import { ScrollShadow, Button, Card, CardBody } from "@heroui/react";
import { MapPinIcon, StarIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface MobileResultsProps {
  markers: any[];
  activeMarker?: string;
  setActiveMarker?: (id: string) => void;
}

export default function MobileResults({
  markers,
  activeMarker,
  setActiveMarker,
}: MobileResultsProps) {
  if (markers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <MapPinIcon className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No locations found
        </h3>
        <p className="text-gray-600 text-sm">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="px-1 py-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">
          {markers.length} {markers.length === 1 ? 'Location' : 'Locations'} Found
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Tap a location to view details
        </p>
      </div>

      {/* Results List */}
      <ScrollShadow className="flex-1 px-1">
        <div className="space-y-3 py-4">
          {markers.map((location) => (
            <Card
              key={location.uid}
              className={`
                shadow-sm border-2 transition-all duration-200 cursor-pointer
                ${activeMarker === location.slug 
                  ? 'border-blue-500 bg-blue-50/50' 
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }
              `}
              isPressable
              onPress={() => setActiveMarker?.(location.slug)}
            >
              <CardBody className="p-4">
                {/* Location Name */}
                <h3 className="font-semibold text-lg text-gray-900 mb-2 leading-tight">
                  {location.name}
                </h3>

                {/* City & Basic Info */}
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
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {category}
                      </span>
                    ))}
                    {location.categories.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        +{location.categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Button */}
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
              </CardBody>
            </Card>
          ))}
        </div>
        
        {/* Bottom padding for safe area */}
        <div className="h-16" />
      </ScrollShadow>
    </div>
  );
}