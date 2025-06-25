"use client";

import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

export default function Rating({ rating, quote }: any) {
  const maxStars = 5;
  const filledStars = Math.floor(Number(rating));
  const hasHalfStar = Number(rating) % 1 !== 0;
  const emptyStars = maxStars - Math.ceil(Number(rating));

  return (
    <div className="flex items-center align-middle">
      {/* Render filled stars */}
      {[...Array(filledStars)].map((_, index) => (
        <StarSolid key={`filled-${index}`} className="size-5 text-orange-600" />
      ))}

      {/* Render half star if needed */}
      {hasHalfStar && (
        <div className="relative">
          <StarOutline className="size-5 text-orange-600" />
          <StarSolid
            className="size-5 text-orange-600 absolute top-0 left-0"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </div>
      )}

      {/* Render empty stars */}
      {[...Array(emptyStars)].map((_, index) => (
        <StarOutline
          key={`empty-${index}`}
          className="size-5 text-orange-600"
        />
      ))}

      <p className="font-bold text-medium mx-2 text-gray-700 dark:text-gray-200">
        {rating}/5
      </p>

      {/* Quote */}
      <p className="text-gray-700 dark:text-gray-200 italic text-lg mx-2">
        "{quote}"
      </p>
    </div>
  );
}
