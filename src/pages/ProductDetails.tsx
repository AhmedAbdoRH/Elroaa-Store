import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Service, ProductSize } from '../types/database';
import { MessageCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import ProductImageSlider from '../components/ProductImageSlider';


export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const handleContact = () => {
    if (!service) return;
    const productUrl = window.location.href;
    const message = `استفسار عن المنتج: ${service.title}\nرابط المنتج: ${productUrl}`;
    window.open(`https://wa.me/201003046674?text=${encodeURIComponent(message)}`, '_blank');
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


  // Extracted background styles for reuse
  const backgroundStyles = {
        background: '#2a2a2a !important',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center pt-24"
        style={backgroundStyles}
      >
        <div className="text-xl text-secondary">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24"
        style={backgroundStyles}
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
    <div className="min-h-screen flex flex-col pt-24 relative" style={backgroundStyles}>
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
                <p className="text-white text-opacity-88 mb-6 text-lg leading-relaxed text-right" style={{ whiteSpace: 'pre-wrap' }}>
  {service.description}
</p>
                <div className="border-t border-gray-700 pt-6 mb-6">
                  {service.has_weight_pricing && (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold mb-4 text-[#CA8A04] text-right flex items-center justify-end gap-2">
                        <span>حدد الكمية المطلوبة</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.633-.585l-.196-.45a1.083 1.083 0 01-.229-.022l-2.155-1.077V19a1 1 0 01-2 0v-6.93l-2.155 1.077a1.083 1.083 0 01-.229.022l-.196.45a1 1 0 01-.633.585A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                        </svg>
                      </h4>
                      
                      <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl shadow-inner">
                        <div className="relative mb-6">
                           {/* Custom Range Slider Styles */}
                          <style>{`
                            input[type=range] {
                              -webkit-appearance: none;
                              width: 100%;
                              background: transparent;
                              direction: rtl; /* Set direction to RTL */
                            }
                            input[type=range]::-webkit-slider-thumb {
                              -webkit-appearance: none;
                              height: 24px;
                              width: 24px;
                              border-radius: 50%;
                              background: #FACC15;
                              cursor: pointer;
                              margin-top: -10px;
                              box-shadow: 0 0 15px rgba(250, 204, 21, 0.6);
                              border: 2px solid #fff;
                              transition: transform 0.1s;
                            }
                            input[type=range]::-webkit-slider-thumb:hover {
                              transform: scale(1.1);
                            }
                            input[type=range]::-webkit-slider-runnable-track {
                              width: 100%;
                              height: 6px;
                              cursor: pointer;
                              /* Gradient direction reversed for RTL: starts yellow from right, goes to gray on left */
                              background: linear-gradient(to left, #FACC15 ${((selectedWeight - 1) / 999) * 100}%, #4B5563 ${((selectedWeight - 1) / 999) * 100}%);
                              border-radius: 3px;
                            }
                            input[type=range]:focus {
                              outline: none;
                            }
                          `}</style>

                          <input
                            type="range"
                            min="1"
                            max="1000"
                            step="1"
                            value={selectedWeight}
                            onChange={(e) => setSelectedWeight(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold text-gray-300 mb-4 px-1" style={{direction: 'rtl'}}>
                          <span>1 جم</span>
                          <span>500 جم</span>
                          <span>1000 جم</span>
                        </div>

                        <div className="flex items-center justify-between bg-black/60 rounded-lg p-4 border border-white/10 shadow-lg">
                          <div className="text-right flex-1">
                            <span className="text-gray-300 text-sm font-medium block mb-1">الوزن المحدد</span>
                            <span className="text-2xl font-bold text-[#FACC15] drop-shadow-sm block">
                              {selectedWeight} جم
                            </span>

                          </div>
                          <div className="h-12 w-px bg-white/20 mx-4"></div>
                          <div className="text-left flex-1">
                            <span className="text-gray-300 text-sm font-medium block mb-1">السعر التقريبي</span>
                            <span className="text-2xl font-bold text-white drop-shadow-sm">{calculatedPrice} ج</span>
                          </div>
                        </div>
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
                                : 'bg-gray-700 text-white hover:bg-gray-600'}`}
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
                        <span className="text-2xl text-[#CA8A04]">{calculatedPrice} ج</span>
                        {service.sale_price_per_kg ? (
                           <div className="flex gap-2">
                             <span className="text-sm text-gray-400 line-through">الكيلو: {service.price_per_kg} ج</span>
                             <span className="text-sm text-green-400">الكيلو: {service.sale_price_per_kg} ج</span>
                           </div>
                        ) : (
                           <span className="text-lg text-gray-400">سعر الكيلو: {service.price_per_kg} ج</span>
                        )}
                      </div>
                    ) : service.has_multiple_sizes ? (
                      selectedSize?.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl text-[#CA8A04]">{selectedSize.sale_price} ج</span>
                          <span className="text-lg text-gray-400 line-through">{selectedSize.price} ج</span>
                        </div>
                      ) : (
                        <span>{selectedSize?.price} ج</span>
                      )
                    ) : (
                      service.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl text-[#CA8A04]">{service.sale_price} ج</span>
                          <span className="text-lg text-gray-400 line-through">{service.price} ج</span>
                        </div>
                      ) : (
                        <span>{service.price} ج</span>
                      )
                    )}
                  </div>
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={handleContact}
                      className="flex-1 bg-[#25D366] text-white py-3 px-6 rounded-lg font-bold hover:bg-opacity-90 flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      تواصل معنا للطلب
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
                      className="bg-[#CA8A04] hover:bg-[#A16207] text-black p-3 rounded-lg font-bold flex items-center justify-center"
                      title="أضف إلى السلة"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
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
                    bg-white/10 rounded-lg shadow p-2 flex-shrink-0 cursor-pointer hover:scale-105 transition
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
                          <span className="text-xs md:text-sm text-[#CA8A04]">{item.sale_price_per_kg} ج/كيلو</span>
                          <span className="text-xs text-gray-400 line-through">{item.price_per_kg} ج/كيلو</span>
                        </>
                      ) : (
                        <span className="text-xs md:text-sm text-accent">{item.price_per_kg} ج/كيلو</span>
                      )
                    ) : item.has_multiple_sizes && item.sizes && item.sizes.length > 0 && item.sizes[0].sale_price ? (
                      <>
                        <span className="text-xs md:text-sm text-[#CA8A04]">{item.sizes[0].sale_price} ج</span>
                        <span className="text-xs text-gray-400 line-through">{item.sizes[0].price} ج</span>
                      </>
                    ) : item.has_multiple_sizes && item.sizes && item.sizes.length > 0 ? (
                      <span className="text-xs md:text-sm text-accent">{item.sizes[0].price} ج</span>
                    ) : item.sale_price ? (
                      <>
                        <span className="text-xs md:text-sm text-[#CA8A04]">{item.sale_price} ج</span>
                        <span className="text-xs text-gray-400 line-through">{item.price} ج</span>
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
