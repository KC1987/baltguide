"use client";

import { useEffect, useState } from "react";

import { Button } from "@heroui/button";
import { Select, SelectItem, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Slider, CheckboxGroup, Checkbox } from "@heroui/react";

export default function FilterMain({ getAttractions, filter, setFilter }: any) {
  const [ advancedMenuOpen, setAdvancedMenuOpen ] = useState(true);

  const [ categoriesKeys, setCategoriesKeys ] = useState(new Set());
  const [ parkingKeys, setParkingKeys ] = useState(new Set());
  const [ accessibilityKeys, setAccessibilityKeys ] = useState(new Set());

  const [ checkSelect, setCheckSelect ] = useState([]);

  
  function handleSearch() {
    getAttractions();
  };

  function handleSelectionChange(name:any, selection:any) {
    setFilter({...filter, [name]: selection})
  };

  // useEffect( () => {
  //   setFilter({...filter,
  //     categories: Array.from(categoriesKeys),
  //     parking: Array.from(parkingKeys),
  //     accessibility: Array.from(accessibilityKeys)
  //   })
  // }, [ categoriesKeys, parkingKeys, accessibilityKeys ]);

  // function updateFilter(label: string, value: string) {
  //   // Update filter with clean filter, and new entry
  //   setFilter({ ...filter, [label]: value });
  // };



  return (
    <div className=" bg-sky-100 dark:bg-sky-800 w-full min-h-16 p-2 gap-2">

          {/* Petfriendly Select */}
          <Select
            className="max-w-xs"
            label="Petfriendly"
            size="sm"
            onChange={(e) => updateFilter("petfriendly", e.target.value)}
          >
            <SelectItem key="yes">Yes</SelectItem>
            <SelectItem key="no">No</SelectItem>
            <SelectItem key="any">Any</SelectItem>
          </Select>

          {/* Souvenirs Select */}
          <Select
            className="max-w-xs"
            label="Souvenirs"
            size="sm"
            onChange={(e) => updateFilter("souvenirs", e.target.value)}
          >
            <SelectItem key="yes">Yes</SelectItem>
            <SelectItem key="no">No</SelectItem>
            <SelectItem key="any">Any</SelectItem>
          </Select>

          {/* Categories Select */}
            <Dropdown>
              <DropdownTrigger>
                <Button className="heroui-button min-w-60">Select Categories</Button>
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

            {/* Parking Filter */}
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


            {/* Accessibility Filter */}
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
            


        <Button className="" color="primary" onPress={handleSearch}>
          Search
        </Button>
        <div>
          <Slider
            className="max-w-md"
            color="primary"
            defaultValue={0.2}
            label="Distance"
            maxValue={300}
            minValue={0}
            showSteps={true}
            size="sm"
            step={30}
          />
        </div>
        <div>
          {JSON.stringify(filter)}
        </div>
        <Button size="sm" color="primary" onPress={() => setAdvancedMenuOpen(!advancedMenuOpen)} >Advanced Menu</Button>
      
      {/* Animated Advanced Menu */}
      <div 
        className={`overflow-hidden container transition-all duration-300 ease-in-out ${
          advancedMenuOpen ? 'h-[400] opacity-100' : 'h-0 opacity-0'
        }`}
      >
        <div className="flex">
          <CheckboxGroup
            name="categories"
            value={filter.categories}
            onValueChange={(selection) => handleSelectionChange("categories", selection)}
            orientation="horizontal"
          >
            <Checkbox value="nightlife-bars" >Nightlife</Checkbox>
            <Checkbox value="parks-nature" >Parks</Checkbox>
          </CheckboxGroup>
          {/* {JSON.stringify(checkSelect)} */}
        </div>
      </div>
    </div>
  );
}