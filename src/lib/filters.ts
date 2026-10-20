import type { Property } from "./validation";

export type PropertyFilters = {
  purpose: Property["purpose"] | "todos";
  type: Property["type"] | "todos";
  min: string;
  max: string;
  bedrooms: string;
  neighborhood: string;
  sort: "recentes" | "menor-preco" | "maior-preco";
};

export const defaultFilters: PropertyFilters = {
  purpose: "todos",
  type: "todos",
  min: "",
  max: "",
  bedrooms: "",
  neighborhood: "",
  sort: "recentes",
};

type Source = Record<string, string | string[] | undefined>;

const read = (source: Source, key: string) => {
  const value = source[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
};

const purposeValues = new Set(["venda", "aluguel"]);
const typeValues = new Set(["casa", "apartamento", "terreno", "comercial"]);
const sortValues = new Set(["recentes", "menor-preco", "maior-preco"]);

export function parseFilters(source: Source): PropertyFilters {
  const purpose = read(source, "finalidade");
  const type = read(source, "tipo");
  const sort = read(source, "ordem");
  const bedrooms = read(source, "quartos");
  return {
    purpose: purposeValues.has(purpose)
      ? (purpose as PropertyFilters["purpose"])
      : "todos",
    type: typeValues.has(type) ? (type as PropertyFilters["type"]) : "todos",
    min: read(source, "precoMin").replace(/[^\d]/g, "").slice(0, 15),
    max: read(source, "precoMax").replace(/[^\d]/g, "").slice(0, 15),
    bedrooms: /^[1-4]$/.test(bedrooms) ? bedrooms : "",
    neighborhood: read(source, "bairro").trim().slice(0, 100),
    sort: sortValues.has(sort) ? (sort as PropertyFilters["sort"]) : "recentes",
  };
}

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

export function filterProperties(
  properties: Property[],
  filters: PropertyFilters,
) {
  const min = Number(filters.min) || 0;
  const max = Number(filters.max) || 0;
  const bedrooms = Number(filters.bedrooms) || 0;
  const neighborhood = fold(filters.neighborhood);

  return properties
    .filter(
      (p) =>
        (filters.purpose === "todos" || p.purpose === filters.purpose) &&
        (filters.type === "todos" || p.type === filters.type) &&
        (!min || p.price >= min) &&
        (!max || p.price <= max) &&
        (!bedrooms || p.bedrooms >= bedrooms) &&
        (!neighborhood ||
          fold(`${p.neighborhood} ${p.city}`).includes(neighborhood)),
    )
    .sort((a, b) => {
      if (filters.sort === "menor-preco") return a.price - b.price;
      if (filters.sort === "maior-preco") return b.price - a.price;
      return 0;
    });
}

export function filtersQuery(filters: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters.purpose !== "todos") params.set("finalidade", filters.purpose);
  if (filters.type !== "todos") params.set("tipo", filters.type);
  if (filters.min) params.set("precoMin", filters.min);
  if (filters.max) params.set("precoMax", filters.max);
  if (filters.bedrooms) params.set("quartos", filters.bedrooms);
  if (filters.neighborhood) params.set("bairro", filters.neighborhood);
  if (filters.sort !== "recentes") params.set("ordem", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}
