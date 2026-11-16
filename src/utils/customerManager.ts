import { supabase } from '../lib/supabase';
import type {
  Customer,
  CustomerDeliveryInfo,
  CustomerOrder,
  CustomerWithOrders,
  OrderItemRecord,
  OrderStatus,
} from '../types/database';

const DELIVERY_STORAGE_KEY = 'el_roaa_customer_delivery_v1';
const SESSION_STORAGE_KEY = 'el_roaa_customer_session_v1';
const FALLBACK_CUSTOMERS_KEY = 'el_roaa_fallback_customers_v1';
const FALLBACK_ORDERS_KEY = 'el_roaa_fallback_orders_v1';
const SYSTEM_V2_ENABLED_KEY = 'el_roaa_system_v2_enabled';
export const SYSTEM_V2_EVENT = 'el_roaa_system_v2_activated';

export function getLocalSystemV2Enabled(): boolean {
  try {
    return localStorage.getItem(SYSTEM_V2_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export async function fetchSystemV2EnabledFromDB(): Promise<boolean> {
  try {
    const { data: rows, error } = await supabase
      .from('store_settings')
      .select('theme_settings')
      .limit(1);

    if (!error && rows && rows.length > 0) {
      const theme = (rows[0].theme_settings as Record<string, unknown>) || {};
      const enabled = Boolean(theme.customer_system_v2_enabled);
      try {
        localStorage.setItem(SYSTEM_V2_ENABLED_KEY, enabled ? 'true' : 'false');
      } catch {
        // Ignore storage error
      }
      return enabled;
    }
  } catch (err) {
    console.error('Error checking system V2 flag:', err);
  }
  return getLocalSystemV2Enabled();
}

export async function activateSystemV2Permanently(): Promise<boolean> {
  try {
    localStorage.setItem(SYSTEM_V2_ENABLED_KEY, 'true');
  } catch {
    // Ignore storage error
  }

  try {
    const { data: rows } = await supabase
      .from('store_settings')
      .select('id, theme_settings')
      .limit(1);

    if (rows && rows.length > 0) {
      const currentTheme = (rows[0].theme_settings as Record<string, unknown>) || {};
      await supabase
        .from('store_settings')
        .update({
          theme_settings: {
            ...currentTheme,
            customer_system_v2_enabled: true,
          },
        })
        .eq('id', rows[0].id);
    }
  } catch (err) {
    console.error('Error activating system V2 in DB:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYSTEM_V2_EVENT));
  }
  return true;
}

interface FallbackStorePayload {
  customers_db?: Customer[];
  customer_orders_db?: CustomerOrder[];
}

export const CUSTOMER_SQL_MIGRATION = `-- تنفيذ هذا الكود مرة واحدة في Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  full_name text NOT NULL,
  address text NOT NULL DEFAULT '',
  password text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_orders (
  id text PRIMARY KEY,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_phone text NOT NULL,
  customer_name text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total text NOT NULL DEFAULT '0',
  has_zero_stock boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customer_orders_phone ON public.customer_orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_id ON public.customer_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON public.customer_orders (created_at DESC);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read customers" ON public.customers;
CREATE POLICY "Allow public read customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
CREATE POLICY "Allow public insert customers" ON public.customers FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update customers" ON public.customers;
CREATE POLICY "Allow public update customers" ON public.customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read customer_orders" ON public.customer_orders;
CREATE POLICY "Allow public read customer_orders" ON public.customer_orders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert customer_orders" ON public.customer_orders;
CREATE POLICY "Allow public insert customer_orders" ON public.customer_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update customer_orders" ON public.customer_orders;
CREATE POLICY "Allow public update customer_orders" ON public.customer_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);`;

function toWesternDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

export function normalizePhone(rawPhone: string): string {
  const digitsOnly = toWesternDigits(rawPhone || '').replace(/[^\d]/g, '');
  if (digitsOnly.startsWith('0020') && digitsOnly.length >= 13) {
    return digitsOnly.slice(3);
  }
  if (digitsOnly.startsWith('201') && digitsOnly.length === 12) {
    return digitsOnly.slice(1);
  }
  return digitsOnly;
}

export function isValidPhone(rawPhone: string): boolean {
  const normalized = normalizePhone(rawPhone);
  return normalized.length >= 8;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === 'PGRST204' ||
    msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

export function getSavedDeliveryInfo(): CustomerDeliveryInfo {
  try {
    const raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CustomerDeliveryInfo>;
      return {
        full_name: parsed.full_name || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
      };
    }
  } catch (err) {
    console.error('Error reading delivery info from localStorage:', err);
  }
  return { full_name: '', phone: '', address: '' };
}

export function saveDeliveryInfo(info: CustomerDeliveryInfo): void {
  try {
    localStorage.setItem(
      DELIVERY_STORAGE_KEY,
      JSON.stringify({
        full_name: info.full_name.trim(),
        phone: normalizePhone(info.phone) || info.phone.trim(),
        address: info.address.trim(),
      })
    );
  } catch (err) {
    console.error('Error saving delivery info to localStorage:', err);
  }
}

export function getSavedCustomerSession(): Customer | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Customer;
    }
  } catch (err) {
    console.error('Error reading customer session:', err);
  }
  return null;
}

export function saveCustomerSession(customer: Customer | null): void {
  try {
    if (!customer) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    const safeCustomer: Customer = {
      id: customer.id,
      phone: customer.phone,
      full_name: customer.full_name,
      address: customer.address,
      has_password: Boolean(customer.password || customer.has_password),
      created_at: customer.created_at,
      updated_at: customer.updated_at,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeCustomer));
  } catch (err) {
    console.error('Error saving customer session:', err);
  }
}

