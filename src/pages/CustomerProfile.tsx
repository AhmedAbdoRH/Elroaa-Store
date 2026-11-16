import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  User,
  Phone,
  MapPin,
  Package,
  LogOut,
  Save,
  Lock,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCustomer } from '../contexts/CustomerContext';
import type { OrderStatus } from '../types/database';

const STATUS_LABELS: Record<OrderStatus, { label: string; colorClass: string }> = {
  pending: { label: 'قيد الانتظار', colorClass: 'text-[#3A4522]' },
  processing: { label: 'جاري التجهيز', colorClass: 'text-[#D1A94F]' },
  completed: { label: 'مكتمل', colorClass: 'text-[#2B3318]' },
  cancelled: { label: 'ملغي', colorClass: 'text-[#B12704]' },
};

export default function CustomerProfile() {
  const {
    isCustomerSystemEnabled,
    customer,
    orders,
    isLoadingOrders,
    openAuthModal,
    updateProfile,
    logout,
    refreshOrders,
  } = useCustomer();

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (customer) {
      setFullName(customer.full_name || '');
      setAddress(customer.address || '');
    }
  }, [customer]);

  if (!isCustomerSystemEnabled) {
    return <Navigate to="/" replace />;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({
        full_name: fullName,
        address,
        newPassword: newPassword.trim() || undefined,
      });
      if (res.ok) {
        toast.success('تم تحديث بياناتك وحفظها بنجاح');
        setNewPassword('');
      } else {
        toast.error(res.error || 'تعذر تحديث البيانات');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#F7F3E9] pt-[128px] md:pt-28 pb-16 px-4">
        <Helmet>
          <title>حسابي | شركة الرؤى للتجارة والتوريدات والعطارة</title>
        </Helmet>
        <div className="max-w-lg mx-auto bg-white/90 rounded-2xl border border-[#D1A94F]/45 shadow-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3318] text-[#E3C778] flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#2B3318] mb-2">الملف الشخصي للعميل</h1>
          <p className="text-sm text-[#3A4522]/85 leading-relaxed mb-6">
            سجل الدخول برقم تليفونك لعرض بياناتك المحفوظة ومتابعة سجل طلباتك السابقة في أي وقت، أو فعّل حسابك إذا طلبت كزائر من قبل.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-6 py-3 rounded-xl bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] font-bold transition-colors border border-[#D1A94F]"
            >
              تسجيل الدخول برقم التليفون
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="px-6 py-3 rounded-xl bg-[#2B3318] hover:bg-[#3A4522] text-[#F7F3E9] font-bold transition-colors"
            >
              حساب جديد / تفعيل
            </button>
          </div>
          <div className="mt-6 pt-5 border-t border-[#3A4522]/15">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2B3318] hover:text-[#3A4522]"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمتجر</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3E9] pt-[128px] md:pt-28 pb-16 px-4">
      <Helmet>
        <title>{`حسابي - ${customer.full_name} | شركة الرؤى`}</title>
      </Helmet>

      <div className="container mx-auto max-w-5xl space-y-8">
        {/* Top Profile Summary Bar */}
        <div className="bg-[#2B3318] text-[#F7F3E9] rounded-2xl p-6 border border-[#D1A94F]/40 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E3C778] text-[#2B3318] flex items-center justify-center font-bold text-xl flex-shrink-0">
              {customer.full_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{customer.full_name}</h1>
              <div className="flex items-center gap-2 text-sm text-[#E3C778] mt-1 tabular-nums">
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr">{customer.phone}</span>
                <span aria-hidden="true">·</span>
                <span>{orders.length} طلبات</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-[#3A4522] hover:bg-[#D1A94F] hover:text-[#2B3318] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              تصفح المتجر
            </Link>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-[#B12704]/90 hover:bg-[#B12704] text-white text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Profile Edit Form */}
          <div className="lg:col-span-5 bg-white/90 rounded-2xl border border-[#3A4522]/15 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#2B3318] mb-1">بياناتي المحفوظة</h2>
            <p className="text-xs text-[#3A4522]/75 mb-5">
              يتم استخدام هذه البيانات تلقائياً لتسهيل طلباتك القادمة.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                  رقم التليفون (معرّف الحساب)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#3A4522]/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customer.phone}
                    readOnly
                    dir="ltr"
                    className="w-full bg-[#F7F3E9] text-[#2B3318]/80 border border-[#3A4522]/20 rounded-xl py-2.5 pr-10 pl-3 text-sm text-right cursor-not-allowed tabular-nums"
                  />
                </div>
              </div>

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
                    required
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
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="أضف عنوان التوصيل"
                    className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D1A94F] resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B3318] mb-1.5">
                  تغيير كلمة المرور (اختياري)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#3A4522]/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                    className="w-full bg-white text-[#2B3318] border border-[#3A4522]/25 rounded-xl py-2.5 pr-10 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D1A94F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] border border-[#D1A94F] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
              </button>
            </form>
          </div>

          {/* Orders History */}
          <div className="lg:col-span-7 bg-white/90 rounded-2xl border border-[#3A4522]/15 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#3A4522]/15">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2B3318]" />
                <h2 className="text-lg font-bold text-[#2B3318]">سجل طلباتي السابقة</h2>
              </div>
              <button
                type="button"
                onClick={refreshOrders}
                disabled={isLoadingOrders}
                className="text-xs font-semibold text-[#3A4522] hover:text-[#2B3318] flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>

            {isLoadingOrders && orders.length === 0 ? (
              <div className="py-12 text-center text-sm text-[#3A4522]/70">
                جاري تحميل طلباتك...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="w-12 h-12 mx-auto text-[#3A4522]/30 mb-3" />
                <p className="text-base font-bold text-[#2B3318]">لا توجد طلبات مسجلة بعد</p>
                <p className="text-xs text-[#3A4522]/75 mt-1 mb-5">
                  عند إتمام أي طلب من المتجر سيظهر هنا فوراً بكل تفاصيله.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] text-sm font-bold transition-colors"
                >
                  تصفح المنتجات الآن
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusMeta = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  return (
                    <div
                      key={order.id}
                      className="rounded-xl border border-[#3A4522]/15 bg-[#F7F3E9]/60 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#3A4522]/10 text-xs">
                        <div className="flex items-center gap-2 text-[#2B3318] font-bold">
                          <span className="font-mono tabular-nums">#{order.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-[#3A4522]/80">
                            {new Date(order.created_at).toLocaleString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className={`font-bold ${statusMeta.colorClass}`}>
                          {statusMeta.label}
                        </span>
                      </div>

                      {order.customer_address && (
                        <p className="text-xs text-[#3A4522]/85 mt-2.5 mb-2 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D1A94F] flex-shrink-0 mt-0.5" />
                          <span>{order.customer_address}</span>
                        </p>
                      )}

                      <div className="space-y-1.5 mt-2">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-white/85 rounded-lg px-3 py-2 border border-[#3A4522]/10"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-[#2B3318] truncate">
                                {item.title}
                              </span>
                              {item.size && (
                                <span className="text-[#3A4522]/70">({item.size})</span>
                              )}
                            </div>
                            <span className="font-bold text-[#2B3318] tabular-nums whitespace-nowrap mr-2">
                              {item.quantity} × {item.price} ج
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#3A4522]/10 text-sm font-bold text-[#2B3318]">
                        <span>الإجمالي</span>
                        <span className="tabular-nums text-base">{order.total} ج</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
