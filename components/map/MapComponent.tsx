import { useEffect };

export default MapComponent; from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom red marker icon
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="marker-pin"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

// Component to handle map animations
const MapController = ({ newMarker, activeMarker }) => {
  const map = useMap();
  
  useEffect(() => {
    if (newMarker) {
      map.flyTo([newMarker.lat, newMarker.lon], 14, { duration: 1 });
    }
  }, [map, newMarker]);

  useEffect(() => {
    if (activeMarker) {
      map.flyTo([activeMarker.lat, activeMarker.lon], 12, { duration: 0.8 });
    }
  }, [map, activeMarker]);
  
  return null;
};

const MapComponent = ({ markers, newMarker, activeMarker }) => {
  return (
    <>
      <MapContainer
        center={[56.7, 24.9]}
        zoom={7}
        minZoom={7}
        className="w-full h-full"
        zoomControl={true}
      >
        {/* Mapbox tile layer */}
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/${process.env.NEXT_PUBLIC_MAPBOX_USERNAME || 'mapbox'}/cmapseqwe01mz01qyc4ma5m7a/tiles/512/{z}/{x}/{y}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`}
          attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          tileSize={512}
          zoomOffset={-1}
        />
        
        {/* Render markers */}
        {markers.map(marker => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lon]}
            icon={customIcon}
          >
            <Popup className="custom-popup" maxWidth={320}>
              <div className="p-3 min-w-[250px]">
                <h3 className="font-bold text-lg mb-2 text-gray-800">{marker.name}</h3>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{marker.description}</p>
                
                {marker.rating && (
                  <div className="text-sm mb-2">
                    <span className="font-medium text-gray-700">Rating:</span> 
                    <span className="ml-1 text-yellow-600">{'★'.repeat(Math.floor(marker.rating))} {marker.rating}</span>
                  </div>
                )}
                
                {marker.address && (
                  <div className="text-sm text-gray-500 mb-3">
                    📍 {marker.address}
                  </div>
                )}
                
                {marker.categories && marker.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {marker.categories.slice(0, 3).map((category, idx) => {
                      const categoryName = typeof category === 'string' ? category : category.name || category.value || 'Category';
                      return (
                        <span 
                          key={idx} 
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {categoryName}
                        </span>
                      );
                    })}
                    {marker.categories.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{marker.categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Map controller for animations */}
        <MapController newMarker={newMarker} activeMarker={activeMarker} />
      </MapContainer>

      {/* Custom styles for markers and popups */}
      <style jsx global>{`
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .marker-pin {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #ff3333;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
        }
        
        .marker-pin::after {
          content: '';
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 8px solid #ff3333;
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          font-family: inherit;
        }
        
        .custom-popup .leaflet-popup-close-button {
          font-size: 18px !important;
          padding: 4px 8px !important;
          color: #6b7280 !important;
        }
        
        .custom-popup .leaflet-popup-close-button:hover {
          color: #374151 !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
}