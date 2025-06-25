"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
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
import { createClient } from "@/config/supabase/client";
import FilterMain from "@/components/map/FilterMain";

// Constants for map configuration
const MAPBOX_STYLE_ID = "cmapseqwe01mz01qyc4ma5m7a";
const BALTIC_EXTENT = [19.5, 52.0, 30.5, 62.0]; // [minLon, minLat, maxLon, maxLat]
const INITIAL_CENTER = [24.9, 56.7]; // Latvia center
const INITIAL_ZOOM = 7.4;
const MIN_ZOOM = 7;

// Marker style configuration
const MARKER_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: "#ff3333" }),
    stroke: new Stroke({ color: "#ffffff", width: 2 }),
  }),
});

export default function Page() {
  // Initialize Supabase client
  const supabase = createClient();

  // State management
  const [activeMarker, setActiveMarker] = useState(null);
  const [filter, setFilter] = useState({});
  const [markers, setMarkers] = useState([]);
  const [selectedFeatureData, setSelectedFeatureData] = useState(null);
  
  // Form state for adding new locations
  const [formData, setFormData] = useState({
    name: "",
    lon: "",
    lat: ""
  });

  // Refs for OpenLayers components
  const mapRef = useRef(null); // OpenLayers map instance
  const vectorLayerRef = useRef(null); // Vector layer for markers
  const olPopupRef = useRef(null); // OpenLayers popup overlay
  
  // Refs for popup DOM elements
  const popupRef = useRef(null); // Popup container
  const popupContentRef = useRef(null); // Popup content container
  const popupCloserRef = useRef(null); // Popup close button
  const popupReactRootRef = useRef(null); // React root for popup content

  /**
   * Fetches attractions from Supabase based on current filters
   */
  const getAttractions = useCallback(async () => {
    try {
      // Start with base query
      let query = supabase
        .from("locations")
        .select("*")
        .eq("type", "attraction");

      // Apply dynamic filters
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "any") {
          if (typeof value === "string" && value.length > 0) {
            query = query.eq(key, value);
          } else if (Array.isArray(value) && value.length > 0) {
            query = query.overlaps(key, value);
          }
        }
      });

      const { data: attractionData, error } = await query;

      if (error) {
        console.error("Supabase error:", error);
        return;
      } 

      // Transform data to marker format
      const attractions = attractionData.map((data) => ({
        id: data.id,
        name: data.name || "Unnamed Location",
        lat: data.latitude,
        lon: data.longitude,
        description: data.description || "No description available",
        slug: data.slug,
      }));

      setMarkers(attractions);
    } catch (error) {
      console.error("Error fetching attractions:", error);
    }
  }, [filter, supabase]);

  /**
   * Closes the popup and clears selected feature
   */
  const closePopup = useCallback(() => {
    if (olPopupRef.current) {
      olPopupRef.current.setPosition(undefined);
    }
    setSelectedFeatureData(null);
  }, []);

  /**
   * Handles map click events
   */
  const handleMapClick = useCallback((evt) => {
    const map = mapRef.current;
    if (!map || !olPopupRef.current) return;

    // Check if a feature was clicked
    const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

    if (feature) {
      // Show popup for clicked feature
      const coordinates = feature.getGeometry().getCoordinates();
      const featureProps = feature.getProperties();

      setSelectedFeatureData({
        name: featureProps.name,
        description: featureProps.description,
        slug: featureProps.slug,
      });
      olPopupRef.current.setPosition(coordinates);
    } else {
      // Close popup if clicking empty space
      closePopup();
    }
  }, [closePopup]);

  /**
   * Handles map hover events for cursor changes
   */
  const handleMapHover = useCallback((e) => {
    const map = mapRef.current;
    if (!map) return;

    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    const targetElement = map.getTargetElement();

    if (targetElement) {
      targetElement.style.cursor = hit ? "pointer" : "";
    }
  }, []);

  /**
   * Handles form submission for adding new locations
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const { name, lat, lon } = formData;
    
    // Validate form data
    if (!name || !lat || !lon) {
      console.warn("Please fill in all fields");
      return;
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);

    // Validate coordinates
    if (
      isNaN(latNum) || isNaN(lonNum) ||
      latNum < -90 || latNum > 90 ||
      lonNum < -180 || lonNum > 180
    ) {
      console.warn("Invalid coordinates");
      return;
    }

    // Create new marker
    const newMarker = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      lat: latNum,
      lon: lonNum,
      description: "Newly added location",
    };

    // Add marker and reset form
    setMarkers(prev => [...prev, newMarker]);
    setFormData({ name: "", lat: "", lon: "" });

    // Animate map to new marker
    if (mapRef.current) {
      mapRef.current.getView().animate({
        center: fromLonLat([lonNum, latNum]),
        zoom: Math.max(mapRef.current.getView().getZoom() || 10, 14),
        duration: 1000,
      });
    }
  }, [formData]);

  /**
   * Updates form field value
   */
  const updateFormField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fetch attractions on mount
  useEffect(() => {
    getAttractions();
  }, []);

  /**
   * Initialize OpenLayers map
   */
  useEffect(() => {
    // Check if map is already initialized or required elements are missing
    if (!popupRef.current || !popupContentRef.current || mapRef.current) {
      return;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    // Create popup overlay
    const olPopup = new Overlay({
      element: popupRef.current,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    });
    olPopupRef.current = olPopup;

    // Setup popup closer button
    if (popupCloserRef.current) {
      popupCloserRef.current.onclick = (e) => {
        e.preventDefault();
        closePopup();
        popupCloserRef.current.blur();
        return false;
      };
    }

    // Create vector layer for markers
    const vectorSource = new VectorSource();
    const vecLayer = new VectorLayer({
      source: vectorSource,
      style: MARKER_STYLE,
    });
    vectorLayerRef.current = vecLayer;

    // Create Mapbox tile layer
    const mapboxUsername = process.env.NEXT_PUBLIC_MAPBOX_USERNAME;
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    
    const mapboxLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.mapbox.com/styles/v1/${mapboxUsername}/${MAPBOX_STYLE_ID}/tiles/512/{z}/{x}/{y}?access_token=${accessToken}`,
        tileSize: 512,
        attributions:
          '© <a href="https://www.mapbox.com/about/maps/" target="_blank">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      }),
    });

    // Transform extent to map projection
    const mapProjectionExtent = transformExtent(
      BALTIC_EXTENT,
      "EPSG:4326",
      "EPSG:3857"
    );

    // Initialize map
    const map = new Map({
      target: "map",
      layers: [mapboxLayer, vecLayer],
      overlays: [olPopup],
      view: new View({
        center: fromLonLat(INITIAL_CENTER),
        zoom: INITIAL_ZOOM,
        // extent: mapProjectionExtent,
        minZoom: MIN_ZOOM,
      }),
    });

    mapRef.current = map;

    // Add event listeners
    map.on("click", handleMapClick);
    map.on("pointermove", handleMapHover);

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.un("click", handleMapClick);
        mapRef.current.un("pointermove", handleMapHover);
        mapRef.current.setTarget(null);
        mapRef.current = null;
      }
      olPopupRef.current = null;
      vectorLayerRef.current = null;
    };
  }, [closePopup, handleMapClick, handleMapHover]);

  /**
   * Initialize React root for popup content
   * This effect only runs once when the popup content element is available
   */
  useEffect(() => {
    if (!popupContentRef.current) return;

    // Check if this DOM element already has a React root
    // In React 18+, we need to be extra careful about not creating multiple roots
    if (popupReactRootRef.current) return;

    // Mark the element to prevent multiple root creation
    const element = popupContentRef.current;
    if (element._reactRoot) return;

    try {
      const root = createRoot(element);
      popupReactRootRef.current = root;
      element._reactRoot = root; // Mark the element as having a root
    } catch (error) {
      console.error("Error creating React root for popup:", error);
      return;
    }

    // Cleanup function to unmount the root when component unmounts
    return () => {
      const root = popupReactRootRef.current;
      const el = popupContentRef.current;
      
      if (root) {
        popupReactRootRef.current = null;
        if (el) {
          el._reactRoot = null; // Clear the marker
        }
        
        // Defer the unmount to avoid React rendering conflicts
        setTimeout(() => {
          try {
            root.unmount();
          } catch (e) {
            console.warn("Error unmounting popup React root:", e);
          }
        }, 0);
      }
    };
  }, []); // Empty dependency array - only run once

  /**
   * Update markers on the map when markers state changes
   */
  useEffect(() => {
    if (!vectorLayerRef.current || !mapRef.current) return;
    
    const vectorSource = vectorLayerRef.current.getSource();
    if (!vectorSource) return;

    // Clear existing features
    vectorSource.clear();

    // Add new features
    if (markers.length > 0) {
      const features = markers.map(marker => 
        new Feature({
          geometry: new Point(fromLonLat([marker.lon, marker.lat])),
          ...marker,
        })
      );
      vectorSource.addFeatures(features);
    }
  }, [markers]);

  /**
   * Render popup content when selected feature changes
   */
  useEffect(() => {
    // Wait for both the root and content ref to be available
    if (!popupReactRootRef.current || !popupContentRef.current) return;

    try {
      popupReactRootRef.current.render(
        selectedFeatureData ? <PopupInfo featureData={selectedFeatureData} /> : null
      );
    } catch (error) {
      console.error("Error rendering popup:", error);
    }
  }, [selectedFeatureData]);

  return (
    <div >
      {/* Filter controls */}
      <FilterMain
        filter={filter}
        getAttractions={getAttractions}
        setFilter={setFilter}
      />
      
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar with marker list */}
        <Sidebar
          activeMarker={activeMarker}
          markers={markers}
          setActiveMarker={setActiveMarker}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Map container */}
          <div className="w-full h-[750] relative" id="map">
            {/* Popup overlay */}
            <div
              ref={popupRef}
              className="ol-popup absolute bg-white rounded-md shadow-xl p-4 min-w-[250px] z-[100] border border-gray-200"
            >
              <a
                ref={popupCloserRef}
                aria-label="Close popup"
                className="ol-popup-closer absolute top-1 right-2 text-gray-500 hover:text-gray-800 text-2xl leading-none"
                href="#"
              >
                &times;
              </a>
              <div ref={popupContentRef} className="popup-content pt-1" />
            </div>
          </div>

          {/* Add location form
          <div className="p-4 bg-gray-50 h-1/4 overflow-y-auto border-t">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              Add New Location
            </h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label
                  className="block text-sm font-medium text-gray-600 mb-1"
                  htmlFor="locationName"
                >
                  Name
                </label>
                <input
                  required
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  id="locationName"
                  placeholder="e.g., Freedom Monument"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                />
              </div>
              
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label
                    className="block text-sm font-medium text-gray-600 mb-1"
                    htmlFor="latitude"
                  >
                    Latitude
                  </label>
                  <input
                    required
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    id="latitude"
                    pattern="^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$"
                    placeholder="e.g., 56.951"
                    title="Latitude must be between -90 and 90."
                    type="text"
                    value={formData.lat}
                    onChange={(e) => updateFormField('lat', e.target.value)}
                  />
                </div>
                
                <div className="flex-1">
                  <label
                    className="block text-sm font-medium text-gray-600 mb-1"
                    htmlFor="longitude"
                  >
                    Longitude
                  </label>
                  <input
                    required
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    id="longitude"
                    pattern="^-?((1[0-7]|[1-9])?\d(\.\d+)?|180(\.0+)?)$"
                    placeholder="e.g., 24.114"
                    title="Longitude must be between -180 and 180."
                    type="text"
                    value={formData.lon}
                    onChange={(e) => updateFormField('lon', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Button className="w-full" type="submit">
                  Add Location
                </Button>
              </div>
            </form>
          </div> */}
        </div>
      </div>

      {/* Global styles for OpenLayers controls */}
      <style global jsx>{`
        .ol-zoom {
          top: 0.75em;
          left: 0.75em;
        }
        .ol-attribution {
          bottom: 0.25em;
          right: 0.5em;
          font-size: 0.75rem;
          background-color: rgba(255, 255, 255, 0.75);
          padding: 2px 4px;
          border-radius: 3px;
        }
        .ol-attribution ul {
          margin: 0;
          padding: 0;
        }
        .ol-attribution li {
          display: inline;
          list-style: none;
        }
        .ol-attribution li:not(:last-child):after {
          content: " ";
        }
        #map {
          min-height: 0;
        }
      `}</style>
      
      {/* Component-specific styles */}
      <style jsx>{`
        .ol-popup {
          transform: translate(-50%, calc(-100% - 12px));
          min-width: 250px;
          max-width: 320px;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))
            drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06));
        }
        .ol-popup:after,
        .ol-popup:before {
          top: 100%;
          left: 50%;
          border: solid transparent;
          content: " ";
          height: 0;
          width: 0;
          position: absolute;
          pointer-events: none;
        }
        .ol-popup:after {
          border-top-color: white;
          border-width: 10px;
          margin-left: -10px;
        }
        .ol-popup:before {
          border-top-color: #e5e7eb;
          border-width: 11px;
          margin-left: -11px;
        }
        .ol-popup-closer {
          text-decoration: none;
          outline: none;
        }
        .popup-content {
          max-height: 200px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
}