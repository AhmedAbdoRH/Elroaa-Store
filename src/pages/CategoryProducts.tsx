import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
      className="min-h-screen pt-24 flex items-center justify-center"
      style={{
        background: '#2a2a2a !important',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
        <div className="text-xl text-secondary">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !category) {
    return (
    <div
      className="min-h-screen pt-24 flex flex-col items-center justify-center gap-4"
      style={{
        background: '#2a2a2a !important',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
        <div className="text-xl text-secondary">{error || 'القسم غير موجود'}</div>
        <Link
          to="/"
          className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent-light transition-colors"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-24"
      style={{
        background: '#2a2a2a !important',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/40">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4 text-accent">{category.name}</h1>
            
            {/* Subcategories list - smaller and closer to title */}
            {subcategories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {subcategories.map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/subcategory/${sc.id}`}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/20 text-white/90 hover:bg-white/30 hover:text-white transition-all duration-200 border border-white/8 hover:border-white/25"
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