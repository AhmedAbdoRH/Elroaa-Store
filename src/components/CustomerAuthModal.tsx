import React, { useState, useEffect } from 'react';
import { X, Phone, Lock, User, MapPin, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useCustomer } from '../contexts/CustomerContext';
import { checkCustomerByPhone, normalizePhone } from '../utils/customerManager';

export default function CustomerAuthModal() {
  const {
    isCustomerSystemEnabled,
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    login,
    registerOrClaim,
    deliveryInfo,
  } = useCustomer();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guestMatchName, setGuestMatchName] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setError(null);
      setPassword('');
      setGuestMatchName(null);
      if (deliveryInfo.phone && !phone) {
        setPhone(deliveryInfo.phone);
      }
      if (deliveryInfo.full_name && !fullName) {
        setFullName(deliveryInfo.full_name);
      }
      if (deliveryInfo.address && !address) {
        setAddress(deliveryInfo.address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthModalOpen, authModalMode]);

  // Detect if phone number has previous guest orders without password
  useEffect(() => {
    if (!isAuthModalOpen || mode !== 'register') {
      setGuestMatchName(null);
      return;
    }
    const clean = normalizePhone(phone);
    if (clean.length < 8) {
      setGuestMatchName(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      const existing = await checkCustomerByPhone(clean);
      if (cancelled) return;
      if (existing && !existing.has_password) {
        setGuestMatchName(existing.full_name);
        if (!fullName) setFullName(existing.full_name);
        if (!address && existing.address) setAddress(existing.address);
      } else {
        setGuestMatchName(null);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phone, mode, isAuthModalOpen, fullName, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(phone, password);
        if (res.ok) {
          toast.success('تم تسجيل الدخول بنجاح');
          closeAuthModal();
          return;
        }
        if (res.needsClaim) {
          setMode('register');
          setError(res.error || null);
          return;
        }
        setError(res.error || 'تعذر تسجيل الدخول');
      } else {
        const res = await registerOrClaim({
          phone,
          password,
          full_name: fullName,
          address,
        });
        if (res.ok) {
          toast.success(
            res.wasClaimed
              ? 'تم تفعيل حسابك وربطه بطلباتك السابقة بنجاح'
              : 'تم إنشاء حسابك وتسجيل الدخول بنجاح'
          );
          closeAuthModal();
          return;
        }
        setError(res.error || 'تعذر إنشاء الحساب');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isCustomerSystemEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          onClick={closeAuthModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#F7F3E9] rounded-2xl shadow-2xl border border-[#D1A94F]/50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#2B3318] text-[#F7F3E9] px-6 py-4 flex items-center justify-between border-b border-[#D1A94F]/35">
              <div>
                <h2 className="text-lg font-bold">حساب العميل</h2>
                <p className="text-xs text-[#E3C778] mt-0.5">
                  تسجيل الدخول برقم التليفون بدون تأكيد
                </p>
              </div>
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-[#F7F3E9]/80 hover:text-[#E3C778] p-1.5 rounded-lg transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Segmented Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#2B3318]/10 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-[#2B3318] text-[#F7F3E9] shadow-sm'
                      : 'text-[#2B3318] hover:bg-[#2B3318]/10'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    mode === 'register'
                      ? 'bg-[#2B3318] text-[#F7F3E9] shadow-sm'
                      : 'text-[#2B3318] hover:bg-[#2B3318]/10'
                  }`}
                >
                  حساب جديد / تفعيل
                </button>
              </div>

              {guestMatchName && mode === 'register' && (
                <div className="mb-4 p-3 rounded-xl bg-[#E3C778]/35 border border-[#D1A94F] text-xs text-[#2B3318] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2B3318] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    مرحباً <strong>{guestMatchName}</strong>! وجدنا ملفك وطلباتك السابقة لهذا الرقم. اكتب أي كلمة مرور لتفعيل حسابك وعرض طلباتك فوراً.
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-[#B12704]/10 border border-[#B12704]/30 text-xs font-semibold text-[#B12704] leading-relaxed">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                    رقم التليفون
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#3A4522]/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 01001234567"
                      required
                      dir="ltr"
                      className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2.5 pr-10 pl-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                    كلمة المرور (أي أرقام أو حروف بدون شروط)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#3A4522]/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="اكتب كلمة المرور"
                      required
                      className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2.5 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3A4522]/70 hover:text-[#2B3318]"
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                        الاسم بالكامل
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#3A4522]/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="اكتب اسمك"
                          required={!guestMatchName}
                          className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                        العنوان بالتفصيل
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-[#3A4522]/70 absolute right-3.5 top-3" />
                        <textarea
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="المدينة / الشارع / علامة مميزة"
                          className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D1A94F] resize-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] border border-[#D1A94F] font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-60"
                >
                  {submitting
                    ? 'جاري التنفيذ...'
                    : mode === 'login'
                      ? 'دخول إلى حسابي'
                      : guestMatchName
                        ? 'تفعيل الحساب وربط الطلبات'
                        : 'إنشاء الحساب والدخول'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
