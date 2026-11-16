import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Customer, CustomerDeliveryInfo, CustomerOrder } from '../types/database';
import {
  getSavedDeliveryInfo,
  saveDeliveryInfo,
  getSavedCustomerSession,
  saveCustomerSession,
  loginCustomerWithPhone,
  registerOrClaimCustomerAccount,
  updateCustomerProfileDetails,
  fetchOrdersForCustomer,
  checkCustomerByPhone,
  getLocalSystemV2Enabled,
  fetchSystemV2EnabledFromDB,
  SYSTEM_V2_EVENT,
} from '../utils/customerManager';

type AuthModalMode = 'login' | 'register';

interface CustomerContextType {
  isCustomerSystemEnabled: boolean;
  customer: Customer | null;
  deliveryInfo: CustomerDeliveryInfo;
  updateDeliveryInfo: (info: CustomerDeliveryInfo) => void;
  orders: CustomerOrder[];
  isLoadingOrders: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  login: (phone: string, password: string) => Promise<{ ok: boolean; error?: string; needsClaim?: boolean }>;
  registerOrClaim: (params: {
    phone: string;
    password: string;
    full_name?: string;
    address?: string;
  }) => Promise<{ ok: boolean; error?: string; wasClaimed?: boolean }>;
  updateProfile: (params: {
    full_name: string;
    address: string;
    newPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshOrders: () => Promise<void>;
  setLoggedInCustomer: (cust: Customer) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCustomerSystemEnabled, setIsCustomerSystemEnabled] = useState<boolean>(() =>
    getLocalSystemV2Enabled()
  );
  const [customer, setCustomer] = useState<Customer | null>(() => getSavedCustomerSession());
  const [deliveryInfo, setDeliveryInfo] = useState<CustomerDeliveryInfo>(() => {
    const saved = getSavedDeliveryInfo();
    const session = getSavedCustomerSession();
    if (!saved.phone && session) {
      return {
        full_name: session.full_name,
        phone: session.phone,
        address: session.address,
      };
    }
    return saved;
  });
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  useEffect(() => {
    fetchSystemV2EnabledFromDB().then((enabled) => {
      setIsCustomerSystemEnabled(enabled);
    });

    const handleActivated = () => {
      setIsCustomerSystemEnabled(true);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'el_roaa_system_v2_enabled') {
        setIsCustomerSystemEnabled(e.newValue === 'true');
      }
    };

    window.addEventListener(SYSTEM_V2_EVENT, handleActivated);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SYSTEM_V2_EVENT, handleActivated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const refreshOrders = useCallback(async () => {
    if (!customer || !isCustomerSystemEnabled) {
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const list = await fetchOrdersForCustomer(customer.phone, customer.id);
      setOrders(list);
    } catch (err) {
      console.error('Error loading customer orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [customer, isCustomerSystemEnabled]);

  // Sync saved session against database on mount
  useEffect(() => {
    if (!isCustomerSystemEnabled) return;
    const session = getSavedCustomerSession();
    if (!session?.phone) return;
    checkCustomerByPhone(session.phone)
      .then((fresh) => {
        if (fresh) {
          const safe: Customer = { ...fresh, password: null, has_password: fresh.has_password };
          setCustomer(safe);
          saveCustomerSession(safe);
        }
      })
      .catch(() => {
        // Keep local session if offline
      });
  }, [isCustomerSystemEnabled]);

  useEffect(() => {
    if (customer && isCustomerSystemEnabled) {
      refreshOrders();
    } else {
      setOrders([]);
    }
  }, [customer, isCustomerSystemEnabled, refreshOrders]);

  const updateDeliveryInfo = useCallback((info: CustomerDeliveryInfo) => {
    setDeliveryInfo(info);
    saveDeliveryInfo(info);
  }, []);

  const openAuthModal = useCallback(
    (mode: AuthModalMode = 'login') => {
      if (!isCustomerSystemEnabled) return;
      setAuthModalMode(mode);
      setIsAuthModalOpen(true);
    },
    [isCustomerSystemEnabled]
  );

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const setLoggedInCustomer = useCallback((cust: Customer) => {
    setCustomer(cust);
    saveCustomerSession(cust);
    const nextDelivery: CustomerDeliveryInfo = {
      full_name: cust.full_name,
      phone: cust.phone,
      address: cust.address,
    };
    setDeliveryInfo(nextDelivery);
    saveDeliveryInfo(nextDelivery);
  }, []);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await loginCustomerWithPhone(phone, password);
      if (res.customer && !res.error) {
        setLoggedInCustomer(res.customer);
        return { ok: true };
      }
      return { ok: false, error: res.error, needsClaim: res.needsClaim };
    },
    [setLoggedInCustomer]
  );

  const registerOrClaim = useCallback(
    async (params: {
      phone: string;
      password: string;
      full_name?: string;
      address?: string;
    }) => {
      const res = await registerOrClaimCustomerAccount(params);
      if (res.customer) {
        setLoggedInCustomer(res.customer);
        return { ok: true, wasClaimed: res.wasClaimed };
      }
      return { ok: false, error: res.error };
    },
    [setLoggedInCustomer]
  );

  const updateProfile = useCallback(
    async (params: { full_name: string; address: string; newPassword?: string }) => {
      if (!customer) return { ok: false, error: 'يجب تسجيل الدخول أولاً' };
      const res = await updateCustomerProfileDetails({
        customerId: customer.id,
        phone: customer.phone,
        full_name: params.full_name,
        address: params.address,
        newPassword: params.newPassword,
      });
      if (res.customer) {
        setLoggedInCustomer(res.customer);
        return { ok: true };
      }
      return { ok: false, error: res.error };
    },
    [customer, setLoggedInCustomer]
  );

  const logout = useCallback(() => {
    setCustomer(null);
    setOrders([]);
    saveCustomerSession(null);
  }, []);

  return (
    <CustomerContext.Provider
      value={{
        isCustomerSystemEnabled,
        customer,
        deliveryInfo,
        updateDeliveryInfo,
        orders,
        isLoadingOrders,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        registerOrClaim,
        updateProfile,
        logout,
        refreshOrders,
        setLoggedInCustomer,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return ctx;
};
