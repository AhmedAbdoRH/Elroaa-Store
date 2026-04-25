import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service, ProductSize } from '../types/database';
import { MessageCircle, ArrowRight, Share2, Copy } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import ProductImageSlider from '../components/ProductImageSlider';


export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<Service[]>([]);

  // Image slider states - removed as we're using ProductImageSlider component
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  
  // Weight pricing states
  const [selectedWeight, setSelectedWeight] = useState<number>(100); // Default 100g
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isEditingWeight, setIsEditingWeight] = useState<boolean>(false);
  const [tempWeight, setTempWeight] = useState<string>('');

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch service and suggested products on ID change
  useEffect(() => {
    if (id) {
      fetchService(id);
    }
  }, [id]);

  // Fetch suggested products when service data is loaded
  useEffect(() => {
    if (service) {
      fetchSuggested();
    }
  }, [service]);

  // Calculate price when weight or price_per_kg changes
  useEffect(() => {
    if (service?.has_weight_pricing && service.price_per_kg) {
      const pricePerKg = service.sale_price_per_kg || service.price_per_kg;
      const price = (selectedWeight / 1000) * pricePerKg;
      setCalculatedPrice(Math.round(price * 100) / 100);
    }
  }, [selectedWeight, service?.price_per_kg, service?.sale_price_per_kg, service?.has_weight_pricing]);

  const fetchService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*, sizes:product_sizes(*)')
        .eq('id', serviceId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('المنتج غير موجود');

      setService(data);
      if (data.has_multiple_sizes && data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggested = async () => {
    if (!service) return;
    
    const { data } = await supabase
      .from('services')
      .select('*, sizes:product_sizes(*)')
      .eq('category_id', service.category_id)
      .neq('id', id)
      .limit(10);
      
    setSuggested(data || []);
  };

  // Weight management functions
  const incrementWeight = (step: number) => {
    const newWeight = Math.min(1000, selectedWeight + step);
    setSelectedWeight(newWeight);
  };

  const decrementWeight = (step: number) => {
    const newWeight = Math.max(1, selectedWeight - step);
    setSelectedWeight(newWeight);
  };

  const startEditingWeight = () => {
    setIsEditingWeight(true);
    setTempWeight(selectedWeight.toString());
  };

  const saveWeight = () => {
    const weight = parseFloat(tempWeight);
    if (!isNaN(weight) && weight >= 1 && weight <= 1000) {
      setSelectedWeight(weight);
      setIsEditingWeight(false);
    }
  };

  const cancelEditingWeight = () => {
    setIsEditingWeight(false);
    setTempWeight('');
  };

  const handleWeightKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveWeight();
    } else if (e.key === 'Escape') {
      cancelEditingWeight();
    }
  };

  const handleContact = () => {
    if (!service) return;
    const productUrl = window.location.href;
    const message = `استفسار عن المنتج: ${service.title}\nرابط المنتج: ${productUrl}`;
    window.open(`https://wa.me/201003046674?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleBack = () => {
    // Try to navigate back to the category page
    if (service?.category_id) {
      navigate(`/category/${service.category_id}`);
    } else {
      // Fallback to home page
      navigate('/');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: service?.title || 'منتج',
          text: service?.description || '',
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success('تم نسخ رابط المنتج');
    }).catch(() => {
      toast.error('فشل نسخ الرابط');
    });
  };

  // Get all images for the main product carousel
  const images: string[] = [
    service?.image_url || '',
    ...(Array.isArray(service?.gallery) ? service.gallery : [])
  ].filter(Boolean);

  // Ensure image URLs are absolute for social crawlers
  const toAbsoluteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return window.location.origin + url;
    return url;
  };
  const productImageForShare = toAbsoluteUrl(images[0] || '/logo-social.png');


  // Extracted background styles for reuse - Removed to use global theme
  
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center pt-24 bg-primary"
      >
        <div className="text-xl text-secondary">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24 bg-primary"
      >
        <div className="text-xl text-secondary">{error || 'المنتج غير موجود'}</div>
        <button
          onClick={() => navigate('/')}
          className="bg-secondary text-primary px-6 py-2 rounded-lg hover:bg-opacity-90"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-24 relative bg-primary">
      {service && (
        <Helmet>
          <title>{`${service.title} | شركة الرؤى للتجارة والتوريدات والعطارة`}</title>
          <meta
            name="description"
            content={(service.description || '').slice(0, 160)}
          />
          <link rel="canonical" href={window.location.href} />

          {/* Open Graph */}
          <meta property="og:type" content="product" />
          <meta property="og:url" content={window.location.href} />
          <meta property="og:title" content={`${service.title} | شركة الرؤى للتجارة والتوريدات والعطارة`} />
          <meta property="og:description" content={(service.description || '').slice(0, 200)} />
          <meta property="og:image" content={productImageForShare} />
          <meta property="og:site_name" content="شركة الرؤى للتجارة والتوريدات والعطارة" />
          <meta property="og:locale" content="ar_EG" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={window.location.href} />
          <meta property="twitter:title" content={`${service.title} | شركة الرؤى للتجارة والتوريدات والعطارة`} />
          <meta property="twitter:description" content={(service.description || '').slice(0, 200)} />
          <meta property="twitter:image" content={productImageForShare} />
        </Helmet>
      )}
      <div className="flex items-center justify-center flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl lg:max-w-5xl">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-4 flex items-center gap-2 text-secondary hover:text-secondary/80 transition-colors font-medium"
          >
            <ArrowRight className="w-5 h-5" />
            <span>رجوع للقسم</span>
          </button>
          
          <div className="rounded-lg shadow-lg overflow-hidden glass">
            <div className="md:flex">
              <div className="md:w-1/2">
                <ProductImageSlider 
                  mainImageUrl={service.image_url}
                  additionalImages={Array.isArray(service.gallery) ? service.gallery : []}
                />
              </div>
              <div className="md:w-1/2 p-8">
                <h1 className="text-3xl font-bold mb-4 text-secondary text-right">{service.title}</h1>
                <p className="text-secondary text-opacity-88 mb-6 text-lg leading-relaxed text-right" style={{ whiteSpace: 'pre-wrap' }}>
  {service.description}
</p>
                <div className="border-t border-secondary/20 pt-6 mb-6">
                  {service.has_weight_pricing && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold mb-4 text-secondary text-right flex items-center justify-end gap-2">
                        <span>حدد الكمية المطلوبة</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.633-.585l-.196-.45a1.083 1.083 0 01-.229-.022l-2.155-1.077V19a1 1 0 01-2 0v-6.93l-2.155 1.077a1.083 1.083 0 01-.229.022l-.196.45a1 1 0 01-.633.585A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                        </svg>
                      </h4>
                      
                      <div className="bg-secondary/5 backdrop-blur-sm border border-secondary/10 p-6 rounded-xl shadow-inner">
                        {/* Weight Input with Increment/Decrement Buttons */}
                        <div className="mb-6">
                          <div className="flex items-center justify-center gap-4 mb-4">
                            {/* Decrement buttons */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => decrementWeight(1)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="إنقاص 1 جرام"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => decrementWeight(10)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="إنقاص 10 جرام"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => decrementWeight(100)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="إنقاص 100 جرام"
                              >
                                -100
                              </button>
                            </div>

                            {/* Weight Display/Input */}
                            <div className="flex flex-col items-center">
                              {isEditingWeight ? (
                                <div className="flex flex-col items-center gap-2">
                                  <input
                                    type="number"
                                    value={tempWeight}
                                    onChange={(e) => setTempWeight(e.target.value)}
                                    onKeyDown={handleWeightKeyPress}
                                    onBlur={saveWeight}
                                    min="1"
                                    max="1000"
                                    step="1"
                                    className="w-24 h-16 text-2xl font-bold text-center text-secondary bg-secondary/10 border-2 border-secondary/30 rounded-lg focus:outline-none focus:border-secondary"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={saveWeight}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEditingWeight}
                                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm text-secondary/60 font-medium mb-1 animate-pulse bg-white px-3 py-1 rounded-full shadow-sm border border-secondary/20">اضغط للتعديل</span>
                                  <button
                                    onClick={startEditingWeight}
                                    className="w-24 h-16 text-2xl font-bold text-secondary bg-white hover:bg-gray-50 border-2 border-secondary/30 rounded-lg transition-all hover:scale-105 focus:outline-none focus:border-secondary shadow-md"
                                    title="اضغط للتعديل"
                                  >
                                    {selectedWeight}
                                  </button>
                                  <span className="text-sm text-secondary/70 font-medium mt-1">جرام</span>
                                </div>
                              )}
                            </div>

                            {/* Increment buttons */}
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => incrementWeight(1)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="زيادة 1 جرام"
                              >
                                +1
                              </button>
                              <button
                                onClick={() => incrementWeight(10)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="زيادة 10 جرام"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => incrementWeight(100)}
                                className="w-10 h-10 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg font-bold transition-colors"
                                title="زيادة 100 جرام"
                              >
                                +100
                              </button>
                            </div>
                          </div>

                          {/* Quick select buttons */}
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            <button
                              onClick={() => setSelectedWeight(50)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedWeight === 50
                                  ? 'bg-secondary text-primary'
                                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                              }`}
                            >
                              50 جم
                            </button>
                            <button
                              onClick={() => setSelectedWeight(100)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedWeight === 100
                                  ? 'bg-secondary text-primary'
                                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                              }`}
                            >
                              100 جم
                            </button>
                            <button
                              onClick={() => setSelectedWeight(250)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedWeight === 250
                                  ? 'bg-secondary text-primary'
                                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                              }`}
                            >
                              250 جم
                            </button>
                            <button
                              onClick={() => setSelectedWeight(500)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedWeight === 500
                                  ? 'bg-secondary text-primary'
                                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                              }`}
                            >
                              500 جم
                            </button>
                            <button
                              onClick={() => setSelectedWeight(1000)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                selectedWeight === 1000
                                  ? 'bg-secondary text-primary'
                                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary'
                              }`}
                            >
                              1 كجم
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-secondary/10 rounded-lg p-4 border border-secondary/20 shadow-lg">
                          <div className="text-right flex-1">
                            <span className="text-secondary/70 text-sm font-medium block mb-1">الوزن المحدد</span>
                            <span className="text-2xl font-bold text-secondary drop-shadow-sm block">
                              {selectedWeight} جم
                            </span>

                          </div>
                          <div className="h-12 w-px bg-secondary/20 mx-4"></div>
                          <div className="text-left flex-1">
                            <span className="text-secondary/70 text-sm font-medium block mb-1">السعر التقريبي</span>
                            <span className="text-2xl font-bold text-secondary drop-shadow-sm">{calculatedPrice} ج</span>
                          </div>
                        </div>
                        {service.price_per_kg && (
                          <p className="text-center text-xs text-secondary/60 mt-4">
                            سعر الكيلو: {service.price_per_kg} ج
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {service.has_multiple_sizes && service.sizes && service.sizes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-lg font-bold mb-2 text-secondary text-right">المقاسات المتوفرة</h4>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {service.sizes.map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-lg font-bold transition-colors ${ selectedSize?.id === size.id
                                ? 'bg-secondary text-primary'
                                : 'bg-gray-200 text-secondary hover:bg-gray-300'}`}
                          >
                            {size.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="text-2xl font-bold text-accent mb-6 text-right">
                    {service.has_weight_pricing ? (
                      <div className="flex flex-col items-end">
                        <span className="text-2xl text-secondary">{calculatedPrice} ج</span>
                      </div>
                    ) : service.has_multiple_sizes ? (
                      selectedSize?.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl text-secondary">{selectedSize.sale_price} ج</span>
                          <span className="text-lg text-secondary/60 line-through">{selectedSize.price} ج</span>
                        </div>
                      ) : (
                        <span>{selectedSize?.price} ج</span>
                      )
                    ) : (
                      service.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl text-secondary">{service.sale_price} ج</span>
                          <span className="text-lg text-secondary/60 line-through">{service.price} ج</span>
                        </div>
                      ) : (
                        <span>{service.price} ج</span>
                      )
                    )}
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={handleContact}
                      className="w-14 h-14 bg-[#CA8A04] text-white rounded-lg font-bold hover:bg-opacity-90 flex items-center justify-center"
                      title="تواصل معنا للطلب"
                    >
                      <MessageCircle className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-14 h-14 bg-blue-600 text-white rounded-lg font-bold hover:bg-opacity-90 flex items-center justify-center"
                      title="مشاركة المنتج"
                    >
                      <Share2 className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-14 h-14 bg-gray-600 text-white rounded-lg font-bold hover:bg-opacity-90 flex items-center justify-center"
                      title="نسخ رابط المنتج"
                    >
                      <Copy className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (service.has_weight_pricing) {
                          const weightText = `${selectedWeight} جم`;
                          addToCart({
                            productId: String(service.id),
                            title: service.title,
                            price: String(calculatedPrice),
                            imageUrl: service.image_url || '',
                            size: weightText,
                          });
                          toast.success('تمت إضافة المنتج إلى السلة');
                        } else if (service.has_multiple_sizes) {
                          if (selectedSize) {
                            addToCart({
                              productId: String(service.id),
                              title: service.title,
                              price: String(selectedSize.sale_price || selectedSize.price),
                              imageUrl: service.image_url || '',
                              size: selectedSize.size,
                            });
                            toast.success('تمت إضافة المنتج إلى السلة');
                          } else {
                            toast.error('الرجاء اختيار مقاس');
                          }
                        } else {
                          addToCart({
                            productId: String(service.id),
                            title: service.title,
                            price: String(service.sale_price || service.price || 0),
                            imageUrl: service.image_url || '',
                          });
                          toast.success('تمت إضافة المنتج إلى السلة');
                        }
                      }}
                      className="flex-1 h-14 bg-[#25D366] hover:bg-opacity-90 text-white p-3 rounded-lg font-bold flex items-center justify-center"
                      title="أضف إلى السلة"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                      <span className="mr-2">أضف للسلة للطلب</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Products */}
      {suggested.length > 0 && (
        <div className="container mx-auto px-4 max-w-4xl lg:max-w-5xl mb-8">
          <h2 className="text-xl font-bold text-secondary mb-4 text-right">متوفر لدينا ايضا</h2>
          <div
            className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {suggested.map((item) => {
              const images: string[] = [
                item.image_url || '',
                ...(Array.isArray(item.gallery) ? item.gallery : [])
              ].filter(Boolean);
              const imageUrl = images[0] || '';

              return (
                <div
                  key={item.id}
                  className="
                    min-w-[160px] max-w-[180px]
                    md:min-w-[220px] md:max-w-[260px]
                    bg-secondary/5 rounded-lg shadow p-2 flex-shrink-0 cursor-pointer hover:scale-105 transition
                  "
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <img
                    src={imageUrl || '/placeholder-product.jpg'}
                    alt={item.title}
                    className="w-full h-24 md:h-40 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.jpg';
                    }}
                  />
                  <div className="mt-2 text-sm md:text-base font-bold text-secondary truncate text-right">{item.title}</div>
                  <div className="flex flex-col items-end">
                    {item.has_weight_pricing ? (
                      item.sale_price_per_kg ? (
                        <>
                          <span className="text-xs md:text-sm text-secondary">{item.sale_price_per_kg} ج/كيلو</span>
                          <span className="text-xs text-secondary/60 line-through">{item.price_per_kg} ج/كيلو</span>
                        </>
                      ) : (
                        <span className="text-xs md:text-sm text-accent">{item.price_per_kg} ج/كيلو</span>
                      )
                    ) : item.has_multiple_sizes && item.sizes && item.sizes.length > 0 && item.sizes[0].sale_price ? (
                      <>
                        <span className="text-xs md:text-sm text-secondary">{item.sizes[0].sale_price} ج</span>
                        <span className="text-xs text-secondary/60 line-through">{item.sizes[0].price} ج</span>
                      </>
                    ) : item.has_multiple_sizes && item.sizes && item.sizes.length > 0 ? (
                      <span className="text-xs md:text-sm text-accent">{item.sizes[0].price} ج</span>
                    ) : item.sale_price ? (
                      <>
                        <span className="text-xs md:text-sm text-secondary">{item.sale_price} ج</span>
                        <span className="text-xs text-secondary/60 line-through">{item.price} ج</span>
                      </>
                    ) : (
                      <span className="text-xs md:text-sm text-accent">{item.price} ج</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Styles to hide scrollbar */}
          <style>{`
            .hide-scrollbar {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      )}

      {/* Back to Home button */}
      <div className="flex justify-center pb-8">
        <button
          onClick={() => navigate('/')}
          className="text-secondary hover:text-accent px-4 py-2 rounded-lg border border-secondary hover:border-accent"
        >
          ← العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
