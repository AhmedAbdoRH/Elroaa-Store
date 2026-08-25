import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Service, Banner, StoreSettings, Testimonial, Subcategory } from '../types/database'; // Added Subcategory type
import { sanitizeStoreSettings } from '../utils/storeBranding';
import { Trash2, Edit, Plus, Save, X, Upload, ChevronDown, ChevronUp, Facebook, Instagram, Twitter, Palette, Store, Image, List, Package, Eye, EyeOff, Home, ArrowUp, Sparkles, Flame, Filter, Layers } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const brownDark = '#3d2c1d';
const successGreen = '#228B22'; // Natural green color
const greenButtonClass = `bg-[${successGreen}] text-white px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50`;
const greenTabClass = `bg-[${successGreen}] text-white shadow-lg border-b-4 border-[${successGreen}]`;
const greenTabInactiveClass = 'bg-black/20 text-white';

const STORE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

interface AdminDashboardProps {
  onSettingsUpdate?: () => void;
}

export default function AdminDashboard({ onSettingsUpdate }: AdminDashboardProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingBackground, setRemovingBackground] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [editingService, setEditingService] = useState<number | null>(null);
  const [highlightedServiceId, setHighlightedServiceId] = useState<number | null>(null);
  const [editServiceData, setEditServiceData] = useState<{
    title: string;
    description: string;
    image_url: string;
    category_id: string;
    subcategory_id: string;
    gallery: string[];
    is_featured: boolean;
    is_best_seller: boolean;
    has_weight_pricing: boolean;
    price_per_kg: number | null;
    sale_price_per_kg: number | null;
    price: number | null;
    sale_price: number | null;
  }>({
    title: '',
    description: '',
    image_url: '',
    category_id: '',
    subcategory_id: '',
    gallery: [],
    is_featured: false,
    is_best_seller: false,
    has_weight_pricing: false,
    price_per_kg: null,
    sale_price_per_kg: null,
    price: 0,
    sale_price: null,
  });
  const [editRemoveBgSwitch, setEditRemoveBgSwitch] = useState(false);
  const [editOriginalImageUrl, setEditOriginalImageUrl] = useState<string | null>(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editRemovingBg, setEditRemovingBg] = useState(false);
  const [editUploadingGallery, setEditUploadingGallery] = useState(false);
  const [isAddProductFormOpen, setIsAddProductFormOpen] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string | number; type: 'category' | 'service' | 'banner' | 'subcategory' } | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'banners' | 'testimonials' | 'store'>('products');

  // Remove BG switch state and original image backup (session only)
  const [removeBgSwitch, setRemoveBgSwitch] = useState(false);
  const [originalServiceImageUrl, setOriginalServiceImageUrl] = useState<string | null>(null);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    image_url: '',
    // is_active: true, // You may not need this field if it's not in your form
  });
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null);
  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(false);
  const [productsSubTab, setProductsSubTab] = useState<'services' | 'categories' | 'subcategories'>('services');
  const [bannersSubTab, setBannersSubTab] = useState<'text' | 'image' | 'strip'>('image');

  // Search state for products
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Category and Subcategory filters for products list
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newSubcategory, setNewSubcategory] = useState({ category_id: '', name_ar: '', description_ar: '' });
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    image_url: '',
    category_id: '',
    gallery: [] as string[],
    is_featured: false,
    is_best_seller: false,
    has_weight_pricing: false,
    price_per_kg: null as number | null,
    sale_price_per_kg: null as number | null,
    price: 0,
    sale_price: null as number | null,
  });
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [newBanner, setNewBanner] = useState<Partial<Banner>>({
    type: 'image',
    title: '',
    description: '',
    image_url: '',
    strip_text_color: '#ffffff',
    strip_background_color: '#2a2a2a',
    strip_position: 'below_main'
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    id: '',
    store_name: '',
    store_description: '',
    logo_url: '',
    favicon_url: '',
    og_image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: [],
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    snapchat_url: '',
    tiktok_url: '',
    updated_at: '',
    show_testimonials: false // Added this property
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const navigate = useNavigate();

  // جلب آراء العملاء من قاعدة البيانات
  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTestimonials(data || []);
    } catch (err: any) {
      toast.error('خطأ في جلب آراء العملاء: ' + err.message);
      setTestimonials([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove background from an existing image URL (uses same algorithm)
  async function removeBackgroundFromImageUrl(url: string): Promise<File> {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(null);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر إنشاء سياق الرسم');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const dist = (r1:number,g1:number,b1:number,r2:number,g2:number,b2:number) => {
      const dr=r1-r2, dg=g1-g2, db=b1-b2;
      return Math.sqrt(dr*dr+dg*dg+db*db);
    };

    function avgCorner(x0:number, y0:number, w:number, h:number){
      let sr=0, sg=0, sb=0, c=0;
      for(let y=y0; y<y0+h; y++){
        for(let x=x0; x<x0+w; x++){
          const idx = (y*width + x) * 4;
          sr += data[idx]; sg += data[idx+1]; sb += data[idx+2]; c++;
        }
      }
      return [sr/c, sg/c, sb/c] as [number,number,number];
    }

    const sample = 10;
    const c1 = avgCorner(0, 0, sample, sample);
    const c2 = avgCorner(width-sample, 0, sample, sample);
    const c3 = avgCorner(0, height-sample, sample, sample);
    const c4 = avgCorner(width-sample, height-sample, sample, sample);
    const bg = [
      (c1[0]+c2[0]+c3[0]+c4[0])/4,
      (c1[1]+c2[1]+c3[1]+c4[1])/4,
      (c1[2]+c2[2]+c3[2]+c4[2])/4,
    ] as [number,number,number];

    const threshold = 60;
    const feather = 20;

    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r=d[i], g=d[i+1], b=d[i+2];
      const distance = dist(r,g,b,bg[0],bg[1],bg[2]);
      if (distance <= threshold) {
        d[i+3] = 0;
      } else if (distance <= threshold + feather) {
        const t = (distance - threshold) / feather;
        d[i+3] = Math.min(255, Math.max(0, Math.round(255 * t)));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('فشل إنشاء الصورة')), 'image/png');
    });
    return new File([blob], `${Date.now()}_bg_removed.png`, { type: 'image/png' });
  }

  const handleToggleRemoveBgSwitch = async (checked: boolean) => {
    if (!newService.image_url) return;
    if (checked) {
      setRemovingBackground(true);
      try {
        if (!originalServiceImageUrl) setOriginalServiceImageUrl(newService.image_url);
        const processed = await removeBackgroundFromImageUrl(newService.image_url);
        const fileExt = processed.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processed, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);
        setNewService(prev => ({ ...prev, image_url: publicUrl }));
        setRemoveBgSwitch(true);
        setSuccessMsg('تم تحويل الصورة إلى خلفية شفافة');
      } catch (err: any) {
        setRemoveBgSwitch(false);
        setError(`تعذر إزالة الخلفية: ${err.message}`);
      } finally {
        setRemovingBackground(false);
      }
    } else {
      // Revert to original in-session
      if (originalServiceImageUrl) {
        setNewService(prev => ({ ...prev, image_url: originalServiceImageUrl! }));
      }
      setRemoveBgSwitch(false);
    }
  };

  // إزالة الخلفية داخل المتصفح باستخدام كانفس عبر تقدير لون الخلفية من زوايا الصورة
  async function removeBackgroundFromFile(file: File): Promise<File> {
    // حمل الصورة
    const img = new window.Image();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    await new Promise((resolve, reject) => {
      img.onload = () => resolve(null);
      img.onerror = reject;
      img.src = dataUrl;
    });

    // ارسم على كانفس
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر إنشاء سياق الرسم');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // دالة مسافة اللون
    const dist = (r1:number,g1:number,b1:number,r2:number,g2:number,b2:number) => {
      const dr=r1-r2, dg=g1-g2, db=b1-b2;
      return Math.sqrt(dr*dr+dg*dg+db*db);
    };

    // احسب متوسط لون الزوايا (منطقة 10x10 من كل زاوية)
    function avgCorner(x0:number, y0:number, w:number, h:number){
      let sr=0, sg=0, sb=0, c=0;
      for(let y=y0; y<y0+h; y++){
        for(let x=x0; x<x0+w; x++){
          const idx = (y*width + x) * 4;
          sr += data[idx]; sg += data[idx+1]; sb += data[idx+2]; c++;
        }
      }
      return [sr/c, sg/c, sb/c] as [number,number,number];
    }

    const sample = 10;
    const c1 = avgCorner(0, 0, sample, sample);
    const c2 = avgCorner(width-sample, 0, sample, sample);
    const c3 = avgCorner(0, height-sample, sample, sample);
    const c4 = avgCorner(width-sample, height-sample, sample, sample);
    const bg = [
      (c1[0]+c2[0]+c3[0]+c4[0])/4,
      (c1[1]+c2[1]+c3[1]+c4[1])/4,
      (c1[2]+c2[2]+c3[2]+c4[2])/4,
    ] as [number,number,number];

    // عتبات الإزالة والتدرج (feather)
    const threshold = 60; // كلما زادت كان الإزالة أشد
    const feather = 20;   // نطاق تدرّج الألفا حول العتبة

    // عدّل ألفا البكسلات
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r=d[i], g=d[i+1], b=d[i+2];
      const distance = dist(r,g,b,bg[0],bg[1],bg[2]);
      if (distance <= threshold) {
        d[i+3] = 0; // شفاف بالكامل
      } else if (distance <= threshold + feather) {
        const t = (distance - threshold) / feather; // 0..1
        d[i+3] = Math.min(255, Math.max(0, Math.round(255 * t)));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // حوّل إلى PNG مع ألفا
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => b ? resolve(b) : reject(new Error('فشل إنشاء الصورة')), 'image/png');
    });
    return new File([blob], `${Date.now()}_bg_removed.png`, { type: 'image/png' });
  }

  // رافع صورة مع إزالة الخلفية ورفعها إلى Supabase
  const handleImageUploadRemoveBg = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setRemovingBackground(true);
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');

      // قلل الحجم أولاً إذا لزم
      const resized = await resizeImageIfNeeded(file, 150);
      // أزل الخلفية
      const processed = await removeBackgroundFromFile(resized);

      const fileExt = processed.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('services')
        .upload(fileName, processed, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);
      setNewService(prev => ({ ...prev, image_url: publicUrl }));
      setSuccessMsg('تمت إزالة الخلفية ورفع الصورة بنجاح!');
    } catch (err: any) {
      setError(`تعذر إزالة الخلفية: ${err.message}`);
    } finally {
      setRemovingBackground(false);
      // امسح قيمة المدخل حتى يمكن اختيار نفس الملف لاحقاً
      event.target.value = '';
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await checkAuth();
        await fetchData();
        await fetchStoreSettings();
        await fetchLogoUrl();
        await fetchTestimonials();
      } catch (err: any) {
        toast.error(`خطأ أثناء التهيئة: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);
  
  // UseEffect for showing toasts
  useEffect(() => {
    if (error) {
        toast.error(error);
        setError(null); // Reset error after showing
    }
  }, [error]);

  useEffect(() => {
    if (successMsg) {
        toast.success(successMsg);
        setSuccessMsg(null); // Reset success message after showing
    }
  }, [successMsg]);


  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/admin/login');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`*, category:categories(*), sizes:product_sizes(*)`)
        .order('created_at', { ascending: false });
      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      const { data: subcatsData, error: subcatsError } = await supabase
        .from('subcategories')
        .select('*')
        .order('created_at', { ascending: false });
      if (subcatsError) throw subcatsError;
      setSubcategories(subcatsData || []);

      const { data: bannersData, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      if (bannersError) throw bannersError;
      setBanners(bannersData || []);
    } catch (err: any) {
      setError(`خطأ في جلب البيانات: ${err.message}`);
      setCategories([]);
      setServices([]);
      setBanners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogoUrl = async () => {
    const { data } = supabase.storage.from('services').getPublicUrl('logo.svg');
    if (data?.publicUrl) {
      try {
        const response = await fetch(data.publicUrl, { method: 'HEAD' });
        if (response.ok) {
          setLogoUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
        } else {
          setLogoUrl(null);
        }
      } catch (fetchError) {
        console.warn("لم يتم العثور على الشعار الحالي:", fetchError);
        setLogoUrl(null);
      }
    } else {
      setLogoUrl(null);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const { data: allRows, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', STORE_SETTINGS_ID);

      if (error) {
        setError(`خطأ في جلب إعدادات المتجر: ${error.message}`);
        return;
      }

      if (allRows && allRows.length > 0) {
        setStoreSettings(sanitizeStoreSettings(allRows[0] as StoreSettings));
      } else {
        // Initialize with default values if no settings are found
        setStoreSettings({
          id: STORE_SETTINGS_ID,
          store_name: '',
          store_description: '',
          logo_url: '',
          favicon_url: '',
          og_image_url: '',
          meta_title: '',
          meta_description: '',
          keywords: [],
          facebook_url: '',
          instagram_url: '',
          twitter_url: '',
          snapchat_url: '',
          tiktok_url: '',
          updated_at: '',
          show_testimonials: false
        });
      }
    } catch (err: any) {
      setError(`خطأ في جلب إعدادات المتجر: ${err.message}`);
    }
  };

  const handleStoreSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({
          store_name: storeSettings.store_name,
          store_description: storeSettings.store_description,
          logo_url: storeSettings.logo_url,
          favicon_url: storeSettings.favicon_url,
          og_image_url: storeSettings.og_image_url,
          meta_title: storeSettings.meta_title,
          meta_description: storeSettings.meta_description,
          keywords: storeSettings.keywords,
          facebook_url: storeSettings.facebook_url,
          instagram_url: storeSettings.instagram_url,
          twitter_url: storeSettings.twitter_url,
          snapchat_url: storeSettings.snapchat_url,
          tiktok_url: storeSettings.tiktok_url
        })
        .eq('id', storeSettings.id);

      if (error) throw error;
      setSuccessMsg("تم تحديث إعدادات المتجر بنجاح!");
      onSettingsUpdate?.();
    } catch (err: any) {
      setError(`خطأ في تحديث إعدادات المتجر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'og_image'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('الرجاء اختيار ملف صورة صالح');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage.from('services').upload(fileName, file, {
        cacheControl: '0',
        upsert: true
      });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);

      setStoreSettings(prev => ({
        ...prev,
        [type === 'logo' ? 'logo_url' : type === 'favicon' ? 'favicon_url' : 'og_image_url']: publicUrl
      }));
      setSuccessMsg(`تم رفع ${type} بنجاح!`);

    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'og_image' | 'service' | 'banner'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadingStateSetters = {
      logo: setUploadingLogo,
      favicon: setUploadingFavicon,
      og_image: setUploadingOgImage,
      service: setUploadingImage,
      banner: setUploadingBannerImage
    };

    const setUploading = uploadingStateSetters[type];
    setUploading(true);
    
    try {
      if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
      const maxSize = type === 'favicon' ? 150 * 1024 : 150 * 1024;
      if (file.size > maxSize) {
        throw new Error(`حجم الصورة يجب أن لا يتجاوز ${maxSize / 1024} كيلوبايت`);
      }
      const fileExt = file.name.split('.').pop();
      const fileName = type === 'logo' ? 'logo.svg' :
        type === 'favicon' ? 'favicon.png' :
        type === 'og_image' ? 'og-image.png' :
        `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);

      if (type === 'logo') {
        setLogoUrl(publicUrl);
        setStoreSettings(prev => ({ ...prev, logo_url: publicUrl }));
      } else if (type === 'favicon') {
        setStoreSettings(prev => ({ ...prev, favicon_url: publicUrl }));
      } else if (type === 'og_image') {
        setStoreSettings(prev => ({ ...prev, og_image_url: publicUrl }));
      } else if (type === 'service') {
        setNewService(prev => ({ ...prev, image_url: publicUrl }));
      } else if (type === 'banner') {
        setNewBanner(prev => ({ ...prev, image_url: publicUrl }));
      }
      setSuccessMsg("تم رفع الصورة بنجاح!");
    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      setKeywords(prev => [...prev, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setKeywords(prev => prev.filter((_, index) => index !== indexToRemove));
  };
    
  // دالة لضغط وتصغير الصورة إذا تجاوزت 150 كيلو
  async function resizeImageIfNeeded(file: File, maxSizeKB = 150): Promise<File> {
    if (file.size <= maxSizeKB * 1024) return file;
    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const reader = new FileReader();
        reader.onload = (e) => {
        img.onload = () => {
            let [w, h] = [img.width, img.height];
            // تصغير الأبعاد تدريجياً حتى يقل الحجم
            let quality = 0.92;
            const canvas = document.createElement('canvas');
            function process() {
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, w, h);
            canvas.toBlob(
                (blob) => {
                if (!blob) return reject(new Error('فشل ضغط الصورة'));
                if (blob.size <= maxSizeKB * 1024 || (w < 300 || h < 300)) {
                    resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), { type: 'image/webp' }));
                } else {
                    // قلل الأبعاد والجودة أكثر
                    w = Math.round(w * 0.85);
                    h = Math.round(h * 0.85);
                    quality -= 0.07;
                    process();
                }
                },
                file.type,
                quality
            );
            }
            process();
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'service' | 'banner' = 'service') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadingState = type === 'service' ? setUploadingImage : setUploadingBannerImage;
    const setNewState = type === 'service' ? setNewService : setNewBanner;

    uploadingState(true);
    try {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/webm')) {
        throw new Error('الرجاء اختيار ملف صورة صالح أو فيديو بصيغة WEBM');
      }
      
      let fileToUpload: File;

      if (file.type.startsWith('image/')) {
        fileToUpload = await resizeImageIfNeeded(file, 150);
      } else {
        // For video files (webm), skip resizing
        fileToUpload = file;
      }

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the final processed file (either original resized or background-removed)
      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, fileToUpload);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
      
      setNewState(prev => ({ ...prev, image_url: publicUrl }));
      setSuccessMsg("تم رفع الملف بنجاح!");

    } catch (err: any) {
      setError(`خطأ في رفع الملف: ${err.message}`);
      setNewState(prev => ({ ...prev, image_url: '' }));
    } finally {
      uploadingState(false);
    }
  };

  

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError("اسم القسم مطلوب.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('categories').insert([newCategory]);
      if (error) throw error;
      setNewCategory({ name: '', description: '' });
      await fetchData();
      setSuccessMsg("تمت إضافة القسم بنجاح!");
    } catch (err: any) {
      setError(`خطأ في إضافة القسم: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category.id);
    setNewCategory({ name: category.name, description: category.description || '' });
    const formElement = document.getElementById('category-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCategory.name.trim()) {
      setError("اسم القسم مطلوب.");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: newCategory.name, description: newCategory.description })
        .eq('id', editingCategory);
      if (error) throw error;

      setNewCategory({ name: '', description: '' });
      setEditingCategory(null);
      await fetchData();
      setSuccessMsg("تم تحديث القسم بنجاح!");
    } catch (err: any) {
      setError(`خطأ في تحديث القسم: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
  };

  const handleDeleteConfirmation = async () => {
    if (!deleteModal) return;

    setIsLoading(true);
    try {
      let message = "";
      if (deleteModal.type === 'category') {
        // First delete associated services
        await supabase.from('services').delete().eq('category_id', deleteModal.id);
        // Then delete the category
        await supabase.from('categories').delete().eq('id', deleteModal.id);
        message = "تم حذف القسم والمنتجات المرتبطة به.";
      } else if (deleteModal.type === 'service') {
        await supabase.from('services').delete().eq('id', deleteModal.id);
        message = "تم حذف المنتج بنجاح.";
      } else if (deleteModal.type === 'banner') {
        await supabase.from('banners').delete().eq('id', deleteModal.id);
        message = "تم حذف البانر بنجاح.";
      } else if (deleteModal.type === 'subcategory') {
        await supabase.from('services').update({ subcategory_id: null }).eq('subcategory_id', deleteModal.id);
        await supabase.from('subcategories').delete().eq('id', deleteModal.id);
        message = "تم حذف التصنيف الفرعي بنجاح.";
      }

      setDeleteModal(null);
      await fetchData();
      setSuccessMsg(message);
    } catch (err: any) {
      setError(`خطأ أثناء الحذف: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = (id: string) => setDeleteModal({ id, type: 'category' });
  const handleDeleteService = (id: number) => setDeleteModal({ id, type: 'service' });
  const handleDeleteBanner = (id: string) => setDeleteModal({ id, type: 'banner' });
  const handleDeleteSubcategory = (id: string) => setDeleteModal({ id, type: 'subcategory' });
  
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !newService.title.trim()) {
        setError("يجب اختيار قسم وتحديد عنوان للمنتج.");
        return;
    }
    setIsLoading(true);
    try {
        const { ...serviceData } = newService;
        
        let serviceToAdd: Partial<Service> = {
            ...serviceData,
            category_id: selectedCategory,
            subcategory_id: selectedSubcategory || null,
            is_featured: newService.is_featured || false,
            is_best_seller: newService.is_best_seller || false,
        };

        if (!newService.has_weight_pricing) {
          serviceToAdd.price = newService.price;
          serviceToAdd.sale_price = newService.sale_price;
        } else {
          serviceToAdd.price = null;
          serviceToAdd.sale_price = null;
        }

        const { data: service, error } = await supabase.from('services').insert([serviceToAdd]).select();

        if (error) throw error;

        // Reset form
        setNewService({
            title: '',
            description: '',
            image_url: '',
            category_id: '',
            gallery: [],
            is_featured: false,
            is_best_seller: false,
            has_weight_pricing: false,
            price_per_kg: null,
            sale_price_per_kg: null,
            price: 0,
            sale_price: null,
        });
        setSelectedCategory('');
        setSelectedSubcategory('');
        await fetchData();
        setSuccessMsg('تمت إضافة المنتج بنجاح');
    } catch (err: any) {
        setError(`خطأ في إضافة المنتج: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  const handleEditService = (service: Service) => {
    const isAlreadyEditing = editingService === service.id;
    if (isAlreadyEditing) {
      setEditingService(null);
      return;
    }

    setEditingService(service.id);
    setEditServiceData({
      title: service.title || '',
      description: service.description || '',
      image_url: service.image_url || '',
      category_id: service.category_id || '',
      // @ts-ignore
      subcategory_id: (service as any).subcategory_id || '',
      gallery: Array.isArray(service.gallery) ? service.gallery : [],
      is_featured: service.is_featured || false,
      is_best_seller: service.is_best_seller || false,
      has_weight_pricing: service.has_weight_pricing || false,
      price_per_kg: service.price_per_kg || null,
      sale_price_per_kg: service.sale_price_per_kg || null,
      price: service.price || 0,
      sale_price: service.sale_price || null,
    });
    setEditRemoveBgSwitch(false);
    setEditOriginalImageUrl(service.image_url || null);

    // Scroll smoothly to this product card in the list
    setTimeout(() => {
      const cardEl = document.getElementById(`service-card-${service.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleEditServiceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEditUploadingImage(true);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('الرجاء اختيار ملف صورة صالح');
      }
      const fileToUpload = await resizeImageIfNeeded(file, 150);
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('services').upload(filePath, fileToUpload);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
      setEditServiceData(prev => ({ ...prev, image_url: publicUrl }));
      setEditRemoveBgSwitch(false);
      setEditOriginalImageUrl(publicUrl);
      setSuccessMsg("تم رفع الصورة بنجاح!");
    } catch (err: any) {
      setError(`خطأ في رفع الصورة: ${err.message}`);
    } finally {
      setEditUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleEditToggleRemoveBgSwitch = async (checked: boolean) => {
    if (!editServiceData.image_url) return;
    if (checked) {
      setEditRemovingBg(true);
      try {
        if (!editOriginalImageUrl) setEditOriginalImageUrl(editServiceData.image_url);
        const processed = await removeBackgroundFromImageUrl(editServiceData.image_url);
        const fileExt = processed.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processed, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);
        setEditServiceData(prev => ({ ...prev, image_url: publicUrl }));
        setEditRemoveBgSwitch(true);
        setSuccessMsg('تم تحويل الصورة إلى خلفية شفافة');
      } catch (err: any) {
        setEditRemoveBgSwitch(false);
        setError(`تعذر إزالة الخلفية: ${err.message}`);
      } finally {
        setEditRemovingBg(false);
      }
    } else {
      if (editOriginalImageUrl) {
        setEditServiceData(prev => ({ ...prev, image_url: editOriginalImageUrl }));
      }
      setEditRemoveBgSwitch(false);
    }
  };

  const handleEditGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setEditUploadingGallery(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const processedFile = await resizeImageIfNeeded(file, 150);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processedFile, { upsert: true });
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setEditServiceData(prev => {
        const gallery = [...(prev.gallery || []), ...uploadedUrls].filter(Boolean);
        const filteredGallery = Array.from(new Set(gallery)).filter(img => img !== prev.image_url);
        return { ...prev, gallery: filteredGallery };
      });
      if (uploadedUrls.length > 0) setSuccessMsg(`تم رفع ${uploadedUrls.length} صورة بنجاح!`);
    } catch (err: any) {
      setError(`خطأ في رفع الصور: ${err.message}`);
    } finally {
      setEditUploadingGallery(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editServiceData.category_id || !editServiceData.title.trim()) {
      setError("يجب اختيار قسم وتحديد عنوان للمنتج.");
      return;
    }
    setIsLoading(true);
    const updatedId = editingService;
    try {
      let serviceToUpdate: Partial<Service> = {
        title: editServiceData.title,
        description: editServiceData.description,
        image_url: editServiceData.image_url,
        category_id: editServiceData.category_id,
        // @ts-ignore
        subcategory_id: editServiceData.subcategory_id || null,
        gallery: editServiceData.gallery,
        is_featured: editServiceData.is_featured || false,
        is_best_seller: editServiceData.is_best_seller || false,
        has_weight_pricing: editServiceData.has_weight_pricing || false,
      };

      if (!editServiceData.has_weight_pricing) {
        serviceToUpdate.price = editServiceData.price;
        serviceToUpdate.sale_price = editServiceData.sale_price;
        serviceToUpdate.price_per_kg = null;
        serviceToUpdate.sale_price_per_kg = null;
      } else {
        serviceToUpdate.price = null;
        serviceToUpdate.sale_price = null;
        serviceToUpdate.price_per_kg = editServiceData.price_per_kg;
        serviceToUpdate.sale_price_per_kg = editServiceData.sale_price_per_kg;
      }

      const { error } = await supabase
        .from('services')
        .update(serviceToUpdate)
        .eq('id', updatedId);
      if (error) throw error;

      setEditingService(null);
      await fetchData();
      setSuccessMsg("تم تحديث المنتج بنجاح!");

      // Highlight the updated product and ensure viewport is aligned with it
      setHighlightedServiceId(updatedId);
      setTimeout(() => {
        const cardEl = document.getElementById(`service-card-${updatedId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setTimeout(() => {
        setHighlightedServiceId(null);
      }, 3500);
    } catch (err: any) {
      setError(`خطأ في تحديث المنتج: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = (serviceId?: number) => {
    const targetId = serviceId || editingService;
    setEditingService(null);
    if (targetId) {
      setTimeout(() => {
        const cardEl = document.getElementById(`service-card-${targetId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleToggleServiceAvailability = async (serviceId: number, nextIsAvailable: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_available: nextIsAvailable })
        .eq('id', serviceId);
      if (error) throw error;

      setServices(prev => prev.map(s => (s.id === serviceId ? { ...s, is_available: nextIsAvailable } : s)));
      setSuccessMsg(nextIsAvailable ? 'تم جعل المنتج متوفر' : 'تم جعل المنتج غير متوفر');
    } catch (err: any) {
      setError(`خطأ في تحديث حالة المنتج: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Subcategories CRUD
  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategory.category_id || !newSubcategory.name_ar.trim()) {
      setError('يجب اختيار قسم وكتابة اسم للتصنيف الفرعي');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from('subcategories').insert([{
        category_id: newSubcategory.category_id,
        name_ar: newSubcategory.name_ar,
        description_ar: newSubcategory.description_ar || null,
      }]);
      if (error) throw error;
      setNewSubcategory({ category_id: '', name_ar: '', description_ar: '' });
      await fetchData();
      setSuccessMsg('تم إضافة التصنيف الفرعي بنجاح');
    } catch (err: any) {
      setError(`خطأ في إضافة التصنيف الفرعي: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubcategory = (subcat: Subcategory) => {
    setEditingSubcategory(subcat.id);
    setNewSubcategory({
      category_id: subcat.category_id,
      name_ar: (subcat as any).name_ar || (subcat as any).name || '',
      description_ar: (subcat as any).description_ar || (subcat as any).description || '',
    });
    const formElement = document.getElementById('subcategory-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory || !newSubcategory.category_id || !newSubcategory.name_ar.trim()) {
      setError('يجب اختيار قسم وكتابة اسم للتصنيف الفرعي');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({
          category_id: newSubcategory.category_id,
          name_ar: newSubcategory.name_ar,
          description_ar: newSubcategory.description_ar || null,
        })
        .eq('id', editingSubcategory);
      if (error) throw error;
      setNewSubcategory({ category_id: '', name_ar: '', description_ar: '' });
      setEditingSubcategory(null);
      await fetchData();
      setSuccessMsg('تم تحديث التصنيف الفرعي بنجاح');
    } catch (err: any) {
      setError(`خطأ في تحديث التصنيف الفرعي: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditSubcategory = () => {
    setEditingSubcategory(null);
    setNewSubcategory({ category_id: '', name_ar: '', description_ar: '' });
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBanner.type === 'text' && !newBanner.title?.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }
    if (newBanner.type === 'strip' && !newBanner.title?.trim()) {
      setError("عنوان البانر الشريطي مطلوب.");
      return;
    }
    setIsLoading(true);
    try {
      const bannerData: any = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: true
      };

      // Only add strip properties if type is strip
      if (newBanner.type === 'strip') {
        bannerData.strip_text_color = newBanner.strip_text_color || '#ffffff';
        bannerData.strip_background_color = newBanner.strip_background_color || '#b8860b';
        bannerData.strip_position = newBanner.strip_position || 'below_main';
      }

      const { error } = await supabase.from('banners').insert([bannerData]);
      if (error) {
        // If strip columns don't exist, try without them
        if (error.message.includes('strip_background_color')) {
          console.log('Strip columns not available, creating banner without strip properties');
          const basicBannerData = {
            type: newBanner.type,
            title: newBanner.title || null,
            description: newBanner.description || null,
            image_url: newBanner.image_url || null,
            is_active: true
          };
          const { error: basicError } = await supabase.from('banners').insert([basicBannerData]);
          if (basicError) throw basicError;
        } else {
          throw error;
        }
      }

      setNewBanner({
        type: bannersSubTab, // Keep the current sub-tab type
        title: '',
        description: '',
        image_url: '',
        strip_text_color: '#ffffff',
        strip_background_color: '#b8860b',
        strip_position: 'below_main'
      });
      await fetchData();
      setSuccessMsg("تمت إضافة البانر بنجاح!");
    } catch (err: any) {
      setError(`خطأ في إضافة البانر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBanner = (banner: Banner) => {
    setEditingBanner(banner.id);
    setNewBanner({
      type: banner.type,
      title: banner.title || '',
      description: banner.description || '',
      image_url: banner.image_url || '',
      is_active: banner.is_active,
      strip_text_color: banner.strip_text_color || '#ffffff',
      strip_background_color: banner.strip_background_color || '#2a2a2a',
      strip_position: banner.strip_position || 'below_main'
    });
    const formElement = document.getElementById('banner-form');
    formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    if (newBanner.type === 'text' && !newBanner.title?.trim()) {
      setError("عنوان البانر مطلوب للنوع النصي.");
      return;
    }
    if (newBanner.type === 'image' && !newBanner.image_url) {
      setError("صورة البانر مطلوبة للنوع المصور.");
      return;
    }
    if (newBanner.type === 'strip' && !newBanner.title?.trim()) {
      setError("عنوان البانر الشريطي مطلوب.");
      return;
    }

    setIsLoading(true);
    try {
      const bannerData: any = {
        type: newBanner.type,
        title: newBanner.title || null,
        description: newBanner.description || null,
        image_url: newBanner.image_url || null,
        is_active: newBanner.is_active
      };

      // Only add strip properties if type is strip
      if (newBanner.type === 'strip') {
        bannerData.strip_text_color = newBanner.strip_text_color || '#ffffff';
        bannerData.strip_background_color = newBanner.strip_background_color || '#b8860b';
        bannerData.strip_position = newBanner.strip_position || 'below_main';
      }

      const { error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', editingBanner);
      if (error) {
        // If strip columns don't exist, try without them
        if (error.message.includes('strip_background_color')) {
          console.log('Strip columns not available, updating banner without strip properties');
          const basicBannerData = {
            type: newBanner.type,
            title: newBanner.title || null,
            description: newBanner.description || null,
            image_url: newBanner.image_url || null,
            is_active: newBanner.is_active
          };
          const { error: basicError } = await supabase
            .from('banners')
            .update(basicBannerData)
            .eq('id', editingBanner);
          if (basicError) throw basicError;
        } else {
          throw error;
        }
      }

      setNewBanner({
        type: bannersSubTab,
        title: '',
        description: '',
        image_url: '',
        strip_text_color: '#ffffff',
        strip_background_color: '#b8860b',
        strip_position: 'below_main'
      });
      setEditingBanner(null);
      await fetchData();
      setSuccessMsg("تم تحديث البانر بنجاح!");
    } catch (err: any) {
      setError(`خطأ في تحديث البانر: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEditBanner = () => {
    setEditingBanner(null);
    setNewBanner({
      type: bannersSubTab,
      title: '',
      description: '',
      image_url: '',
      strip_text_color: '#ffffff',
      strip_background_color: '#2a2a2a',
      strip_position: 'below_main'
    });
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
    navigate('/admin/login');
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const processedFile = await resizeImageIfNeeded(file, 150);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('services')
          .upload(fileName, processedFile, { upsert: true });
        if (uploadError) {
            toast.warn(`فشل رفع الصورة: ${file.name}`);
            continue;
        }
        const { data: { publicUrl } } = supabase.storage
          .from('services')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
      setNewService(prev => {
        const gallery = [...(prev.gallery || []), ...uploadedUrls].filter(Boolean);
        const filteredGallery = Array.from(new Set(gallery)).filter(img => img !== prev.image_url);
        return { ...prev, gallery: filteredGallery };
      });
      if(uploadedUrls.length > 0) setSuccessMsg(`تم رفع ${uploadedUrls.length} صورة بنجاح!`);
    } catch (err: any) {
      setError(`خطأ في رفع الصور: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUploadTestimonial = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTestimonialImage(true);
    setIsLoading(true);
    try {
        if (!file.type.startsWith('image/')) throw new Error('الرجاء اختيار ملف صورة صالح');
        const processedFile = await resizeImageIfNeeded(file, 150);
        const fileExt = processedFile.name.split('.').pop();
        const fileName = `testimonial_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('testimonials')
            .upload(fileName, processedFile, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('testimonials').getPublicUrl(fileName);
        
        // Insert the new testimonial with the public URL
        const { error: insertError } = await supabase
            .from('testimonials')
            .insert([{ image_url: publicUrl, is_active: true }]); // Assuming is_active is true by default
        if (insertError) throw insertError;
        
        setNewTestimonial({ image_url: '' }); // Reset form
        await fetchTestimonials(); // Refresh the list
        setSuccessMsg("تمت إضافة رأي العميل بنجاح!");
    } catch (err: any) {
        setError(`خطأ في رفع الصورة أو حفظ الرأي: ${err.message}`);
    } finally {
        setUploadingTestimonialImage(false);
        setIsLoading(false);
    }
  }

  // Filtered services based on category, subcategory, and search query
  const hasFeaturedProducts = services.some(s => s.is_featured);
  const hasBestSellerProducts = services.some(s => s.is_best_seller);

  const filteredServices = services.filter((service) => {
    // 1. Filter by category or special tabs (featured / best_sellers)
    if (productCategoryFilter === 'featured') {
      if (!service.is_featured) return false;
    } else if (productCategoryFilter === 'best_sellers') {
      if (!service.is_best_seller) return false;
    } else if (productCategoryFilter !== 'all') {
      if (service.category_id !== productCategoryFilter) return false;
      // 2. Filter by subcategory if one is selected
      if (productSubcategoryFilter && service.subcategory_id !== productSubcategoryFilter) {
        return false;
      }
    }

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = service.title ? service.title.toLowerCase().includes(q) : false;
      const matchDesc = service.description ? service.description.toLowerCase().includes(q) : false;
      const categoryName = categories.find(c => c.id === service.category_id)?.name || '';
      const matchCat = categoryName.toLowerCase().includes(q);
      const subcatName = subcategories.find(sc => sc.id === service.subcategory_id)?.name || (service as any).subcategory?.name_ar || '';
      const matchSubcat = subcatName ? subcatName.toLowerCase().includes(q) : false;

      if (!matchTitle && !matchDesc && !matchCat && !matchSubcat) {
        return false;
      }
    }

    return true;
  });

  if (isLoading && categories.length === 0 && services.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-xl mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-[Cairo] relative"
      style={{
        background: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        color: "#fff"
      }}
      dir="rtl"
    >
      <ToastContainer 
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{ 
          backgroundColor: '#1f2937',
          color: '#fff',
          borderRadius: '8px',
          border: '1px solid #4b5563',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
      />

      {/* Fixed Home Button - Bottom Left */}
      <button
        onClick={() => navigate('/')}
        className="fixed left-6 bottom-6 z-50 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 border border-white/30"
        title="العودة للصفحة الرئيسية"
      >
        <Home size={24} />
      </button>

      {/* Scroll to Top Button - Bottom Right */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-6 bottom-6 z-50 bg-black hover:bg-gray-900 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        title="الصعود لأعلى"
      >
        <ArrowUp size={16} />
      </button>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">تأكيد الحذف</h2>
            <p className="text-gray-300 mb-6">
              {deleteModal.type === 'category'
                ? 'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المنتجات المرتبطة به بشكل نهائي.'
                : deleteModal.type === 'banner'
                ? 'هل أنت متأكد من حذف هذا البانر؟'
                : 'هل أنت متأكد من حذف هذا المنتج؟'}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteConfirmation}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/60 backdrop-blur-sm shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className={`text-2xl font-bold text-blue-400`}>لوحة التحكم</h1>
          {isLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>}
          <button
            onClick={handleLogout}
            className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800 transition-colors font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            تسجيل خروج
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Side Tabs */}
          <div className="md:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'products'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Package className="h-5 w-5" />
              <span>إدارة المنتجات</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'banners'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Image className="h-5 w-5" />
              <span>البانرات</span>
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'testimonials'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <List className="h-5 w-5" />
              <span>آراء العملاء</span>
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all duration-300 transform
                ${activeTab === 'store'
                  ? 'bg-blue-500 text-white shadow-lg -translate-y-1'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <Store className="h-5 w-5" />
              <span>إعدادات المتجر</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {/* Header for Products, Banners, Testimonials, Store */}
            <div className="mb-8 p-6 bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {activeTab === 'products' && <><Package className="w-7 h-7 text-blue-400" /> إدارة المنتجات</>}
                            {activeTab === 'banners' && <><Image className="w-7 h-7 text-blue-400" /> إدارة البانرات</>}
                            {activeTab === 'testimonials' && <><List className="w-7 h-7 text-blue-400" /> إدارة آراء العملاء</>}
                            {activeTab === 'store' && <><Store className="w-7 h-7 text-blue-400" /> إعدادات المتجر</>}
                        </h2>
                        <p className="text-gray-400 mt-1 text-sm">
                            {activeTab === 'products' && 'إدارة المنتجات والأقسام المرتبطة بها.'}
                            {activeTab === 'banners' && 'يمكنك إضافة بانر نصي أو صور أو شريطي.'}
                            {activeTab === 'testimonials' && 'إدارة وتعديل آراء وتقييمات العملاء.'}
                            {activeTab === 'store' && 'تعديل إعدادات المتجر والمعلومات العامة.'}
                        </p>
                    </div>
                     <div className="flex items-center gap-2 text-xs font-bold">
                        {activeTab === 'products' && <>
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{services.length} منتج</span>
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{categories.length} قسم</span>
                        </>}
                        {activeTab === 'banners' && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{banners.length} بانر</span>}
                        {activeTab === 'testimonials' && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">{testimonials.length} رأي</span>}
                    </div>
                </div>
            </div>

            {activeTab === 'testimonials' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">إعدادات قسم آراء العملاء</h2>
                        <div className="flex items-center gap-3">
                            <label htmlFor="toggle-testimonials" className="text-white font-semibold cursor-pointer">إظهار القسم في الموقع</label>
                            <input
                                id="toggle-testimonials"
                                type="checkbox"
                                checked={!!storeSettings.show_testimonials}
                                onChange={async (e) => {
                                    const newValue = e.target.checked;
                                    setStoreSettings((prev) => ({ ...prev, show_testimonials: newValue }));
                                    try {
                                        setIsLoading(true);
                                        const { error } = await supabase
                                            .from('store_settings')
                                            .update({ show_testimonials: newValue })
                                            .eq('id', STORE_SETTINGS_ID);
                                        if (error) throw error;
                                        setSuccessMsg(newValue ? 'تم تفعيل قسم آراء العملاء' : 'تم إخفاء قسم آراء العملاء');
                                        localStorage.setItem('storeSettingsUpdated', Date.now().toString());
                                        if (onSettingsUpdate) onSettingsUpdate();
                                    } catch (err: any) {
                                        setError('خطأ في تحديث حالة قسم آراء العملاء: ' + err.message);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="w-5 h-5 accent-blue-500 cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <div className="mb-8">
                        <label htmlFor="testimonial-upload" className="w-full flex items-center justify-center gap-2 p-4 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700/50 hover:border-blue-500 transition-colors">
                            <Upload className="w-6 h-6 text-blue-400"/>
                            <span className="text-white font-semibold">
                                {uploadingTestimonialImage ? 'جاري الرفع...' : 'انقر هنا لرفع صورة رأي جديد'}
                            </span>
                        </label>
                        <input
                            type="file"
                            id="testimonial-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUploadTestimonial}
                            disabled={uploadingTestimonialImage || isLoading}
                        />
                    </div>

                    <div className="space-y-3">
                        {isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4">جاري تحميل الآراء...</p>}
                        {!isLoading && testimonials.length === 0 && <p className="text-gray-400 text-center mt-4">لا توجد آراء لعرضها.</p>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {testimonials.map((t: Testimonial) => (
                                <div key={t.id} className="relative group border border-gray-700 rounded-lg overflow-hidden">
                                    <img src={t.image_url} alt="testimonial" className="w-full h-40 object-cover bg-white" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <button
                                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const { error } = await supabase.from('testimonials').delete().eq('id', t.id);
                                                    if (error) throw error;
                                                    await fetchTestimonials();
                                                    setSuccessMsg("تم حذف الرأي بنجاح.");
                                                } catch (err: any) {
                                                    setError('خطأ في حذف الرأي: ' + err.message);
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <Trash2 size={20}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'store' && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
                    <div className="p-6">
                        <form onSubmit={handleStoreSettingsUpdate} className="space-y-6">
                            {/* Social Media Links */}
                            <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">روابط التواصل الاجتماعي</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط فيسبوك</label>
                                    <input
                                    type="url"
                                    value={storeSettings.facebook_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, facebook_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://facebook.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط انستغرام</label>
                                    <input
                                    type="url"
                                    value={storeSettings.instagram_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, instagram_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://instagram.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط تويتر</label>
                                    <input
                                    type="url"
                                    value={storeSettings.twitter_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, twitter_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://twitter.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط سناب شات</label>
                                    <input
                                    type="url"
                                    value={storeSettings.snapchat_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, snapchat_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://snapchat.com/..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">رابط تيك توك</label>
                                    <input
                                    type="url"
                                    value={storeSettings.tiktok_url || ''}
                                    onChange={(e) => setStoreSettings({ ...storeSettings, tiktok_url: e.target.value })}
                                    className="w-full p-2 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://tiktok.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-700">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                                >
                                    <Save className="w-5 h-5" />
                                    {isLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {activeTab === 'banners' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="p-6">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button
                      onClick={() => {setBannersSubTab('image'); setNewBanner({type: 'image'})}}
                      className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${ bannersSubTab === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >بانرات صور</button>
                    <button
                      onClick={() => {setBannersSubTab('text'); setNewBanner({type: 'text'})}}
                      className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${ bannersSubTab === 'text' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >بانرات نصية</button>
                    <button
                      onClick={() => {setBannersSubTab('strip'); setNewBanner({type: 'strip'})}}
                      className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${ bannersSubTab === 'strip' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                    >بانرات شريطية</button>
                  </div>
                  
                  <form id="banner-form" onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner} className="mb-10 space-y-4">
                    {bannersSubTab === 'text' && (
                      <>
                        <input
                          type="text"
                          placeholder="عنوان البانر"
                          value={newBanner.title || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', title: e.target.value })}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                        <textarea
                          placeholder="وصف البانر (اختياري)"
                          value={newBanner.description || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'text', description: e.target.value })}
                          rows={3}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </>
                    )}
                    {bannersSubTab === 'strip' && (
                      <>
                        <input
                          type="text"
                          placeholder="عنوان البانر الشريطي"
                          value={newBanner.title || ''}
                          onChange={(e) => setNewBanner({ ...newBanner, type: 'strip', title: e.target.value })}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">لون النص</label>
                            <input
                              type="color"
                              value={newBanner.strip_text_color || '#ffffff'}
                              onChange={(e) => setNewBanner({ ...newBanner, strip_text_color: e.target.value })}
                              className="w-full h-10 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">لون الخلفية</label>
                            <input
                              type="color"
                              value={newBanner.strip_background_color || '#b8860b'}
                              onChange={(e) => setNewBanner({ ...newBanner, strip_background_color: e.target.value })}
                              className="w-full h-10 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">موضع البانر</label>
                          <select
                            value={newBanner.strip_position || 'below_main'}
                            onChange={(e) => setNewBanner({ ...newBanner, strip_position: e.target.value as 'above_main' | 'below_main' })}
                            className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                          >
                            <option value="below_main">أسفل البانر الرئيسي</option>
                            <option value="above_main">فوق البانر الرئيسي</option>
                          </select>
                        </div>
                      </>
                    )}
                    {bannersSubTab === 'image' && (
                      <div>
                        <div className="flex justify-start mb-2 gap-1">
                          <a 
                            id="canva-banner-button"
                            href="https://www.canva.com/design/DAGxiEhNhbw/eXR_AZsWGumCY5a4NrCYiw/edit?utm_content=DAGxiEhNhbw&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-l from-blue-800 to-purple-800 text-white hover:from-blue-600 hover:to-purple-800 transition-all flex items-center gap-0.5"
                            title="إنشاء / تعديل بانر باستخدام كانفا"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
انشاء / تعديل بانر على كانفا                          </a>

                        </div>
                        <label htmlFor="banner-image-upload" className={`w-full flex flex-col items-center justify-center p-4 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700/50 hover:border-blue-500 transition-colors ${uploadingBannerImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <Upload className={`w-8 h-8 mb-2 text-blue-400 ${uploadingBannerImage ? 'animate-pulse' : ''}`} />
                            <span className="text-white font-semibold">{uploadingBannerImage ? 'جاري رفع الملف...' : (newBanner.image_url ? 'تغيير الملف' : 'اختر صورة أو فيديو (WEBM) للبانر')}</span>
                            <span className="text-xs text-gray-500 mt-1">المقاس الموصى به: 1920x700 بكسل (صور) أو فيديو WEBM</span>
                        </label>
                         <input
                          type="file"
                          accept="image/*,video/webm"
                          onChange={(e) => handleImageUpload(e, 'banner')}
                          className="hidden"
                          id="banner-image-upload"
                          disabled={uploadingBannerImage || isLoading}
                        />
                        {newBanner.image_url && !uploadingBannerImage && (
                          <div className="mt-3 flex items-center justify-center gap-4 bg-gray-900/50 p-2 rounded border border-gray-700">
                            {newBanner.image_url.endsWith('.webm') ? (
                              <video src={newBanner.image_url} className="w-24 h-auto object-cover rounded border border-gray-600" autoPlay loop muted playsInline />
                            ) : (
                              <img src={newBanner.image_url} alt="معاينة" className="w-24 h-auto object-cover rounded border border-gray-600" />
                            )}
                            <span className="text-gray-400 text-xs">ملف البانر الحالي/الجديد</span>
                            <button type="button" onClick={() => setNewBanner({...newBanner, image_url: ''})} className="text-red-500 hover:text-red-400 p-1" title="إزالة الملف"><X size={16}/></button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading}>
                        {editingBanner ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة بانر</>}
                      </button>
                      {editingBanner && (
                        <button type="button" onClick={handleCancelEditBanner} className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold" disabled={isLoading}>
                          <X size={20} /> إلغاء
                        </button>
                      )}
                    </div>
                  </form>
                  
                  <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">البانرات الحالية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!isLoading && banners.filter(b => b.type === bannersSubTab).length === 0 && <div className="col-span-full text-gray-400 text-center py-8">لا توجد بانرات من هذا النوع.</div>}
                    
                    {banners.filter(b => b.type === bannersSubTab).map((banner) => (
                      <div key={banner.id} className={`relative group border border-gray-700 rounded-lg bg-gray-900/50 shadow-lg overflow-hidden ${editingBanner === banner.id ? `ring-2 ring-blue-500` : ''}`}>
                        {banner.type === 'image' && banner.image_url ? (
                          banner.image_url.endsWith('.webm') ? (
                            <video src={banner.image_url} className="w-full h-32 object-cover" autoPlay loop muted playsInline />
                          ) : (
                            <img src={banner.image_url} alt={banner.title || 'صورة البانر'} className="w-full h-32 object-cover"/>
                          )
                        ) : (
                          <div className="p-4">
                            <h4 className="font-bold text-white text-lg truncate">{banner.title || 'بدون عنوان'}</h4>
                            {banner.description && <p className="text-gray-300 text-sm mt-1 line-clamp-2">{banner.description}</p>}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => !isLoading && handleEditBanner(banner)} title="تعديل" className="bg-blue-600 text-white p-2 rounded-full disabled:opacity-50" disabled={editingBanner === banner.id || isLoading}><Edit size={16} /></button>
                          <button onClick={() => !isLoading && handleDeleteBanner(banner.id)} title="حذف" className="bg-red-600 text-white p-2 rounded-full disabled:opacity-50" disabled={isLoading}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'products' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="p-6">
                  <div className="flex border-b border-gray-700 mb-6">
                    <button onClick={() => setProductsSubTab('services')} className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${productsSubTab === 'services' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>المنتجات</button>
                    <button onClick={() => setProductsSubTab('categories')} className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${productsSubTab === 'categories' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الأقسام</button>
                    <button onClick={() => setProductsSubTab('subcategories')} className={`flex-1 py-2 font-bold transition-colors rounded-t-md ${productsSubTab === 'subcategories' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>التصنيفات الفرعية</button>
                  </div>

                  {productsSubTab === 'services' && (
                    <>
                      {/* نموذج إضافة منتج جديد بأعلى الصفحة */}
                      <div className="mb-8 bg-gray-900/60 border border-gray-700/80 rounded-xl overflow-hidden shadow-lg">
                        <button
                          type="button"
                          onClick={() => setIsAddProductFormOpen(!isAddProductFormOpen)}
                          className="w-full p-4 flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-850 hover:bg-gray-750 transition-colors text-right"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                              <Plus className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">إضافة منتج جديد</h3>
                              <p className="text-xs text-gray-400">انقر هنا {isAddProductFormOpen ? 'لإخفاء' : 'لإظهار'} نموذج إضافة منتج جديد</p>
                            </div>
                          </div>
                          {isAddProductFormOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </button>

                        {isAddProductFormOpen && (
                          <form onSubmit={handleAddService} className="p-5 space-y-4 border-t border-gray-700/60" id="service-form">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">عنوان المنتج <span className="text-red-400">*</span></label>
                              <input type="text" placeholder="مثال: عسل سدر طبيعي 500 جرام" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}/>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">وصف المنتج (اختياري)</label>
                              <textarea placeholder="وصف تفصيلي لمميزات المنتج ومكوناته..." value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} rows={3} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">صورة المنتج الرئيسية</label>
                              <label htmlFor="image-upload" className={`w-full flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-800/80 hover:border-blue-500 transition-colors ${uploadingImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <Upload className={`w-8 h-8 mb-2 text-blue-400 ${uploadingImage ? 'animate-pulse' : ''}`} />
                                  <span className="text-white font-semibold">{uploadingImage ? 'جاري رفع الصورة...' : (newService.image_url ? 'تغيير الصورة الرئيسية' : 'اختر صورة المنتج الرئيسية')}</span>
                                  <span className="text-xs text-gray-400 mt-1">المقاس الموصى به: أبعاد مربعة أو أفقية</span>
                              </label>
                              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" disabled={uploadingImage || isLoading}/>
                            </div>

                            {newService.image_url && !uploadingImage && (
                              <div className="bg-gray-800/80 p-3 rounded-lg border border-gray-700 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img src={newService.image_url} alt="معاينة" className="w-16 h-16 object-cover rounded-lg border border-gray-600 bg-gray-900" />
                                  <span className="text-gray-300 text-xs font-medium">تم اختيار الصورة بنجاح</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer bg-gray-750 px-3 py-1.5 rounded-md border border-gray-600">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 accent-emerald-500 rounded border border-gray-500 bg-gray-700 focus:ring-0 cursor-pointer"
                                      checked={removeBgSwitch}
                                      onChange={(e) => handleToggleRemoveBgSwitch(e.target.checked)}
                                      disabled={removingBackground || isLoading}
                                    />
                                    <span className="leading-none">بدون خلفية</span>
                                    {removingBackground && <span className="text-[10px] text-yellow-400">جاري المعالجة...</span>}
                                  </label>
                                  <button type="button" onClick={() => { setNewService({...newService, image_url: ''}); setRemoveBgSwitch(false); setOriginalServiceImageUrl(null); }} className="text-red-400 hover:text-red-300 p-1.5 rounded bg-red-950/40 border border-red-800/50" title="إزالة الصورة">
                                    <Trash2 size={16}/>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">القسم <span className="text-red-400">*</span></label>
                                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory(''); }} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" required disabled={isLoading || categories.length === 0}>
                                  <option value="" disabled className="text-gray-400">-- اختر القسم --</option>
                                  {categories.map((category) => (<option key={category.id} value={category.id} className="bg-gray-800 text-white">{category.name}</option>))}
                                  {categories.length === 0 && <option disabled>لا توجد أقسام، يرجى إضافة قسم أولاً.</option>}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">التصنيف الفرعي (اختياري)</label>
                                <select value={selectedSubcategory} onChange={(e) => setSelectedSubcategory(e.target.value)} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" disabled={isLoading || !selectedCategory}>
                                  <option value="" className="text-gray-400">-- بدون تصنيف فرعي --</option>
                                  {subcategories
                                    .filter(sc => sc.category_id === selectedCategory)
                                    .map((sc) => (
                                      <option key={sc.id} value={sc.id} className="bg-gray-800 text-white">{(sc as any).name_ar || (sc as any).name}</option>
                                    ))}
                                </select>
                              </div>
                            </div>
                            
                            {/* نظام التسعير */}
                            <div className="bg-gray-800/70 p-4 rounded-xl border border-gray-700">
                                <h4 className="text-sm font-bold mb-3 text-white">نظام التسعير:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${!newService.has_weight_pricing ? 'bg-blue-600/20 border-2 border-blue-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="new_pricing_type" 
                                            checked={!newService.has_weight_pricing}
                                            onChange={() => setNewService({ ...newService, has_weight_pricing: false })}
                                            className="h-4 w-4 accent-blue-500"
                                        />
                                        <div>
                                            <span className="font-bold block text-sm">سعر ثابت</span>
                                            <span className="text-gray-400 text-xs">منتج بسعر واحد</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${newService.has_weight_pricing ? 'bg-blue-600/20 border-2 border-blue-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                        <input 
                                            type="radio" 
                                            name="new_pricing_type" 
                                            checked={newService.has_weight_pricing}
                                            onChange={() => setNewService({ ...newService, has_weight_pricing: true })}
                                            className="h-4 w-4 accent-blue-500"
                                        />
                                        <div>
                                            <span className="font-bold block text-sm">تسعير بالوزن</span>
                                            <span className="text-gray-400 text-xs">سعر الكيلو</span>
                                        </div>
                                    </label>
                                </div>

                                {newService.has_weight_pricing ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">سعر الكيلو <span className="text-red-400">*</span></label>
                                          <input 
                                              type="number" 
                                              placeholder="مثال: 120" 
                                              value={newService.price_per_kg || ''} 
                                              onChange={(e) => setNewService({ ...newService, price_per_kg: parseFloat(e.target.value) || null })} 
                                              className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              required
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">سعر الكيلو بعد التخفيض (اختياري)</label>
                                          <input 
                                              type="number" 
                                              placeholder="مثال: 99" 
                                              value={newService.sale_price_per_kg || ''} 
                                              onChange={(e) => setNewService({ ...newService, sale_price_per_kg: parseFloat(e.target.value) || null })} 
                                              className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                        </div>
                                    </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-xs text-gray-300 mb-1">السعر <span className="text-red-400">*</span></label>
                                      <input type="number" placeholder="مثال: 150" value={newService.price || ''} onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}/>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-gray-300 mb-1">سعر التخفيض (اختياري)</label>
                                      <input type="number" placeholder="مثال: 120" value={newService.sale_price || ''} onChange={(e) => setNewService({ ...newService, sale_price: parseFloat(e.target.value) || null })} className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                                    </div>
                                  </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <label className="flex items-center gap-2 p-3 bg-gray-800/80 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                                    <input type="checkbox" id="is_featured" checked={newService.is_featured || false} onChange={(e) => setNewService({ ...newService, is_featured: e.target.checked })} className="h-4 w-4 accent-blue-500"/>
                                    <span className="text-white font-medium">أحدث العروض (يظهر في قسم العروض المميزة)</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 bg-gray-800/80 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                                    <input type="checkbox" id="is_best_seller" checked={newService.is_best_seller || false} onChange={(e) => setNewService({ ...newService, is_best_seller: e.target.checked })} className="h-4 w-4 accent-blue-500"/>
                                    <span className="text-white font-medium">الأكثر مبيعًا (شارة الأكثر طلباً)</span>
                                </label>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">صور إضافية للمنتج <span className="text-gray-400">(اختياري)</span></label>
                              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30" disabled={uploadingImage || isLoading}/>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {newService.gallery && newService.gallery.map((img, idx) => (
                                  <div key={img} className="relative group">
                                    <img src={img} alt={`صورة إضافية ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-600"/>
                                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" className="text-red-400 hover:text-red-300" onClick={() => setNewService(prev => ({ ...prev, gallery: prev.gallery.filter((g) => g !== img) }))} title="حذف الصورة">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2">
                              <button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md" disabled={isLoading || !selectedCategory}>
                                <Plus size={20} /> إضافة المنتج
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      {/* قسم قائمة المنتجات الحالية */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-gray-700 pb-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">المنتجات الحالية</h3>
                          <span className="bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                            {filteredServices.length} منتج
                          </span>
                        </div>
                        {editingService && (
                          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span>أنت الآن في وضع تعديل المنتج مباشرة في القائمة أدناه</span>
                          </div>
                        )}
                      </div>

                      {/* أزرار الأقسام والأقسام الفرعية مثل الصفحة الرئيسية */}
                      <div className="mb-6 space-y-4">
                        {/* الأزرار العلوية: جميع المنتجات + أحدث العروض + الأكثر مبيعاً */}
                        <div className="flex flex-wrap gap-2.5 items-center">
                          <button
                            type="button"
                            onClick={() => {
                              setProductCategoryFilter('all');
                              setProductSubcategoryFilter(null);
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
                              productCategoryFilter === 'all'
                                ? 'bg-blue-600 text-white shadow-blue-500/20 border border-blue-400'
                                : 'bg-gray-800/90 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700'
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                            <span>جميع المنتجات</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                              productCategoryFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {services.length}
                            </span>
                          </button>

                          {hasFeaturedProducts && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductCategoryFilter('featured');
                                setProductSubcategoryFilter(null);
                              }}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
                                productCategoryFilter === 'featured'
                                  ? 'bg-amber-600 text-white shadow-amber-500/20 border border-amber-400'
                                  : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border border-amber-800/40'
                              }`}
                            >
                              <Sparkles className="w-4 h-4 text-yellow-300" />
                              <span>أحدث العروض</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                                productCategoryFilter === 'featured' ? 'bg-amber-700 text-white' : 'bg-amber-900/60 text-amber-200'
                              }`}>
                                {services.filter(s => s.is_featured).length}
                              </span>
                            </button>
                          )}

                          {hasBestSellerProducts && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductCategoryFilter('best_sellers');
                                setProductSubcategoryFilter(null);
                              }}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
                                productCategoryFilter === 'best_sellers'
                                  ? 'bg-red-600 text-white shadow-red-500/20 border border-red-400'
                                  : 'bg-red-950/30 text-red-300 hover:bg-red-900/40 border border-red-800/40'
                              }`}
                            >
                              <Flame className="w-4 h-4 text-red-400" />
                              <span>الأكثر مبيعاً</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                                productCategoryFilter === 'best_sellers' ? 'bg-red-700 text-white' : 'bg-red-900/60 text-red-200'
                              }`}>
                                {services.filter(s => s.is_best_seller).length}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* أزرار الأقسام الرئيسية */}
                        {categories.length > 0 && (
                          <div className="bg-gray-900/50 p-3.5 rounded-2xl border border-gray-700/80">
                            <div className="text-xs font-semibold text-gray-400 mb-2.5 flex items-center gap-1.5">
                              <Filter className="w-3.5 h-3.5 text-blue-400" />
                              <span>تصفية حسب القسم:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {categories.map((category) => {
                                const isSelected = productCategoryFilter === category.id;
                                const categoryCount = services.filter(s => s.category_id === category.id).length;
                                return (
                                  <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setProductCategoryFilter('all');
                                        setProductSubcategoryFilter(null);
                                      } else {
                                        setProductCategoryFilter(category.id);
                                        setProductSubcategoryFilter(null);
                                      }
                                    }}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                      isSelected
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750 hover:text-white border border-gray-700/70'
                                    }`}
                                  >
                                    <span>{category.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                                      isSelected ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400'
                                    }`}>
                                      {categoryCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* شريط الأقسام الفرعية التابعة للقسم المختار */}
                        {productCategoryFilter !== 'all' && productCategoryFilter !== 'featured' && productCategoryFilter !== 'best_sellers' && (
                          <div className="bg-gradient-to-r from-blue-950/30 via-gray-900/50 to-blue-950/30 p-3.5 rounded-2xl border border-blue-800/40 animate-fadeIn">
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="text-xs font-semibold text-blue-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                <span>الأقسام الفرعية لقسم ({categories.find(c => c.id === productCategoryFilter)?.name}):</span>
                              </div>
                              {productSubcategoryFilter && (
                                <button
                                  type="button"
                                  onClick={() => setProductSubcategoryFilter(null)}
                                  className="text-[11px] text-gray-400 hover:text-white underline"
                                >
                                  عرض كل التصنيفات الفرعية
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {/* زر الكل داخل هذا القسم */}
                              <button
                                type="button"
                                onClick={() => setProductSubcategoryFilter(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                  productSubcategoryFilter === null
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                                }`}
                              >
                                الكل ({services.filter(s => s.category_id === productCategoryFilter).length})
                              </button>

                              {/* قائمة الأقسام الفرعية */}
                              {subcategories
                                .filter(sc => sc.category_id === productCategoryFilter)
                                .map((sc) => {
                                  const isSubSelected = productSubcategoryFilter === sc.id;
                                  const subCount = services.filter(s => s.category_id === productCategoryFilter && s.subcategory_id === sc.id).length;
                                  const subName = (sc as any).name_ar || (sc as any).name;
                                  return (
                                    <button
                                      key={sc.id}
                                      type="button"
                                      onClick={() => setProductSubcategoryFilter(isSubSelected ? null : sc.id)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                        isSubSelected
                                          ? 'bg-emerald-600 text-white shadow-sm border border-emerald-400'
                                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700'
                                      }`}
                                    >
                                      <span>{subName}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        isSubSelected ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-400'
                                      }`}>
                                        {subCount}
                                      </span>
                                    </button>
                                  );
                                })}

                              {subcategories.filter(sc => sc.category_id === productCategoryFilter).length === 0 && (
                                <span className="text-xs text-gray-400 italic py-1">
                                  لا توجد أقسام فرعية لهذا القسم حالياً
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* شريط البحث */}
                      <div className="mb-6">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ابحث عن منتج بالاسم أو الوصف أو القسم..."
                            value={searchQuery || ''}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-3 pr-10 pl-10 rounded-lg text-white bg-gray-900/60 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm"
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded"
                              title="مسح البحث"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {(searchQuery || productCategoryFilter !== 'all' || productSubcategoryFilter) && (
                          <div className="mt-2.5 flex items-center justify-between text-xs text-gray-400 bg-gray-900/40 px-3 py-1.5 rounded-lg border border-gray-800">
                            <span>
                              تم العثور على <strong className="text-blue-400">{filteredServices.length}</strong> منتج
                              {productCategoryFilter === 'featured' && ' في أحدث العروض'}
                              {productCategoryFilter === 'best_sellers' && ' في الأكثر مبيعاً'}
                              {productCategoryFilter !== 'all' && productCategoryFilter !== 'featured' && productCategoryFilter !== 'best_sellers' && (
                                <> في قسم (<strong className="text-gray-200">{categories.find(c => c.id === productCategoryFilter)?.name}</strong>)</>
                              )}
                              {productSubcategoryFilter && (
                                <> - تصنيف (<strong className="text-emerald-400">{(subcategories.find(sc => sc.id === productSubcategoryFilter) as any)?.name_ar || subcategories.find(sc => sc.id === productSubcategoryFilter)?.name}</strong>)</>
                              )}
                              {searchQuery && <> لكلمة البحث: "<strong className="text-white">{searchQuery}</strong>"</>}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setProductCategoryFilter('all');
                                setProductSubcategoryFilter(null);
                                setSearchQuery('');
                              }}
                              className="text-blue-400 hover:text-blue-300 font-medium underline"
                            >
                              إعادة ضبط الفلاتر
                            </button>
                          </div>
                        )}
                      </div>

                      {/* شبكة عرض المنتجات والتعديل المباشر */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredServices.length === 0 && (
                          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-900/30 border border-gray-800 rounded-xl">
                            <Package className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                            <p className="font-semibold">لم يتم العثور على أي منتجات مطابقة</p>
                          </div>
                        )}

                        {filteredServices.map((service) => {
                          const isEditingThis = editingService === service.id;
                          const isHighlighted = highlightedServiceId === service.id;

                          if (isEditingThis) {
                            // خانات التعديل المباشرة أسفل/في مكان المنتج
                            return (
                              <div
                                key={`edit-${service.id}`}
                                id={`service-card-${service.id}`}
                                className="col-span-full bg-gradient-to-b from-gray-850 to-gray-900 border-2 border-blue-500 rounded-2xl p-6 shadow-2xl transition-all duration-300 ring-4 ring-blue-500/20"
                              >
                                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-700">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                                      <Edit className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-bold text-white">تعديل المنتج</h4>
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">#{service.id}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 truncate max-w-md">{service.title}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelEdit(service.id)}
                                    className="text-gray-400 hover:text-white p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                                    title="إلغاء التعديل"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>

                                <form onSubmit={handleUpdateService} className="space-y-5">
                                  {/* الحقول الأساسية */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-1">عنوان المنتج <span className="text-red-400">*</span></label>
                                      <input
                                        type="text"
                                        value={editServiceData.title}
                                        onChange={(e) => setEditServiceData({ ...editServiceData, title: e.target.value })}
                                        className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={isLoading}
                                        placeholder="عنوان المنتج"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-1">القسم <span className="text-red-400">*</span></label>
                                      <select
                                        value={editServiceData.category_id}
                                        onChange={(e) => setEditServiceData({ ...editServiceData, category_id: e.target.value, subcategory_id: '' })}
                                        className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={isLoading}
                                      >
                                        <option value="" disabled>-- اختر القسم --</option>
                                        {categories.map((c) => (
                                          <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">التصنيف الفرعي (اختياري)</label>
                                    <select
                                      value={editServiceData.subcategory_id}
                                      onChange={(e) => setEditServiceData({ ...editServiceData, subcategory_id: e.target.value })}
                                      className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      disabled={isLoading || !editServiceData.category_id}
                                    >
                                      <option value="">-- بدون تصنيف فرعي --</option>
                                      {subcategories
                                        .filter(sc => sc.category_id === editServiceData.category_id)
                                        .map((sc) => (
                                          <option key={sc.id} value={sc.id}>{(sc as any).name_ar || (sc as any).name}</option>
                                        ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">وصف المنتج</label>
                                    <textarea
                                      value={editServiceData.description}
                                      onChange={(e) => setEditServiceData({ ...editServiceData, description: e.target.value })}
                                      rows={3}
                                      className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="وصف تفصيلي للمنتج..."
                                      disabled={isLoading}
                                    />
                                  </div>

                                  {/* صورة المنتج وإزالة الخلفية */}
                                  <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">صورة المنتج الرئيسية</label>
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                      {editServiceData.image_url ? (
                                        <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-gray-600 bg-gray-900 flex-shrink-0">
                                          <img
                                            src={editServiceData.image_url}
                                            alt="معاينة"
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                                          بدون صورة
                                        </div>
                                      )}

                                      <div className="flex-1 w-full space-y-2">
                                        <label
                                          htmlFor={`edit-image-${service.id}`}
                                          className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-gray-600 cursor-pointer bg-gray-800 hover:bg-gray-750 hover:border-blue-500 transition-colors ${editUploadingImage || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                          <Upload className={`w-5 h-5 text-blue-400 ${editUploadingImage ? 'animate-pulse' : ''}`} />
                                          <span className="text-white text-sm font-semibold">
                                            {editUploadingImage ? 'جاري رفع الصورة...' : (editServiceData.image_url ? 'تغيير الصورة' : 'رفع صورة للمنتج')}
                                          </span>
                                        </label>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={handleEditServiceImageUpload}
                                          className="hidden"
                                          id={`edit-image-${service.id}`}
                                          disabled={editUploadingImage || isLoading}
                                        />

                                        {editServiceData.image_url && (
                                          <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-2 text-xs text-gray-300 select-none cursor-pointer bg-gray-750 px-3 py-1.5 rounded-lg border border-gray-600">
                                              <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-emerald-500 rounded border border-gray-500 bg-gray-700 focus:ring-0 cursor-pointer"
                                                checked={editRemoveBgSwitch}
                                                onChange={(e) => handleEditToggleRemoveBgSwitch(e.target.checked)}
                                                disabled={editRemovingBg || isLoading}
                                              />
                                              <span>بدون خلفية</span>
                                              {editRemovingBg && <span className="text-[10px] text-yellow-400">جاري المعالجة...</span>}
                                            </label>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditServiceData({ ...editServiceData, image_url: '' });
                                                setEditRemoveBgSwitch(false);
                                                setEditOriginalImageUrl(null);
                                              }}
                                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 p-1.5 rounded bg-red-950/40 border border-red-800/40"
                                            >
                                              <Trash2 size={14} /> حذف الصورة
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* نظام التسعير */}
                                  <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700">
                                    <h4 className="text-sm font-bold mb-3 text-white">نظام التسعير:</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                      <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${!editServiceData.has_weight_pricing ? 'bg-blue-600/20 border-2 border-blue-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                        <input
                                          type="radio"
                                          name={`pricing_type_${service.id}`}
                                          checked={!editServiceData.has_weight_pricing}
                                          onChange={() => setEditServiceData({ ...editServiceData, has_weight_pricing: false })}
                                          className="h-4 w-4 accent-blue-500"
                                        />
                                        <div>
                                          <span className="font-bold block text-sm">سعر ثابت</span>
                                          <span className="text-gray-400 text-xs">منتج بسعر واحد</span>
                                        </div>
                                      </label>

                                      <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${editServiceData.has_weight_pricing ? 'bg-blue-600/20 border-2 border-blue-500 text-white' : 'bg-gray-800 border border-gray-700 text-gray-300'}`}>
                                        <input
                                          type="radio"
                                          name={`pricing_type_${service.id}`}
                                          checked={editServiceData.has_weight_pricing}
                                          onChange={() => setEditServiceData({ ...editServiceData, has_weight_pricing: true })}
                                          className="h-4 w-4 accent-blue-500"
                                        />
                                        <div>
                                          <span className="font-bold block text-sm">تسعير بالوزن</span>
                                          <span className="text-gray-400 text-xs">سعر الكيلو</span>
                                        </div>
                                      </label>
                                    </div>

                                    {editServiceData.has_weight_pricing ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">سعر الكيلو <span className="text-red-400">*</span></label>
                                          <input
                                            type="number"
                                            value={editServiceData.price_per_kg || ''}
                                            onChange={(e) => setEditServiceData({ ...editServiceData, price_per_kg: parseFloat(e.target.value) || null })}
                                            className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            placeholder="سعر الكيلو"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">سعر الكيلو بعد التخفيض (اختياري)</label>
                                          <input
                                            type="number"
                                            value={editServiceData.sale_price_per_kg || ''}
                                            onChange={(e) => setEditServiceData({ ...editServiceData, sale_price_per_kg: parseFloat(e.target.value) || null })}
                                            className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="سعر التخفيض"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">السعر <span className="text-red-400">*</span></label>
                                          <input
                                            type="number"
                                            value={editServiceData.price || ''}
                                            onChange={(e) => setEditServiceData({ ...editServiceData, price: parseFloat(e.target.value) })}
                                            className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            disabled={isLoading}
                                            placeholder="السعر"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs text-gray-300 mb-1">سعر التخفيض (اختياري)</label>
                                          <input
                                            type="number"
                                            value={editServiceData.sale_price || ''}
                                            onChange={(e) => setEditServiceData({ ...editServiceData, sale_price: parseFloat(e.target.value) || null })}
                                            className="w-full p-3 rounded-lg text-white bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={isLoading}
                                            placeholder="سعر التخفيض"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* خيارات العرض */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <label className="flex items-center gap-2 p-3 bg-gray-800/60 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                                      <input
                                        type="checkbox"
                                        checked={editServiceData.is_featured}
                                        onChange={(e) => setEditServiceData({ ...editServiceData, is_featured: e.target.checked })}
                                        className="h-4 w-4 accent-blue-500"
                                      />
                                      <span className="text-white">أحدث العروض (مميز)</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-3 bg-gray-800/60 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                                      <input
                                        type="checkbox"
                                        checked={editServiceData.is_best_seller}
                                        onChange={(e) => setEditServiceData({ ...editServiceData, is_best_seller: e.target.checked })}
                                        className="h-4 w-4 accent-blue-500"
                                      />
                                      <span className="text-white">الأكثر مبيعًا</span>
                                    </label>
                                  </div>

                                  {/* معرض الصور الإضافية */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">صور إضافية للمنتج</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleEditGalleryUpload}
                                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600/20 file:text-blue-300 hover:file:bg-blue-600/30"
                                      disabled={editUploadingGallery || isLoading}
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {editServiceData.gallery && editServiceData.gallery.map((img, idx) => (
                                        <div key={img} className="relative group">
                                          <img src={img} alt={`صورة ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-600" />
                                          <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              type="button"
                                              className="text-red-400 hover:text-red-300"
                                              onClick={() => setEditServiceData(prev => ({ ...prev, gallery: prev.gallery.filter(g => g !== img) }))}
                                              title="حذف الصورة"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* أزرار الحفظ والإلغاء المباشرة */}
                                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-700">
                                    <button
                                      type="submit"
                                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                      disabled={isLoading || !editServiceData.category_id || !editServiceData.title.trim()}
                                    >
                                      <Save size={20} />
                                      {isLoading ? 'جاري الحفظ...' : 'حفظ التعديلات على المنتج'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelEdit(service.id)}
                                      className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                      disabled={isLoading}
                                    >
                                      <X size={20} /> إلغاء التعديل
                                    </button>
                                  </div>
                                </form>
                              </div>
                            );
                          }

                          // كارت المنتج الافتراضي مع زر التعديل
                          return (
                            <div
                              key={service.id}
                              id={`service-card-${service.id}`}
                              className={`p-4 rounded-xl bg-gray-900/60 border transition-all duration-500 flex flex-col justify-between ${
                                isHighlighted
                                  ? 'border-emerald-500 ring-4 ring-emerald-500/40 bg-emerald-950/20 shadow-2xl scale-[1.02]'
                                  : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/60'
                              }`}
                            >
                              <div className="flex flex-col gap-3">
                                {/* صورة المنتج */}
                                <div className="relative w-full h-36 overflow-hidden rounded-lg border border-gray-700 bg-gray-950 flex items-center justify-center">
                                  {service.image_url ? (
                                    <img 
                                      src={service.image_url} 
                                      alt={service.title} 
                                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  ) : (
                                    <Package className="w-12 h-12 text-gray-600" />
                                  )}
                                  {service.is_featured && (
                                    <span className="absolute top-2 right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                      عرض مميز
                                    </span>
                                  )}
                                  {service.is_best_seller && (
                                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                      الأكثر مبيعاً
                                    </span>
                                  )}
                                </div>
                                
                                {/* معلومات المنتج */}
                                <div className="flex-1 min-h-0">
                                  <h4 className="font-bold text-white text-base mb-1 line-clamp-2 leading-snug">
                                    {service.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                    <span className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                      {service.category?.name || 'قسم غير محدد'}
                                    </span>
                                  </div>
                                  
                                  {/* السعر */}
                                  <div className="flex items-center gap-2 mb-2">
                                    {service.sale_price ? (
                                      <>
                                        <span className="font-bold text-emerald-400 text-base">{service.sale_price} ج.م</span>
                                        <span className="text-xs text-gray-500 line-through">{service.price} ج.م</span>
                                      </>
                                    ) : service.price ? (
                                      <span className="font-bold text-emerald-400 text-base">{service.price} ج.م</span>
                                    ) : service.has_weight_pricing ? (
                                      service.sale_price_per_kg ? (
                                        <>
                                          <span className="font-bold text-emerald-400 text-base">{service.sale_price_per_kg} ج/كيلو</span>
                                          <span className="text-xs text-gray-500 line-through">{service.price_per_kg}</span>
                                        </>
                                      ) : (
                                        <span className="font-bold text-emerald-400 text-base">{service.price_per_kg} ج/كيلو</span>
                                      )
                                    ) : (
                                      <span className="text-gray-400 text-xs">بدون سعر محدد</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* الأزرار وحالة التوفر */}
                              <div className="flex flex-col gap-2 pt-3 border-t border-gray-800 mt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">حالة التوفر:</span>
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleServiceAvailability(service.id, !(service.is_available ?? true))}
                                      className={`relative w-12 h-6 rounded-full transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                                        (service.is_available ?? true)
                                          ? 'bg-emerald-500 focus:ring-emerald-400'
                                          : 'bg-gray-600 focus:ring-gray-300'
                                      }`}
                                      disabled={isLoading}
                                      role="switch"
                                      aria-checked={service.is_available ?? true}
                                      aria-label={`المنتج ${(service.is_available ?? true) ? 'متوفر' : 'غير متوفر'}`}
                                    >
                                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-400 shadow-md transform ${
                                        (service.is_available ?? true)
                                          ? 'translate-x-6'
                                          : 'translate-x-0'
                                      }`}>
                                        <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-400 ${
                                          (service.is_available ?? true)
                                            ? 'text-emerald-500'
                                            : 'text-gray-400'
                                        }`}>
                                          {(service.is_available ?? true) ? (
                                            <Eye size={10} />
                                          ) : (
                                            <EyeOff size={10} />
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 mt-1">
                                  <button 
                                    onClick={() => !isLoading && handleEditService(service)} 
                                    title="تعديل هذا المنتج مباشرة" 
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white p-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold disabled:opacity-50" 
                                    disabled={isLoading}
                                  >
                                    <Edit size={15} />
                                    <span>تعديل</span>
                                  </button>
                                  <button 
                                    onClick={() => !isLoading && handleDeleteService(service.id)} 
                                    title="حذف المنتج" 
                                    className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-300 hover:text-white p-2.5 rounded-lg transition-all flex items-center justify-center text-xs disabled:opacity-50" 
                                    disabled={isLoading}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {productsSubTab === 'subcategories' && (
                    <>
                      {/* Subcategory create/edit form */}
                      <form onSubmit={editingSubcategory ? handleUpdateSubcategory : handleAddSubcategory} className="mb-8 space-y-4" id="subcategory-form">
                        <select
                          value={newSubcategory.category_id}
                          onChange={(e) => setNewSubcategory({ ...newSubcategory, category_id: e.target.value })}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                          required
                          disabled={isLoading || categories.length === 0}
                        >
                          <option value="" disabled className="text-gray-400">-- اختر القسم --</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-gray-800 text-white">{category.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="اسم التصنيف الفرعي (عربي)"
                          value={newSubcategory.name_ar}
                          onChange={(e) => setNewSubcategory({ ...newSubcategory, name_ar: e.target.value })}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                          disabled={isLoading}
                        />
                        <textarea
                          placeholder="وصف التصنيف الفرعي (اختياري)"
                          value={newSubcategory.description_ar}
                          onChange={(e) => setNewSubcategory({ ...newSubcategory, description_ar: e.target.value })}
                          rows={3}
                          className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isLoading}
                          >
                            {editingSubcategory ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة تصنيف فرعي</>}
                          </button>
                          {editingSubcategory && (
                            <button
                              type="button"
                              onClick={handleCancelEditSubcategory}
                              className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold"
                              disabled={isLoading}
                            >
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      {/* Subcategories list */}
                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">التصنيفات الفرعية الحالية</h3>
                      <div className="space-y-3">
                        {subcategories.map((sc) => (
                          <div
                            key={sc.id}
                            className={`p-4 rounded-md bg-gray-900/50 border border-gray-700 flex justify-between items-center transition-all ${editingSubcategory === sc.id ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-white text-lg truncate">{(sc as any).name_ar || (sc as any).name}</h4>
                              <div className="text-xs text-gray-400 mb-1">القسم: {categories.find(c => c.id === sc.category_id)?.name || 'غير محدد'}</div>
                              {(sc as any).description_ar && (
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{(sc as any).description_ar}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => !isLoading && handleEditSubcategory(sc)}
                                title="تعديل"
                                className="text-blue-400 hover:text-blue-300 p-2 disabled:opacity-50"
                                disabled={editingSubcategory === sc.id || isLoading}
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => !isLoading && handleDeleteSubcategory(sc.id)}
                                title="حذف"
                                className="text-red-500 hover:text-red-400 p-2 disabled:opacity-50"
                                disabled={isLoading}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!isLoading && subcategories.length === 0 && (
                          <div className="text-gray-400 text-center py-6">لا توجد تصنيفات فرعية بعد.</div>
                        )}
                      </div>
                    </>
                  )}

                  {productsSubTab === 'categories' && (
                    <>
                      <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="mb-8 space-y-4" id="category-form">
                        <input type="text" placeholder="اسم القسم" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={isLoading}/>
                        <textarea placeholder="وصف القسم (اختياري)" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} rows={3} className="w-full p-3 rounded text-white bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isLoading}/>
                        <div className="flex gap-3">
                          <button type="submit" className="flex-grow bg-blue-600 text-white py-2.5 px-4 rounded-md font-bold hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50" disabled={isLoading}>
                            {editingCategory ? <><Save size={20} /> حفظ التعديلات</> : <><Plus size={20} /> إضافة قسم</>}
                          </button>
                          {editingCategory && (
                            <button type="button" onClick={handleCancelEditCategory} className="bg-gray-600 text-white px-4 py-2.5 rounded-md hover:bg-gray-700 flex items-center justify-center gap-2 font-bold" disabled={isLoading}>
                              <X size={20} /> إلغاء
                            </button>
                          )}
                        </div>
                      </form>

                      <h3 className="text-lg font-semibold mb-4 text-white border-b border-gray-600 pb-2">الأقسام الحالية</h3>
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <div key={category.id} className={`p-4 rounded-md bg-gray-900/50 border border-gray-700 flex justify-between items-center transition-all ${editingCategory === category.id ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="flex-1 overflow-hidden">
                              <h4 className="font-bold text-white text-lg truncate">{category.name}</h4>
                              {category.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{category.description}</p>}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => !isLoading && handleEditCategory(category)} title="تعديل" className="text-blue-400 hover:text-blue-300 p-2 disabled:opacity-50" disabled={editingCategory === category.id || isLoading}><Edit size={18} /></button>
                              <button onClick={() => !isLoading && handleDeleteCategory(category.id)} title="حذف" className="text-red-500 hover:text-red-400 p-2 disabled:opacity-50" disabled={isLoading}><Trash2 size={18} /></button>
                              <button
                                onClick={() => {
                                  if (isLoading) return;
                                  setProductsSubTab('subcategories');
                                  setNewSubcategory({ ...newSubcategory, category_id: category.id });
                                }}
                                title="إضافة تصنيف فرعي لهذا القسم"
                                className="text-green-400 hover:text-green-300 p-2 disabled:opacity-50"
                                disabled={isLoading}
                              >
                                <Plus size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="w-full flex justify-center py-8 mt-10">
        <button
          onClick={() => { window.location.href = '/'; }}
          className="bg-white/10 backdrop-blur-md text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-colors border border-white/20 hover:bg-white/20"
        >
          ← العودة للصفحة الرئيسية
        </button>
      </footer>
    </div> 
  );
}