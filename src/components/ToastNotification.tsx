import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';

interface ToastNotificationProps {
  show: boolean;
  productName?: string;
  onViewCart?: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  show, 
  productName = 'المنتج',
  onViewCart 
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">
              تمت إضافة {productName} للسلة ✅
            </span>
            {onViewCart && (
              <button
                onClick={onViewCart}
                className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                عرض السلة
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
