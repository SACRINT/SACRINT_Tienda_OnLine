"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const sortOptions = [
  { value: "relevance", label: "Relevancia" },
  { value: "price-asc", label: "Precio: Menor a Mayor" },
  { value: "price-desc", label: "Precio: Mayor a Menor" },
  { value: "rating", label: "Mejor Valorado" },
  { value: "newest", label: "Más Nuevo" },
];

export function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sortOption, setSortOption] = useState(
    searchParams.get("sort") || "relevance"
  );

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);

    const params = new URLSearchParams(searchParams);
    params.set("sort", newSortOption);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <select
        value={sortOption}
        onChange={handleSortChange}
        className="block w-full appearance-none rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <ChevronDown className="h-4 w-4" />
      </div>
    </div>
  );
}
