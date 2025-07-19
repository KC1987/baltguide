"use client";

import { useRouter } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { ChevronLeftIcon } from "@heroicons/react/24/solid";

export default function BreadcrumbsComponent({ country, city }: any) {
  const router = useRouter();

  return (
    <div className="flex align-middle">
      <ChevronLeftIcon
        className="size-5 text-gray-600 dark:text-gray-400 mx-2 cursor-pointer"
        onClick={() => router.back()}
      />
      <Breadcrumbs>
        <BreadcrumbItem href={`/${country.toLowerCase()}`}>
          {country}
        </BreadcrumbItem>
        <BreadcrumbItem href={`/${city.toLowerCase()}`}>{city}</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
}
