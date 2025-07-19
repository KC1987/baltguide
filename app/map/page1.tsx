"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from 'next/dynamic';
import { Button } from "@heroui/button";
import Sidebar from "@/components/map/Sidebar";
import { createClient } from "@/config/supabase/client";
import FilterMain from "@/components/map/FilterMain";

// Dynamically import the map component to avoid SSR issues
// Note: Update this path to match where you place the MapComponent file
const DynamicMap = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>
});

export default function Page() {
  // Initialize Supabase client
  const supabase = createClient();

  // State management
  const [geolocation, setGeolocation] = useState({lat: "0", lon: "0"});
  const [activeMarker, setActiveMarker] = useState(null);
  const [filter, setFilter] = useState({ 
    searchText: "", 
    distanceSearch: { radius: "0", userLat: "0", userLon: "0" },
    city: null,
    country: null,
    petfriendly: null,
    family_friendly: null,
    open_24hrs: null,
    free_entry: null,
    souvenirs: null,
    rating: null,
    price_range: [],
    categories: [],
    wifi: [],
    parking: [],
    accessibility: [],
    audience_range: []
  });
  const [markers, setMarkers] = useState([]);
  const [selectedDistance, setSelectedDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newMarker, setNewMarker] = useState(null); // For map animation
  
  // Form state for adding new locations
  const [formData, setFormData] = useState({
    name: "",
    lon: "",
    lat: ""
  });

  // Helper function to check if an item matches any of the filter values
  const matchesArrayFilter = useCallback((itemArray, filterArray) => {
    if (!filterArray || !Array.isArray(filterArray) || filterArray.length === 0) {
      return true;
    }
    if (!itemArray || !Array.isArray(itemArray)) {
      return false;
    }
    
    const extractValues = (array) => {
      return array.flatMap(item => {
        if (typeof item === 'string') return [item];
        if (Array.isArray(item)) return item;
        if (typeof item === 'object' && item !== null) {
          return item.value || item.name || item.label || [String(item)];
        }
        return [String(item)];
      });
    };
    
    const itemValues = extractValues(itemArray);
    const filterValues = extractValues(filterArray);
    
    return filterValues.some(filterValue => 
      itemValues.some(itemValue => 
        String(itemValue).toLowerCase() === String(filterValue).toLowerCase()
      )
    );
  }, []);

  // Fetches attractions from Supabase
  const getAttractions = useCallback(async () => {
    console.log("getAttractions called with filter:", filter);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        'get_attractions_simple',
        {
          search_text: filter.searchText?.trim() || null,
          max_results: 100
        }
      );

      if (error) {
        console.error("Supabase error:", error);
        setMarkers([]);
        return;
      } 

      if (!data || !Array.isArray(data)) {
        setMarkers([]);
        return;
      }

      // Apply client-side filtering
      let filteredData = data;
      
      if (data.length > 0 && data[0].categories) {
        filteredData = data.filter(item => {
          return matchesArrayFilter(item.price_range, filter.price_range) &&
                 matchesArrayFilter(item.categories, filter.categories) &&
                 matchesArrayFilter(item.wifi, filter.wifi) &&
                 matchesArrayFilter(item.parking, filter.parking) &&
                 matchesArrayFilter(item.accessibility, filter.accessibility) &&
                 matchesArrayFilter(item.audience_range, filter.audience_range);
        });
      }

      // Transform data to marker format
      const attractions = filteredData.map((item) => ({
        id: item.uid,
        name: item.name || "Unnamed Location",
        lat: item.latitude,
        lon: item.longitude,
        description: item.description || "No description available",
        slug: item.slug,
        rating: item.rating,
        address: item.address,
        city: item.city,
        country: item.country,
        categories: item.categories || [],
        price_range: item.price_range || [],
        wifi: item.wifi || [],
        parking: item.parking || [],
        accessibility: item.accessibility || [],
        audience_range: item.audience_range || []
      }));

      setMarkers(attractions);
    } catch (err) {
      console.error("Error in getAttractions:", err);
      setMarkers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter.searchText, filter.price_range, filter.categories, filter.wifi, filter.parking, filter.accessibility, filter.audience_range, supabase, matchesArrayFilter]);

  // Handle form submission for adding new locations
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const { name, lat, lon } = formData;
    
    if (!name || !lat || !lon) {
      alert("Please fill in all fields");
      return;
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);

    if (
      isNaN(latNum) || isNaN(lonNum) ||
      latNum < -90 || latNum > 90 ||
      lonNum < -180 || lonNum > 180
    ) {
      alert("Invalid coordinates");
      return;
    }

    const newMarkerData = {
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      lat: latNum,
      lon: lonNum,
      description: "Newly added location",
    };

    setMarkers(prev => [...prev, newMarkerData]);
    setFormData({ name: "", lat: "", lon: "" });
    setNewMarker(newMarkerData); // Trigger map animation
    
    // Clear the animation trigger after a delay
    setTimeout(() => setNewMarker(null), 1500);
  }, [formData]);

  const updateFormField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Fetch attractions on mount and when filters change
  useEffect(() => {
    getAttractions();
  }, [getAttractions]);

  return (
    <div className="h-screen flex flex-col">
      {/* Debug info */}
      <div className="p-2 bg-gray-100 text-sm">
        <p>Loading: {isLoading ? 'Yes' : 'No'} | Markers: {markers.length}</p>
        <button 
          onClick={getAttractions}
          className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-xs"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeMarker={activeMarker}
          markers={markers}
          setActiveMarker={setActiveMarker}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Filter controls */}
          <div className="relative z-10 bg-white shadow-sm">
            <FilterMain
              filter={filter}
              getAttractions={getAttractions}
              setFilter={setFilter}
              userGeolocation={geolocation}
              setUserGeolocation={setGeolocation}
              selectedDistance={selectedDistance}
              setSelectedDistance={setSelectedDistance}
            />
          </div>

          {/* Map container */}
          <div className="w-full flex-1 relative bg-gray-200">
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="text-white">Loading...</div>
              </div>
            )}
            
            <DynamicMap 
              markers={markers}
              newMarker={newMarker}
              activeMarker={activeMarker}
            />
          </div>

          {/* Add location form */}
          <div className="p-4 bg-gray-50 h-1/4 overflow-y-auto border-t">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">
              Add New Location
            </h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="locationName">
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
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="latitude">
                    Latitude
                  </label>
                  <input
                    required
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    id="latitude"
                    placeholder="e.g., 56.951"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={formData.lat}
                    onChange={(e) => updateFormField('lat', e.target.value)}
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1" htmlFor="longitude">
                    Longitude
                  </label>
                  <input
                    required
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    id="longitude"
                    placeholder="e.g., 24.114"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
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
          </div>
        </div>
      </div>
    </div>
  );
}