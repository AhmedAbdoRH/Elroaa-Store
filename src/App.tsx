import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabase';
import { CartProvider } from './contexts/CartContext';
import Cart from './components/Cart';
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
import { ThemeProvider } from './theme/ThemeContext';
import FacebookButton from './components/FacebookButton';

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
  const [mainContentLoaded, setMainContentLoaded] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Debug environment variables
  useEffect(() => {
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
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
      const primary = theme.primaryColor || '#f5f6db';
      const secondary = theme.secondaryColor || '#4f170c';
      const accent = theme.accentColor || '#4f170c';
      const fontFamily = theme.fontFamily || 'Cairo, sans-serif';
      const backgroundGradient = theme.backgroundGradient || '';
      const backgroundColor = theme.backgroundColor || '#f5f6db';

      const root = document.documentElement;
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--color-secondary', secondary);
      root.style.setProperty('--color-accent', accent);
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
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching store settings:", error);
        // Set default settings if fetch fails
        setStoreSettings({
          id: '00000000-0000-0000-0000-000000000001',
          store_name: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          store_description: 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية',
          logo_url: '/logo.png',
          meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
          theme_settings: {
            primaryColor: '#f5f6db',
            secondaryColor: '#4f170c',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: '#f5f6db',
            backgroundGradient: ''
          }
        } as StoreSettings);
        return;
      }

      if (data) {
        setStoreSettings(data);
      } else {
        // No data found, set default settings
        setStoreSettings({
          id: '00000000-0000-0000-0000-000000000001',
          store_name: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          store_description: 'أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية',
          logo_url: '/logo.png',
          meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
          meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
          theme_settings: {
            primaryColor: '#f5f6db',
            secondaryColor: '#4f170c',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: '#f5f6db',
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
        logo_url: '/Logo.png',
        meta_title: 'شركة الرؤى للتجارة والتوريدات والعطارة',
        meta_description: 'نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية بأسعار تنافسية وجودة عالية',
        theme_settings: {
          primaryColor: '#f5f6db',
          secondaryColor: '#4f170c',
          fontFamily: 'Cairo, sans-serif',
          backgroundColor: '#f5f6db',
          backgroundGradient: ''
        }
      } as StoreSettings);
    }
  };

  interface LayoutProps {
    children: React.ReactNode;
    banners: Banner[];
  }

  const Layout = ({ children, banners: layoutBanners }: LayoutProps) => {
    // Filter banners for different purposes
    const mainBanners = layoutBanners.filter(banner =>
      banner.type === 'image' && banner.is_active
    );
    const stripBanners = layoutBanners.filter(banner =>
      banner.type === 'strip' && banner.is_active
    );

    return (
      <div
        className="min-h-screen font-cairo" // Ensure font-cairo is defined in tailwind.config.js if used like this
        style={{
          background: (storeSettings && (storeSettings as any).theme_settings?.backgroundGradient)
            ? (storeSettings as any).theme_settings.backgroundGradient
            : (storeSettings && (storeSettings as any).theme_settings?.backgroundColor)
              ? (storeSettings as any).theme_settings.backgroundColor
              : "", // Default fallback
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <Header storeSettings={storeSettings} />
        {window.location.pathname === '/' && mainBanners.length > 0 && (
          <BannerSlider banners={mainBanners} />
        )}
        {window.location.pathname === '/' && stripBanners.length > 0 && (
          <BannerStrip banners={stripBanners} />
        )}
        <MainFade>{children}</MainFade>
        {window.location.pathname === '/' && (
          <Testimonials />
        )}
        <Footer storeSettings={storeSettings} />
        <WhatsAppButton />
      </div>
    );
  };

  if (loading) {
    return (
      <LoadingScreen
        logoUrl={storeSettings?.logo_url || '/logo.png'} // Provide a default logo
      />
    );
  }

  return (
    <ThemeProvider>
      <CartProvider>
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
              <Layout banners={banners}>
                <ServiceDetails />
              </Layout>
            } />
            <Route path="/product/:id" element={
              <Layout banners={banners}>
                <ProductDetails />
              </Layout>
            } />
            <Route path="/category/:categoryId" element={
              <Layout banners={banners}>
                <CategoryProducts />
              </Layout>
            } />
            <Route path="/subcategory/:subcategoryId" element={
              <Layout banners={banners}>
                <SubcategoryProducts />
              </Layout>
            } />
            <Route path="/about" element={
              <Layout banners={banners}>
                <AboutUs />
              </Layout>
            } />
            <Route path="/contact" element={
              <Layout banners={banners}>
                <ContactUs />
              </Layout>
            } />
            <Route path="/" element={
              <Layout banners={banners}>
                <StaggeredHome
                  storeSettings={storeSettings}
                  banners={banners}
                  setMainContentLoaded={setMainContentLoaded}
                />
              </Layout>
            } />
          </Routes>
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

function StaggeredHome({
  storeSettings,
  banners,
  setMainContentLoaded,
}: {
  storeSettings: StoreSettings | null;
  banners: Banner[];
  setMainContentLoaded: (v: boolean) => void;
}) {
  useEffect(() => {
    setMainContentLoaded(true);
  }, [setMainContentLoaded]);

  return (
    <>
      {/* Social Buttons Section - Added below hero */}
      <div className="py-8" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-6">
            <div className="flex justify-center">
              <FacebookButton
                facebookUrl={storeSettings?.facebook_url || undefined}
                className="scale-110 transform transition-transform hover:scale-105 !my-0"
              />
            </div>
            <button
              className="telegram-button"
              onClick={() => window.open('https://t.me/samah_furnitures', '_blank', 'noopener,noreferrer')}
              type="button"
            >
              <div className="svg-wrapper-1">
                <div className="svg-wrapper">
                  <svg
                    viewBox="0 0 24 24"
                    height="1.2em"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.35-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
              </div>
              <span>تواصل على تيليجرام</span>
            </button>
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

export default App;
