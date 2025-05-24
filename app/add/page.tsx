'use client'

import { useState } from "react"
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem} from "@heroui/react";



import { Button } from "@heroui/button"
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';


export default function Add() {
  const [wifiKeys, setWifiKeys] = useState( new Set([]) );

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function handleSubmit(e:any) {
    e.preventDefault();

    // const docRef = doc( db, "locations", "restaurants" );
    const collectionRef = collection( db, "locations" );

    try {
      await addDoc(
        collectionRef,
        { name,
          slug,
          wifi: Array.from(wifiKeys),
          type: "restaurant", }
      )
    } catch (error) {
      console.error(error);
    }

  };

  return (
    <div>
      {JSON.stringify(Array.from(wifiKeys))}
      <h1>Add</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" value={name} placeholder="name" onChange={ e => setName(e.target.value) }/>
        </div>
        <div>
          <input type="text" value={slug} placeholder="slug" onChange={ e => setSlug(e.target.value) }/>
        </div>

        <Dropdown>
          <DropdownTrigger>
            <Button>Wifi Awailability</Button>
          </DropdownTrigger>

          <DropdownMenu
            // disallowEmptySelection
            aria-label="dropdown selection"
            closeOnSelect={false}
            selectedKeys={wifiKeys}
            selectionMode="multiple"
            variant="flat"
            onSelectionChange={setWifiKeys}
          >
            <DropdownItem key="free" >Free</DropdownItem>
            <DropdownItem key="free-limited" >Free Limited</DropdownItem>
            <DropdownItem key="paid" >Paid</DropdownItem>
            <DropdownItem key="none" >None</DropdownItem>

          </DropdownMenu>
        </Dropdown>
        <div>
          <Button type="submit" >Submit Loacation</Button>
        </div>
      </form>
    </div>
  )
}