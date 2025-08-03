"use client";

import { ReactNode } from 'react';
import MobileMapLayout from './MobileMapLayout';
import TabletMapLayout from './TabletMapLayout';
import DesktopMapLayout from './DesktopMapLayout';

interface ResponsiveMapLayoutProps {
  searchBar: ReactNode;
  map: ReactNode;
  sidebar: ReactNode;
  bottomSheet: ReactNode;
  filterFAB: ReactNode;
  filterOverlay: ReactNode;
  filterPanel: ReactNode;
}

export default function ResponsiveMapLayout(props: ResponsiveMapLayoutProps) {
  const {
    searchBar,
    map,
    sidebar,
    bottomSheet,
    filterFAB,
    filterOverlay,
    filterPanel
  } = props;

  return (
    <>
      {/* Mobile Layout (< 768px) */}
      <MobileMapLayout
        searchBar={searchBar}
        map={map}
        bottomSheet={bottomSheet}
        filterFAB={filterFAB}
      />

      {/* Tablet Layout (768px-1023px) */}
      <TabletMapLayout
        searchBar={searchBar}
        map={map}
        sidebar={sidebar}
        filterOverlay={filterOverlay}
      />

      {/* Desktop Layout (1024px+) */}
      <DesktopMapLayout
        searchBar={searchBar}
        map={map}
        sidebar={sidebar}
        filterPanel={filterPanel}
      />
    </>
  );
}