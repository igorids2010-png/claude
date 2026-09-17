"use client";

import * as React from "react";

import {
  areaRanges,
  properties as allProperties,
  type Property,
} from "@/lib/data/properties";

export const ANY = "todos";

export type Filters = {
  type: string;
  region: string;
  area: string;
};

const emptyFilters: Filters = { type: ANY, region: ANY, area: ANY };

type FilterContextValue = {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  reset: () => void;
  results: Property[];
  isFiltered: boolean;
};

const FilterContext = React.createContext<FilterContextValue | null>(null);

/** Aplica os filtros da busca do hero sobre o catálogo mockado. */
export function filterProperties(filters: Filters, source = allProperties) {
  const range = areaRanges.find((item) => item.value === filters.area);

  return source.filter((property) => {
    if (filters.type !== ANY && property.type !== filters.type) return false;
    if (filters.region !== ANY && property.region !== filters.region) return false;
    if (range && (property.area < range.min || property.area > range.max)) {
      return false;
    }
    return true;
  });
}

export function PropertyFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [filters, setFilters] = React.useState<Filters>(emptyFilters);

  const value = React.useMemo<FilterContextValue>(() => {
    const isFiltered = Object.values(filters).some((item) => item !== ANY);
    return {
      filters,
      setFilters,
      reset: () => setFilters(emptyFilters),
      results: filterProperties(filters),
      isFiltered,
    };
  }, [filters]);

  return <FilterContext value={value}>{children}</FilterContext>;
}

export function usePropertyFilters() {
  const context = React.use(FilterContext);
  if (!context) {
    throw new Error(
      "usePropertyFilters precisa estar dentro de <PropertyFilterProvider>",
    );
  }
  return context;
}
