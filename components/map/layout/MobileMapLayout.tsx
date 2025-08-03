"use client";

import { ReactNode } from 'react';

interface MobileMapLayoutProps {
  searchBar: ReactNode;
  map: ReactNode;
  bottomSheet: ReactNode;
  filterFAB: ReactNode;
}

export default function MobileMapLayout({ 
  searchBar, 
  map, 
  bottomSheet, 
  filterFAB 
}: MobileMapLayoutProps) {
  return (
    <div className="block md:hidden min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Floating Search Bar */}
      <div className="absolute top-safe z-30 left-4 right-4">
        <div className="pt-4">
          {searchBar}
        </div>
      </div>

      {/* Full-Screen Map */}
      <div className="relative h-screen w-full">
        {map}
      </div>

      {/* Bottom Sheet */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        {bottomSheet}
      </div>

      {/* Floating Filter FAB */}
      <div className="absolute bottom-safe right-4 z-40 pb-20">
        {filterFAB}
      </div>
    </div>
  );
}