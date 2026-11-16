import { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { deductStockForOrder, syncInventoryFromDB } from '../utils/inventoryManager';
import type { CustomerDeliveryInfo } from '../types/database';
import {
  getLocalSystemV2Enabled,
  isValidPhone,
  normalizePhone,
  recordCustomerOrder,
  upsertCustomerOnOrder,
} from '../utils/customerManager';

export interface CartItem {
  id: string;
  title: string;
  price: string;
  numericPrice: number;
  quantity: number;
  imageUrl?: string;
  productId?: string;
  size?: string;
  track_stock?: boolean;
  stock_quantity?: number | null;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity' | 'numericPrice'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  isAutoShowing: boolean;
  toggleCart: (open?: boolean) => void;
  itemCount: number;
  cartTotal: string;
  sendOrderViaWhatsApp: (customerInfo?: CustomerDeliveryInfo) => Promise<boolean>;
  showToast: boolean;
  toastProductName: string;
  hideToast: () => void;
  isSubmittingOrder: boolean;
  hasZeroStockItemsInCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAutoShowing, setIsAutoShowing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastProductName, setToastProductName] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Sync inventory data on mount
  useEffect(() => {
    syncInventoryFromDB();
  }, []);

  const cleanPrice = (price: string | number): { display: string; numeric: number } => {
    // If price is already a number, use it directly
    if (typeof price === 'number') {
      return {
        display: price.toString(),
        numeric: price
      };
    }

    // Handle Arabic numerals by converting to Western numerals first
    const westernPrice = price
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

    // Extract numbers with decimal points and commas
    const match = westernPrice.match(/[\d,.]*/g)?.join('');
    let numericValue = 0;
    
    if (match) {
      // Remove any non-numeric characters except decimal point
      const cleanNumber = match.replace(/[^\d.,]/g, '')
        .replace(/,/g, '.')
        .replace(/\.(?=.*\.)/g, ''); // Remove all but last decimal point
      
      numericValue = parseFloat(cleanNumber) || 0;
    }
    
    return {
      display: price.trim(),
      numeric: numericValue
    };
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity' | 'numericPrice'>) => {
    const { display, numeric } = cleanPrice(item.price);
    
    setCartItems(prevItems => {
      // Check if item already exists in cart by title and size
      const existingItem = prevItems.find(
        cartItem => cartItem.title === item.title && cartItem.size === item.size
      );

      if (existingItem) {
        // If item exists, increase quantity
        return prevItems.map(cartItem =>
          cartItem.title === item.title && cartItem.size === item.size
            ? { ...cartItem, quantity: cartItem.quantity + 1, track_stock: item.track_stock ?? cartItem.track_stock, stock_quantity: item.stock_quantity ?? cartItem.stock_quantity }
            : cartItem
        );
      }
      
      // If item doesn't exist, add it to cart
      return [...prevItems, { 
        ...item, 
        id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
        price: display,
        numericPrice: numeric,
        quantity: 1,
        track_stock: item.track_stock ?? false,
        stock_quantity: item.stock_quantity ?? null
      }];
    });
            
    // Show toast notification instead of opening cart
    setToastProductName(item.title);
    setShowToast(true);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== id);
      // If last item is removed, hide the cart if it was auto-shown
      if (newItems.length === 0 && isAutoShowing) {
        toggleCart(false);
      }
      return newItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleCart = useCallback((open?: boolean) => {
    if (open !== undefined) {
      setIsCartOpen(open);
      if (!open) setIsAutoShowing(false);
    } else {
      setIsCartOpen(prev => {
        const newState = !prev;
        if (!newState) setIsAutoShowing(false);
        return newState;
      });
    }
  }, []);

  const hideToast = useCallback(() => {
    setShowToast(false);
  }, []);

  const itemCount = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );

  const hasZeroStockItemsInCart = useMemo(() => {
    return cartItems.some(item => item.track_stock && (item.stock_quantity ?? 0) <= 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    let total = 0;
    
    cartItems.forEach(item => {
      const price = typeof item.numericPrice === 'number' ? item.numericPrice : 0;
      const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
      const itemTotal = price * quantity;
      total += itemTotal;
    });
    
    if (isNaN(total) || !isFinite(total)) {
      total = 0;
    }
    
    return total.toFixed(2);
  }, [cartItems]);

  const sendOrderViaWhatsApp = async (customerInfo?: CustomerDeliveryInfo): Promise<boolean> => {
    if (cartItems.length === 0) {
      toast.warning('السلة فارغة، أضف منتجات أولاً');
      return false;
    }

    const systemV2Enabled = getLocalSystemV2Enabled();

    if (!systemV2Enabled) {
      setIsSubmittingOrder(true);
      try {
        const { hasZeroStock, zeroStockItemTitles, orderRecord } = await deductStockForOrder(
          cartItems.map(item => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            size: item.size
          })),
          cartTotal
        );

        const orderDetails = cartItems.map(item => {
          const isItemZeroStock = item.track_stock && (item.stock_quantity ?? 0) <= 0;
          const zeroStockTag = isItemZeroStock ? ' *(مخزون صفري: 0 - تحت الطلب)*' : '';
          return `- ${item.title}${item.size ? ` (${item.size})` : ''} (${item.quantity} × ${item.price} ج)${zeroStockTag}`;
        }).join('%0A');

        let message = `*طلب جديد من المتجر الإلكتروني*%0A`;
        message += `رقم الطلب: ${orderRecord.id}%0A`;
        message += `------------------------%0A`;
        message += `${orderDetails}%0A`;
        message += `------------------------%0A`;
        message += `*الإجمالي: ${cartTotal} ج*%0A`;

        if (hasZeroStock) {
          message += `%0A⚠️ *تنبيه للتاجر*: يتضمن هذا الطلب منتجات تم شراؤها بمخزون صفري (0 متبقي):%0A`;
          zeroStockItemTitles.forEach(title => {
            message += `• ${title}%0A`;
          });
          message += `*(يرجى مراجعة المخزن وتوفير وتجهيز الكمية المطلوبة للعميل)*%0A`;
        }

        message += `%0Aشكراً لكم!`;

        window.open(`https://wa.me/201003046674?text=${message}`, '_blank');

        if (hasZeroStock) {
          toast.info('تم تأكيد طلبك بنجاح! سيتم تجهيز وتوريد المنتجات المطلوبة لك فوراً.', { autoClose: 5000 });
        } else {
          toast.success('تم إرسال الطلب بنجاح وتحديث المخزون!');
        }

        clearCart();
        toggleCart(false);
        return true;
      } catch (err: unknown) {
        console.error('Error completing order:', err);
        toast.error('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة ثانية');
        return false;
      } finally {
        setIsSubmittingOrder(false);
      }
    }

    const cleanName = (customerInfo?.full_name || '').trim();
    const normalizedPhone = normalizePhone(customerInfo?.phone || '');
    const cleanAddress = (customerInfo?.address || '').trim();

    if (!cleanName) {
      toast.warning('يرجى إدخال الاسم بالكامل قبل إتمام الطلب');
      return false;
    }
    if (!isValidPhone(normalizedPhone)) {
      toast.warning('يرجى إدخال رقم تليفون صحيح (8 أرقام على الأقل)');
      return false;
    }
    if (!cleanAddress) {
      toast.warning('يرجى إدخال عنوان التوصيل بالتفصيل');
      return false;
    }

    setIsSubmittingOrder(true);
    try {
      // 1. Upsert customer profile by phone (works for guests & registered customers)
      const { customer } = await upsertCustomerOnOrder({
        full_name: cleanName,
        phone: normalizedPhone,
        address: cleanAddress,
      });

      // 2. Deduct stock automatically and check for zero stock items
      const { hasZeroStock, zeroStockItemTitles, orderRecord } = await deductStockForOrder(
        cartItems.map(item => ({
          productId: item.productId,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          size: item.size
        })),
        cartTotal,
        {
          customer_id: customer.id,
          full_name: customer.full_name,
          phone: customer.phone,
          address: customer.address,
        }
      );

      // 3. Persist order in customer_orders database linked to customer phone & ID
      await recordCustomerOrder({
        orderId: orderRecord.id,
        customer,
        items: orderRecord.items,
        total: cartTotal,
        hasZeroStock,
      });

      // 4. Format order details for WhatsApp
      const orderDetails = cartItems.map(item => {
        const isItemZeroStock = item.track_stock && (item.stock_quantity ?? 0) <= 0;
        const zeroStockTag = isItemZeroStock ? ' *(مخزون صفري: 0 - تحت الطلب)*' : '';
        return `- ${item.title}${item.size ? ` (${item.size})` : ''} (${item.quantity} × ${item.price} ج)${zeroStockTag}`;
      }).join('%0A');

      // 5. Build WhatsApp message with customer details & zero-stock warning
      let message = `*طلب جديد من المتجر الإلكتروني*%0A`;
      message += `رقم الطلب: ${orderRecord.id}%0A`;
      message += `👤 *العميل:* ${customer.full_name}%0A`;
      message += `📞 *التليفون:* ${customer.phone}%0A`;
      message += `📍 *العنوان:* ${customer.address}%0A`;
      message += `------------------------%0A`;
      message += `${orderDetails}%0A`;
      message += `------------------------%0A`;
      message += `*الإجمالي: ${cartTotal} ج*%0A`;

      if (hasZeroStock) {
        message += `%0A⚠️ *تنبيه للتاجر*: يتضمن هذا الطلب منتجات تم شراؤها بمخزون صفري (0 متبقي):%0A`;
        zeroStockItemTitles.forEach(title => {
          message += `• ${title}%0A`;
        });
        message += `*(يرجى مراجعة المخزن وتوفير وتجهيز الكمية المطلوبة للعميل)*%0A`;
      }

      message += `%0Aشكراً لكم!`;

      // 6. Open WhatsApp
      window.open(`https://wa.me/201003046674?text=${message}`, '_blank');

      if (hasZeroStock) {
        toast.info('تم تأكيد طلبك بنجاح! سيتم تجهيز وتوريد المنتجات المطلوبة لك فوراً.', { autoClose: 5000 });
      } else {
        toast.success('تم إرسال الطلب بنجاح وحفظه في سجل طلباتك!');
      }

      // 7. Clear cart and close
      clearCart();
      toggleCart(false);
      return true;
    } catch (err: unknown) {
      console.error('Error completing order:', err);
      toast.error('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة ثانية');
      return false;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        isCartOpen,
        isAutoShowing,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        sendOrderViaWhatsApp,
        showToast,
        toastProductName,
        hideToast,
        isSubmittingOrder,
        hasZeroStockItemsInCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
