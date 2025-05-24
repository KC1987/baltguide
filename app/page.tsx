"use client"

import { useEffect, useState } from "react";

import { db } from "@/config/firebase"
import { collection, getDocs } from "firebase/firestore";
import { divider } from "@heroui/theme";
import { Link } from "@heroui/link";



export default function () {
  const [locations, setLocations] = useState([]);

  useEffect( () => {

    async function getLocations() {
      const collectionRef = collection( db, "locations" );
      
      await getDocs( collectionRef )
      .then( locations => setLocations(locations.docs.map( doc => doc.data() )) )
      
    };
    getLocations();
    
  }, [] )
  
  
  return (
    
    
    <div>
      <h1>Baltguide</h1>
      <Link href="/map" >Map</Link>
      <div><Link href="/add-attraction" >Add Attraction</Link></div>
      { locations.map( (loc, i) => (
        <div key={i} className="border border-orange-700 p-2 max-w-lg">
          <Link href={`/location/${loc.slug}`}>{loc.name}</Link>
          <h1>{loc.city}</h1>
        </div>
      ))}
    </div>
  )
}