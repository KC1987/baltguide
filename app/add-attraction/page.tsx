"use client"

import React, { useState, useEffect, useRef } from "react";
import { Button } from '@heroui/button';
// Assuming db is correctly configured and imported from "@/config/firebase"
import { db, storage } from "@/config/firebase"; // Import storage
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import storage functions
import { Dropdown, DropdownItem, DropdownTrigger, DropdownMenu } from "@heroui/react";
import mapboxgl from 'mapbox-gl';
import { v4 as uuidv4 } from 'uuid'; // For generating unique image names

// Mapbox credentials provided by the user
const mapboxUsername = 'kc87';
const mapboxStyleId = 'cmapseqwe01mz01qyc4ma5m7a';
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoia2M4NyIsImEiOiJjbWFwcDhtcGowMHZ0MmtzNTR6a2hkd3hnIn0.P5R7RxumD0mYTFUO0yPSpg';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

export default function Page() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rating, setRating] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("");
  const [souvenirs, setSouvenirs] = useState("");
  const [petfriendly, setPetfriendly] = useState("");
  const [wifiKeys, setWifiKeys] = useState(new Set([]));
  const [accessibilityKeys, setAccessibilityKeys] = useState(new Set([]));
  const [parkingKeys, setParkingKeys] = useState(new Set([]));
  const [categoriesKeys, setCategoriesKeys] = useState(new Set([]));
  const [admissionFee, setAdmissionFee] = useState(""); // New state for Admission Fee
  const [openingHours, setOpeningHours] = useState(""); // New state for Opening Hours


  // Image upload state
  const [images, setImages] = useState([]); // To store selected image files
  const [imageUrls, setImageUrls] = useState([]); // To store uploaded image URLs
  const [isUploading, setIsUploading] = useState(false); // To track upload status

  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);
  const suggestionsListRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsListRef.current &&
        !suggestionsListRef.current.contains(event.target) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (searchText) => {
    if (!searchText) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?` +
        new URLSearchParams({
          access_token: mapboxgl.accessToken,
          autocomplete: 'true',
          country: ['LV', 'LT', 'EE'],
          types: 'address,poi',
        })
      );
      if (!response.ok) throw new Error(`Mapbox API error: ${response.statusText}`);
      const data = await response.json();
      setSuggestions(data.features || []);
    } catch (error) {
      console.error('Error fetching Mapbox suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setAutocompleteQuery(value);
    setAddress(value);
    setLatitude("");
    setLongitude("");
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setAutocompleteQuery(suggestion.place_name);
    setAddress(suggestion.place_name);
    setSuggestions([]);
    if (suggestion.center && suggestion.center.length === 2) {
      setLongitude(suggestion.center[0].toString());
      setLatitude(suggestion.center[1].toString());
    }
    const countryContext = suggestion.context?.find(c => c.id.startsWith('country'));
    if (countryContext) setCountry(countryContext.text);
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files) {
      // Allow multiple files to be selected, convert FileList to array
      setImages(Array.from(e.target.files));
    }
  };

  // Upload images to Firebase Storage and get URLs
  const uploadImages = async () => {
    if (images.length === 0) return []; // No images to upload

    setIsUploading(true);
    const uploadedUrls = [];
    for (const image of images) {
      // Create a unique filename using uuid to prevent overwrites
      const imageName = `attractions/${uuidv4()}-${image.name}`;
      const imageRef = ref(storage, imageName);
      try {
        await uploadBytes(imageRef, image);
        const url = await getDownloadURL(imageRef);
        uploadedUrls.push(url);
        console.log(`Uploaded ${image.name} to ${url}`);
      } catch (error) {
        console.error("Error uploading image:", image.name, error);
        // Optionally, handle individual image upload errors
      }
    }
    setIsUploading(false);
    return uploadedUrls;
  };


  async function handleSubmit(e) {
    e.preventDefault();
    if (!latitude || !longitude) {
      console.error("Latitude and Longitude are required.");
      return;
    }

    // Upload images first
    const newImageUrls = await uploadImages();

    const newAttraction = {
      type: "attraction",
      name,
      slug,
      description,
      address,
      phone,
      url,
      country,
      souvenirs,
      petfriendly,
      rating: Number(rating),
      coordinates: [Number(latitude), Number(longitude)],
      wifi: Array.from(wifiKeys),
      accessibility: Array.from(accessibilityKeys),
      parking: Array.from(parkingKeys),
      categories: Array.from(categoriesKeys),
      imageUrls: newImageUrls, // Store the array of image URLs
      admissionFee, // Added Admission Fee
      openingHours, // Added Opening Hours
      reviews: [],
    };

    try {
      const collectionRef = collection(db, "locations");
      await addDoc(collectionRef, newAttraction);
      console.log("Attraction added successfully:", newAttraction);
      setName("");
      setDescription("");
      setSlug("");
      setLatitude("");
      setLongitude("");
      setRating("");
      setAddress("");
      setPhone("");
      setUrl("");
      setCountry("");
      setSouvenirs("");
      setPetfriendly("");
      setWifiKeys(new Set([]));
      setAccessibilityKeys(new Set([]));
      setParkingKeys(new Set([]));
      setCategoriesKeys(new Set([]));
      setAutocompleteQuery("");
      setSuggestions([]);
      setImages([]); // Clear selected image files
      setImageUrls([]); // Clear uploaded image URLs from state (already in newAttraction)
      setAdmissionFee(""); // Reset Admission Fee
      setOpeningHours(""); // Reset Opening Hours
      // Clear the file input visually if possible (or provide feedback)
      const fileInput = document.getElementById('images');
      if (fileInput) fileInput.value = "";


    } catch (error) {
      console.error("Error adding attraction:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .heroui-button {
            min-height: 42px; display: flex; align-items: center; justify-content: center;
            padding: 0 16px; border-radius: 0.375rem; border: 1px solid #d1d5db;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.15s ease-in-out;
            background-color: white; color: #1f2937;
          }
          .heroui-button:focus {
            outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); border-color: transparent;
          }
          .heroui-button:hover { background-color: #f9fafb; }
        `}
      </style>
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Add Attraction</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <ul className="space-y-4">
          <li>
            <input
              type="text" id="name" value={name} placeholder="Name"
              onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <input
              type="text" id="slug" value={slug} placeholder="Slug"
              onChange={(e) => setSlug(e.target.value)} required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li className="relative">
            <input
              ref={addressInputRef} type="text" id="address" value={autocompleteQuery}
              placeholder="Address (start typing for suggestions)"
              onChange={handleAddressInputChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
            {suggestions.length > 0 && (
              <ul
                ref={suggestionsListRef}
                className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id} onClick={() => handleSelectSuggestion(suggestion)}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out text-gray-800"
                  >
                    {suggestion.place_name}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <input
              type="tel" id="phone" value={phone} placeholder="Phone"
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <input
              type="url" id="url" value={url} placeholder="URL"
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <textarea
              id="description" value={description} placeholder="Description"
              onChange={(e) => setDescription(e.target.value)} required rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          {/* New Input for Admission Fee */}
          <li>
            <input
              type="text" id="admissionFee" value={admissionFee} placeholder="Admission Fee (e.g., Free, 10 EUR, Varies)"
              onChange={(e) => setAdmissionFee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          {/* New Textarea for Opening Hours */}
          <li>
            <textarea
              id="openingHours" value={openingHours} placeholder="Opening Hours (e.g., Mon-Fri: 9 AM - 5 PM)"
              onChange={(e) => setOpeningHours(e.target.value)} rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
           {/* Image Upload Input */}
           <li>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Images (select multiple)
            </label>
            <input
              type="file"
              id="images"
              multiple // Allow multiple files
              onChange={handleImageChange}
              accept="image/*" // Accept only image files
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
             {/* Display selected image names (optional) */}
             {images.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Selected: {images.map(file => file.name).join(', ')}
              </div>
            )}
          </li>
          <li>
            <input
              type="number" id="latitude" value={latitude} placeholder="Latitude"
              onChange={(e) => setLatitude(e.target.value)} required step="any"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <input
              type="number" id="longitude" value={longitude} placeholder="Longitude"
              onChange={(e) => setLongitude(e.target.value)} required step="any"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <input
              type="number" id="rating" value={rating} placeholder="Rating (1-10)"
              onChange={(e) => setRating(e.target.value)} required min="1" max="10" step="0.5"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
            />
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">{country || "Select Country"}</Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection aria-label="country selection" closeOnSelect={true}
                selectedKeys={country ? new Set([country]) : new Set([])} selectionMode="single"
                variant="flat" onSelectionChange={(keys) => setCountry(Array.from(keys)[0] || "")}
              >
                <DropdownItem key="Latvia">Latvia</DropdownItem>
                <DropdownItem key="Lithuania">Lithuania</DropdownItem>
                <DropdownItem key="Estonia">Estonia</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
           <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">{petfriendly ? (petfriendly === 'yes' ? 'Pet Friendly: Yes' : 'Pet Friendly: No') : "Pet Friendly"}</Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="petfriendly selection" closeOnSelect={true}
                selectedKeys={petfriendly ? new Set([petfriendly]) : new Set([])}
                selectionMode="single" variant="flat"
                onSelectionChange={(keys) => setPetfriendly(Array.from(keys)[0] || "")}
              >
                <DropdownItem key="yes">Yes</DropdownItem>
                <DropdownItem key="no">No</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">{souvenirs ? (souvenirs === 'yes' ? 'Souvenirs: Yes' : 'Souvenirs: No') : "Souvenirs"}</Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="souvenirs selection" closeOnSelect={true}
                selectedKeys={souvenirs ? new Set([souvenirs]) : new Set([])}
                selectionMode="single" variant="flat"
                onSelectionChange={(keys) => setSouvenirs(Array.from(keys)[0] || "")}
              >
                <DropdownItem key="yes">Yes</DropdownItem>
                <DropdownItem key="no">No</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(wifiKeys).length > 0 ? `Wifi: ${Array.from(wifiKeys).join(', ')}` : "Select Wifi Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="wifi selection" closeOnSelect={false} selectedKeys={wifiKeys}
                selectionMode="multiple" variant="flat" onSelectionChange={setWifiKeys}
              >
                <DropdownItem key="free">Free</DropdownItem>
                <DropdownItem key="free-limited">Free Limited</DropdownItem>
                <DropdownItem key="paid">Paid</DropdownItem>
                <DropdownItem key="none">None</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(parkingKeys).length > 0 ? `Parking: ${Array.from(parkingKeys).join(', ')}` : "Select Parking Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="parking selection" closeOnSelect={false} selectedKeys={parkingKeys}
                selectionMode="multiple" variant="flat" onSelectionChange={setParkingKeys}
              >
                <DropdownItem key="free">Free</DropdownItem>
                <DropdownItem key="paid">Paid</DropdownItem>
                <DropdownItem key="nearby">Nearby</DropdownItem>
                <DropdownItem key="none">None</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(accessibilityKeys).length > 0 ? `Accessibility: ${Array.from(accessibilityKeys).join(', ')}` : "Select Accessibility Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="accessibility selection" closeOnSelect={false} selectedKeys={accessibilityKeys}
                selectionMode="multiple" variant="flat" onSelectionChange={setAccessibilityKeys}
              >
                <DropdownItem key="wheelchair-accessible">Wheelchair Accessible</DropdownItem>
                <DropdownItem key="accessible-restrooms">Accessible Restrooms</DropdownItem>
                <DropdownItem key="audio-tours">Audio Tours</DropdownItem>
                <DropdownItem key="braille-signage">Braille Signage</DropdownItem>
                <DropdownItem key="none">None</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(categoriesKeys).length > 0 ? `Categories: ${Array.from(categoriesKeys).join(', ')}` : "Select Categories"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="categories selection" closeOnSelect={false} selectedKeys={categoriesKeys}
                selectionMode="multiple" variant="flat" onSelectionChange={setCategoriesKeys}
              >
                <DropdownItem key="culture-history">Culture & History</DropdownItem>
                <DropdownItem key="parks-nature">Parks & Nature</DropdownItem>
                <DropdownItem key="amusement-theme-parks">Amusement & Theme Parks</DropdownItem>
                <DropdownItem key="arts-live-entertainment">Arts & Live Entertainment</DropdownItem>
                <DropdownItem key="nightlife-bars">Nightlife & Bars</DropdownItem>
                <DropdownItem key="sports-recreation">Sports & Recreation</DropdownItem>
                <DropdownItem key="shopping-markets">Shopping & Markets</DropdownItem>
                <DropdownItem key="restaurants-dining">Restaurants & Dining</DropdownItem>
                <DropdownItem key="unique-niche">Unique & Niche Attractions</DropdownItem>
                <DropdownItem key="educational-interactive">Educational & Interactive</DropdownItem>
                <DropdownItem key="wellness-relaxation">Wellness & Relaxation</DropdownItem>
                <DropdownItem key="transport-tours">Transport & Tours</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
              disabled={isUploading} // Disable button while uploading
            >
              {isUploading ? 'Uploading Images...' : 'Submit Attraction'}
            </Button>
          </li>
        </ul>
      </form>
    </div>
  );
}