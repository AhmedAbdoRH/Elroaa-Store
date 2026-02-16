import { useEffect, useState, useCallback } from 'react';
import ServiceCard from './ServiceCard';
import FacebookButton from './FacebookButton';
import { supabase } from '../lib/supabase';
import type { Service, Category, Subcategory } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';

const lightGold = '#B8860B';
const brownDark = '#3d2c1d';

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

  useEffect(() => {
    fetchCategories();
    fetchServices();
    fetchSubcategories();
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

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null); // Reset subcategory selection
    setOpenCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  const handleSubcategoryClick = (subcategoryId: string | null) => {
    setSelectedSubcategory(subcategoryId);
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
    <section className="py-16" style={{ backgroundColor: 'var(--color-primary)' }} id="products">
      <motion.div
        className="container mx-auto px-4 bg-secondary/5 backdrop-blur-xl rounded-2xl p-8 border border-secondary/10 shadow-2xl shadow-secondary/5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8, delayChildren: 0.3, staggerChildren: 0.2 } },
        }}
      >
        {/* العنوان المحسن للSEO */}
        <motion.div
          className="text-center mb-12"
          variants={{
            hidden: { opacity: 0, y: -30 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold mb-4 text-secondary">
            {selectedSubcategory ? (
              <>
                {subcategories.find(sc => sc.id === selectedSubcategory)?.name} -
                {categories.find(c => c.id === selectedCategory)?.name}
              </>
            ) : selectedCategory ? (
              categories.find(c => c.id === selectedCategory)?.name || 'منتجاتنا'
            ) : (
              'منتجاتنا'
            )}
          </h2>

          {/* SEO-optimized description */}
          <div className="max-w-3xl mx-auto text-secondary/80 text-lg leading-relaxed">
            {selectedSubcategory ? (
              <p>
                اكتشف مجموعة واسعة من <strong>{subcategories.find(sc => sc.id === selectedSubcategory)?.name}</strong>
                في قسم <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong> من
                <strong> شركة الرؤى للتجارة والتوريدات والعطارة</strong>. نقدم أجود أنواع الأعشاب والتوابل والزيوت العطرية
                بأسعار تنافسية وجودة عالية.
              </p>
            ) : selectedCategory ? (
              <p>
                تصفح مجموعة متنوعة من <strong>{categories.find(c => c.id === selectedCategory)?.name}</strong>
                من <strong>شركة الرؤى للتجارة والتوريدات والعطارة</strong>. توابل، أعشاب، زيوت عطرية،
                مكسرات وأكثر بأسعار مناسبة وجودة مضمونة طبقاً للمواصفات القياسية.
              </p>
            ) : (
              <p>
                مرحباً بكم في <strong>شركة الرؤى للتجارة والتوريدات والعطارة</strong> - وجهتكم الأولى للحصول على
                <strong> أجود أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية</strong>. اكتشف مجموعتنا الواسعة من
                المنتجات المختارة بعناية فائقة بأسعار تنافسية وجودة عالية.
              </p>
            )}
          </div>
        </motion.div>

        {/* Special Categories */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mb-6"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          {/* All Products Button */}
          <motion.button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setOpenCategoryId(null);
            }}
            className={`p-4 rounded-xl transition-all duration-300 ${!selectedCategory
                ? 'bg-accent text-primary font-bold shadow-md'
                : 'bg-secondary/10 text-secondary hover:bg-secondary/20 hover:shadow-md'
              }`}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            جميع المنتجات
          </motion.button>

          {/* Featured Products Category */}
          {hasFeaturedProducts && (
            <motion.button
              onClick={() => {
                setSelectedCategory('featured');
                setSelectedSubcategory(null);
                setOpenCategoryId(null);
              }}
              className={`p-4 rounded-xl transition-all duration-300 ${selectedCategory === 'featured'
                  ? 'bg-accent text-primary font-bold shadow-md'
                  : 'bg-accent/20 text-accent hover:bg-accent/30 hover:shadow-md'
                }`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-yellow-400">✨</span> أحدث العروض
              </h3>
            </motion.button>
          )}

          {/* Best Sellers Category */}
          {hasBestSellerProducts && (
            <motion.button
              onClick={() => {
                setSelectedCategory('best_sellers');
                setSelectedSubcategory(null);
                setOpenCategoryId(null);
              }}
              className={`p-4 rounded-xl transition-all duration-300 ${selectedCategory === 'best_sellers'
                  ? 'bg-red-500 text-white font-bold shadow-md'
                  : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 hover:shadow-md'
                }`}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-red-400">🔥</span> الأكثر مبيعاً
              </h3>
            </motion.button>
          )}
        </motion.div>

        {/* Regular Categories */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mb-8"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          <AnimatePresence>
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`p-4 rounded-xl transition-all duration-300 ${category.id === selectedCategory
                    ? 'bg-accent text-primary font-bold shadow-md'
                    : 'bg-secondary/10 text-secondary hover:bg-secondary/20 hover:shadow-md'
                  }`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Subcategories Section */}
        {openCategoryId && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-wrap gap-3 justify-center">
              {/* زر الكل */}
              <motion.button
                onClick={() => handleSubcategoryClick(null)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${selectedSubcategory === null
                    ? 'bg-accent text-primary shadow-xl'
                    : 'bg-secondary/10 text-secondary border-2 border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 hover:shadow-lg'
                  }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                الكل
              </motion.button>

              {/* الأقسام الفرعية */}
              <AnimatePresence>
                {subcategories
                  .filter(sc => sc.category_id === openCategoryId)
                  .map((subcategory, idx) => (
                    <motion.button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryClick(subcategory.id)}
                      className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${selectedSubcategory === subcategory.id
                          ? 'bg-accent text-primary shadow-xl'
                          : 'bg-secondary/10 text-secondary border-2 border-secondary/20 hover:bg-secondary/20 hover:border-secondary/40 hover:shadow-lg'
                        }`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {subcategory.name}
                    </motion.button>
                  ))}
              </AnimatePresence>
            </div>

          </motion.div>
        )}

        {/* Products Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
        >
          <AnimatePresence mode="wait">
            {filteredServices().length > 0 ? (
              filteredServices().map((service) => (
                <motion.div
                  key={service.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                    exit: { opacity: 0, y: -20 }
                  }}
                  transition={{ duration: 0.4 }}
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
                transition={{ duration: 0.5 }}
              >
                لا توجد منتجات في هذه الفئة.
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}
