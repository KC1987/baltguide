"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";

import { createClient } from "@/config/supabase/client";

import { HeartIcon as Heart_o } from "@heroicons/react/24/outline";
import { HeartIcon as Heart_s } from "@heroicons/react/24/solid";


export default function Favourite({ uid }:any) {
  const supabase = createClient();
  const { user } = useContext(AuthContext);

  const [ favourites, setFavourites ] = useState([]);

  // Retrieve user favourite locations
  useEffect( () => {
    setFavourites(user?.user_metadata.favourite_locations || []);
  }, [ user ] );


  

  async function handleFavourite() {
      let updatedFavourites: string[];
          
      if (favourites.includes(uid)) {
        // Remove from favourites
        updatedFavourites = favourites.filter(f => f !== uid);
      } else {
        // Add to favourites
        updatedFavourites = [...favourites, uid];
      }

      // Update database
      const { data, error } = await supabase.auth.updateUser({
        data: {
          favourite_locations: updatedFavourites
        }
      });

      if (error) {
        console.error("Error updating user: ", error);
      } else {
        console.log("User updated successfully", data);
        // Update local state only after successful database update
        setFavourites(updatedFavourites);
      }
  };

return (
  <span >
    {favourites.includes(uid) ? (
      <Heart_s onClick={handleFavourite} className="size-10 text-red-600 hover:cursor-pointer" />
    ) : (
      <Heart_o onClick={handleFavourite} className="size-10 text-red-600 hover:cursor-pointer" />
    )}
  </span>
)
}