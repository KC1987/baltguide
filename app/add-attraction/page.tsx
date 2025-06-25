"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@heroui/button";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/react";
import {
  Dropdown,
  DropdownItem,
  DropdownTrigger,
  DropdownMenu,
} from "@heroui/react";
import mapboxgl from "mapbox-gl";
import { v4 as uuidv4 } from "uuid";

import { taglist } from "@/res/tagList";
import { createClient } from "@/config/supabase/client";

export default function Page() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rating, setRating] = useState("");
  const [address, setAddress] = useState("");

  // Phone Numbers
  const [number1, setNumber1] = useState("");
  const [number2, setNumber2] = useState("");
  const [number3, setNumber3] = useState("");

  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [souvenirs, setSouvenirs] = useState(false);
  const [petfriendly, setPetfriendly] = useState(false);
  const [wifiKeys, setWifiKeys] = useState(new Set([]));
  const [accessibilityKeys, setAccessibilityKeys] = useState(new Set([]));
  const [categoriesKeys, setCategoriesKeys] = useState(new Set([]));
  const [priceRangeKeys, setPriceRangeKeys] = useState(new Set([]));
  const [audienceRangeKeys, setAudienceRangeKeys] = useState(new Set([]));
  const [parkingKeys, setParkingKeys] = useState(new Set([]));
  const [admissionFee, setAdmissionFee] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [open24hrs, setOpen24hrs] = useState(false);
  const [freeEntry, setFreeEntry] = useState(false);
  const [quote, setQuote] = useState("");
  const [tags, setTags] = useState([]);

  // Image upload state
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const debounceTimeoutRef = useRef(null);
  const nameDebounceTimeoutRef = useRef(null);
  const descriptionDebounceTimeoutRef = useRef(null);
  const addressInputRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const fileInputRef = useRef(null);

  const supabase = createClient();

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

  // Constants for validation
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  // Auto-generate slug from name
  const generateSlug = useCallback((text) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .replace(/^-+|-+$/g, "");
  }, []);

  // Validate file
  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert(
        `File type ${file.type} is not supported. Allowed types: JPEG, PNG, GIF, WebP`,
      );

      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);

      return false;
    }

    return true;
  }, []);

  // Fixed optimize image function
  const optimizeImage = useCallback((file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Don't upscale images
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);

        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));

              return;
            }

            // Create a new File object from the Blob to preserve properties
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          file.type,
          quality,
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Fixed process image files
  const processImageFiles = useCallback(
    (files) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(validateFile);

      if (validFiles.length === 0) return;

      const imageFiles = [];
      const promises = [];

      validFiles.forEach((file) => {
        imageFiles.push(file);

        promises.push(
          new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
              resolve({
                id: uuidv4(),
                file: file,
                url: e.target.result,
                name: file.name,
                caption: "",
              });
            };
            reader.onerror = () => {
              console.error(`Failed to read file: ${file.name}`);
              resolve(null);
            };
            reader.readAsDataURL(file);
          }),
        );
      });

      Promise.all(promises).then((previews) => {
        // Filter out any null values from failed reads
        const validPreviews = previews.filter((p) => p !== null);

        setImages(imageFiles);
        setImagePreviews(validPreviews);
      });
    },
    [validateFile],
  );

  // Handle name input with debouncing
  const handleNameChange = useCallback(
    (e) => {
      const value = e.target.value;

      setName(value);

      if (nameDebounceTimeoutRef.current) {
        clearTimeout(nameDebounceTimeoutRef.current);
      }

      nameDebounceTimeoutRef.current = setTimeout(() => {
        if (value && !slug) {
          setSlug(generateSlug(value));
        }
      }, 500);
    },
    [slug, generateSlug],
  );

  // Handle description input
  const handleDescriptionChange = useCallback((e) => {
    const value = e.target.value;

    setDescription(value);

    if (descriptionDebounceTimeoutRef.current) {
      clearTimeout(descriptionDebounceTimeoutRef.current);
    }

    descriptionDebounceTimeoutRef.current = setTimeout(() => {
      // Any debounced description processing can go here
    }, 500);
  }, []);

  // Handle drag and drop events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      if (files.length > 0) {
        processImageFiles(files);
      }
    },
    [processImageFiles],
  );

  // Fixed remove image function
  const removeImage = useCallback((imageId) => {
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((img) => img.id !== imageId);

      // Also update the images array to match
      setImages(newPreviews.map((preview) => preview.file));

      return newPreviews;
    });
  }, []);

  // Update image caption
  const updateImageCaption = useCallback((imageId, caption) => {
    setImagePreviews((prev) =>
      prev.map((img) => (img.id === imageId ? { ...img, caption } : img)),
    );
  }, []);

  // Handle image file selection
  const handleImageChange = useCallback(
    (e) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);

        processImageFiles(files);
      }
    },
    [processImageFiles],
  );

  const handleAutoGenerate = useCallback(() => {
    const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const locations = {
      Latvia: { city: "Riga", lat: 56.9496, lon: 24.1052 },
      Lithuania: { city: "Vilnius", lat: 54.6872, lon: 25.2797 },
      Estonia: { city: "Tallinn", lat: 59.437, lon: 24.7536 },
    };

    const sampleNames = [
      "Old Town Walking Tour",
      "Freedom Monument Viewpoint",
      "Grand Cathedral",
      "National History Museum",
      "Riverside Park",
      "Modern Art Gallery",
      "Historic Castle Hill",
      "Central Market Hall",
    ];
    const sampleQuotes = [
      "A must-see for every visitor.",
      "The heart of the city.",
      "A truly unforgettable experience.",
      "Perfect for a sunny afternoon.",
    ];

    const generatedName = randomItem(sampleNames);
    const generatedSlug = generateSlug(generatedName);

    const chosenCountry = randomItem(Object.keys(locations));
    const locationInfo = locations[chosenCountry];
    const generatedCity = locationInfo.city;

    const generatedLat = (
      locationInfo.lat +
      (Math.random() - 0.5) * 0.1
    ).toFixed(6);
    const generatedLon = (
      locationInfo.lon +
      (Math.random() - 0.5) * 0.1
    ).toFixed(6);

    const generatedAddress = `${generatedCity} Center, near ${randomItem(["Main Square", "the River", "the Opera House"])}`;

    const allCategories = [
      "culture-history",
      "parks-nature",
      "amusement-theme-parks",
      "arts-live-entertainment",
      "nightlife-bars",
      "sports-recreation",
      "shopping-markets",
      "restaurants-dining",
      "unique-niche",
      "educational-interactive",
      "wellness-relaxation",
      "transport-tours",
    ];
    const generatedCategories = new Set(
      allCategories.filter(() => Math.random() > 0.7).slice(0, 3),
    );

    if (generatedCategories.size === 0)
      generatedCategories.add(randomItem(allCategories));

    const allPriceRanges = ["free", "budget", "moderate", "expensive"];
    const generatedPriceRange = new Set([randomItem(allPriceRanges)]);
    const isFree = generatedPriceRange.has("free") || Math.random() > 0.5;

    // Generate a rating from 1.0 to 5.0 in 0.5 increments
    const ratingSteps = Math.floor(Math.random() * 9); // 9 steps: 1.0, 1.5, ..., 5.0
    const generatedRating = (1.0 + ratingSteps * 0.5).toFixed(1);

    setName(generatedName);
    setSlug(generatedSlug);
    setCountry(chosenCountry);
    setCity(generatedCity);
    setLatitude(generatedLat);
    setLongitude(generatedLon);
    setAddress(generatedAddress);
    setAutocompleteQuery(generatedAddress);
    setRating(generatedRating);
    setDescription(
      `A wonderful place to explore ${generatedCity}. This location offers a unique glimpse into the local culture and is popular among tourists and locals alike. Don't miss the opportunity to visit.`,
    );
    setQuote(randomItem(sampleQuotes));

    // Set booleans
    setFamilyFriendly(Math.random() > 0.3);
    setSouvenirs(Math.random() > 0.5);
    setPetfriendly(Math.random() > 0.7);
    setOpen24hrs(Math.random() > 0.8);
    setFreeEntry(isFree);

    // Set dropdowns
    setPriceRangeKeys(generatedPriceRange);
    setAdmissionFee(
      isFree ? "Free" : `${Math.floor(Math.random() * 10 + 5)} EUR`,
    );
    setOpeningHours("Mon-Fri: 10:00 AM - 6:00 PM, Sat-Sun: 11:00 AM - 7:00 PM");
    setWifiKeys(new Set([randomItem(["free", "paid", "none"])]));
    setParkingKeys(new Set([randomItem(["nearby", "paid", "free"])]));
    setAccessibilityKeys(
      new Set(Math.random() > 0.5 ? ["wheelchair-accessible"] : ["none"]),
    );
    setCategoriesKeys(generatedCategories);

    setNumber1(`+371 ${Math.floor(10000000 + Math.random() * 90000000)}`);
    setNumber2("");
    setNumber3("");
    setUrl(`https://example.com/${generatedSlug}`);

    // Clear suggestions and images
    setSuggestions([]);
    setImagePreviews([]);
    setImages([]);
    setTags([]);
  }, [generateSlug]);

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

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
            autocomplete: "true",
            country: ["LV", "LT", "EE"],
            types: "address,poi",
          }),
      );

      if (!response.ok)
        throw new Error(`Mapbox API error: ${response.statusText}`);
      const data = await response.json();

      setSuggestions(data.features || []);
    } catch (error) {
      console.error("Error fetching Mapbox suggestions:", error);
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
    const countryContext = suggestion.context?.find((c) =>
      c.id.startsWith("country"),
    );

    if (countryContext) setCountry(countryContext.text);

    const placeContext = suggestion.context?.find((c) =>
      c.id.startsWith("place"),
    );

    if (placeContext) setCity(placeContext.text);
  };

  // Fixed upload images function
  const uploadImages = async () => {
    if (imagePreviews.length === 0) return [];

    setIsUploading(true);
    setUploadProgress(0);
    const uploadedImagesData = [];
    const totalImages = imagePreviews.length;

    try {
      for (let i = 0; i < imagePreviews.length; i++) {
        const preview = imagePreviews[i];

        try {
          // Update progress
          setUploadProgress(Math.round((i / totalImages) * 100));

          // Optimize image before upload
          const optimizedImage = await optimizeImage(preview.file);

          // Create a unique filename
          const fileName = `${uuidv4()}-${preview.file.name}`;
          const filePath = `attractions/${fileName}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from("images")
            .upload(filePath, optimizedImage, {
              contentType: preview.file.type,
              upsert: false,
            });

          if (error) throw error;

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(filePath);

          uploadedImagesData.push({
            url: publicUrl,
            caption: preview.caption || "",
            name: preview.file.name,
          });

          console.log(`Uploaded ${preview.file.name} to ${publicUrl}`);
        } catch (error) {
          console.error("Error uploading image:", preview.file.name, error);
          alert(`Failed to upload ${preview.file.name}: ${error.message}`);
          // Continue with other images even if one fails
        }
      }

      setUploadProgress(100);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }

    return uploadedImagesData;
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!latitude || !longitude) {
      alert("Latitude and Longitude are required.");

      return;
    }

    if (!name || !slug || !description) {
      alert("Name, slug, and description are required.");

      return;
    }

    try {
      // Upload images first
      const uploadedImages = await uploadImages();

      // Prepare data for Supabase
      const newAttraction = {
        type: "attraction",
        name,
        slug,
        description,
        address,
        phone: [number1, number2, number3].filter(Boolean),
        url,
        country,
        city,
        souvenirs,
        petfriendly,
        rating: Number(rating),
        latitude: Number(latitude),
        longitude: Number(longitude),
        wifi: Array.from(wifiKeys),
        accessibility: Array.from(accessibilityKeys),
        parking: Array.from(parkingKeys),
        categories: Array.from(categoriesKeys),
        price_range: Array.from(priceRangeKeys),
        audience_range: Array.from(audienceRangeKeys),
        images: uploadedImages,
        admission_fee: admissionFee,
        opening_hours: openingHours,
        family_friendly: familyFriendly,
        open_24hrs: open24hrs,
        free_entry: freeEntry,
        quote,
        tags,
        reviews: [],
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from("locations")
        .insert([newAttraction])
        .select();

      if (error) throw error;

      console.log("Attraction added successfully:", data);
      alert("Attraction added successfully!");

      // Reset form
      setName("");
      setDescription("");
      setSlug("");
      setLatitude("");
      setLongitude("");
      setRating("");
      setAddress("");
      setNumber1("");
      setNumber2("");
      setNumber3("");
      setUrl("");
      setCountry("");
      setCity("");
      setSouvenirs(false);
      setPetfriendly(false);
      setWifiKeys(new Set([]));
      setAccessibilityKeys(new Set([]));
      setParkingKeys(new Set([]));
      setCategoriesKeys(new Set([]));
      setPriceRangeKeys(new Set([]));
      setAudienceRangeKeys(new Set([]));
      setAutocompleteQuery("");
      setSuggestions([]);
      setImages([]);
      setImagePreviews([]);
      setAdmissionFee("");
      setOpeningHours("");
      setFamilyFriendly(false);
      setOpen24hrs(false);
      setFreeEntry(false);
      setQuote("");
      setTags([]);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error adding attraction:", error);
      alert(`Error adding attraction: ${error.message}`);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-10">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; }
          .heroui-button {
            min-height: 42px; display: flex; align-items: center; justify-content: center;
            padding: 0 16px; border-radius: 0.375rem; border: 1px solid hsl(var(--nextui-default-300));
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.15s ease-in-out;
            background-color: hsl(var(--nextui-default-50)); color: hsl(var(--nextui-default-900));
          }
          .heroui-button:focus {
            outline: none; box-shadow: 0 0 0 2px hsl(var(--nextui-primary-500) / 0.3); border-color: hsl(var(--nextui-primary-500));
          }
          .heroui-button:hover { background-color: hsl(var(--nextui-default-100)); }
        `}
      </style>
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Add Attraction</h1>
        <Button
          className="heroui-button bg-secondary-100 text-secondary-800 hover:bg-secondary-200 border-secondary-200"
          type="button"
          onClick={handleAutoGenerate}
        >
          Auto Generate
        </Button>
      </div>
      <form
        className="bg-content1 p-8 rounded-xl shadow-large w-full max-w-lg border border-divider"
        onSubmit={handleSubmit}
      >
        <ul className="space-y-6">
          <li>
            <input
              required
              className="w-full px-4 py-3 bg-default-100 border border-default-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200 ease-in-out text-foreground placeholder-default-500"
              id="name"
              placeholder="Name"
              type="text"
              value={name}
              onChange={handleNameChange}
            />
          </li>
          <li>
            <input
              required
              className="w-full px-4 py-3 bg-default-100 border border-default-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200 ease-in-out text-foreground placeholder-default-500"
              id="slug"
              placeholder="Slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </li>
          <li className="relative">
            <input
              ref={addressInputRef}
              required
              className="w-full px-4 py-3 bg-default-100 border border-default-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200 ease-in-out text-foreground placeholder-default-500"
              id="address"
              placeholder="Address (start typing for suggestions)"
              type="text"
              value={autocompleteQuery}
              onChange={handleAddressInputChange}
            />
            {suggestions.length > 0 && (
              <ul
                ref={suggestionsListRef}
                className="absolute z-10 w-full bg-content1 border border-divider rounded-lg shadow-large max-h-60 overflow-y-auto mt-1 backdrop-blur-sm"
              >
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="px-4 py-3 cursor-pointer hover:bg-default-100 transition duration-200 ease-in-out text-foreground border-b border-divider last:border-b-0"
                    onClick={() => handleSelectSuggestion(suggestion)}
                  >
                    {suggestion.place_name}
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="city"
              placeholder="City"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </li>

          {/* Phone */}
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="number1"
              placeholder="Phone 1"
              type="tel"
              value={number1}
              onChange={(e) => setNumber1(e.target.value)}
            />
          </li>
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="number2"
              placeholder="Phone 2"
              type="tel"
              value={number2}
              onChange={(e) => setNumber2(e.target.value)}
            />
          </li>
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="number3"
              placeholder="Phone 3"
              type="tel"
              value={number3}
              onChange={(e) => setNumber3(e.target.value)}
            />
          </li>

          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="url"
              placeholder="URL"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </li>
          <li>
            <textarea
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="description"
              placeholder="Description"
              rows="4"
              value={description}
              onChange={handleDescriptionChange}
            />
          </li>
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="quote"
              placeholder='Quote (e.g., "A must-see historical landmark")'
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </li>
          <li>
            <input
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="admissionFee"
              placeholder="Admission Fee (e.g., Free, 10 EUR, Varies)"
              type="text"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(e.target.value)}
            />
          </li>
          <li>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="openingHours"
              placeholder="Opening Hours (e.g., Mon-Fri: 9 AM - 5 PM)"
              rows="3"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
            />
          </li>
          <li className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-default-50 rounded-lg border border-default-200 hover:border-default-300 transition-colors duration-200">
              <input
                checked={familyFriendly}
                className="w-5 h-5 text-primary-600 bg-default-100 border-default-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all duration-200"
                id="familyFriendly"
                type="checkbox"
                onChange={(e) => setFamilyFriendly(e.target.checked)}
              />
              <label
                className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none"
                htmlFor="familyFriendly"
              >
                Family Friendly
              </label>
              <span className="text-xs text-default-500">
                {familyFriendly ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-default-50 rounded-lg border border-default-200 hover:border-default-300 transition-colors duration-200">
              <input
                checked={open24hrs}
                className="w-5 h-5 text-primary-600 bg-default-100 border-default-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all duration-200"
                id="open24hrs"
                type="checkbox"
                onChange={(e) => setOpen24hrs(e.target.checked)}
              />
              <label
                className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none"
                htmlFor="open24hrs"
              >
                Open 24 Hours
              </label>
              <span className="text-xs text-default-500">
                {open24hrs ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-default-50 rounded-lg border border-default-200 hover:border-default-300 transition-colors duration-200">
              <input
                checked={freeEntry}
                className="w-5 h-5 text-primary-600 bg-default-100 border-default-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all duration-200"
                id="freeEntry"
                type="checkbox"
                onChange={(e) => setFreeEntry(e.target.checked)}
              />
              <label
                className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none"
                htmlFor="freeEntry"
              >
                Free Entry
              </label>
              <span className="text-xs text-default-500">
                {freeEntry ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-default-50 rounded-lg border border-default-200 hover:border-default-300 transition-colors duration-200">
              <input
                checked={souvenirs}
                className="w-5 h-5 text-primary-600 bg-default-100 border-default-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all duration-200"
                id="souvenirs"
                type="checkbox"
                onChange={(e) => setSouvenirs(e.target.checked)}
              />
              <label
                className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none"
                htmlFor="souvenirs"
              >
                Souvenirs Available
              </label>
              <span className="text-xs text-default-500">
                {souvenirs ? "Yes" : "No"}
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-default-50 rounded-lg border border-default-200 hover:border-default-300 transition-colors duration-200">
              <input
                checked={petfriendly}
                className="w-5 h-5 text-primary-600 bg-default-100 border-default-300 rounded focus:ring-primary-500 focus:ring-2 cursor-pointer transition-all duration-200"
                id="petfriendly"
                type="checkbox"
                onChange={(e) => setPetfriendly(e.target.checked)}
              />
              <label
                className="flex-1 text-sm font-medium text-foreground cursor-pointer select-none"
                htmlFor="petfriendly"
              >
                Pet Friendly
              </label>
              <span className="text-xs text-default-500">
                {petfriendly ? "Yes" : "No"}
              </span>
            </div>
          </li>

          {/* Category */}
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(categoriesKeys).length > 0
                    ? `Categories: ${Array.from(categoriesKeys).join(", ")}`
                    : "Select Categories"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="categories selection"
                closeOnSelect={false}
                selectedKeys={categoriesKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setCategoriesKeys}
              >
                <DropdownItem key="culture-history">
                  Culture & History
                </DropdownItem>
                <DropdownItem key="parks-nature">Parks & Nature</DropdownItem>
                <DropdownItem key="amusement-theme-parks">
                  Amusement & Theme Parks
                </DropdownItem>
                <DropdownItem key="arts-live-entertainment">
                  Arts & Live Entertainment
                </DropdownItem>
                <DropdownItem key="nightlife-bars">
                  Nightlife & Bars
                </DropdownItem>
                <DropdownItem key="sports-recreation">
                  Sports & Recreation
                </DropdownItem>
                <DropdownItem key="shopping-markets">
                  Shopping & Markets
                </DropdownItem>
                <DropdownItem key="restaurants-dining">
                  Restaurants & Dining
                </DropdownItem>
                <DropdownItem key="unique-niche">
                  Unique & Niche Attractions
                </DropdownItem>
                <DropdownItem key="educational-interactive">
                  Educational & Interactive
                </DropdownItem>
                <DropdownItem key="wellness-relaxation">
                  Wellness & Relaxation
                </DropdownItem>
                <DropdownItem key="transport-tours">
                  Transport & Tours
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {Array.from(categoriesKeys)?.map((cat) =>
              taglist[cat]?.map((tag) => (
                <Chip
                  key={tag}
                  className="hover:cursor-pointer transition-all duration-200"
                  color="success"
                  startContent={<CheckIcon />}
                  variant={tags.find((t) => t === tag) ? "solid" : "bordered"}
                  onClick={() => {
                    if (tags.find((t) => t === tag)) {
                      setTags(tags.filter((t) => t !== tag));
                    } else {
                      setTags([...tags, tag]);
                    }
                  }}
                >
                  {tag}
                </Chip>
              )),
            )}
          </div>
          {/* <div>{JSON.stringify(tags)}</div> */}
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(priceRangeKeys).length > 0
                    ? `Price Range: ${Array.from(priceRangeKeys).join(", ")}`
                    : "Select Price Range"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="price range selection"
                closeOnSelect={false}
                selectedKeys={priceRangeKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setPriceRangeKeys}
              >
                <DropdownItem key="free">Free</DropdownItem>
                <DropdownItem key="budget">Budget (0-10 EUR)</DropdownItem>
                <DropdownItem key="moderate">Moderate (10-25 EUR)</DropdownItem>
                <DropdownItem key="expensive">
                  Expensive (25-50 EUR)
                </DropdownItem>
                <DropdownItem key="luxury">Luxury (50+ EUR)</DropdownItem>
                <DropdownItem key="varies">Varies</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {Array.from(audienceRangeKeys).length > 0
                    ? `Audience Range: ${Array.from(audienceRangeKeys).join(", ")}`
                    : "Select Audience Range"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="audience range selection"
                closeOnSelect={false}
                selectedKeys={audienceRangeKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setAudienceRangeKeys}
              >
                <DropdownItem key="infants">Infants (0-2 years)</DropdownItem>
                <DropdownItem key="toddlers">Toddlers (2-5 years)</DropdownItem>
                <DropdownItem key="children">
                  Children (6-12 years)
                </DropdownItem>
                <DropdownItem key="teenagers">
                  Teenagers (13-17 years)
                </DropdownItem>
                <DropdownItem key="adults">Adults (18+ years)</DropdownItem>
                <DropdownItem key="seniors">Seniors (65+ years)</DropdownItem>
                <DropdownItem key="all-ages">All Ages</DropdownItem>
                <DropdownItem key="family-friendly">
                  Family Friendly
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <label
              className="block text-sm font-semibold text-foreground mb-3"
              htmlFor="images"
            >
              Upload Images
            </label>

            <div
              className={`
                relative w-full border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ease-in-out cursor-pointer group
                ${
                  isDragging
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20 scale-[1.02]"
                    : "border-default-300 hover:border-primary-400 hover:bg-default-50 dark:hover:bg-default-100/5"
                }
              `}
              onClick={() => fileInputRef.current?.click()}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="hidden"
                id="images"
                type="file"
                onChange={handleImageChange}
              />

              <div
                className={`flex flex-col items-center transition-transform duration-300 ${isDragging ? "scale-110" : "group-hover:scale-105"}`}
              >
                <div
                  className={`
                  relative mb-4 p-4 rounded-full transition-all duration-300
                  ${
                    isDragging
                      ? "bg-primary-100 dark:bg-primary-900/30"
                      : "bg-default-100 group-hover:bg-primary-50 dark:group-hover:bg-primary-950/10"
                  }
                `}
                >
                  <svg
                    className={`w-8 h-8 transition-colors duration-300 ${
                      isDragging
                        ? "text-primary-600"
                        : "text-default-400 group-hover:text-primary-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>

                  {isDragging && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary-300 animate-ping" />
                  )}
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isDragging
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-foreground"
                    }`}
                  >
                    {isDragging ? (
                      "Drop images here"
                    ) : (
                      <>
                        <span className="text-primary-600 dark:text-primary-400 font-semibold">
                          Click to upload
                        </span>
                        <span className="text-default-500">
                          {" "}
                          or drag and drop
                        </span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-default-400">
                    PNG, JPG, GIF, WebP up to 10MB each • Multiple files
                    supported
                  </p>

                  {imagePreviews.length > 0 && (
                    <p className="text-xs text-success-600 dark:text-success-400 font-medium">
                      {imagePreviews.length} image
                      {imagePreviews.length > 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    Selected Images
                  </h4>
                  <span className="text-xs text-default-500 bg-default-100 px-2 py-1 rounded-full">
                    {imagePreviews.length} file
                    {imagePreviews.length > 1 ? "s" : ""}
                  </span>
                </div>

                {imagePreviews.map((preview, index) => (
                  <div
                    key={preview.id}
                    className="group bg-content2 border border-divider rounded-xl p-4 transition-all duration-200 hover:shadow-medium hover:border-default-400"
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            alt={preview.name}
                            className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                            src={preview.url}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-lg" />
                        </div>

                        <button
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 hover:bg-danger-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-medium hover:scale-110"
                          title="Remove image"
                          type="button"
                          onClick={() => removeImage(preview.id)}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M6 18L18 6M6 6l12 12"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </button>

                        <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-small">
                          {index + 1}
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-foreground truncate">
                            {preview.name}
                          </div>
                          <div className="text-xs text-default-500">
                            Ready to upload
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-foreground/80">
                            Caption (optional)
                          </label>
                          <input
                            className="w-full px-3 py-2 text-sm bg-default-50 border border-default-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-200 ease-in-out text-foreground placeholder-default-400"
                            placeholder="Describe this image..."
                            type="text"
                            value={preview.caption}
                            onChange={(e) =>
                              updateImageCaption(preview.id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </li>

          <li>
            <input
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="latitude"
              placeholder="Latitude"
              step="any"
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
          </li>
          <li>
            <input
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="longitude"
              placeholder="Longitude"
              step="any"
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </li>
          <li>
            <input
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out"
              id="rating"
              max="5"
              min="1"
              placeholder="Rating (1-5)"
              step="0.5"
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
          </li>
          <li>
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button">
                  {country || "Select Country"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="country selection"
                closeOnSelect={true}
                selectedKeys={country ? new Set([country]) : new Set([])}
                selectionMode="single"
                variant="flat"
                onSelectionChange={(keys) =>
                  setCountry(Array.from(keys)[0] || "")
                }
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
                <Button className="heroui-button">
                  {Array.from(wifiKeys).length > 0
                    ? `Wifi: ${Array.from(wifiKeys).join(", ")}`
                    : "Select Wifi Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="wifi selection"
                closeOnSelect={false}
                selectedKeys={wifiKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setWifiKeys}
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
                  {Array.from(parkingKeys).length > 0
                    ? `Parking: ${Array.from(parkingKeys).join(", ")}`
                    : "Select Parking Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="parking selection"
                closeOnSelect={false}
                selectedKeys={parkingKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setParkingKeys}
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
                  {Array.from(accessibilityKeys).length > 0
                    ? `Accessibility: ${Array.from(accessibilityKeys).join(", ")}`
                    : "Select Accessibility Options"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="accessibility selection"
                closeOnSelect={false}
                selectedKeys={accessibilityKeys}
                selectionMode="multiple"
                variant="flat"
                onSelectionChange={setAccessibilityKeys}
              >
                <DropdownItem key="wheelchair-accessible">
                  Wheelchair Accessible
                </DropdownItem>
                <DropdownItem key="accessible-restrooms">
                  Accessible Restrooms
                </DropdownItem>
                <DropdownItem key="audio-tours">Audio Tours</DropdownItem>
                <DropdownItem key="braille-signage">
                  Braille Signage
                </DropdownItem>
                <DropdownItem key="none">None</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </li>
          <li>
            <Button
              className={`
                w-full py-3 px-6 rounded-lg font-semibold text-sm shadow-medium
                transition-all duration-200 ease-in-out
                ${
                  isUploading
                    ? "bg-default-100 text-default-400 cursor-not-allowed"
                    : "bg-primary-500 hover:bg-primary-600 text-primary-foreground hover:shadow-large hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
              disabled={isUploading}
              type="submit"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Uploading Images... {uploadProgress}%</span>
                </div>
              ) : (
                "Submit Attraction"
              )}
            </Button>
          </li>
        </ul>
      </form>
    </div>
  );
}
