import { useEffect, useState, useCallback, useRef } from 'react';
import { LayoutGrid, ChevronDown, ChevronUp } from 'lucide-react';
import ServiceCard from './ServiceCard';
import CategoryVisual from './CategoryVisual';
import { syncCategoryImagesFromDB } from '../utils/categoryImagesManager';
import { supabase } from '../lib/supabase';
import type { Service, Category, Subcategory } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | 'featured' | 'best_sellers' | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFeaturedProducts, setHasFeaturedProducts] = useState(false);
  const [hasBestSellerProducts, setHasBestSellerProducts] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const resultsStartRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef<boolean>(false);
  const loadMoreTimerRef = useRef<number | null>(null);

  const scrollToResults = useCallback(() => {
    window.setTimeout(() => {
      const el = resultsStartRef.current;
      if (!el) return;
      const headerOffset = window.innerWidth >= 768 ? 88 : 112;
      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementTop - headerOffset),
        behavior: 'smooth',
      });
    }, 100);
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchServices();
    fetchSubcategories();
    syncCategoryImagesFromDB();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all services with their categories and subcategories
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          category:categories(*),
          subcategory:subcategories(*),
          sizes:product_sizes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);

      // Check if we have any featured or best seller products
      const hasFeatured = data?.some(service => service.is_featured) || false;
      const hasBestSellers = data?.some(service => service.is_best_seller) || false;

      setHasFeaturedProducts(hasFeatured);
      setHasBestSellerProducts(hasBestSellers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('id, name_ar, description_ar, category_id')
        .order('name_ar');

      if (error) throw error;
      const mapped: Subcategory[] = (data || []).map((sc: any) => ({
        id: sc.id,
        name: sc.name_ar ?? '',
        description: sc.description_ar ?? null,
        category_id: sc.category_id,
      }));
      setSubcategories(mapped);
    } catch (err) {
      console.error('Failed to fetch subcategories', err);
    }
  };

  const filteredServices = useCallback((): Service[] => {
    let filtered = services;

    // Filter by availability first - hide unavailable products
    filtered = filtered.filter(service => service.is_available !== false);

    // Filter by category first
    if (selectedCategory && selectedCategory !== 'featured' && selectedCategory !== 'best_sellers') {
      filtered = filtered.filter(service => service.category_id === selectedCategory);
    } else if (selectedCategory === 'featured') {
      filtered = filtered.filter(service => service.is_featured === true);
    } else if (selectedCategory === 'best_sellers') {
      filtered = filtered.filter(service => service.is_best_seller === true);
    }

    // Then filter by subcategory if selected
    if (selectedSubcategory) {
      filtered = filtered.filter(service => service.subcategory_id === selectedSubcategory);
    }

    return filtered;
  }, [selectedCategory, selectedSubcategory, services]);

  const currentFiltered = filteredServices();
  const totalFiltered = currentFiltered.length;
  const hasMore = visibleCount < totalFiltered;

  useEffect(() => {
    if (loadMoreTimerRef.current !== null) {
      window.clearTimeout(loadMoreTimerRef.current);
      loadMoreTimerRef.current = null;
    }
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    setVisibleCount(24);
  }, [selectedCategory, selectedSubcategory]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current !== null) {
        window.clearTimeout(loadMoreTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasMore) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMoreRef.current) {
          isLoadingMoreRef.current = true;
          setIsLoadingMore(true);
          loadMoreTimerRef.current = window.setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 24, totalFiltered));
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
            loadMoreTimerRef.current = null;
          }, 1500);
        }
      },
      { rootMargin: '60px 0px', threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, visibleCount, totalFiltered]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null); // Reset subcategory selection
    setOpenCategoryId(categoryId);
    setIsCategoriesOpen(false);
    scrollToResults();
  };

  const handleSubcategoryClick = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
    scrollToResults();
  };

  if (isLoading) {
    return (
      <div className="py-16" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="container mx-auto px-4 text-center text-secondary">
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="container mx-auto px-4 text-center text-red-600">
          حدث خطأ أثناء تحميل المنتجات: {error}
        </div>
      </div>
    );
  }

  return (
    <section className="pt-4 pb-16" style={{ backgroundColor: 'var(--color-primary)' }} id="products">
      <motion.div
        className="container mx-auto px-2 sm:px-4 bg-[#2B3318]/[0.03] rounded-2xl p-2.5 sm:p-6 md:p-8 border border-[#3A4522]/15 shadow-lg"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6, delayChildren: 0.2, staggerChildren: 0.1 } },
        }}
      >
        {/* عنوان القسم الرئيسي */}
        <motion.div
          className="text-center mb-4 sm:mb-6"
          variants={{
            hidden: { opacity: 0, y: -20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-xl sm:text-3xl font-bold mb-1 text-[#2B3318] inline-flex items-center justify-center gap-2">
            <span>بتدور على إيه؟</span>
          </h2>
        </motion.div>

        {/* شريط الأزرار الرئيسي: زر الأقسام + أحدث العروض + الأكثر مبيعاً */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 mb-4">
          <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2.5 max-w-full">
            {(() => {
              const activeCategoryName =
                selectedCategory && selectedCategory !== 'featured' && selectedCategory !== 'best_sellers'
                  ? categories.find((c) => c.id === selectedCategory)?.name
                  : null;
              return (
                <button
                  type="button"
                  onClick={() => setIsCategoriesOpen((prev) => !prev)}
                  aria-expanded={isCategoriesOpen}
                  className={`px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-2 border shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
                    isCategoriesOpen || activeCategoryName
                      ? 'bg-[#2B3318] text-[#E3C778] border-[#D1A94F] shadow-md'
                      : 'bg-[#E3C778] text-[#2B3318] border-[#D1A94F] hover:bg-[#D1A94F]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate max-w-[95px] sm:max-w-none">
                    {activeCategoryName ? `الأقسام: ${activeCategoryName}` : 'الأقسام'}
                  </span>
                  {isCategoriesOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  )}
                </button>
              );
            })()}

            {hasFeaturedProducts && (
              <button
                type="button"
                onClick={() => {
                  const next = selectedCategory === 'featured' ? null : 'featured';
                  setSelectedCategory(next);
                  setSelectedSubcategory(null);
                  setOpenCategoryId(null);
                  setIsCategoriesOpen(false);
                  if (next) scrollToResults();
                }}
                className={`px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 border whitespace-nowrap shrink-0 ${
                  selectedCategory === 'featured'
                    ? 'bg-[#B12704] text-[#F7F3E9] border-[#8A1E03] shadow-md scale-[1.03]'
                    : 'bg-[#B12704]/10 text-[#B12704] border-[#B12704]/35 hover:bg-[#B12704]/20'
                }`}
              >
                <span>✨</span>
                <span>أحدث العروض</span>
              </button>
            )}

            {hasBestSellerProducts && (
              <button
                type="button"
                onClick={() => {
                  const next = selectedCategory === 'best_sellers' ? null : 'best_sellers';
                  setSelectedCategory(next);
                  setSelectedSubcategory(null);
                  setOpenCategoryId(null);
                  setIsCategoriesOpen(false);
                  if (next) scrollToResults();
                }}
                className={`px-2.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-bold transition-all duration-200 flex items-center gap-1 sm:gap-1.5 border whitespace-nowrap shrink-0 ${
                  selectedCategory === 'best_sellers'
                    ? 'bg-[#2B3318] text-[#E3C778] border-[#D1A94F] shadow-md scale-[1.03]'
                    : 'bg-[#E3C778]/35 text-[#2B3318] border-[#D1A94F]/60 hover:bg-[#E3C778]/70'
                }`}
              >
                <span>🔥</span>
                <span>الأكثر مبيعاً</span>
              </button>
            )}
          </div>

          {selectedCategory !== null && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedSubcategory(null);
                setOpenCategoryId(null);
              }}
              className="px-3 py-1 sm:px-4 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold bg-[#3A4522]/10 text-[#2B3318] border border-[#3A4522]/25 hover:bg-[#3A4522] hover:text-[#F7F3E9] transition-colors whitespace-nowrap"
            >
              عرض الكل ✕
            </button>
          )}
        </div>

        {/* قائمة الأقسام المنسدلة (مضغوطة وتحت بعضها) */}
        <AnimatePresence>
          {isCategoriesOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden mb-4"
            >
              <div className="max-w-[230px] sm:max-w-[260px] mx-auto bg-[#F7F3E9]/95 rounded-xl border border-[#D1A94F]/50 p-1.5 shadow-md">
                <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto pr-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setOpenCategoryId(null);
                      setIsCategoriesOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors text-right ${
                      selectedCategory === null
                        ? 'bg-[#2B3318] text-[#E3C778]'
                        : 'text-[#2B3318] hover:bg-[#E3C778]/30'
                    }`}
                  >
                    <span>كل المنتجات</span>
                  </button>

                  {categories.map((category) => {
                    const isSelected = category.id === selectedCategory;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryClick(category.id)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors text-right ${
                          isSelected
                            ? 'bg-[#2B3318] text-[#F7F3E9] font-bold'
                            : 'text-[#2B3318] hover:bg-[#E3C778]/30 font-medium'
                        }`}
                      >
                        <CategoryVisual
                          categoryId={category.id}
                          categoryName={category.name}
                          customImageUrl={category.image_url}
                          isActive={isSelected}
                          size="xs"
                        />
                        <span className="text-xs leading-tight truncate flex-1">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* بداية عرض وصف القسم المختار + الأقسام الفرعية + المنتجات */}
        <div ref={resultsStartRef} className="pt-2">
          {/* وصف القسم المختار فوق الأقسام الفرعية */}
          {(() => {
            const activeCategoryObj =
              selectedCategory && selectedCategory !== 'featured' && selectedCategory !== 'best_sellers'
                ? categories.find(c => c.id === selectedCategory)
                : null;
            const activeSubcatObj = selectedSubcategory
              ? subcategories.find(sc => sc.id === selectedSubcategory)
              : null;

            const headingText = activeSubcatObj
              ? `${activeSubcatObj.name} - ${activeCategoryObj?.name || ''}`
              : activeCategoryObj
                ? activeCategoryObj.name
                : selectedCategory === 'featured'
                  ? 'أحدث العروض'
                  : selectedCategory === 'best_sellers'
                    ? 'الأكثر مبيعاً'
                    : null;

            if (!headingText) return null;

            return (
              <div className="mb-5 p-4 rounded-xl bg-[#3A4522]/[0.07] border border-[#D1A94F]/45 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-[#2B3318] mb-1.5">
                  {headingText}
                </h3>
                <div className="max-w-3xl mx-auto text-[#3A4522] text-xs sm:text-sm md:text-base leading-relaxed">
                  {activeSubcatObj ? (
                    <p>
                      {activeSubcatObj.description || (
                        <>
                          اكتشف مجموعة مميزة من <strong>{activeSubcatObj.name}</strong> في قسم{' '}
                          <strong>{activeCategoryObj?.name}</strong> من{' '}
                          <strong>شركة الرؤى للتجارة والتوريدات والعطارة</strong> بأعلى جودة وأفضل سعر.
                        </>
                      )}
                    </p>
                  ) : activeCategoryObj ? (
                    <p>
                      {activeCategoryObj.description || (
                        <>
                          تصفح مجموعة متنوعة من <strong>{activeCategoryObj.name}</strong> من{' '}
                          <strong>شركة الرؤى للتجارة والتوريدات والعطارة</strong> بجودة مضمونة وأسعار تنافسية.
                        </>
                      )}
                    </p>
                  ) : selectedCategory === 'featured' ? (
                    <p>تصفح أحدث العروض والتخفيضات المميزة من شركة الرؤى للتجارة والتوريدات والعطارة.</p>
                  ) : (
                    <p>تصفح المنتجات الأكثر طلباً ومبيعاً لدى عملائنا في متجر الرؤى.</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Subcategories Section (تحت وصف القسم وفوق المنتجات) */}
          {openCategoryId && subcategories.some(sc => sc.category_id === openCategoryId) && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex flex-wrap gap-2 justify-center">
                {/* زر الكل */}
                <motion.button
                  onClick={() => handleSubcategoryClick(null)}
                  className={`px-3.5 py-1.5 md:px-5 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${selectedSubcategory === null
                      ? 'bg-[#3A4522] text-[#F7F3E9] border border-[#D1A94F]/60 shadow-sm'
                      : 'bg-[#F7F3E9] text-[#2B3318] border border-[#3A4522]/25 hover:border-[#D1A94F] hover:bg-[#E3C778]/25'
                    }`}
                  whileTap={{ scale: 0.96 }}
                >
                  الكل
                </motion.button>

                {/* الأقسام الفرعية */}
                <AnimatePresence>
                  {subcategories
                    .filter(sc => sc.category_id === openCategoryId)
                    .map((subcategory) => (
                      <motion.button
                        key={subcategory.id}
                        onClick={() => handleSubcategoryClick(subcategory.id)}
                        className={`px-3.5 py-1.5 md:px-5 md:py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${selectedSubcategory === subcategory.id
                            ? 'bg-[#3A4522] text-[#F7F3E9] border border-[#D1A94F]/60 shadow-sm'
                            : 'bg-[#F7F3E9] text-[#2B3318] border border-[#3A4522]/25 hover:border-[#D1A94F] hover:bg-[#E3C778]/25'
                          }`}
                        whileTap={{ scale: 0.96 }}
                      >
                        {subcategory.name}
                      </motion.button>
                    ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Products Grid: 3 columns on mobile, 3-4 on tablet/desktop */}
          <motion.div
            className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4 md:gap-6"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
          }}
        >
          <AnimatePresence mode="wait">
            {currentFiltered.length > 0 ? (
              currentFiltered.slice(0, visibleCount).map((service) => (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -16 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <ServiceCard
                    id={service.id}
                    title={service.title}
                    description={service.description || ''}
                    imageUrl={service.image_url || ''}
                    price={service.price}
                    salePrice={service.sale_price}
                    has_multiple_sizes={service.has_multiple_sizes}
                    sizes={service.sizes}
                    has_weight_pricing={service.has_weight_pricing}
                    price_per_kg={service.price_per_kg}
                    sale_price_per_kg={service.sale_price_per_kg}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                key="no-services"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center text-secondary text-xl"
                transition={{ duration: 0.4 }}
              >
                لا توجد منتجات في هذه الفئة.
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </div>

        {hasMore && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center mt-8 py-4 min-h-[56px]"
            aria-live="polite"
            aria-label={isLoadingMore ? 'جاري التحميل' : undefined}
          >
            {isLoadingMore && (
              <span className="w-9 h-9 sm:w-10 sm:h-10 border-[3.5px] border-[#D1A94F]/35 border-t-[#2B3318] rounded-full animate-spin" />
            )}
          </div>
        )}
      </motion.div>
    </section>
  );
}
