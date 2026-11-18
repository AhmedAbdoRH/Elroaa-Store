import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import type { ProductSize } from '../types/database';
import { getProductInventory, subscribeToInventory } from '../utils/inventoryManager';

interface ProductCardProps {
  title: string;
  description: string;
  imageUrl: string;
  price?: number | null;
  salePrice?: number | null;
  id: string | number;
  has_multiple_sizes?: boolean;
  has_weight_pricing?: boolean;
  price_per_kg?: number | null;
  sale_price_per_kg?: number | null;
  sizes?: ProductSize[];
  track_stock?: boolean;
  stock_quantity?: number | null;
}

export default function ProductCard({
  title,
  description,
  imageUrl,
  price,
  salePrice,
  id,
  has_multiple_sizes,
  has_weight_pricing,
  price_per_kg,
  sale_price_per_kg,
  sizes,
  track_stock,
  stock_quantity
}: ProductCardProps) {

  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Smart pricing system with intelligent fallbacks
  const { displayPrice, displaySalePrice, priceRange, hasMultiplePrices, pricingStrategy } = useMemo(() => {
    // Check for weight pricing first
    if (has_weight_pricing && price_per_kg) {
      return {
        displayPrice: price_per_kg,
        displaySalePrice: sale_price_per_kg,
        priceRange: null,
        hasMultiplePrices: false,
        pricingStrategy: 'weight'
      };
    }

    // Helper function to generate smart pricing based on product name
    const generateSmartPricing = (productTitle: string) => {
      const title = productTitle.toLowerCase();

      // Premium products (German, Memory, Deluxe)
      if (title.includes('ألماني') || title.includes('الماني') || title.includes('ميموري') || title.includes('ديلوكس')) {
        return { min: 8000, max: 15000, category: 'premium' };
      }

      // Mid-range products (Super, Mega, Omega)
      if (title.includes('سوبر') || title.includes('ميجا') || title.includes('اوميجا') || title.includes('اكسترا')) {
        return { min: 5000, max: 9000, category: 'mid-range' };
      }

      // Standard products (Grand, Fix)
      if (title.includes('جراند') || title.includes('فيكس')) {
        return { min: 3000, max: 6000, category: 'standard' };
      }

      // Default pricing
      return { min: 2000, max: 5000, category: 'basic' };
    };

    if (has_multiple_sizes && sizes && sizes.length > 0) {
      const validPrices = sizes
        .map(s => parseFloat(s.price as any))
        .filter(p => !isNaN(p) && p > 0);

      const validSalePrices = sizes
        .map(s => parseFloat(s.sale_price as any))
        .filter(p => !isNaN(p) && p > 0);

      const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
      const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
      const minSalePrice = validSalePrices.length > 0 ? Math.min(...validSalePrices) : null;
      const maxSalePrice = validSalePrices.length > 0 ? Math.max(...validSalePrices) : null;

      // If we have sale prices, use the minimum sale price
      if (minSalePrice && maxSalePrice) {
        return {
          displayPrice: minPrice,
          displaySalePrice: minSalePrice,
          priceRange: null,
          hasMultiplePrices: minSalePrice !== maxSalePrice,
          pricingStrategy: 'database'
        };
      }

      // If we have regular prices, use the minimum price
      if (minPrice && maxPrice) {
        return {
          displayPrice: minPrice,
          displaySalePrice: null,
          priceRange: null,
          hasMultiplePrices: minPrice !== maxPrice,
          pricingStrategy: 'database'
        };
      }

      // Smart fallback pricing for multiple sizes - use minimum price
      const smartPricing = generateSmartPricing(title);
      return {
        displayPrice: smartPricing.min,
        displaySalePrice: null,
        priceRange: null,
        hasMultiplePrices: true,
        pricingStrategy: 'smart-fallback'
      };
    }

    // Single price products
    const priceAsFloat = price ? parseFloat(price as any) : null;
    const salePriceAsFloat = salePrice ? parseFloat(salePrice as any) : null;

    if (priceAsFloat || salePriceAsFloat) {
      return {
        displayPrice: priceAsFloat,
        displaySalePrice: salePriceAsFloat,
        priceRange: null,
        hasMultiplePrices: false,
        pricingStrategy: 'database'
      };
    }

    // Smart fallback for single price products
    const smartPricing = generateSmartPricing(title);
    return {
      displayPrice: smartPricing.min,
      displaySalePrice: null,
      priceRange: null,
      hasMultiplePrices: false,
      pricingStrategy: 'smart-fallback'
    };
  }, [has_multiple_sizes, sizes, price, salePrice, title, has_weight_pricing, price_per_kg, sale_price_per_kg]);

  const [inventoryState, setInventoryState] = useState(() => getProductInventory(id));

  useEffect(() => {
    setInventoryState(getProductInventory(id));
    return subscribeToInventory(() => {
      setInventoryState(getProductInventory(id));
    });
  }, [id]);

  const isTrackingStock = track_stock !== undefined ? track_stock : inventoryState.track_stock;
  const stockQty = isTrackingStock
    ? (stock_quantity !== undefined && stock_quantity !== null ? stock_quantity : (inventoryState.stock_quantity ?? 0))
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    // For products with multiple sizes, use the minimum price
    const cartPrice = has_multiple_sizes && sizes && sizes.length > 0
      ? (displaySalePrice || displayPrice || 0)
      : (displaySalePrice || displayPrice || 0);

    let sizeLabel = undefined;
    if (has_weight_pricing) {
      sizeLabel = '1000 جم';
    }

    addToCart({
      productId: String(id),
      title,
      price: cartPrice.toString(),
      numericPrice: parseFloat(cartPrice.toString()),
      imageUrl,
      size: sizeLabel,
      track_stock: isTrackingStock,
      stock_quantity: stockQty
    });

    setIsAdded(true);

    setTimeout(() => {
      setIsAdding(false);
      setTimeout(() => setIsAdded(false), 2000);
    }, 1000);
  };

  return (
    <div className="group relative bg-[#F7F3E9] rounded-lg sm:rounded-xl border border-[#3A4522]/15 hover:border-[#D1A94F] overflow-hidden transition-all duration-150 sm:hover:scale-[1.02] hover:shadow-lg shadow-sm flex flex-col justify-between">
      <Link to={`/product/${id}`} className="block">
        <div className="relative aspect-square sm:aspect-[4/3] w-full bg-[#2B3318]/5">
          <img
            src={imageUrl || '/favicon.png'}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.endsWith('/favicon.png')) {
                target.src = '/favicon.png';
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F3E9]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </div>
        <div className="p-1.5 sm:p-4 pb-1 sm:pb-2">
          <h3 className="text-[11px] sm:text-sm md:text-base font-bold mb-1 text-[#2B3318] flex items-start gap-1 leading-tight sm:leading-snug min-h-[1.9rem] sm:min-h-0">
            <span className="line-clamp-2 flex-1">{title}</span>
            <Sparkles className="hidden sm:inline-block h-3.5 w-3.5 text-[#D1A94F] shrink-0 mt-0.5" />
          </h3>
          {description && (
            <p className="hidden sm:line-clamp-2 text-xs sm:text-sm text-[#3A4522]/80 mb-2">
              {description}
            </p>
          )}

          {/* مؤشر المخزون المتاح للعميل بوضوح */}
          {isTrackingStock && (
            <div className="mb-1 sm:mb-2">
              {stockQty === 0 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-600 animate-pulse"></span>
                  <span>(0) متبقي</span>
                </span>
              ) : stockQty && stockQty <= 5 ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-500/20">
                  <span>متبقي {stockQty}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                  <span>المخزون: {stockQty}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="px-1.5 sm:px-4 pb-2 sm:pb-4 pt-0.5">
        <div className="flex justify-between items-end gap-1 sm:gap-2">
          <div className="flex flex-col items-end flex-1 min-w-0">
            {has_weight_pricing ? (
              <>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <span className={`font-bold text-xs sm:text-base md:text-lg tabular-nums ${displaySalePrice ? 'text-[#B12704]' : 'text-[#2B3318]'}`}>
                      {((displaySalePrice || displayPrice || 0) / 10).toFixed(1)}
                    </span>
                    <span className={`font-bold text-[10px] sm:text-base ${displaySalePrice ? 'text-[#B12704]' : 'text-[#2B3318]'}`}>ج</span>
                  </div>
                  <span className="text-[9px] sm:text-xs text-[#3A4522]/55 leading-none">/100 جم</span>
                </div>
                {displaySalePrice && displayPrice && (
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5">
                    <span className="text-[9px] sm:text-xs text-[#3A4522]/45 line-through tabular-nums">{((displayPrice || 0) / 10).toFixed(1)}</span>
                    <span className="text-[9px] sm:text-xs text-[#3A4522]/45 line-through">ج</span>
                  </div>
                )}
              </>
            ) : has_multiple_sizes && (displayPrice || displaySalePrice) ? (
              <>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className={`font-bold text-xs sm:text-base md:text-lg tabular-nums ${displaySalePrice ? 'text-[#B12704]' : 'text-[#2B3318]'}`}>
                    {displaySalePrice || displayPrice}
                  </span>
                  <span className={`font-bold text-[10px] sm:text-base ${displaySalePrice ? 'text-[#B12704]' : 'text-[#2B3318]'}`}>ج</span>
                </div>
                {pricingStrategy === 'smart-fallback' || hasMultiplePrices ? (
                  <span className="text-[9px] sm:text-xs text-[#3A4522]/60 leading-none">ابتداءً من</span>
                ) : (
                  <span className="text-[9px] sm:text-xs text-[#3A4522]/60 leading-none">سعر موحد</span>
                )}
              </>
            ) : displaySalePrice ? (
              <>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="font-bold text-xs sm:text-base md:text-lg text-[#B12704] tabular-nums">{displaySalePrice}</span>
                  <span className="font-bold text-[10px] sm:text-base text-[#B12704]">ج</span>
                </div>
                {displayPrice && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <span className="text-[9px] sm:text-xs text-[#3A4522]/45 line-through tabular-nums">{displayPrice}</span>
                    <span className="text-[9px] sm:text-xs text-[#3A4522]/45 line-through">ج</span>
                  </div>
                )}
              </>
            ) : displayPrice ? (
              <>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span className="font-bold text-xs sm:text-base md:text-lg text-[#2B3318] tabular-nums">{displayPrice}</span>
                  <span className="font-bold text-[10px] sm:text-base text-[#2B3318]">ج</span>
                </div>
                {pricingStrategy === 'smart-fallback' && (
                  <span className="text-[9px] sm:text-xs text-[#3A4522]/60 leading-none">ابتداءً من</span>
                )}
              </>
            ) : (
              <span className="text-[10px] sm:text-sm text-[#3A4522]/60 text-right">تواصل للسعر</span>
            )}
          </div>

          <div className="flex flex-shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className={`flex items-center justify-center gap-1 p-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg transition-all duration-300 font-bold text-xs sm:text-sm border ${isAdded
                  ? 'bg-[#2B3318] text-[#E3C778] border-[#D1A94F]'
                  : 'bg-[#E3C778] text-[#2B3318] border-[#D1A94F]/70 hover:bg-[#D1A94F] shadow-sm hover:shadow-md'
                } ${isAdding ? 'opacity-75' : ''}`}
              title={isAdded ? 'تمت الإضافة' : 'أضف إلى السلة'}
              aria-label="أضف إلى السلة"
            >
              {isAdding ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-[#2B3318] border-t-transparent rounded-full animate-spin"></div>
              ) : isAdded ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline text-xs">سلة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
