"use client"

import dynamic from "next/dynamic"


const DynamicMap = dynamic( () =>
    import("@/components/map/MapComponent"),
  {
    ssr: false,
    loading: () => <div style={{ height: '400px', background: '#f0f0f0' }}>Loading map...</div>
  }
);

export default DynamicMap;