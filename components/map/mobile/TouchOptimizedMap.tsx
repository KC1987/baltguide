"use client";

import { memo } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@heroui/react';
import { PlusIcon, MinusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Fix marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced touch-friendly zoom controls with 44px minimum
function TouchZoomControls() {
  const map = useMap();
  
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3">
      <Button
        isIconOnly
        size="lg"
        className="w-11 h-11 min-w-11 bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200"
        onPress={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        <PlusIcon className="w-6 h-6 font-bold" />
      </Button>
      <Button
        isIconOnly
        size="lg"
        className="w-11 h-11 min-w-11 bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200"
        onPress={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        <MinusIcon className="w-6 h-6 font-bold" />
      </Button>
    </div>
  );
}

// Location button for centering on user's location
function LocationButton() {
  const map = useMap();
  
  const handleLocationRequest = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 12);
        },
        (error) => {
          console.error("Error getting location:", error);
          // TODO: Show user-friendly error message
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <Button
        isIconOnly
        size="lg"
        className="w-11 h-11 min-w-11 bg-white/95 backdrop-blur-sm shadow-xl border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-gray-300 transition-all duration-200"
        onPress={handleLocationRequest}
        aria-label="Center on my location"
      >
        <MapPinIcon className="w-5 h-5" />
      </Button>
    </div>
  );
}

interface TouchOptimizedMapProps {
  markers: any[];
  className?: string;
}

export default memo(function TouchOptimizedMap({ 
  markers, 
  className = "" 
}: TouchOptimizedMapProps) {
  const mb_key = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapboxUrl = `https://api.mapbox.com/styles/v1/kc87/cmapseqwe01mz01qyc4ma5m7a/tiles/{z}/{x}/{y}?access_token=${mb_key}`;

  return (
    <div className={`w-full h-full relative ${className}`}>
      <MapContainer
        className="h-full w-full"
        center={[56.905, 24.6]}
        zoom={7}
        scrollWheelZoom={true}
        attributionControl={false}
        zoomControl={false}
        touchZoom={true}
        doubleClickZoom={true}
        dragging={true}
        tap={true}
        touchExtend={true}
        // Mobile-optimized settings
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
      >
        <TileLayer url={mapboxUrl} />
        
        {/* Touch-friendly controls */}
        <TouchZoomControls />
        <LocationButton />
        
        {/* Enhanced markers with larger touch targets */}
        {markers.map((m) => (
          <Marker key={m.uid} position={[m.latitude, m.longitude]}>
            <Popup 
              closeButton={true}
              className="custom-popup"
              maxWidth={320}
              minWidth={280}
              // Mobile-optimized popup settings
              autoPan={true}
              autoPanPadding={[20, 20]}
              keepInView={true}
            >
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 leading-tight">
                  {m.name}
                </h3>
                {m.city && (
                  <p className="text-sm text-gray-600 mb-4 flex items-center">
                    <span className="mr-1">📍</span> {m.city}
                  </p>
                )}
                <Button 
                  as={Link} 
                  href={`/location/${m.slug}`}
                  color="primary"
                  size="lg"
                  className="w-full min-h-11 text-base font-medium"
                  radius="lg"
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Mobile location counter */}
      <div className="absolute bottom-4 left-4 z-[1000] md:hidden">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            📍 {markers.length} {markers.length === 1 ? 'location' : 'locations'}
          </p>
        </div>
      </div>
    </div>
  );
});