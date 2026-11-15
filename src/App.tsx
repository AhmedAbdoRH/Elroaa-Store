import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from './lib/supabase';
import { CartProvider, useCart } from './contexts/CartContext';
import Cart from './components/Cart';
import ToastNotification from './components/ToastNotification';
import Header from './components/Header';
import BannerSlider from './components/BannerSlider';
import BannerStrip from './components/BannerStrip';
import Services from './components/Services';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';
import WhatsAppButton from './components/WhatsAppButton';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ServiceDetails from './pages/ServiceDetails';
import CategoryProducts from './pages/CategoryProducts';
import SubcategoryProducts from './pages/SubcategoryProducts';
import ProductDetails from './pages/ProductDetails';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import LoadingScreen from './components/LoadingScreen';
import StructuredData from './components/StructuredData';
import type { StoreSettings, Banner } from './types/database';
import { sanitizeStoreSettings } from './utils/storeBranding';
import { ThemeProvider } from './theme/ThemeContext';
import FacebookButton from './components/FacebookButton';
import ClickParticleEffect from './components/ClickParticleEffect';

// PrivateRoute component with professional loading spinner
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  }

  if (isAuthenticated === null) {
    return (
      <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
        <p className="loading-spinner-text"> </p>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/admin/login" replace />
  );
}

function App() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Debug environment variables
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log('VITE_SUPABASE_URL:', url);
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!key);

    if (!url || !key) {
      console.error('CRITICAL: Supabase environment variables are missing!');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initApp() {
      try {
        await fetchStoreSettings();

        // Fetch banners
        const { data: bannersData, error: bannersError } = await supabase
          .from('banners')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch services for structured data
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .limit(10)
          .order('created_at', { ascending: false });

        // Fetch categories for structured data
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (isMounted) {
          if (bannersError) {
            console.error("Error fetching banners:", bannersError);
            setBanners([]);
          } else {
            setBanners(bannersData || []);
          }

          if (servicesError) {
            console.error("Error fetching services:", servicesError);
            setServices([]);
          } else {
            setServices(servicesData || []);
          }

          if (categoriesError) {
            console.error("Error fetching categories:", categoriesError);
            setCategories([]);
          } else {
            setCategories(categoriesData || []);
          }

          // Set loading to false after all data is fetched
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initApp();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (storeSettings) {
      const theme = (storeSettings as any).theme_settings || {};
      const primary = theme.primaryColor && theme.primaryColor !== '#f5f6db' ? theme.primaryColor : '#F7F3E9';
      const secondary = theme.secondaryColor && theme.secondaryColor !== '#4f170c' ? theme.secondaryColor : '#2B3318';
      const accent = theme.accentColor && theme.accentColor !== '#4B5E26' ? theme.accentColor : '#2B3318';
      const fontFamily = theme.fontFamily || 'Cairo, sans-serif';
      const backgroundGradient = theme.backgroundGradient || '';
      const backgroundColor = theme.backgroundColor && theme.backgroundColor !== '#f5f6db' ? theme.backgroundColor : '#F7F3E9';

      const root = document.documentElement;
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--color-secondary', secondary);
      root.style.setProperty('--color-accent', accent);
      root.style.setProperty('--color-olive', '#2B3318');
      root.style.setProperty('--color-olive-secondary', '#3A4522');
      root.style.setProperty('--color-gold', '#D1A94F');
      root.style.setProperty('--color-gold-light', '#E3C778');
      root.style.setProperty('--color-sale', '#B12704');
      root.style.setProperty('--color-accent-light', primary);
      root.style.setProperty('--font-family', fontFamily);

      if (backgroundGradient && backgroundGradient.trim() !== '') {
        root.style.setProperty('--background-gradient', backgroundGradient);
        root.style.setProperty('--background-color', ''); // Clear single color if gradient is set
      } else {
        root.style.setProperty('--background-gradient', ''); // Clear gradient if single color is set
        root.style.setProperty('--background-color', backgroundColor);
      }
    }
  }, [storeSettings]);

  const fetchStoreSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching store settings:", error);
        // Set default settings if fetch fails
        setStoreSettings({
          id: '00000000-0000-0000-0000-000000000001',
          store_name: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          store_description: 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية',
          logo_url: '/favicon.png',
          meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
          theme_settings: {
            primaryColor: '#F7F3E9',
            secondaryColor: '#2B3318',
            accentColor: '#2B3318',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: '#F7F3E9',
            backgroundGradient: ''
          }
        } as StoreSettings);
        return;
      }

      if (data) {
        setStoreSettings(sanitizeStoreSettings(data as StoreSettings));
      } else {
        // No data found, set default settings
        setStoreSettings({
          id: '00000000-0000-0000-0000-000000000001',
          store_name: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          store_description: 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية',
          logo_url: '/favicon.png',
          meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
          theme_settings: {
            primaryColor: '#F7F3E9',
            secondaryColor: '#2B3318',
            accentColor: '#2B3318',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: '#F7F3E9',
            backgroundGradient: ''
          }
        } as StoreSettings);
      }
    } catch (error) {
      console.error("Unexpected error fetching store settings:", error);
      // Set default settings on any unexpected error
      setStoreSettings({
        id: '00000000-0000-0000-0000-000000000001',
        store_name: 'شركة الرؤى للتجارة والتوريدات والعطارة',
        store_description: 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية',
        logo_url: '/favicon.png',
        meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
        meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
        theme_settings: {
          primaryColor: '#F7F3E9',
          secondaryColor: '#2B3318',
          accentColor: '#2B3318',
          fontFamily: 'Cairo, sans-serif',
          backgroundColor: '#F7F3E9',
          backgroundGradient: ''
        }
      } as StoreSettings);
    }
  };

  if (loading) {
    return (
      <LoadingScreen
        logoUrl={storeSettings?.logo_url || '/favicon.png'}
      />
    );
  }

  return (
    <ThemeProvider>
      <CartProvider>
        <ClickParticleEffect />
        <Helmet>
          <title>{storeSettings?.meta_title || storeSettings?.store_name || 'شركة الرؤى للتجارة والتوريدات والعطارة | أفضل أنواع الأعشاب والتوابل في مصر'}</title>
          <meta name="description" content={storeSettings?.meta_description || storeSettings?.store_description || 'شركة الرؤى للتجارة والتوريدات والعطارة - نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية.'} />
          <meta name="keywords" content={storeSettings?.keywords ? storeSettings.keywords.join(', ') : 'شركة الرؤى, عطارة, توابل, أعشاب طبيعية, زيوت عطرية, مكسرات, توريدات, مصر, صحي, طبيعي'} />
          <meta name="author" content="شركة الرؤى للتجارة والتوريدات والعطارة" />
          <meta name="robots" content="index, follow" />
          <meta name="language" content="Arabic" />
          <meta name="revisit-after" content="7 days" />

          {/* Additional SEO Meta Tags */}
          <meta name="geo.region" content="EG" />
          <meta name="geo.placename" content="Egypt" />
          <meta name="geo.position" content="30.0444;31.2357" />
          <meta name="ICBM" content="30.0444, 31.2357" />

          {/* Canonical URL */}
          <link rel="canonical" href="https://elroaa-store.com/" />

          {/* Favicon */}
          {storeSettings?.favicon_url && (
            <link rel="icon" href={storeSettings.favicon_url} />
          )}
        </Helmet>

        {/* Structured Data */}
        <StructuredData
          type="organization"
          data={storeSettings || undefined}
          services={services}
          categories={categories}
        />
        <Router>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={
              <PrivateRoute>
                <AdminDashboard onSettingsUpdate={fetchStoreSettings} />
              </PrivateRoute>
            } />

            <Route path="/service/:id" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <ServiceDetails />
              </Layout>
            } />
            <Route path="/product/:id" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <ProductDetails />
              </Layout>
            } />
            <Route path="/category/:categoryId" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <CategoryProducts />
              </Layout>
            } />
            <Route path="/subcategory/:subcategoryId" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <SubcategoryProducts />
              </Layout>
            } />
            <Route path="/about" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <AboutUs />
              </Layout>
            } />
            <Route path="/contact" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <ContactUs />
              </Layout>
            } />
            <Route path="/" element={
              <Layout banners={banners} storeSettings={storeSettings}>
                <StaggeredHome
                  storeSettings={storeSettings}
                />
              </Layout>
            } />
          </Routes>
        </Router>
        <Cart />
        <ToastNotificationWrapper />
      </CartProvider>
    </ThemeProvider>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  banners: Banner[];
  storeSettings: StoreSettings | null;
}

