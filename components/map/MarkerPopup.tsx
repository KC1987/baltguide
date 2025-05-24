// src/components/map/PopupInfo.js
'use client';

import React from 'react';
import { Button } from '@heroui/button';
import { Link } from '@heroui/link';

// You can define a more specific type for featureData if you like
// interface FeatureData {
//   name: string;
//   description: string;
//   // any other properties like imageUrl, etc.
// }

// interface PopupInfoProps {
//   featureData: FeatureData | null;
// }

export default function PopupInfo({ featureData }) {
  if (!featureData) {
    return null; // Don't render anything if there's no feature data
  }

  return (
    <div className="popup-info-content">
      <h3 className="text-lg font-semibold mb-1">{featureData.name}</h3>
      <p className="text-sm">{featureData.description}</p>
      <Button><Link href={`/location/${featureData.slug}`} >Details</Link></Button>
      {/* You can add more details from featureData here if needed:
        {featureData.imageUrl && (
          <img 
            src={featureData.imageUrl} 
            alt={featureData.name} 
            className="mt-2 max-w-full h-auto rounded" 
          />
        )}
        {featureData.website && (
          <a 
            href={featureData.website} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline mt-2 block"
          >
            Visit website
          </a>
        )}
      */}
    </div>
  );
}