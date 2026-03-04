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
    x: '100%',
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
    x: '100%',
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
            className="absolute inset-y-0 right-0 w-full max-w-md bg-gradient-to-b from-gray-50 to-white shadow-2xl flex flex-col"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={cartVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-transparent">
              <h2 className="text-2xl font-bold text-gray-800">سلة التسوق</h2>
              <button
                onClick={() => toggleCart(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="إغلاق السلة"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">سلة التسوق فارغة</h3>
                  <p className="mt-1 text-gray-500">ابدأ بإضافة بعض المنتجات</p>
                </div>
              ) : (
                <motion.ul className="space-y-3">
                  {cartItems.map((item, index) => (
                    <motion.li
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md hover:border-blue-200 transition-all"
                      variants={itemVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      {item.imageUrl && (
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {item.title}
                          {item.size && <span className="text-xs font-normal text-gray-500 ml-1">({item.size})</span>}
                        </h3>
                        <p className="text-blue-600 font-bold text-sm mt-1">{item.price} ج</p>
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
                          <span className="mx-2 w-6 text-center">{item.quantity}</span>
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
                        className="text-red-500 hover:text-red-700 p-2"
                        aria-label="إزالة المنتج"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>

            {/* Footer with total and checkout button */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-5 bg-gradient-to-t from-gray-50 to-transparent space-y-4">
                <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm">
                  <span className="text-gray-700 font-bold text-lg">المجموع</span>
                  <span className="text-blue-600 font-bold text-2xl">{cartTotal} ج</span>
                </div>
                <button
                  onClick={sendOrderViaWhatsApp}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-bold shadow-md hover:shadow-lg"
                >
                  إتمام الطلب
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