async function readFallbackDatabase(): Promise<{
  rowId: string | null;
  theme: Record<string, unknown>;
  customers: Customer[];
  orders: CustomerOrder[];
}> {
  let localCustomers: Customer[] = [];
  let localOrders: CustomerOrder[] = [];

  try {
    const cRaw = localStorage.getItem(FALLBACK_CUSTOMERS_KEY);
    if (cRaw) localCustomers = JSON.parse(cRaw) as Customer[];
    const oRaw = localStorage.getItem(FALLBACK_ORDERS_KEY);
    if (oRaw) localOrders = JSON.parse(oRaw) as CustomerOrder[];
  } catch {
    // Ignore local fallback parse error
  }

  try {
    const { data: rows } = await supabase
      .from('store_settings')
      .select('id, theme_settings')
      .limit(1);

    if (rows && rows.length > 0) {
      const theme = (rows[0].theme_settings as Record<string, unknown>) || {};
      const payload = theme as FallbackStorePayload;
      const remoteCustomers = Array.isArray(payload.customers_db) ? payload.customers_db : [];
      const remoteOrders = Array.isArray(payload.customer_orders_db) ? payload.customer_orders_db : [];
      return {
        rowId: rows[0].id,
        theme,
        customers: remoteCustomers.length > 0 ? remoteCustomers : localCustomers,
        orders: remoteOrders.length > 0 ? remoteOrders : localOrders,
      };
    }
  } catch (err) {
    console.error('Fallback store read error:', err);
  }

  return { rowId: null, theme: {}, customers: localCustomers, orders: localOrders };
}

async function writeFallbackDatabase(
  rowId: string | null,
  theme: Record<string, unknown>,
  customers: Customer[],
  orders: CustomerOrder[]
): Promise<void> {
  try {
    localStorage.setItem(FALLBACK_CUSTOMERS_KEY, JSON.stringify(customers));
    localStorage.setItem(FALLBACK_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Ignore localStorage quota error
  }

  if (!rowId) return;
  try {
    await supabase
      .from('store_settings')
      .update({
        theme_settings: {
          ...theme,
          customers_db: customers,
          customer_orders_db: orders,
        },
      })
      .eq('id', rowId);
  } catch (err) {
    console.error('Fallback store write error:', err);
  }
}

export async function checkSqlTablesReady(): Promise<boolean> {
  const { error } = await supabase.from('customers').select('id').limit(1);
  return !isMissingTableError(error);
}

export async function checkCustomerByPhone(rawPhone: string): Promise<Customer | null> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  const { data, error } = await supabase
    .from('customers')
    .select('id, phone, full_name, address, password, created_at, updated_at')
    .eq('phone', phone)
    .maybeSingle();

  if (!error) {
    if (!data) return null;
    return {
      ...data,
      has_password: data.password !== null && data.password !== undefined && data.password !== '',
    };
  }

  if (isMissingTableError(error)) {
    const fb = await readFallbackDatabase();
    const match = fb.customers.find((c) => normalizePhone(c.phone) === phone);
    if (!match) return null;
    return {
      ...match,
      has_password: Boolean(match.password),
    };
  }

  return null;
}

