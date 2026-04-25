import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart, X } from 'lucide-react';

interface ToastNotificationProps {
  show: boolean;
  productName?: string;
  onViewCart?: () => void;
  onClose?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  show, 
  productName = 'المنتج',
  onViewCart,
  onClose
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto z-50"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-xl shadow-2xl flex items-center justify-between gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm md:text-base truncate">
                تمت إضافة {productName} للسلة ✅
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onViewCart && (
                <button
                  onClick={onViewCart}
                  className="bg-white/20 hover:bg-white/30 px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
                  <span>عرض السلة</span>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
