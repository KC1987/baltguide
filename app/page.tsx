"use client";

import { useEffect, useState, useContext } from "react";
import { Link } from "@heroui/link";

import { AuthContext } from "@/contexts/AuthContext";
import { createClient } from "@/config/supabase/client";
import { useTranslation } from "@/lib/i18n";
import TranslationProvider from "@/components/TranslationProvider";

function HomePage() {
  const [locations, setLocations] = useState([]);
  const { t } = useTranslation();

  const supabase = createClient();

  const { session, user, loading } = useContext(AuthContext);

  useEffect(() => {
    async function getLocations() {
      // console.log((await supabase.auth.getSession()).data)

      const { data, error } = await supabase.from("locations").select("*");
      // .eq("country", "Latvia")

      // console.log(data);
      setLocations(data);
    }

    // async function getLocations() {
    //   const collectionRef = collection( db, "locations" );

    //   await getDocs( collectionRef )
    //   .then( locations => setLocations(locations.docs.map( doc => doc.data() )) )

    // };
    getLocations();
  }, []);

  return (
    <div>
      <button onClick={() => console.log(user, session)}>
        Log User Context
      </button>
      <h1>{t("locations.title")}</h1>
      <p>{t("locations.description")}</p>
      <Link href="/map">{t("navigation.map")}</Link>
      <div>
        <Link href="/add-attraction">{t("navigation.addAttraction")}</Link>
      </div>
      {locations.map((loc, i) => (
        <div key={i} className="border border-orange-700 p-2 max-w-lg">
          <Link href={`/location/${loc.slug}`}>{loc.name}</Link>
          <h1>{loc.city}</h1>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <TranslationProvider>
      <HomePage />
    </TranslationProvider>
  );
}