export async function upsertCustomerOnOrder(info: CustomerDeliveryInfo): Promise<{
  customer: Customer;
  usedFallback: boolean;
}> {
  const phone = normalizePhone(info.phone);
  const fullName = info.full_name.trim();
  const address = info.address.trim();

  saveDeliveryInfo({ full_name: fullName, phone, address });

  const { data: existing, error: fetchError } = await supabase
    .from('customers')
    .select('id, phone, full_name, address, password, created_at, updated_at')
    .eq('phone', phone)
    .maybeSingle();

  if (!fetchError) {
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('customers')
        .update({
          full_name: fullName,
          address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, phone, full_name, address, password, created_at, updated_at')
        .single();

      if (!updateError && updated) {
        const resultCustomer: Customer = {
          ...updated,
          has_password: Boolean(updated.password),
        };
        const currentSession = getSavedCustomerSession();
        if (currentSession && normalizePhone(currentSession.phone) === phone) {
          saveCustomerSession(resultCustomer);
        }
        return { customer: resultCustomer, usedFallback: false };
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('customers')
        .insert({
          phone,
          full_name: fullName,
          address,
          password: null,
        })
        .select('id, phone, full_name, address, password, created_at, updated_at')
        .single();

      if (!insertError && inserted) {
        return {
          customer: { ...inserted, has_password: false },
          usedFallback: false,
        };
      }
    }
  }

  // Fallback path when SQL migration hasn't been executed yet
  const fb = await readFallbackDatabase();
  const existingIdx = fb.customers.findIndex((c) => normalizePhone(c.phone) === phone);
  const now = new Date().toISOString();

  let customerRecord: Customer;
  if (existingIdx >= 0) {
    customerRecord = {
      ...fb.customers[existingIdx],
      full_name: fullName,
      address,
      updated_at: now,
    };
    fb.customers[existingIdx] = customerRecord;
  } else {
    customerRecord = {
      id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phone,
      full_name: fullName,
      address,
      password: null,
      created_at: now,
      updated_at: now,
    };
    fb.customers.unshift(customerRecord);
  }

  await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);

  const currentSession = getSavedCustomerSession();
  if (currentSession && normalizePhone(currentSession.phone) === phone) {
    saveCustomerSession({ ...customerRecord, has_password: Boolean(customerRecord.password) });
  }

  return {
    customer: { ...customerRecord, has_password: Boolean(customerRecord.password) },
    usedFallback: true,
  };
}

export async function recordCustomerOrder(params: {
  orderId: string;
  customer: Customer;
  items: OrderItemRecord[];
  total: string;
  hasZeroStock: boolean;
}): Promise<CustomerOrder> {
  const newOrder: CustomerOrder = {
    id: params.orderId,
    customer_id: params.customer.id,
    customer_phone: normalizePhone(params.customer.phone),
    customer_name: params.customer.full_name,
    customer_address: params.customer.address,
    items: params.items,
    total: params.total,
    has_zero_stock: params.hasZeroStock,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('customer_orders')
    .insert({
      id: newOrder.id,
      customer_id: newOrder.customer_id,
      customer_phone: newOrder.customer_phone,
      customer_name: newOrder.customer_name,
      customer_address: newOrder.customer_address,
      items: newOrder.items,
      total: newOrder.total,
      has_zero_stock: newOrder.has_zero_stock,
      status: newOrder.status,
      created_at: newOrder.created_at,
    })
    .select('*')
    .single();

  if (!error && data) {
    return data as CustomerOrder;
  }

  if (isMissingTableError(error) || error) {
    const fb = await readFallbackDatabase();
    fb.orders.unshift(newOrder);
    await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);
  }

  return newOrder;
}

export async function loginCustomerWithPhone(
  rawPhone: string,
  password: string
): Promise<{ customer?: Customer; error?: string; needsClaim?: boolean }> {
  const phone = normalizePhone(rawPhone);
  if (!isValidPhone(phone)) {
    return { error: 'يرجى إدخال رقم تليفون صحيح' };
  }
  if (!password) {
    return { error: 'يرجى إدخال كلمة المرور' };
  }

  const existing = await checkCustomerByPhone(phone);
  if (!existing) {
    return {
      error: 'لا يوجد حساب مسجل بهذا الرقم. يمكنك إنشاء حساب جديد فوراً.',
    };
  }

  if (existing.password === null || existing.password === undefined || existing.password === '') {
    return {
      needsClaim: true,
      customer: existing,
      error:
        'لديك طلبات مسجلة لدينا بهذا الرقم ولكن لم تحدد كلمة مرور بعد. اختر "حساب جديد / تفعيل حساب" لتعيين كلمة مرور وفتح طلباتك فوراً.',
    };
  }

  if (existing.password !== password) {
    return { error: 'كلمة المرور غير صحيحة، حاول مرة أخرى' };
  }

  const safeCustomer: Customer = {
    ...existing,
    has_password: true,
  };
  saveCustomerSession(safeCustomer);
  saveDeliveryInfo({
    full_name: safeCustomer.full_name,
    phone: safeCustomer.phone,
    address: safeCustomer.address,
  });

  return { customer: safeCustomer };
}

export async function registerOrClaimCustomerAccount(params: {
  phone: string;
  password: string;
  full_name?: string;
  address?: string;
}): Promise<{ customer?: Customer; error?: string; wasClaimed?: boolean }> {
  const phone = normalizePhone(params.phone);
  if (!isValidPhone(phone)) {
    return { error: 'يرجى إدخال رقم تليفون صحيح' };
  }
  if (!params.password || params.password.length === 0) {
    return { error: 'يرجى إدخال كلمة مرور (أي أرقام أو حروف بدون قيود)' };
  }

  const existing = await checkCustomerByPhone(phone);

  // Case 1: Guest ordered previously with this phone -> claim & set password directly
  if (existing) {
    if (existing.password && existing.password !== '') {
      if (existing.password === params.password) {
        const loggedCustomer: Customer = { ...existing, has_password: true };
        saveCustomerSession(loggedCustomer);
        saveDeliveryInfo({
          full_name: loggedCustomer.full_name,
          phone: loggedCustomer.phone,
          address: loggedCustomer.address,
        });
        return { customer: loggedCustomer, wasClaimed: false };
      }
      return {
        error: 'هذا الرقم مسجل بالفعل بكلمة مرور، يرجى تسجيل الدخول من تبويب "تسجيل الدخول".',
      };
    }

    const updatedName = (params.full_name || '').trim() || existing.full_name;
    const updatedAddress = (params.address || '').trim() || existing.address;

    const { data: updated, error: updateErr } = await supabase
      .from('customers')
      .update({
        password: params.password,
        full_name: updatedName,
        address: updatedAddress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id, phone, full_name, address, created_at, updated_at')
      .single();

    if (!updateErr && updated) {
      const claimed: Customer = { ...updated, has_password: true };
      saveCustomerSession(claimed);
      saveDeliveryInfo({
        full_name: claimed.full_name,
        phone: claimed.phone,
        address: claimed.address,
      });
      return { customer: claimed, wasClaimed: true };
    }

    // Fallback update
    const fb = await readFallbackDatabase();
    const idx = fb.customers.findIndex((c) => normalizePhone(c.phone) === phone);
    if (idx >= 0) {
      fb.customers[idx] = {
        ...fb.customers[idx],
        password: params.password,
        full_name: updatedName,
        address: updatedAddress,
        updated_at: new Date().toISOString(),
      };
      await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);
      const claimed: Customer = { ...fb.customers[idx], has_password: true };
      saveCustomerSession(claimed);
      saveDeliveryInfo({
        full_name: claimed.full_name,
        phone: claimed.phone,
        address: claimed.address,
      });
      return { customer: claimed, wasClaimed: true };
    }
  }

  // Case 2: Completely new customer
  const fullName = (params.full_name || '').trim() || `عميل ${phone}`;
  const address = (params.address || '').trim();

  const { data: created, error: createErr } = await supabase
    .from('customers')
    .insert({
      phone,
      full_name: fullName,
      address,
      password: params.password,
    })
    .select('id, phone, full_name, address, created_at, updated_at')
    .single();

  if (!createErr && created) {
    const newCustomer: Customer = { ...created, has_password: true };
    saveCustomerSession(newCustomer);
    saveDeliveryInfo({
      full_name: newCustomer.full_name,
      phone: newCustomer.phone,
      address: newCustomer.address,
    });
    return { customer: newCustomer, wasClaimed: false };
  }

  if (isMissingTableError(createErr) || createErr) {
    const fb = await readFallbackDatabase();
    const newCustomer: Customer = {
      id: `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phone,
      full_name: fullName,
      address,
      password: params.password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fb.customers.unshift(newCustomer);
    await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);

    const safe: Customer = { ...newCustomer, has_password: true };
    saveCustomerSession(safe);
    saveDeliveryInfo({
      full_name: safe.full_name,
      phone: safe.phone,
      address: safe.address,
    });
    return { customer: safe, wasClaimed: false };
  }

  return { error: 'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى' };
}

export async function updateCustomerProfileDetails(params: {
  customerId: string;
  phone: string;
  full_name: string;
  address: string;
  newPassword?: string;
}): Promise<{ customer?: Customer; error?: string }> {
  const phone = normalizePhone(params.phone);
  const fullName = params.full_name.trim();
  const address = params.address.trim();

  if (!fullName) {
    return { error: 'يرجى إدخال الاسم' };
  }

  const updatePayload: Record<string, string> = {
    full_name: fullName,
    address,
    updated_at: new Date().toISOString(),
  };
  if (params.newPassword && params.newPassword.length > 0) {
    updatePayload.password = params.newPassword;
  }

  const { data: updated, error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('phone', phone)
    .select('id, phone, full_name, address, created_at, updated_at')
    .single();

  if (!error && updated) {
    const safe: Customer = { ...updated, has_password: true };
    saveCustomerSession(safe);
    saveDeliveryInfo({ full_name: safe.full_name, phone: safe.phone, address: safe.address });
    return { customer: safe };
  }

  const fb = await readFallbackDatabase();
  const idx = fb.customers.findIndex((c) => normalizePhone(c.phone) === phone);
  if (idx >= 0) {
    fb.customers[idx] = {
      ...fb.customers[idx],
      full_name: fullName,
      address,
      ...(params.newPassword ? { password: params.newPassword } : {}),
      updated_at: new Date().toISOString(),
    };
    await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);
    const safe: Customer = { ...fb.customers[idx], has_password: true };
    saveCustomerSession(safe);
    saveDeliveryInfo({ full_name: safe.full_name, phone: safe.phone, address: safe.address });
    return { customer: safe };
  }

  return { error: 'تعذر حفظ التعديلات حالياً' };
}

export async function fetchOrdersForCustomer(
  rawPhone: string,
  customerId?: string
): Promise<CustomerOrder[]> {
  const phone = normalizePhone(rawPhone);
  if (!phone && !customerId) return [];

  let query = supabase
    .from('customer_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (phone && customerId) {
    query = query.or(`customer_phone.eq.${phone},customer_id.eq.${customerId}`);
  } else if (phone) {
    query = query.eq('customer_phone', phone);
  } else if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;

  if (!error && data) {
    return data as CustomerOrder[];
  }

  const fb = await readFallbackDatabase();
  return fb.orders
    .filter(
      (o) =>
        (phone && normalizePhone(o.customer_phone) === phone) ||
        (customerId && o.customer_id === customerId)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchAllCustomersWithOrders(): Promise<{
  customers: CustomerWithOrders[];
  orders: CustomerOrder[];
  tablesReady: boolean;
}> {
  const { data: dbCustomers, error: custErr } = await supabase
    .from('customers')
    .select('id, phone, full_name, address, password, created_at, updated_at')
    .order('created_at', { ascending: false });

  const { data: dbOrders, error: ordErr } = await supabase
    .from('customer_orders')
    .select('*')
    .order('created_at', { ascending: false });

  let rawCustomers: Customer[] = [];
  let rawOrders: CustomerOrder[] = [];
  let tablesReady = true;

  if (!custErr && !ordErr && dbCustomers && dbOrders) {
    rawCustomers = dbCustomers.map((c) => ({
      ...c,
      has_password: Boolean(c.password),
      password: null,
    }));
    rawOrders = dbOrders as CustomerOrder[];
  } else {
    tablesReady = !isMissingTableError(custErr) && !isMissingTableError(ordErr);
    const fb = await readFallbackDatabase();
    rawCustomers = fb.customers.map((c) => ({
      ...c,
      has_password: Boolean(c.password),
      password: null,
    }));
    rawOrders = fb.orders;
  }

  const enriched: CustomerWithOrders[] = rawCustomers.map((cust) => {
    const custPhone = normalizePhone(cust.phone);
    const custOrders = rawOrders
      .filter(
        (ord) =>
          ord.customer_id === cust.id || normalizePhone(ord.customer_phone) === custPhone
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const totalSpent = custOrders.reduce((sum, ord) => {
      const val = parseFloat(String(ord.total || '0'));
      return sum + (Number.isFinite(val) ? val : 0);
    }, 0);

    return {
      ...cust,
      orders: custOrders,
      orders_count: custOrders.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      last_order_at: custOrders[0]?.created_at ?? null,
    };
  });

  // Sort by most recent order or account creation
  enriched.sort((a, b) => {
    const dateA = new Date(a.last_order_at || a.created_at).getTime();
    const dateB = new Date(b.last_order_at || b.created_at).getTime();
    return dateB - dateA;
  });

  return {
    customers: enriched,
    orders: rawOrders,
    tablesReady,
  };
}

export async function updateCustomerOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('customer_orders')
    .update({ status })
    .eq('id', orderId);

  if (!error) return true;

  const fb = await readFallbackDatabase();
  const idx = fb.orders.findIndex((o) => o.id === orderId);
  if (idx >= 0) {
    fb.orders[idx] = { ...fb.orders[idx], status };
    await writeFallbackDatabase(fb.rowId, fb.theme, fb.customers, fb.orders);
    return true;
  }

  return false;
}
