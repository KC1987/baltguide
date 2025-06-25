"use client";

import { ScrollShadow, Button, Accordion, AccordionItem } from "@heroui/react";
import { Link } from "@heroui/link";

export default function Sidebar({
  markers,
  activeMarker,
  setActiveMarker,
}: any) {
  
  return (
    <ScrollShadow className="w-72 h-screen" hideScrollBar>
      <Accordion className=" shadow-none" variant="light" >
        {markers.map((m, i) => 
          <AccordionItem className="" key={i} title={m.name} >
            <div className="" >
              <p>{m.slug}</p>
              <Button color="primary"  ><Link href={`/location/${m.slug}`}>Visit</Link></Button>
            </div>
          </AccordionItem>
        )}
      </Accordion>
    </ScrollShadow>
  );





          // <div
          //   key={i}
          //   className={`border border-cyan-400 min-h-14 w-full hover:cursor-pointer transition-all duration-200 hover:bg-sky-50
          //     ${activeMarker === m.slug && 'bg-sky-100 '}
          //   `}
          //   onClick={() => setActiveMarker(m.slug)}
          // >
          //   <div className="p-2">
          //     <h1 className="font-semibold">{m.name}</h1>
          //   </div>
            
          //   {/* Extended Version */}
          //   <div 
          //     className={`overflow-hidden transition-all duration-300 ease-in-out ${
          //       activeMarker === m.slug ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          //     }`}
          //   >
          //     <div className="px-2 pb-2">
          //       {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"> */}
          //         <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          //           Click below to view full details about {m.name}
          //         </p>
          //         <Link href={`/location/${m.slug}`}>
          //           <Button size="sm" color="primary" className="w-full">
          //             View Details
          //           </Button>
          //         </Link>
          //       {/* </div> */}
          //     </div>
          //   </div>
          // </div>
  
}