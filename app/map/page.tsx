'use client';

import { useEffect, useState, useRef } from "react";
import { createRoot } from 'react-dom/client';
import { Map, View, Overlay } from "ol";
import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";
import { fromLonLat, transformExtent } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import { Button } from "@heroui/button";
import Sidebar from "@/components/map/Sidebar";
import PopupInfo from "@/components/map/MarkerPopup";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function Page() {
  const [name, setName] = useState("");
  const [lon, setLon] = useState("");
  const [lat, setLat] = useState("");
  const [markers, setMarkers] = useState([]);
  
  const popupRef = useRef(null);
  const popupContentRef = useRef(null);
  const popupCloserRef = useRef(null);
  const mapRef = useRef(null);

  const [selectedFeatureData, setSelectedFeatureData] = useState(null);
  const popupReactRootRef = useRef(null); // Ref to store the React root for the popup

  // Fetch attractions (no changes here)
  useEffect(() => {
    async function getAttractions() {
      try {
        const collectionRef = collection(db, "locations");
        const q = query(collectionRef, where("type", "==", "attraction"));
    
        const attractionData = await getDocs(q);
        const attractions = attractionData.docs.map(doc => {
            const data = doc.data();
            const latitude = parseFloat(data.coordinates?.[0]);
            const longitude = parseFloat(data.coordinates?.[1]);

            if (isNaN(latitude) || isNaN(longitude)) {
                console.warn("Invalid coordinates for attraction:", data.name, data.coordinates);
                return null;
            }
            return {
                id: doc.id,
                name: data.name || "Unnamed Location",
                lat: latitude,
                lon: longitude,
                description: data.description || "No description available",
                slug: data.slug
            };
        }).filter(marker => marker !== null);
  
        setMarkers(attractions);
      } catch (error) {
        console.error("Error fetching attractions:", error);
      }
    }
    getAttractions();
  }, []);

  // NEW: Effect to manage the lifecycle of the popup's React root
  useEffect(() => {
    // This effect runs once when the component mounts and its cleanup on unmount.
    // It ensures the React root for the popup is created when the container is ready
    // and unmounted when the Page component itself is destroyed.

    if (popupContentRef.current && !popupReactRootRef.current) {
      popupReactRootRef.current = createRoot(popupContentRef.current);
    }

    // Store the current ref value for cleanup, as ref.current might change
    const currentRoot = popupReactRootRef.current;

    return () => {
      // Cleanup React root when the Page component unmounts
      if (currentRoot) {
        currentRoot.unmount();
        // It's good practice to nullify the ref after unmounting if you might check it later,
        // but since the component is unmounting, it's less critical.
        // if (popupReactRootRef.current === currentRoot) {
        //   popupReactRootRef.current = null;
        // }
      }
    };
  }, []); // Empty dependency array: runs on mount and cleans up on unmount of Page.

  // MODIFIED: Initialize map, overlay
  useEffect(() => {
    if (!popupRef.current || !popupContentRef.current || !document.getElementById("map")) {
        return; // Wait for all necessary DOM elements
    }

    // Ensure React root for the popup content area is created if it wasn't by the effect above
    // (e.g., if popupContentRef.current wasn't available immediately for the [] effect)
    // This is a defensive check; the [] effect should ideally handle creation.
    if (!popupReactRootRef.current && popupContentRef.current) {
        popupReactRootRef.current = createRoot(popupContentRef.current);
    }
    
    const olPopup = new Overlay({ // Renamed to olPopup to avoid confusion with component Popups
      element: popupRef.current,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
    });

    if (popupCloserRef.current) {
      popupCloserRef.current.onclick = function() {
        olPopup.setPosition(undefined);
        setSelectedFeatureData(null); // Clear data on close
        popupCloserRef.current.blur();
        return false;
      };
    }

    const features = markers.map(marker => {
      return new Feature({
        geometry: new Point(fromLonLat([marker.lon, marker.lat])),
        ...marker 
      });
    });

    const vectorSource = new VectorSource({ features });
    const markerStyle = new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: '#ff3333' }),
        stroke: new Stroke({ color: '#ffffff', width: 2 })
      })
    });
    const vectorLayer = new VectorLayer({ source: vectorSource, style: markerStyle });

    const mapboxUsername = 'kc87';
    const mapboxStyleId = 'cmapseqwe01mz01qyc4ma5m7a';
    const accessToken = 'pk.eyJ1Ijoia2M4NyIsImEiOiJjbWFwcDhtcGowMHZ0MmtzNTR6a2hkd3hnIn0.P5R7RxumD0mYTFUO0yPSpg';

    const mapboxLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.mapbox.com/styles/v1/${mapboxUsername}/${mapboxStyleId}/tiles/512/{z}/{x}/{y}?access_token=${accessToken}`,
        tileSize: 512,
        attributions: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      })
    });
    
    const balticLonLatExtent = [19.5, 53.0, 29.5, 60.0];
    const mapProjectionExtent = transformExtent(balticLonLatExtent, 'EPSG:4326', 'EPSG:3857');

    const initialMap = new Map({
      target: "map",
      layers: [mapboxLayer, vectorLayer],
      overlays: [olPopup], // Use the OpenLayers overlay instance
      view: new View({
        center: fromLonLat([24.7536, 57.2]),
        zoom: 6,
        extent: mapProjectionExtent,
        minZoom: 6,
      }),
    });
    
    mapRef.current = initialMap;

    initialMap.on('click', function(evt) {
      const feature = initialMap.forEachFeatureAtPixel(evt.pixel, f => f);
      if (feature) {
        const coordinates = feature.getGeometry().getCoordinates();
        const featureProps = feature.getProperties();
        setSelectedFeatureData({
          name: featureProps.name,
          description: featureProps.description,
          slug: featureProps.slug,
        });
        olPopup.setPosition(coordinates);
      } else {
        olPopup.setPosition(undefined);
        setSelectedFeatureData(null);
      }
    });

    initialMap.on('pointermove', function(e) {
      const pixel = initialMap.getEventPixel(e.originalEvent);
      const hit = initialMap.hasFeatureAtPixel(pixel);
      if (initialMap.getTargetElement()) {
        initialMap.getTargetElement().style.cursor = hit ? 'pointer' : '';
      }
    });
    
    return () => {
      // Cleanup map
      if (mapRef.current) {
        // Explicitly remove the overlay instance that was added to this map instance
        mapRef.current.removeOverlay(olPopup); 
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
      // DO NOT unmount popupReactRootRef.current here.
      // Its lifecycle is managed by the separate useEffect with an empty dependency array.
    };
  }, [markers]); // Re-initialize map if markers array instance changes

  // MODIFIED: Effect to render PopupInfo component when selectedFeatureData changes
  useEffect(() => {
    if (popupReactRootRef.current) {
      // Render PopupInfo if data exists, otherwise render null to clear the popup
      popupReactRootRef.current.render(
        selectedFeatureData ? <PopupInfo featureData={selectedFeatureData} /> : null
      );
    }
  }, [selectedFeatureData]);


  // handleSubmit function (no changes here)
  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !lat || !lon) {
      alert("Please fill in all fields");
      return;
    }
    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      alert("Latitude must be between -90 and 90, and longitude between -180 and 180.");
      return;
    }
    const newMarker = {
      name,
      lat: latNum,
      lon: lonNum,
      description: "Newly added location" // You might want a way to input this
    };
    setMarkers(prevMarkers => [...prevMarkers, newMarker]);
    // TODO: Persist newMarker to Firebase here
    setName("");
    setLat("");
    setLon("");
    if (mapRef.current) {
      mapRef.current.getView().animate({
        center: fromLonLat([lonNum, latNum]),
        zoom: Math.max(mapRef.current.getView().getZoom(), 14),
        duration: 1000
      });
    }
  }

  // JSX for the component (no structural changes, just ensure refs are correct)
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="flex flex-1 h-full overflow-hidden">
        <Sidebar markers={markers} />
        <div className="flex-1 flex flex-col">
          <div id="map" className="w-full h-3/4 relative">
            <div 
              ref={popupRef} 
              className="ol-popup absolute bg-white rounded-md shadow-xl p-4 min-w-[250px] z-[100] border border-gray-200"
            >
              <a 
                href="#" 
                ref={popupCloserRef} 
                className="ol-popup-closer absolute top-1 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
                aria-label="Close popup"
              >
                &times;
              </a>
              {/* This div is the mount point for the PopupInfo React component */}
              <div ref={popupContentRef} className="popup-content pt-1"></div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 h-1/4 overflow-y-auto border-t">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Add New Location</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="locationName" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input 
                  id="locationName"
                  type="text" 
                  value={name} 
                  placeholder="e.g., Freedom Monument" 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  required
                />
              </div>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-600 mb-1">Latitude</label>
                  <input 
                    id="latitude"
                    type="text" 
                    value={lat} 
                    placeholder="e.g., 56.951" 
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    required
                    pattern="^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$"
                    title="Latitude must be between -90 and 90."
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-600 mb-1">Longitude</label>
                  <input 
                    id="longitude"
                    type="text" 
                    value={lon} 
                    placeholder="e.g., 24.114" 
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                    required
                    pattern="^-?((1[0-7]|[1-9])?\d(\.\d+)?|180(\.0+)?)$"
                    title="Longitude must be between -180 and 180."
                  />
                </div>
              </div>
              <div>
                <Button type="submit" className="w-full">Add Location</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      {/* Styles (no changes here) */}
      <style jsx global>{`
        .ol-zoom { top: .75em; left: .75em; }
        .ol-attribution { bottom: .25em; right: .5em; font-size: 0.75rem; background-color: rgba(255, 255, 255, 0.75); padding: 2px 4px; border-radius: 3px; }
        .ol-attribution ul { margin: 0; padding: 0; }
        .ol-attribution li { display: inline; list-style: none; }
        .ol-attribution li:not(:last-child):after { content: " "; }
      `}</style>
      <style jsx>{`
        .ol-popup { transform: translate(-50%, calc(-100% - 12px)); min-width: 250px; max-width: 320px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)) drop-shadow(0 2px 4px rgba(0,0,0,0.06)); }
        .ol-popup:after, .ol-popup:before { top: 100%; left: 50%; border: solid transparent; content: " "; height: 0; width: 0; position: absolute; pointer-events: none; }
        .ol-popup:after { border-top-color: white; border-width: 10px; margin-left: -10px; }
        .ol-popup:before { border-top-color: #e5e7eb; border-width: 11px; margin-left: -11px; }
        .ol-popup-closer { text-decoration: none; outline: none; }
        .popup-content { max-height: 200px; overflow-y: auto; }
      `}</style>
    </div>
  );
}