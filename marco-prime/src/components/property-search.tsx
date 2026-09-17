"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANY,
  usePropertyFilters,
  type Filters,
} from "@/components/property-filters";
import { areaRanges, propertyTypes, regions } from "@/lib/data/properties";

type Field = {
  key: keyof Filters;
  label: string;
  placeholder: string;
  options: { value: string; label: string }[];
};

const fields: Field[] = [
  {
    key: "type",
    label: "Tipo de imóvel",
    placeholder: "Todos os tipos",
    options: propertyTypes.map((type) => ({ value: type, label: type })),
  },
  {
    key: "region",
    label: "Região",
    placeholder: "Todas as regiões",
    options: regions.map((region) => ({ value: region, label: region })),
  },
  {
    key: "area",
    label: "Metragem",
    placeholder: "Qualquer metragem",
    options: areaRanges.map((range) => ({
      value: range.value,
      label: range.label,
    })),
  },
];

/** Barra de busca integrada ao hero; alimenta a grade de imóveis em destaque. */
export function PropertySearch() {
  const { filters, setFilters, results } = usePropertyFilters();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document
      .getElementById("imoveis")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Buscar imóveis comerciais"
      className="border border-border/80 bg-black/55 p-5 backdrop-blur-md sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-end lg:gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <Label htmlFor={`filtro-${field.key}`}>{field.label}</Label>
            <Select
              value={filters[field.key]}
              onValueChange={(value) =>
                setFilters({ ...filters, [field.key]: value })
              }
            >
              <SelectTrigger id={`filtro-${field.key}`}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{field.placeholder}</SelectItem>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Button type="submit" className="h-12 w-full lg:w-auto">
          <Search aria-hidden="true" />
          Buscar
        </Button>
      </div>

      <p aria-live="polite" className="mt-4 text-xs text-muted-foreground">
        {results.length === 0
          ? "Nenhum imóvel encontrado com esses critérios — fale com um consultor para uma busca dirigida."
          : `${results.length} ${results.length === 1 ? "imóvel disponível" : "imóveis disponíveis"} com esses critérios.`}
      </p>
    </form>
  );
}
