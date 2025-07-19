"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input, Slider, CheckboxGroup, Checkbox, Divider } from "@heroui/react";

export default function FilterMain({
  getAttractions,
  filter,
  setFilter,
  userGeolocation,
  setUserGeolocation,
  selectedDistance,
  setSelectedDistance,
}: any) {
  const [advancedMenuOpen, setAdvancedMenuOpen] = useState(false);

  function handleSearch() {
    getAttractions();
  }

  function handleSelectionChange(name: any, selection: any) {
    setFilter({ ...filter, [name]: selection });
  }

  // function handleTagSelection(tags:any) {
  //   //Remove doublicates
  //   const filteredTags = tags.filter( tag => !filter.tags?.includes(tag) );

  //   //
  //   setFilter({...filter, tags: [...filter.tags, ...filteredTags]});
  // };

  function getUserGeolocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setFilter({
        ...filter,
        distanceSearch: {
          ...filter.distanceSearch,
          userLat: pos.coords.latitude,
          userLon: pos.coords.longitude,
        },
      });
      console.log(pos.coords.latitude);
      console.log(pos.coords.longitude);
    });
  }

  return (
    <div className=" bg-sky-100 dark:bg-sky-800 w-full min-h-16 p-2 gap-2">
      <div className="flex">
        <Input
          placeholder="Search..."
          type="text"
          value={filter.searchText}
          onChange={(e) => setFilter({ ...filter, searchText: e.target.value })}
        />
      </div>
      <div>
        <Checkbox
          size="sm"
          onValueChange={(isSelected: boolean) =>
            handleSelectionChange("family_friendly", isSelected)
          }
        >
          Family Friendly
        </Checkbox>
        <Checkbox
          size="sm"
          onValueChange={(isSelected: boolean) =>
            handleSelectionChange("open_24hrs", isSelected)
          }
        >
          Open 24hrs
        </Checkbox>
        <Checkbox
          size="sm"
          onValueChange={(isSelected: boolean) =>
            handleSelectionChange("free_entry", isSelected)
          }
        >
          Free Entry
        </Checkbox>
        <Checkbox
          size="sm"
          onValueChange={(isSelected: boolean) =>
            handleSelectionChange("souvenirs", isSelected)
          }
        >
          Souvenirs
        </Checkbox>
        <Checkbox
          size="sm"
          onValueChange={(isSelected: boolean) =>
            handleSelectionChange("petfriendly", isSelected)
          }
        >
          Petfriendly
        </Checkbox>
      </div>
      <div className="flex gap-2 items-center">
        <Slider
          className="max-w-md"
          color="primary"
          defaultValue={0}
          label="Distance (km)"
          maxValue={300}
          minValue={0}
          showSteps={true}
          size="sm"
          step={30}
          value={filter.distanceSearch?.radius || 0}
          onChange={(e) =>
            setFilter({
              ...filter,
              distanceSearch: { ...filter.distanceSearch, radius: e },
            })
          }
        />
        <Button color="secondary" size="sm" onPress={getUserGeolocation}>
          Get Geolocation
        </Button>
        <p className="text-xs">
          Lat: {filter.distanceSearch?.userLat || "N/A"}
        </p>
        <p className="text-xs">
          Lon: {filter.distanceSearch?.userLon || "N/A"}
        </p>
      </div>

      <Button className="" color="warning" onPress={handleSearch}>
        Search
      </Button>
      <div>{JSON.stringify(filter)}</div>
      <Button
        color="primary"
        size="sm"
        onPress={() => setAdvancedMenuOpen(!advancedMenuOpen)}
      >
        Advanced Menu
      </Button>

      {/* Animated Advanced Menu */}
      <div
        className={`overflow-hidden container transition-all duration-300 ease-in-out ${
          advancedMenuOpen ? "h-[320] opacity-100" : "h-0 opacity-0"
        }`}
      >
        {/* Categories */}
        <div className="">
          <span>
            <h1 className="text-lg font-semibold my-2">Categories</h1>
            {/* <Square3Stack3DIcon /> */}
          </span>
          <CheckboxGroup
            className=""
            name="categories"
            orientation="horizontal"
            size="sm"
            value={filter.categories}
            onValueChange={(selection) =>
              handleSelectionChange("categories", selection)
            }
          >
            <table>
              <tbody>
                <tr>
                  <td>
                    <Checkbox value="culture-history">
                      Culture & History
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="parks-nature">Parks & Nature</Checkbox>
                  </td>
                  <td>
                    <Checkbox value="amusement-theme-parks">
                      Amusement & Theme Parks
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="arts-live-entertainment">
                      Arts & Live Entertainment
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="nightlife-bars">Nightlife & Bars</Checkbox>
                  </td>
                  <td>
                    <Checkbox value="sports-recreation">
                      Sports & Recreation
                    </Checkbox>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Checkbox value="shopping-markets">
                      Shopping & Markets
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="restaurants-dining">
                      Restaurants & Dining
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="educational-interactive">
                      Educational & Interactive
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="wellness-relaxation">
                      Wellness & Relaxation
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="transport-tours">
                      Transport & Tours
                    </Checkbox>
                  </td>
                  <td>
                    <Checkbox value="unique-niche">
                      Unique & Niche Attractions
                    </Checkbox>
                  </td>
                </tr>
              </tbody>
            </table>
          </CheckboxGroup>
          {/* <div className="" >
            {filter.categories?.length > 0 && filter.categories.map( (cat, i) => 
            <CheckboxGroup onValueChange={ sel => handleTagSelection(sel) } size="sm" orientation="horizontal" key={cat} >
              { taglist[cat].map(( tag, i ) => (
                    <Checkbox key={tag} value={tag} >{tag}</Checkbox>
                ))}
            </CheckboxGroup>
          )
            }
          </div> */}
        </div>
        <Divider className="my-1" />

        {/* Price Range */}
        <div className="">
          <span>
            <h1 className="text-lg font-semibold my-2">Price Range</h1>
            {/* <Square3Stack3DIcon /> */}
          </span>
          <CheckboxGroup
            name="price_range"
            value={filter.price_range}
            onValueChange={(selection) => handleSelectionChange("price_range", selection)}
            orientation="horizontal"
            // className="max-h-8"
            size="sm"
          >
            <Checkbox value="free">Free</Checkbox>
            <Checkbox value="budget">Budget (0 - 10 Eur)</Checkbox>
            <Checkbox value="moderate">Moderate (10 - 25 Eur) </Checkbox>
            <Checkbox value="expensive">Expensive (25 - 50 Eur)</Checkbox>
            <Checkbox value="luxury">Luxury (50+ Eur)</Checkbox>
          </CheckboxGroup>
        </div>
        <Divider className="my-1" />

        {/* Audience Range */}
        <div className="">
          <span>
            <h1 className="text-lg font-semibold my-2">Audience Range</h1>
            {/* <Square3Stack3DIcon /> */}
          </span>
          <CheckboxGroup
            name="audience_range"
            value={filter.audience_range}
            onValueChange={(selection) => handleSelectionChange("audience_range", selection)}
            orientation="horizontal"
            // className="max-h-8"
            size="sm"
          >
            <Checkbox value="infants">Infants (0-2 years)</Checkbox>
            <Checkbox value="toddlers">Toddlers (2-5 years)</Checkbox>
            <Checkbox value="children">Children (6-12 years)</Checkbox>
            <Checkbox value="teenagers">Teenagers (13-17 years)</Checkbox>
            <Checkbox value="adults">Adults (18+ years)</Checkbox>
            <Checkbox value="seniors">Seniors (65+ years)</Checkbox>
          </CheckboxGroup>
        </div>
        <Divider className="my-1" />

        <div className="flex gap-10">
          {/* Parking */}
          <div className="">
            <span>
              <h1 className="text-lg font-semibold my-2">Parking</h1>
              {/* <Square3Stack3DIcon /> */}
            </span>
            <CheckboxGroup
              name="parking"
              value={filter.parking}
              onValueChange={(selection) => handleSelectionChange("parking", selection)}
              orientation="horizontal"
              // className="max-h-8"
              size="sm"
            >
              <Checkbox value="free">Free</Checkbox>
              <Checkbox value="paid">Paid</Checkbox>
              <Checkbox value="nearby">Nearby</Checkbox>
            </CheckboxGroup>
          </div>
          {/* <Divider className="my-1" /> */}

          {/* WiFi */}
          <div className="">
            <span>
              <h1 className="text-lg font-semibold my-2">WiFi</h1>
              {/* <Square3Stack3DIcon /> */}
            </span>
            <CheckboxGroup
              name="wifi"
              value={filter.wifi}
              onValueChange={(selection) => handleSelectionChange("wifi", selection)}
              orientation="horizontal"
              // className="max-h-8"
              size="sm"
            >
              <Checkbox value="free">Free</Checkbox>
              <Checkbox value="free-limited">Free Limited</Checkbox>
              <Checkbox value="paid">Paid</Checkbox>
              <Checkbox value="none">None</Checkbox>
            </CheckboxGroup>
          </div>

          {/* Accessibility */}
          <div className="">
            <span>
              <h1 className="text-lg font-semibold my-2">Accessibility</h1>
              {/* <Square3Stack3DIcon /> */}
            </span>
            <CheckboxGroup
              name="accessibility"
              value={filter.accessibility}
              onValueChange={(selection) => handleSelectionChange("accessibility", selection)}
              orientation="horizontal"
              // className="max-h-8"
              size="sm"
            >
              <Checkbox value="wheelchair-accessible">
                Wheelchair Accessible
              </Checkbox>
              <Checkbox value="accessible-restrooms">
                Accessible Restrooms
              </Checkbox>
              <Checkbox value="audio-tours">Audio Tours</Checkbox>
              <Checkbox value="braille-signage">Braille Signage</Checkbox>
            </CheckboxGroup>
          </div>
          {/* <Divider className="my-1" /> */}
        </div>
        <Divider className="my-1" />
      </div>
    </div>
  );
}
