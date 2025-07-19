import { CakeIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { notFound } from "next/navigation";

import Gallery from "@/components/location/Gallery";
import LocationIcons from "@/components/location/LocationIcons";
import BreadcrumbsComponent from "@/components/location/Breadcrumbs";
import Rating from "@/components/location/Rating";
import Favourite from "@/components/location/Favourite";
import { createClient } from "@/config/supabase/server";
import RightBar from "@/components/location/RightBar";

interface LocationData {
  uid: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  rating: number;
  quote: string;
  images: [];
  wifi?: string[];
  familyFriendly?: boolean;
  description: string;
  url: string;
  phone: ["", "", ""];
  address: string;
  features?: string[];
  petfriendly: boolean;
  free_entry: boolean;
  open_24hrs: boolean;
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  let location: LocationData | null = null;

  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("slug", slug)
      .single(); // Use .single() instead of accessing [0]

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data) {
      notFound(); // Handle case where location doesn't exist
    }
    console.log(data);
    location = data;
  } catch (error) {
    console.error("Failed to fetch location:", error);
    notFound();
  }

  return (
    <section className="flex flex-col container mx-auto px-4 gap-6 scroll-smooth py-6">
      {/* Breadcrumbs and Navigation */}
      <div className="flex items-center gap-2">
        <BreadcrumbsComponent
          city={location?.city}
          country={location?.country}
        />
      </div>

      {/* Title with Family Friendly indicator */}
      <div className="flex items-center gap-3">
        <Favourite uid={location?.uid} />
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100">
          {location.name}
        </h1>
        {location.familyFriendly && (
          <CakeIcon className="size-8 text-green-500" title="Family Friendly" />
        )}
      </div>

      {/* Icons */}
      <LocationIcons
        family_friendly={location?.familyFriendly}
        free_entry={location?.free_entry}
        open_24hrs={location?.open_24hrs}
        petfriendly={location?.petfriendly}
      />

      {/* Rating */}
      <Rating quote={location.quote} rating={location.rating} />

      {/* Gallery */}
      <div className="h-[400px] md:h-[500px] scroll-m-16" id="gallery">
        <Gallery images={location?.images || []} />
      </div>
      {/* Sticky Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-600 p-4 rounded-md">
        <div className="flex gap-4">
          <Link
            className="px-4 py-2 border border-sky-500 rounded-md hover:bg-sky-50 dark:hover:bg-sky-500 transition-colors"
            href="#gallery"
          >
            Gallery
          </Link>
          <Link
            className="px-4 py-2 border border-sky-500 rounded-md hover:bg-sky-50 dark:hover:bg-sky-500 transition-colors"
            href="#features"
          >
            Features
          </Link>
          <Link
            className="px-4 py-2 border border-sky-500 rounded-md hover:bg-sky-50 dark:hover:bg-sky-500 transition-colors"
            href="#description"
          >
            Description
          </Link>
          <Link
            className="px-4 py-2 border border-sky-500 rounded-md hover:bg-sky-50 dark:hover:bg-sky-500 transition-colors"
            href="#info"
          >
            Info
          </Link>
        </div>
      </div>

      {/* RightBar split */}
      <div className="flex gap-2">
        {/* Features Section */}
        <div className="flex flex-col gap-2 ">
          <div
            className="scroll-mt-20 bg-slate-50 dark:bg-slate-800 rounded-md p-6 shadow-sm"
            id="features"
          >
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Features at {location.name}
            </h2>
            {/* WiFi Options */}
            {/* {location.wifi && location.wifi.length > 0 && (
                      <div className="mb-6">
                      <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                      WiFi Options
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                      {location.wifi?.map((option, i) => (
                        <li key={i} className="text-slate-600 dark:text-slate-300">
                        {option}
                        </li>
                        ))}
                        </ul>
                        </div>
                        )}
                        */}
            {/* Additional Features */}
            {location.features && location.features.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Amenities
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {location.features.map((feature, i) => (
                    <li key={i} className="text-slate-600 dark:text-slate-300">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              className="w-full md:w-auto"
              color="success"
              size="lg"
              variant="shadow"
            >
              Book Now
            </Button>
          </div>
          {/* Description Section */}
          <div
            className="scroll-mt-20 bg-white dark:bg-slate-800 rounded-md p-6 shadow-sm"
            id="description"
          >
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              About {location.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {location.description}
            </p>
          </div>
          {/* Info Section */}
          <div
            className="scroll-mt-20 bg-slate-50 dark:bg-slate-800 rounded-md p-6 shadow-sm"
            id="info"
          >
            <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              {location.url && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Website:{" "}
                  </span>
                  <Link
                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400"
                    href={location.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {location.url}
                  </Link>
                </div>
              )}
              {location.phone && (
                <div className="gap-2">
                  <p>Phone Number(s):</p>
                  {location?.phone.map((tel, i) => (
                    <div key={i}>
                      <a
                        className="font-medium hover:text-sky-500"
                        href={`tel:${tel}`}
                      >
                        {tel}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              {location.address && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Address:{" "}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {location.address}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <RightBar />
      </div>
    </section>
  );
}
