import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import ServiceCard from '../components/ServiceCard';
import { ArrowRight } from 'lucide-react';
import type { Service, Category } from '../types/database';
interface SubcategoryItem { id: string; name: string; }

export default function CategoryProducts() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/');
  };

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAndServices();
    }
  }, [categoryId]);

  const fetchCategoryAndServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch category details
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, description, created_at')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategory({
        id: categoryData.id,
        name: categoryData.name,
        description: categoryData.description,
        created_at: categoryData.created_at
      } as Category);

      // Fetch services for this category (only available ones)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('category_id', categoryId)
        .or('is_available.is.true,is_available.is.null');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Fetch subcategories for this category (if table exists)
      const { data: subcats, error: subErr } = await supabase
        .from('subcategories')
        .select('id, name_ar')
        .eq('category_id', categoryId)
        .order('name_ar', { ascending: true });
      if (!subErr && subcats) {
        setSubcategories(subcats.map((s: any) => ({ id: s.id, name: s.name_ar })));
      } else {
        setSubcategories([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
    <div
      className="min-h-screen pt-[116px] md:pt-24 flex items-center justify-center bg-primary"
    >
        <div className="text-xl text-secondary">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !category) {
    return (
    <div
      className="min-h-screen pt-[116px] md:pt-24 flex flex-col items-center justify-center gap-4 bg-primary"
    >
        <div className="text-xl text-secondary">{error || 'القسم غير موجود'}</div>
        <Link
          to="/"
          className="bg-[#4B5E26] hover:bg-[#3B4B1B] text-[#f5f6db] px-6 py-2 rounded-lg transition-colors font-semibold"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-[116px] md:pt-24 bg-primary"
    >
      <Helmet>
        <title>{`${category.name} | شركة الرؤى للتجارة والتوريدات والعطارة`}</title>
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="bg-[#4B5E26]/[0.04] rounded-2xl p-8 border border-[#4B5E26]/15 shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-[#4B5E26]">{category.name}</h1>
            
            {/* Subcategories list - smaller and closer to title */}
            {subcategories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {subcategories.map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/subcategory/${sc.id}`}
                    className="px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-[#4B5E26]/10 text-[#3B4B1B] hover:bg-[#4B5E26] hover:text-[#f5f6db] transition-all duration-200 border border-[#4B5E26]/25"
                  >
                    {sc.name}
                  </Link>
                ))}
              </div>
            )}

            {category.description && (
              <p className="text-secondary/70">{category.description}</p>
            )}
          </div>

          {services.length === 0 ? (
            <p className="text-center text-secondary/70 py-8">
              لا توجد منتجات في هذا القسم حالياً
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  description={service.description || ''}
                  imageUrl={service.image_url || ''}
                  price={service.price || ''}
                  salePrice={service.sale_price || null}
                  has_multiple_sizes={service.has_multiple_sizes}
                  sizes={service.sizes}
                  has_weight_pricing={service.has_weight_pricing}
                  price_per_kg={service.price_per_kg}
                  sale_price_per_kg={service.sale_price_per_kg}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}