import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, Banknote, ShieldCheck, Sparkles, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Service } from '../types/database';

interface OfferTickerItem {
  id: string;
  productId?: string;
  title: string;
  discountPct?: number;
  highlightText?: string;
}

function computeProductDiscountPct(service: Service): number {
  if (service.has_weight_pricing) {
    const base = Number(service.price_per_kg || 0);
    const sale = Number(service.sale_price_per_kg || 0);
    if (base > 0 && sale > 0 && sale < base) {
      return Math.round(((base - sale) / base) * 100);
    }
  }

  const basePrice = Number(service.price || 0);
  const salePrice = Number(service.sale_price || 0);
  if (basePrice > 0 && salePrice > 0 && salePrice < basePrice) {
    return Math.round(((basePrice - salePrice) / basePrice) * 100);
  }

  if (Array.isArray(service.sizes) && service.sizes.length > 0) {
    let bestPct = 0;
    for (const size of service.sizes) {
      const sBase = Number(size.price || 0);
      const sSale = Number(size.sale_price || 0);
      if (sBase > 0 && sSale > 0 && sSale < sBase) {
        const pct = Math.round(((sBase - sSale) / sBase) * 100);
        if (pct > bestPct) bestPct = pct;
      }
    }
    return bestPct;
  }

  return 0;
}

const TRUST_BADGE_ITEMS = [
  { id: 'delivery', label: 'توصيل سريع', Icon: Truck, iconColor: 'text-[#B12704]' },
  { id: 'returns', label: 'إرجاع خلال 14 يوم', Icon: RotateCcw, iconColor: 'text-[#3A4522]' },
  { id: 'cod', label: 'الدفع عند الاستلام', Icon: Banknote, iconColor: 'text-[#2B3318]' },
  { id: 'quality', label: 'جودة طبيعية مضمونة 100%', Icon: ShieldCheck, iconColor: 'text-[#3A4522]' },
  { id: 'fresh', label: 'أجود أنواع العطارة والتوابل', Icon: Sparkles, iconColor: 'text-[#D1A94F]' },
] as const;

