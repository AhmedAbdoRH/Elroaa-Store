import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, User, Phone, MapPin, CheckCircle2, Edit3 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCustomer } from '../contexts/CustomerContext';
import { isValidPhone } from '../utils/customerManager';
import { motion, AnimatePresence } from 'framer-motion';

// Animation variants
const overlayVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

const cartVariants = {
  hidden: {
    x: '-100%',
    opacity: 0.5
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 0.5
    }
  },
  exit: {
    x: '-100%',
    opacity: 0.5,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
      mass: 0.5
    }
  }
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: 'easeOut'
    }
  }),
  exit: () => ({
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  })
};

const Cart: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    toggleCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    sendOrderViaWhatsApp,
    isSubmittingOrder,
  } = useCart();

  const {
    isCustomerSystemEnabled,
    customer,
    deliveryInfo,
    updateDeliveryInfo,
    openAuthModal,
    refreshOrders,
  } = useCustomer();

  const [fullName, setFullName] = useState(deliveryInfo.full_name || '');
  const [phone, setPhone] = useState(deliveryInfo.phone || '');
  const [address, setAddress] = useState(deliveryInfo.address || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditingSavedInfo, setIsEditingSavedInfo] = useState(false);

  const hasSavedInfo = Boolean(
    deliveryInfo.full_name.trim() &&
    isValidPhone(deliveryInfo.phone) &&
    deliveryInfo.address.trim()
  );

  // Sync local inputs whenever cart opens or deliveryInfo / logged-in customer updates
  useEffect(() => {
    if (isCartOpen) {
      setFullName(deliveryInfo.full_name || customer?.full_name || '');
      setPhone(deliveryInfo.phone || customer?.phone || '');
      setAddress(deliveryInfo.address || customer?.address || '');
      setFormError(null);
      setIsEditingSavedInfo(
        !(
          (deliveryInfo.full_name || customer?.full_name) &&
          isValidPhone(deliveryInfo.phone || customer?.phone || '') &&
          (deliveryInfo.address || customer?.address)
        )
      );
    }
  }, [isCartOpen, deliveryInfo, customer]);

  const handleFieldUpdate = (nextName: string, nextPhone: string, nextAddress: string) => {
    setFullName(nextName);
    setPhone(nextPhone);
    setAddress(nextAddress);
    setFormError(null);
    updateDeliveryInfo({
      full_name: nextName,
      phone: nextPhone,
      address: nextAddress,
    });
  };

  const handleCheckoutSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!isCustomerSystemEnabled) {
      await sendOrderViaWhatsApp();
      return;
    }

    if (!fullName.trim()) {
      setIsEditingSavedInfo(true);
      setFormError('يرجى إدخال الاسم بالكامل أولاً');
      return;
    }
    if (!isValidPhone(phone)) {
      setIsEditingSavedInfo(true);
      setFormError('يرجى إدخال رقم تليفون صحيح (8 أرقام على الأقل)');
      return;
    }
    if (!address.trim()) {
      setIsEditingSavedInfo(true);
      setFormError('يرجى إدخال عنوان التوصيل بالتفصيل');
      return;
    }

    const ok = await sendOrderViaWhatsApp({
      full_name: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
    });

    if (ok && customer) {
      refreshOrders();
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay with fade animation */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            onClick={() => toggleCart(false)}
          />

          {/* Cart panel with slide animation */}
          <motion.div
            className="absolute inset-y-0 left-0 w-full max-w-md bg-[#F7F3E9] shadow-2xl flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cartVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#D1A94F]/35 flex justify-between items-center bg-[#2B3318] text-[#F7F3E9]">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold">سلة التسوق</h2>
                {isCustomerSystemEnabled && (
                  customer ? (
                    <span className="text-[11px] font-bold bg-[#3A4522] text-[#E3C778] px-2.5 py-0.5 rounded-full border border-[#D1A94F]/40">
                      مرحباً {customer.full_name.split(' ')[0]}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuthModal('login')}
                      className="text-[11px] font-bold bg-[#3A4522] hover:bg-[#D1A94F] hover:text-[#2B3318] text-[#E3C778] px-2.5 py-1 rounded-lg border border-[#D1A94F]/40 transition-colors"
                    >
                      تسجيل الدخول
                    </button>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleCart(false)}
                className="text-[#F7F3E9]/80 hover:text-[#E3C778] transition-colors"
                aria-label="إغلاق السلة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart items + Delivery Info Form */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingCart className="w-16 h-16 text-[#3A4522]/30 mb-4" />
                  <h3 className="text-lg font-medium text-[#2B3318]">سلة التسوق فارغة</h3>
                  <p className="mt-1 text-[#3A4522]/70">ابدأ بإضافة بعض المنتجات</p>
                </div>
              ) : (
                <>
                  <motion.ul className="space-y-3">
                    {cartItems.map((item, index) => {
                      const isZeroStock = item.track_stock && (item.stock_quantity ?? 0) <= 0;
                      return (
                        <motion.li
                          key={item.id}
                          className="flex items-center gap-3 p-3 border border-[#3A4522]/15 rounded-lg bg-white/90 hover:shadow-md hover:border-[#D1A94F] transition-all"
                          variants={itemVariants}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                        >
                          {item.imageUrl && (
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-[#3A4522]/15 shadow-sm">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#2B3318] text-sm">
                              {item.title}
                              {item.size && <span className="text-xs font-normal text-[#3A4522]/70 ml-1">({item.size})</span>}
                            </h3>
                            <p className="text-[#2B3318] font-bold text-sm mt-1">{item.price} ج</p>

                            {/* مؤشر المخزون للمنتج بالسلة */}
                            {item.track_stock && (
                              <div className="mt-1">
                                {isZeroStock ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    <span>⚠️ (0) مخزون متبقي (طلب مسبق)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    <span>المتاح بالمخزن: {item.stock_quantity}</span>
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center mt-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.quantity > 1) {
                                    updateQuantity(item.id, item.quantity - 1);
                                  } else {
                                    removeFromCart(item.id);
                                  }
                                }}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                aria-label="تقليل الكمية"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="mx-2 w-6 text-center font-bold text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, item.quantity + 1);
                                }}
                                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                aria-label="زيادة الكمية"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.id);
                            }}
                            className="text-[#B12704] hover:opacity-80 p-2"
                            aria-label="إزالة المنتج"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </motion.li>
                      );
                    })}
                  </motion.ul>

                  {/* Customer Checkout Delivery Info Card */}
                  {isCustomerSystemEnabled && (
                  <div className="bg-white rounded-xl border border-[#D1A94F]/45 p-4 shadow-sm space-y-3" dir="rtl">
                    <div className="flex items-center justify-between gap-2 border-b border-[#3A4522]/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#2B3318]" />
                        <h3 className="text-sm font-bold text-[#2B3318]">
                          بيانات العميل والتوصيل <span className="text-[#B12704]">*</span>
                        </h3>
                      </div>
                      {hasSavedInfo && !isEditingSavedInfo && (
                        <button
                          type="button"
                          onClick={() => setIsEditingSavedInfo(true)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#2B3318] bg-[#E3C778]/50 hover:bg-[#E3C778] px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      )}
                    </div>

                    {hasSavedInfo && !isEditingSavedInfo ? (
                      <div className="bg-[#F7F3E9]/80 rounded-lg p-3 border border-[#D1A94F]/30 space-y-1.5 text-xs text-[#2B3318]">
                        <div className="flex items-center gap-1.5 text-[#3A4522] font-bold mb-1">
                          <CheckCircle2 className="w-4 h-4 text-[#2B3318]" />
                          <span>بياناتك محفوظة وجاهزة للطلب</span>
                        </div>
                        <p className="font-bold text-sm">{fullName}</p>
                        <p className="font-mono font-semibold text-[#3A4522]" dir="ltr">{phone}</p>
                        <p className="text-[#3A4522]/90 leading-relaxed">{address}</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {hasSavedInfo && (
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#3A4522] bg-[#F7F3E9] px-2.5 py-1.5 rounded-lg border border-[#D1A94F]/25">
                            <span>يتم حفظ التعديلات تلقائياً للطلبات القادمة</span>
                            <button
                              type="button"
                              onClick={() => setIsEditingSavedInfo(false)}
                              className="text-[#2B3318] font-bold underline"
                            >
                              معاينة
                            </button>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-[#2B3318] mb-1">
                            الاسم بالكامل <span className="text-[#B12704]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => handleFieldUpdate(e.target.value, phone, address)}
                              placeholder="مثال: أحمد محمد"
                              className="w-full pr-8 pl-3 py-2 rounded-lg bg-[#F7F3E9] border border-[#3A4522]/25 text-[#2B3318] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                            />
                            <User className="w-4 h-4 text-[#3A4522]/60 absolute right-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#2B3318] mb-1">
                            رقم التليفون <span className="text-[#B12704]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              dir="ltr"
                              value={phone}
                              onChange={(e) => handleFieldUpdate(fullName, e.target.value, address)}
                              placeholder="01XXXXXXXXX"
                              className="w-full pr-8 pl-3 py-2 rounded-lg bg-[#F7F3E9] border border-[#3A4522]/25 text-[#2B3318] text-sm font-medium text-right focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                            />
                            <Phone className="w-4 h-4 text-[#3A4522]/60 absolute right-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#2B3318] mb-1">
                            عنوان التوصيل بالتفصيل <span className="text-[#B12704]">*</span>
                          </label>
                          <div className="relative">
                            <textarea
                              rows={2}
                              value={address}
                              onChange={(e) => handleFieldUpdate(fullName, phone, e.target.value)}
                              placeholder="المحافظة / المنطقة / الشارع / رقم العقار والشقة"
                              className="w-full pr-8 pl-3 py-2 rounded-lg bg-[#F7F3E9] border border-[#3A4522]/25 text-[#2B3318] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D1A94F] resize-none"
                            />
                            <MapPin className="w-4 h-4 text-[#3A4522]/60 absolute right-2.5 top-2.5" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formError && (
                      <div className="bg-[#B12704]/10 border border-[#B12704]/30 text-[#B12704] text-xs font-bold px-3 py-2 rounded-lg">
                        {formError}
                      </div>
                    )}

                    {!customer && (
                      <p className="text-[11px] text-[#3A4522]/80 leading-relaxed">
                        يمكنك الطلب مباشرة كزائر، أو{' '}
                        <button
                          type="button"
                          onClick={() => openAuthModal('login')}
                          className="text-[#2B3318] font-bold underline hover:text-[#B12704]"
                        >
                          تسجيل الدخول برقم التليفون
                        </button>{' '}
                        لمتابعة جميع طلباتك السابقة.
                      </p>
                    )}
                  </div>
                  )}
                </>
              )}
            </div>

            {/* Footer with total and checkout button */}
            {cartItems.length > 0 && (
              <div className="border-t border-[#D1A94F]/30 p-4 sm:p-5 bg-[#F7F3E9] space-y-3">
                <div className="flex justify-between items-center bg-white/95 rounded-lg p-3.5 shadow-sm border border-[#D1A94F]/30">
                  <span className="text-[#2B3318] font-bold text-base sm:text-lg">المجموع</span>
                  <span className="text-[#2B3318] font-bold text-xl sm:text-2xl">{cartTotal} ج</span>
                </div>

                {/* إشعار المخزون الصفري للعميل مع التأكيد على إتاحة إتمام الطلب */}
                {cartItems.some(i => i.track_stock && (i.stock_quantity ?? 0) <= 0) && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-right">
                    <p className="text-amber-900 text-xs font-semibold flex items-center gap-1.5 mb-0.5">
                      <span>⚠️ يتضمن طلبك منتجاً برصيد (0) مخزون متبقي</span>
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      الطلب متاح ونشط بشكل كامل! يمكنك إتمام طلبك الآن وسيقوم فريق المتجر بتوفير الكمية المطلوبة فوراً.
                    </p>
                  </div>
                )}

                <div className="bg-[#3A4522]/10 border border-[#3A4522]/20 rounded-lg p-2 text-center">
                  <p className="text-[#2B3318] text-xs font-medium">
                    يتم تقدير تكلفة الشحن حسب المنطقة
                  </p>
                </div>

                {/* زر إتمام الطلب - نشط دائماً حتى عند مخزون 0 */}
                <button
                  type="button"
                  disabled={isSubmittingOrder}
                  onClick={() => handleCheckoutSubmit()}
                  className="w-full bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] border border-[#D1A94F] py-3.5 rounded-xl transition-all font-bold text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isSubmittingOrder ? 'جاري تسجيل الطلب...' : 'إتمام الطلب عبر واتساب'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Cart;
