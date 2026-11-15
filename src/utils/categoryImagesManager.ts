import { supabase } from '../lib/supabase';

const CATEGORY_IMAGES_STORAGE_KEY = 'el_roaa_category_images_v1';

let cachedCategoryImages: Record<string, string> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (err) {
      console.error('Category image listener error:', err);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('el_roaa_category_images_updated'));
  }
}

export function getLocalCategoryImagesMap(): Record<string, string> {
  if (cachedCategoryImages) return cachedCategoryImages;
  try {
    const raw = localStorage.getItem(CATEGORY_IMAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      cachedCategoryImages = parsed || {};
      return cachedCategoryImages;
    }
  } catch (err) {
    console.error('Error reading category images from localStorage:', err);
  }
  return {};
}

export function getCategoryImageUrl(categoryId?: string | null): string | null {
  if (!categoryId) return null;
  const map = getLocalCategoryImagesMap();
  return map[String(categoryId)] || null;
}

export async function syncCategoryImagesFromDB(): Promise<Record<string, string>> {
  try {
    const { data: rows, error } = await supabase
      .from('store_settings')
      .select('id, theme_settings')
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return getLocalCategoryImagesMap();
    }

    const theme = (rows[0].theme_settings as Record<string, unknown> | null) || {};
    const remoteImages = theme.category_images as Record<string, string> | undefined;

    if (remoteImages && typeof remoteImages === 'object') {
      cachedCategoryImages = { ...getLocalCategoryImagesMap(), ...remoteImages };
      try {
        localStorage.setItem(CATEGORY_IMAGES_STORAGE_KEY, JSON.stringify(cachedCategoryImages));
      } catch (err) {
        console.warn('Failed to cache category images in localStorage:', err);
      }
      notifyListeners();
    }

    return getLocalCategoryImagesMap();
  } catch (err) {
    console.error('Failed to sync category images from DB:', err);
    return getLocalCategoryImagesMap();
  }
}

export async function setCategoryImageUrl(
  categoryId: string,
  imageUrl: string | null
): Promise<void> {
  const map = { ...getLocalCategoryImagesMap() };
  const key = String(categoryId);

  if (imageUrl && imageUrl.trim()) {
    map[key] = imageUrl.trim();
  } else {
    delete map[key];
  }

  cachedCategoryImages = map;
  try {
    localStorage.setItem(CATEGORY_IMAGES_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save category images to localStorage:', err);
  }

  notifyListeners();

  try {
    const { data: rows } = await supabase
      .from('store_settings')
      .select('id, theme_settings')
      .limit(1);

    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as Record<string, unknown> | null) || {};
      const updatedTheme = {
        ...currentTheme,
        category_images: map,
      };
      await supabase
        .from('store_settings')
        .update({ theme_settings: updatedTheme })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Failed to persist category images to DB:', err);
  }
}

export function subscribeToCategoryImages(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
