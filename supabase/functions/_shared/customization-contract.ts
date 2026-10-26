/** Versioned public catalogue contract. No supplier costs, audit notes or private files. */
export const CAPABILITY_KEYS = [
  "logo",
  "colors",
  "materials",
  "finishes",
  "packaging",
  "marking",
  "dimensions",
] as const;
export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];
export type CustomizationCapabilities = Partial<
  Record<CapabilityKey, string[]>
> & { text?: boolean };
export interface CustomizationTerms {
  moq?: number;
  lead_time_days?: number;
  surcharge_cents?: number;
  currency?: string;
  sample_required: true;
}
export interface CatalogDetails {
  origin?: string;
  weight?: string;
  dimensions?: string;
  ingredients?: string;
  shelf_life?: string;
  gallery?: string[];
}
export interface CustomizationConfig {
  brand: string;
  color: string;
  logo: string;
  logoOption: string;
  packaging: string;
  marking: string;
  material: string;
  finish: string;
  dimensions: string;
  text: string;
  instructions: string;
}
export const emptyCustomization = (): CustomizationConfig => ({
  brand: "",
  color: "",
  logo: "",
  logoOption: "",
  packaging: "",
  marking: "",
  material: "",
  finish: "",
  dimensions: "",
  text: "",
  instructions: "",
});
function record(input: unknown): Record<string, unknown> {
  if (input == null) return {};
  if (typeof input !== "object" || Array.isArray(input))
    throw new Error("invalid_customization_object");
  return input as Record<string, unknown>;
}
function string(value: unknown, max: number): string {
  if (typeof value !== "string" || value.trim().length > max)
    throw new Error("invalid_customization_text");
  return value.trim();
}
function httpsUrl(value: unknown): string {
  const url = string(value, 2048);
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password)
    throw new Error("https_url_required");
  return url;
}
export function parseCustomizationCapabilities(
  input: unknown,
): CustomizationCapabilities {
  const raw = record(input),
    result: CustomizationCapabilities = {};
  for (const key of CAPABILITY_KEYS) {
    if (raw[key] == null) continue;
    if (!Array.isArray(raw[key]) || raw[key].length > 50)
      throw new Error("invalid_capability_list: " + key);
    const values = raw[key].map((value) => string(value, 120)).filter(Boolean);
    if (
      key === "colors" &&
      values.some((value) => !/^#[0-9a-f]{6}$/i.test(value))
    )
      throw new Error("invalid_capability_color");
    result[key] = [...new Set(values)];
  }
  if (raw.text != null) {
    if (typeof raw.text !== "boolean")
      throw new Error("invalid_text_capability");
    result.text = raw.text;
  }
  return result;
}
export function parseCustomizationTerms(input: unknown): CustomizationTerms {
  const raw = record(input),
    result: CustomizationTerms = { sample_required: true };
  for (const key of ["moq", "lead_time_days", "surcharge_cents"] as const) {
    if (raw[key] == null) continue;
    const value = raw[key];
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < (key === "surcharge_cents" ? 0 : 1) ||
      value > 10_000_000
    ) {
      throw new Error("invalid_customization_term: " + key);
    }
    result[key] = value;
  }
  if (raw.currency != null) {
    const currency = string(raw.currency, 3);
    if (!/^[A-Z]{3}$/.test(currency))
      throw new Error("invalid_customization_currency");
    result.currency = currency;
  }
  if (raw.sample_required != null && raw.sample_required !== true)
    throw new Error("physical_sample_required");
  if (result.surcharge_cents != null && !result.currency)
    throw new Error("customization_currency_required");
  return result;
}
export function parseCatalogDetails(input: unknown): CatalogDetails {
  const raw = record(input),
    result: CatalogDetails = {};
  for (const key of [
    "origin",
    "weight",
    "dimensions",
    "ingredients",
    "shelf_life",
  ] as const) {
    if (raw[key] != null)
      result[key] = string(raw[key], key === "ingredients" ? 4000 : 300);
  }
  if (raw.gallery != null) {
    if (!Array.isArray(raw.gallery) || raw.gallery.length > 20)
      throw new Error("invalid_catalog_gallery");
    result.gallery = raw.gallery.map(httpsUrl);
  }
  return result;
}
export function hasCustomization(
  capabilities: CustomizationCapabilities,
): boolean {
  return (
    CAPABILITY_KEYS.some((key) => Boolean(capabilities[key]?.length)) ||
    capabilities.text === true
  );
}
export function readCustomizationConfig(input: unknown): CustomizationConfig {
  const raw = record(input),
    config = emptyCustomization();
  for (const key of Object.keys(config) as (keyof CustomizationConfig)[]) {
    if (raw[key] != null)
      config[key] = string(
        raw[key],
        key === "instructions" ? 2000 : key === "logo" ? 2048 : 300,
      );
  }
  return config;
}
export function validateCustomizationConfig(
  input: unknown,
  capabilities: CustomizationCapabilities,
): CustomizationConfig {
  if (!hasCustomization(capabilities))
    throw new Error("customization_not_qualified");
  const raw = record(input),
    config = readCustomizationConfig(raw);
  if (Object.keys(raw).some((key) => !(key in config)))
    throw new Error("unsupported_customization_field");
  const pairs = {
    color: "colors",
    logoOption: "logo",
    packaging: "packaging",
    marking: "marking",
    material: "materials",
    finish: "finishes",
    dimensions: "dimensions",
  } as const;
  for (const [field, capability] of Object.entries(pairs)) {
    const value = config[field as keyof typeof pairs];
    if (value && !capabilities[capability]?.includes(value))
      throw new Error("unsupported_customization_option: " + field);
  }
  if (config.logo) {
    if (!capabilities.logo?.length || !config.logoOption)
      throw new Error("logo_option_required");
    httpsUrl(config.logo);
  }
  if (config.text && capabilities.text !== true)
    throw new Error("unsupported_customization_text");
  return config;
}
