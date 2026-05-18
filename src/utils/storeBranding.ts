import type { StoreSettings } from '../types/database';

/** Default public branding (matches App.tsx fallbacks). */
export const DEFAULT_STORE_NAME = 'شركة الرؤى للتجارة والتوريدات والعطارة';
export const DEFAULT_STORE_DESCRIPTION =
  'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية';
export const DEFAULT_META_TITLE = DEFAULT_STORE_NAME;
export const DEFAULT_META_DESCRIPTION =
  'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية';

/** Substrings from old templates (furniture / perfume) that must not replace El Roaa branding. */
const LEGACY_BRAND_MARKERS = [
  'السماح',
  'مفروشات',
  'معرض السماح',
  'متجر العطور',
] as const;

export function textHasLegacyBranding(text: string | null | undefined): boolean {
  if (text == null || !String(text).trim()) return false;
  return LEGACY_BRAND_MARKERS.some((m) => text.includes(m));
}

/** Perfume-seed phrase from an older migration (not this store). */
export function textHasLegacyPerfumeDescription(text: string | null | undefined): boolean {
  if (text == null || !String(text).trim()) return false;
  return text.includes('عطور والمنتجات العالمية');
}

/**
 * Returns a copy of settings with legacy template names/descriptions replaced
 * so the tab title and logo alt text do not flash correct then wrong after Supabase loads.
 */
export function sanitizeStoreSettings<T extends StoreSettings>(raw: T): T {
  const s = { ...raw };
  if (textHasLegacyBranding(s.store_name)) {
    s.store_name = DEFAULT_STORE_NAME;
  }
  if (textHasLegacyBranding(s.meta_title)) {
    s.meta_title = DEFAULT_META_TITLE;
  }
  if (textHasLegacyBranding(s.store_description) || textHasLegacyPerfumeDescription(s.store_description)) {
    s.store_description = DEFAULT_STORE_DESCRIPTION;
  }
  if (textHasLegacyBranding(s.meta_description) || textHasLegacyPerfumeDescription(s.meta_description)) {
    s.meta_description = DEFAULT_META_DESCRIPTION;
  }
  return s;
}
