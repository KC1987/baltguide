"use client"

import { useState, useEffect } from "react"

// import MapComponent from "@/components/map/MapComponent"
import Sidebar from "@/components/map/Sidebar"
import FilterMain from "@/components/map/FilterMain"
import DynamicMap from "@/components/map/DynamicMap"

import { createClient } from "@/config/supabase/client"
import { Button } from "@heroui/react";

const sample_markers = [
  {
    position: [56.905, 24.6],
    content: "sameple marker 1"
  }, {
    position: [57.905, 25.6],
    content: "sameple marker 2"
  }, {
    position: [55.905, 23.6],
    content: "sameple marker 3"
  }, 
];


export default function Page() {
  const supabase = createClient();

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
  const [ markers, setMarkers ] = useState([]);
  
  
  
  function addMarker() {
    setMarkers([...markers, { position: [56.7, 25], content: "sample content" }])
  }

  async function getLocations() {
    const { data, error } = await supabase.rpc(
      'get_attractions_simple',
      {
        search_text: null,
        max_results: 100
      }
    )
    
    error && console.error("Error fetching locations:", error);    
    
    if (data) {
      console.log(data);
      setMarkers(
        data.map( m => ({ position: [m.latitude, m.longitude], content: m.description }) )
      )
    }
  };

  useEffect( () => {
    getLocations();
  }, [] );





  return (
    <div>
      <FilterMain
        filter={filter}
        getLocations={getLocations}
        setFilter={setFilter}
        // userGeolocation={geolocation}
        // setUserGeolocation={setGeolocation}
        // selectedDistance={selectedDistance}
        // setSelectedDistance={setSelectedDistance}
      />
      <div className="flex" >
        <Button onPress={getLocations} >Test getLoactions</Button>
        <Button onPress={addMarker} >Add Marker</Button>
        <DynamicMap markers={markers} />
        {/* <Sidebar /> */}
      </div>
    </div>
  )
}