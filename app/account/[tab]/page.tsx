"use client"

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useContext } from "react";

import { createClient } from "@/config/supabase/client"

import { AuthContext } from "@/contexts/AuthContext";

import { Button } from "@heroui/button";
import { Tab, Tabs, Card, CardBody } from "@heroui/react";

import LocationCard from "@/components/account/LocationCard";


export default function Page() {
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createClient();
  const { user } = useContext(AuthContext);

  const [ favourites, setFavourites ] = useState([]);

  // Handle tab selection
  const handleTabChange = (key) => {
    router.push(key);
  };

  // Retrieve user favourite locations
  useEffect( () => {
    async function getFavourites() {
      if (user?.user_metadata.favourite_locations && user?.user_metadata.favourite_locations.length > 0) {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .in("uid", user?.user_metadata.favourite_locations)
  
        if (error) {
          console.log("Error fetching favourites: ", error)
        } else {
          setFavourites(data);
          // console.log("Favourites fetched successfuly");
        }
      }
    };
    getFavourites();

    // setFavourites(user?.user_metadata.favourite_locations || []);
  }, [ user ] );

  return (
    <div className="my-8 p-2" >
      <Tabs className="" selectedKey={pathname} onSelectionChange={handleTabChange} isVertical >
        <Tab className="min-w-[180] min-h-[50]" key="/account/profile" title="Profile" >
          <div className="min-w-[400]  min-h-[400]" >
            <h1 className="text-xl">Profile</h1>
            <h1>User: {user?.user_metadata.username || "username not found..."}</h1>
            <h1>Email: {user?.email}</h1>

          </div>
        </Tab>
        <Tab className="min-w-[180] min-h-[50]" key="/account/favourites" title="Favourites" >
          <div className="min-w-[400] min-h-[400]" >
            <h1 className="text-xl" >Favourites</h1>
            <div className="flex gap-2">
              { favourites.map( loc => <LocationCard data={loc} key={loc.uid} />)}
            </div>

          </div>
        </Tab>
        <Tab className="min-w-[180] min-h-[50]" key="/account/settings" title="Settings" >
          
          <div className="min-w-[400]  min-h-[400]" >Settings content</div>
        </Tab>
      </Tabs>
      <Button onPress={() => {
        supabase.auth.signOut()
          .then( res => router.push("/login") )
      }} >Sign Out</Button>
    </div>
  )
}