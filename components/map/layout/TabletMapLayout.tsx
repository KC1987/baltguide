"use client";

import { ReactNode } from 'react';

interface TabletMapLayoutProps {
  searchBar: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  filterOverlay: ReactNode;
}

export default function TabletMapLayout({ 
  searchBar, 
  map, 
  sidebar, 
  filterOverlay 
}: TabletMapLayoutProps) {
  return (
    <div className="hidden md:flex lg:hidden min-h-screen bg-gray-50">
      {/* Split View - Map Dominant (70%) + Results Panel (30%) */}
      <div className="flex w-full h-screen">
        {/* Map Section */}
        <div className="relative flex-1 w-[70%]">
          {/* Floating Search + Quick Filters */}
          <div className="absolute top-4 left-4 right-4 z-30">
            {searchBar}
          </div>
          
          {/* Map */}
          <div className="h-full w-full">
            {map}
          </div>
          
          {/* Filter Overlay - Slides In */}
          <div className="absolute inset-0 z-40">
            {filterOverlay}
          </div>
        </div>

        {/* Results Panel */}
        <div className="w-[30%] min-w-80 border-l bg-white">
          {sidebar}
        </div>
      </div>
    </div>
  );
}