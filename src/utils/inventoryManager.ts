import { supabase } from '../lib/supabase';
import type { Service, InventoryItem, OrderRecord, OrderItemRecord } from '../types/database';

const INVENTORY_STORAGE_KEY = 'el_roaa_inventory_map_v1';
const ORDERS_STORAGE_KEY = 'el_roaa_orders_log_v1';

// In-memory cache for fast sync access
let cachedInventoryMap: Record<string, InventoryItem> | null = null;
let cachedOrdersLog: OrderRecord[] | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('Inventory listener error:', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('el_roaa_inventory_updated'));
  }
}

/**
 * Get the local cached inventory map synchronously
 */
export function getLocalInventoryMap(): Record<string, InventoryItem> {
  if (cachedInventoryMap) return cachedInventoryMap;
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (raw) {
      cachedInventoryMap = JSON.parse(raw);
      return cachedInventoryMap || {};
    }
  } catch (err) {
    console.error('Error reading inventory from localStorage:', err);
  }
  return {};
}

/**
 * Get inventory details for a specific product
 */
export function getProductInventory(productId: string | number): InventoryItem {
  const map = getLocalInventoryMap();
  const idStr = String(productId);
  if (map[idStr]) {
    return map[idStr];
  }
  // Default: tracking disabled
  return {
    track_stock: false,
    stock_quantity: 0
  };
}

/**
 * Enriches a Service object with its inventory data
 */
export function enrichServiceWithInventory(service: Service): Service {
  if (!service) return service;
  const inv = getProductInventory(service.id);
  return {
    ...service,
    track_stock: inv.track_stock ?? service.track_stock ?? false,
    stock_quantity: inv.track_stock ? (inv.stock_quantity ?? 0) : (service.stock_quantity ?? null)
  };
}

/**
 * Enriches an array of Service objects with inventory data
 */
export function enrichServicesWithInventory(services: Service[]): Service[] {
  if (!Array.isArray(services)) return [];
  const map = getLocalInventoryMap();
  return services.map(service => {
    const inv = map[String(service.id)];
    if (inv) {
      return {
        ...service,
        track_stock: inv.track_stock,
        stock_quantity: inv.track_stock ? inv.stock_quantity : null
      };
    }
    return service;
  });
}

/**
 * Synchronize inventory map from Supabase store_settings into local cache
 */
export async function syncInventoryFromDB(): Promise<Record<string, InventoryItem>> {
  try {
    const { data: rows, error } = await supabase
      .from('store_settings')
      .select('id, theme_settings')
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return getLocalInventoryMap();
    }

    const theme = (rows[0].theme_settings as any) || {};
    const remoteInventory = theme.inventory_data as Record<string, InventoryItem> | undefined;
    const remoteOrders = theme.orders_log as OrderRecord[] | undefined;

    if (remoteInventory && typeof remoteInventory === 'object') {
      cachedInventoryMap = { ...getLocalInventoryMap(), ...remoteInventory };
      try {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(cachedInventoryMap));
      } catch (e) {
        console.warn('Failed to save inventory to localStorage:', e);
      }
    }

    if (remoteOrders && Array.isArray(remoteOrders)) {
      cachedOrdersLog = remoteOrders;
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(cachedOrdersLog));
      } catch (e) {
        console.warn('Failed to save orders log to localStorage:', e);
      }
    }

    notifyListeners();
    return getLocalInventoryMap();
  } catch (err) {
    console.error('Failed to sync inventory from DB:', err);
    return getLocalInventoryMap();
  }
}

/**
 * Update inventory for a single product and persist to Supabase & localStorage
 */
export async function updateProductInventory(
  productId: string | number,
  track_stock: boolean,
  stock_quantity: number
): Promise<void> {
  const map = { ...getLocalInventoryMap() };
  const idStr = String(productId);

  map[idStr] = {
    track_stock,
    stock_quantity: Math.max(0, Math.floor(stock_quantity || 0)),
    updated_at: new Date().toISOString()
  };

  cachedInventoryMap = map;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  notifyListeners();

  // Persist to Supabase store_settings.theme_settings.inventory_data
  try {
    const { data: rows } = await supabase.from('store_settings').select('id, theme_settings').limit(1);
    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as any) || {};
      const updatedTheme = {
        ...currentTheme,
        inventory_data: map
      };
      await supabase
        .from('store_settings')
        .update({ theme_settings: updatedTheme })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Failed to persist inventory to database:', err);
  }
}

/**
 * Bulk save inventory items (useful when saving multiple or initializing)
 */
