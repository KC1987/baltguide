"use client"

import { memo } from 'react';

// use react-leaflet's main entry point for typescript
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet'
import L from 'leaflet';



// Fix marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


export default memo(function MapComponent({ markers }:any) {


  const mb_key = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  // Custom Mapbox style URL
  const mapboxUrl = `https://api.mapbox.com/styles/v1/kc87/cmapseqwe01mz01qyc4ma5m7a/tiles/{z}/{x}/{y}?access_token=${mb_key}`;


  // Component to handle map updates
  // function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  //   const map = useMap();
    
  //   useEffect(() => {
  //     map.setView(center, zoom);
  //   }, [map, center, zoom]);
    
  //   return null;
  // }


  return (
    <div>
      <MapContainer
        style={{ height: 600, width: 800 }}
        center={[56.905, 24.6]}
        zoom={7}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <TileLayer
          url={mapboxUrl}
          // attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        />
        { markers.map( (m, i) => 
          <Marker key={i} position={m.position} >
            <Popup>{m.content}</Popup>
          </Marker>
        ) }
      </MapContainer>
    </div>
  )
})



// Only load map if user needs it
// const [showMap, setShowMap] = useState(false);

// const Map = dynamic(() => import('./Map'), { ssr: false });

// return (
//   <div>
//     <button onClick={() => setShowMap(true)}>Show Map</button>
//     {showMap && <Map />}
//   </div>
// );