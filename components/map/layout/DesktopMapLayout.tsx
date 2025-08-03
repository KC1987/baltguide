"use client";

import { ReactNode } from 'react';

interface DesktopMapLayoutProps {
  searchBar: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  filterPanel: ReactNode;
}

export default function DesktopMapLayout({ 
  searchBar, 
  map, 
  sidebar, 
  filterPanel 
}: DesktopMapLayoutProps) {
  return (
    <div className="hidden lg:flex min-h-screen bg-gray-50">
      {/* Three-Panel Layout - Full Height */}
      <div className="flex w-full h-screen">
        {/* Results Sidebar */}
        <div className="w-80 min-w-80 border-r bg-white">
          {sidebar}
        </div>

        {/* Map Section */}
        <div className="relative flex-1">
          {/* Floating Search Bar */}
          <div className="absolute top-4 left-4 right-4 z-30">
            {searchBar}
          </div>
          
          {/* Map */}
          <div className="h-full w-full">
            {map}
          </div>
        </div>

        {/* Filters Panel (slide-out) */}
        <div className="w-96 min-w-96 border-l bg-white">
          {filterPanel}
        </div>
      </div>
    </div>
  );
}