function Layout({ children, banners: layoutBanners, storeSettings }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const mainBanners = layoutBanners.filter(banner =>
    banner.type === 'image' && banner.is_active
  );
  const stripBanners = layoutBanners.filter(banner =>
    banner.type === 'strip' && banner.is_active
  );

  return (
    <div
      className="min-h-screen font-cairo"
      style={{
        background: (storeSettings && (storeSettings as any).theme_settings?.backgroundGradient)
          ? (storeSettings as any).theme_settings.backgroundGradient
          : (storeSettings && (storeSettings as any).theme_settings?.backgroundColor && (storeSettings as any).theme_settings?.backgroundColor !== '#f5f6db')
            ? (storeSettings as any).theme_settings.backgroundColor
            : '#F7F3E9',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header storeSettings={storeSettings} />
      {isHome && mainBanners.length > 0 && (
        <BannerSlider banners={mainBanners} />
      )}
      {isHome && stripBanners.length > 0 && (
        <BannerStrip banners={stripBanners} />
      )}
      <MainFade>{children}</MainFade>
      {isHome && (
        <Testimonials />
      )}
      <Footer storeSettings={storeSettings} />
      <WhatsAppButton />
      <ToastContainer
        position="bottom-center"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnHover
      />
    </div>
  );
}

function StaggeredHome({
  storeSettings,
}: {
  storeSettings: StoreSettings | null;
}) {
  return (
    <>
      {/* Social Buttons Section - Added below hero */}
      <div className="pt-4 -mb-8" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6">
            <div className="flex justify-center">
              <FacebookButton
                facebookUrl={storeSettings?.facebook_url || undefined}
                className="scale-75 md:scale-110 transform transition-transform hover:scale-105 !my-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services component */}
      <Services />
    </>
  );
}

function MainFade({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50); // Quick fade-in for content
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="main-fade-content" // Added class for specific styling if needed
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 1200ms cubic-bezier(.4,0,.2,1), transform 700ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  );
}

function ToastNotificationWrapper() {
  const { showToast, toastProductName, toggleCart, hideToast } = useCart();
  
  return (
    <ToastNotification
      show={showToast}
      productName={toastProductName}
      onViewCart={() => toggleCart(true)}
      onClose={hideToast}
    />
  );
}

export default App;