export async function bulkUpdateInventory(
  updates: Record<string, { track_stock: boolean; stock_quantity: number }>
): Promise<void> {
  const map = { ...getLocalInventoryMap() };
  Object.entries(updates).forEach(([id, data]) => {
    map[String(id)] = {
      track_stock: data.track_stock,
      stock_quantity: Math.max(0, Math.floor(data.stock_quantity || 0)),
      updated_at: new Date().toISOString()
    };
  });

  cachedInventoryMap = map;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  notifyListeners();

  try {
    const { data: rows } = await supabase.from('store_settings').select('id, theme_settings').limit(1);
    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as any) || {};
      const updatedTheme = {
        ...currentTheme,
        inventory_data: map
      };
      await supabase
        .from('store_settings')
        .update({ theme_settings: updatedTheme })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Failed to persist bulk inventory to database:', err);
  }
}

/**
 * Deducts stock automatically for items in an order.
 * If stock is 0 or becomes 0, order proceeds normally with zero stock alert.
 */
export async function deductStockForOrder(
  cartItems: Array<{
    productId?: string | number;
    title: string;
    quantity: number;
    price?: string;
    size?: string;
  }>,
  totalPrice: string
): Promise<{
  hasZeroStock: boolean;
  zeroStockItemTitles: string[];
  orderRecord: OrderRecord;
}> {
  const map = { ...getLocalInventoryMap() };
  let hasZeroStock = false;
  const zeroStockItemTitles: string[] = [];
  const orderItems: OrderItemRecord[] = [];

  for (const item of cartItems) {
    const idStr = item.productId ? String(item.productId) : null;
    let inv = idStr ? map[idStr] : null;

    // If not found in map by ID, try finding by title
    if (!inv && !idStr) {
      const foundItem = Object.values(map).find((v: InventoryItem & { title?: string }) => v.title === item.title);
      if (foundItem) {
        inv = foundItem;
      }
    }

    const isTracked = !!inv && inv.track_stock;
    const stockBefore = isTracked ? inv.stock_quantity : 999999;
    const isZeroStock = isTracked && stockBefore <= 0;

    if (isZeroStock) {
      hasZeroStock = true;
      zeroStockItemTitles.push(item.title);
    }

    if (isTracked && idStr && map[idStr]) {
      // Decrease stock, minimum 0
      const newQuantity = Math.max(0, (map[idStr].stock_quantity || 0) - (item.quantity || 1));
      map[idStr] = {
        ...map[idStr],
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      };
    }

    orderItems.push({
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      price: item.price || '0',
      size: item.size,
      track_stock: isTracked,
      stock_before: isTracked ? stockBefore : undefined,
      is_zero_stock: isZeroStock
    });
  }

  // Save updated inventory map
  cachedInventoryMap = map;
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }

  // Create order log record
  const orderRecord: OrderRecord = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
    total: totalPrice,
    items: orderItems,
    has_zero_stock: hasZeroStock,
    status: 'pending'
  };

  // Update orders log in memory and localStorage
  const currentOrders = getLocalOrdersLog();
  const updatedOrders = [orderRecord, ...currentOrders].slice(0, 50); // Keep last 50 orders
  cachedOrdersLog = updatedOrders;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
  } catch (e) {
    console.error('Orders log write error:', e);
  }

  notifyListeners();

  // Persist both inventory map and orders log to Supabase in one call
  try {
    const { data: rows } = await supabase.from('store_settings').select('id, theme_settings').limit(1);
    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as any) || {};
      const updatedTheme = {
        ...currentTheme,
        inventory_data: map,
        orders_log: updatedOrders
      };
      await supabase
        .from('store_settings')
        .update({ theme_settings: updatedTheme })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Failed to sync order and stock deduction to DB:', err);
  }

  return {
    hasZeroStock,
    zeroStockItemTitles,
    orderRecord
  };
}

/**
 * Get all logged orders
 */
export function getLocalOrdersLog(): OrderRecord[] {
  if (cachedOrdersLog) return cachedOrdersLog;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      cachedOrdersLog = JSON.parse(raw);
      return cachedOrdersLog || [];
    }
  } catch (err) {
    console.error('Error reading orders log:', err);
  }
  return [];
}

/**
 * Clear orders log (by admin)
 */
export async function clearOrdersLog(): Promise<void> {
  cachedOrdersLog = [];
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
  notifyListeners();

  try {
    const { data: rows } = await supabase.from('store_settings').select('id, theme_settings').limit(1);
    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as any) || {};
      const updatedTheme = {
        ...currentTheme,
        orders_log: []
      };
      await supabase
        .from('store_settings')
        .update({ theme_settings: updatedTheme })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Failed to clear orders in DB:', err);
  }
}

/**
 * Subscribe to inventory and order changes
 */
export function subscribeToInventory(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