export default function InfiniteMarqueeStrip() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('services')
      .select('id, title, price, sale_price, has_weight_pricing, price_per_kg, sale_price_per_kg, is_featured, is_best_seller, is_available, sizes:product_sizes(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setServices(data as Service[]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const offerItems = useMemo<OfferTickerItem[]>(() => {
    const available = services.filter((s) => s.is_available !== false);

    const discounted: OfferTickerItem[] = [];
    const featuredOrPopular: OfferTickerItem[] = [];

    for (const item of available) {
      const pct = computeProductDiscountPct(item);
      if (pct > 0) {
        discounted.push({
          id: `disc-${item.id}`,
          productId: String(item.id),
          title: item.title,
          discountPct: pct,
        });
      } else if (item.is_featured || item.is_best_seller) {
        featuredOrPopular.push({
          id: `feat-${item.id}`,
          productId: String(item.id),
          title: item.title,
          highlightText: item.is_best_seller ? 'الأكثر مبيعاً' : 'عرض مميز',
        });
      }
    }

    const combined: OfferTickerItem[] = [
      ...discounted.slice(0, 12),
      ...featuredOrPopular.slice(0, Math.max(0, 10 - discounted.length)),
    ];

    if (combined.length === 0) {
      return [
        { id: 'brand-welcome', title: 'أهلاً بكم في متجر الرؤى للعطارة والتوابل الطبيعية' },
        { id: 'brand-spices', title: 'أعشاب وتوابل طازجة منتقاة بعناية', highlightText: 'جودة عالية' },
        { id: 'brand-oils', title: 'زيوت طبيعية معصورة على البارد وعسل سدر أصلي', highlightText: 'طبيعي 100%' },
        { id: 'brand-offers', title: 'اطلب الآن عبر السلة أو واتساب بأفضل الأسعار', highlightText: 'عروض يومية' },
      ];
    }

    return [
      { id: 'brand-welcome', title: 'مرحباً بكم في متجر الرؤى' },
      ...combined,
    ];
  }, [services]);

  const repeatedOffers = useMemo(() => {
    const minItemsPerTrack = 10;
    const repeats = Math.max(2, Math.ceil(minItemsPerTrack / Math.max(1, offerItems.length)));
    const result: OfferTickerItem[] = [];
    for (let r = 0; r < repeats; r++) {
      for (const item of offerItems) {
        result.push({ ...item, id: `${item.id}-r${r}` });
      }
    }
    return result;
  }, [offerItems]);

  const repeatedTrustBadges = useMemo(() => {
    const repeats = 3;
    const result: Array<(typeof TRUST_BADGE_ITEMS)[number] & { uid: string }> = [];
    for (let r = 0; r < repeats; r++) {
      for (const item of TRUST_BADGE_ITEMS) {
        result.push({ ...item, uid: `${item.id}-r${r}` });
      }
    }
    return result;
  }, []);

  const renderOffersTrack = (trackKey: string, ariaHidden?: boolean) => (
    <div
      key={trackKey}
      aria-hidden={ariaHidden}
      className="flex items-center shrink-0 gap-6 sm:gap-8 px-4"
    >
      {repeatedOffers.map((item) => {
        const inner = (
          <span
            dir="rtl"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold whitespace-nowrap text-[#F7F3E9]"
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3C778] fill-[#D1A94F] shrink-0" />
            <span>{item.title}</span>
            {typeof item.discountPct === 'number' && item.discountPct > 0 && (
              <span className="text-[#E3C778] font-extrabold tabular-nums">
                -{item.discountPct}%
              </span>
            )}
            {item.highlightText && (
              <span className="text-[#E3C778] text-[11px] sm:text-xs font-semibold">
                ({item.highlightText})
              </span>
            )}
          </span>
        );

        return item.productId ? (
          <Link
            key={`${trackKey}-${item.id}`}
            to={`/product/${item.productId}`}
            tabIndex={ariaHidden ? -1 : undefined}
            className="hover:opacity-85 transition-opacity"
          >
            {inner}
          </Link>
        ) : (
          <span key={`${trackKey}-${item.id}`}>{inner}</span>
        );
      })}
    </div>
  );

  const renderTrustTrack = (trackKey: string, ariaHidden?: boolean) => (
    <div
      key={trackKey}
      aria-hidden={ariaHidden}
      className="flex items-center shrink-0 gap-3 px-2"
    >
      {repeatedTrustBadges.map((badge) => {
        const Icon = badge.Icon;
        return (
          <div
            key={`${trackKey}-${badge.uid}`}
            dir="rtl"
            className="inline-flex items-center gap-1.5 bg-[#FFFDF8] text-[#2B3318] border border-[#3A4522]/15 rounded-full px-3.5 py-1.5 shadow-sm whitespace-nowrap text-xs sm:text-sm font-bold"
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${badge.iconColor}`} />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      aria-label="شريط العروض والمميزات المتحرك"
      className="w-full py-2"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      <div className="container mx-auto px-3 sm:px-4 space-y-2.5">
        {/* الشريط الأول: شريط العروض والخصومات بلون زيتوني */}
        <div
          dir="ltr"
          className="marquee-container relative w-full overflow-hidden rounded-full bg-[#3A4522] border border-[#D1A94F]/35 shadow-sm py-2 sm:py-2.5"
        >
          <div
            className="animate-marquee-rtl"
            style={{ ['--marquee-duration' as string]: `${Math.max(95, Math.round(repeatedOffers.length * 4.5))}s` }}
          >
            {renderOffersTrack('offers-a')}
            {renderOffersTrack('offers-b', true)}
          </div>
        </div>

        {/* الشريط الثاني: شريط مزايا المتجر وضمان الجودة */}
        <div
          dir="ltr"
          className="marquee-container relative w-full overflow-hidden py-0.5"
        >
          <div
            className="animate-marquee-ltr"
            style={{ ['--marquee-duration' as string]: '34s' }}
          >
            {renderTrustTrack('trust-a')}
            {renderTrustTrack('trust-b', true)}
          </div>
        </div>
      </div>
    </section>
  );
}
