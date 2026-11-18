import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import ServiceCard from '../components/ServiceCard';
import { ArrowRight } from 'lucide-react';
import type { Service } from '../types/database';

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function SubcategoryProducts() {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (category) {
      navigate(`/category/${category.id}`);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (subcategoryId) {
      fetchSubcategoryAndServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategoryId]);

  const fetchSubcategoryAndServices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch subcategory details with parent category_id
      const { data: subcat, error: subcatErr } = await supabase
        .from('subcategories')
        .select('id, name_ar, description_ar, category_id, created_at')
        .eq('id', subcategoryId)
        .single();
      if (subcatErr) throw subcatErr;
      setSubcategory({
        id: subcat.id,
        name: subcat.name_ar,
        description: subcat.description_ar,
        category_id: subcat.category_id,
        created_at: (subcat as any).created_at ?? ''
      } as Subcategory);

      // Fetch parent category
      if (subcat?.category_id) {
        const { data: cat, error: catErr } = await supabase
          .from('categories')
          .select('id, name')
          .eq('id', subcat.category_id)
          .single();
        if (catErr) throw catErr;
        setCategory({ id: cat.id, name: cat.name } as Category);
      }

      // Fetch services for this subcategory (only available ones)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('subcategory_id', subcategoryId)
        .or('is_available.is.true,is_available.is.null');
      if (servicesError) throw servicesError;
      setServices(servicesData || []);
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

  if (error || !subcategory) {
    return (
    <div
      className="min-h-screen pt-[116px] md:pt-24 flex flex-col items-center justify-center gap-4 bg-primary"
    >
        <div className="text-xl text-secondary">{error || 'القسم الفرعي غير موجود'}</div>
        <Link
          to="/"
          className="bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] px-6 py-2 rounded-lg transition-colors font-bold"
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
        <title>{`${subcategory.name} | شركة الرؤى للتجارة والتوريدات والعطارة`}</title>
      </Helmet>
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
        >
          <ArrowRight className="w-5 h-5" />
          <span>رجوع للقسم</span>
        </button>

        {/* Breadcrumbs */}
        <div className="mb-6 sm:mb-8 text-secondary text-sm">
          <Link to="/" className="hover:text-accent transition-colors">الرئيسية</Link>
          {category && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/category/${category.id}`} className="hover:text-accent transition-colors">
                {category.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-accent">{subcategory.name}</span>
        </div>

        <div className="bg-[#2B3318]/[0.04] rounded-2xl p-3 sm:p-8 border border-[#D1A94F]/25 shadow-lg">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 text-[#2B3318]">{subcategory.name}</h1>
          {subcategory.description && (
            <p className="text-[#3A4522]/80 mb-6 sm:mb-8">{subcategory.description}</p>
          )}

          {services.length === 0 ? (
            <p className="text-center text-secondary/70 py-8">
              لا توجد منتجات في هذا القسم الفرعي حالياً
            </p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-4 md:gap-6">
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
