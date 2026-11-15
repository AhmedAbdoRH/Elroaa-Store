import { X, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

// CartItem interface is defined in CartContext

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
  exit: () => ({  // Removed unused 'i' parameter
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
    sendOrderViaWhatsApp
  } = useCart();
  
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
            <div className="p-5 border-b border-[#D1A94F]/35 flex justify-between items-center bg-[#2B3318] text-[#F7F3E9]">
              <h2 className="text-2xl font-bold">سلة التسوق</h2>
              <button
                onClick={() => toggleCart(false)}
                className="text-[#F7F3E9]/80 hover:text-[#E3C778] transition-colors"
                aria-label="إغلاق السلة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingCart className="w-16 h-16 text-[#3A4522]/30 mb-4" />
                  <h3 className="text-lg font-medium text-[#2B3318]">سلة التسوق فارغة</h3>
                  <p className="mt-1 text-[#3A4522]/70">ابدأ بإضافة بعض المنتجات</p>
                </div>
              ) : (
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
                          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-[#3A4522]/15 shadow-sm">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        <div className="flex-1">
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
              )}
            </div>

            {/* Footer with total and checkout button */}
            {cartItems.length > 0 && (
              <div className="border-t border-[#D1A94F]/30 p-5 bg-[#F7F3E9] space-y-4">
                <div className="flex justify-between items-center bg-white/95 rounded-lg p-4 shadow-sm border border-[#D1A94F]/30">
                  <span className="text-[#2B3318] font-bold text-lg">المجموع</span>
                  <span className="text-[#2B3318] font-bold text-2xl">{cartTotal} ج</span>
                </div>

                {/* إشعار المخزون الصفري للعميل مع التأكيد على إتاحة إتمام الطلب */}
                {cartItems.some(i => i.track_stock && (i.stock_quantity ?? 0) <= 0) && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-right">
                    <p className="text-amber-900 text-xs font-semibold flex items-center gap-1.5 mb-1">
                      <span>⚠️ يتضمن طلبك منتجاً برصيد (0) مخزون متبقي</span>
                    </p>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      الطلب متاح ونشط بشكل كامل! يمكنك إتمام طلبك الآن وسيقوم فريق المتجر بتوفير وتجهيز الكمية المطلوبة فوراً.
                    </p>
                  </div>
                )}

                <div className="bg-[#3A4522]/10 border border-[#3A4522]/20 rounded-lg p-2.5 text-center">
                  <p className="text-[#2B3318] text-xs font-medium">
                    يتم تقدير تكلفة الشحن حسب المنطقة
                  </p>
                </div>

                {/* زر إتمام الطلب - نشط دائماً حتى عند مخزون 0 حسب الشرط 3 */}
                <button
                  type="button"
                  onClick={sendOrderViaWhatsApp}
                  className="w-full bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] border border-[#D1A94F] py-3.5 rounded-xl transition-all font-bold text-base shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>إتمام الطلب عبر واتساب</span>
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
