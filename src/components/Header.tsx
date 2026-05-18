import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, Trash2, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, StoreSettings, Service } from '../types/database';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  storeSettings?: StoreSettings | null;
}

export default function Header({ storeSettings }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcatsByCategory, setSubcatsByCategory] = useState<Record<string, { id: string; name: string }[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    toggleCart,
    itemCount,
    cartItems,
    removeFromCart,
    updateQuantity,
    isCartOpen,
    cartTotal,
    sendOrderViaWhatsApp
  } = useCart();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Searching for:', query); // Debug log
      
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*, category:categories(*)')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .or('is_available.is.true,is_available.is.null')
        .limit(10);

      if (servicesError) {
        console.error('Supabase search error:', servicesError);
        throw servicesError;
      }

      console.log('Search results:', services); // Debug log

      const formattedServices = (services || []).map(service => ({
        ...service,
        displayImage: service.image_url || '/placeholder-product.jpg'
      }));

      setSearchResults(formattedServices);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setCategories((data || []).map(cat => ({ ...cat, description: null, created_at: '' })));

        const { data: subs, error: subErr } = await supabase
          .from('subcategories')
          .select('id, name_ar, category_id')
          .order('name_ar');
        if (subErr) throw subErr;

        const grouped: Record<string, { id: string; name: string }[]> = {};
        (subs || []).forEach((s: any) => {
          if (!grouped[s.category_id]) grouped[s.category_id] = [];
          grouped[s.category_id].push({ id: s.id, name: s.name_ar });
        });
        setSubcatsByCategory(grouped);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.mobile-menu-button')) {
        setIsMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-primary/80 backdrop-blur-md border-b border-secondary/10 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-secondary p-2 -ml-2 mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/" className="flex-shrink-0">
              <img 
                src={storeSettings?.logo_url || '/logo.webp'} 
                alt={storeSettings?.store_name || 'شركة الرؤى للتجارة والتوريدات والعطارة'} 
                className="h-12 md:h-16 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/logo.webp') {
                    target.src = '/logo.webp';
                  }
                }}
              />
            </Link>
          </div>

          <div className="hidden md:block relative flex-1 max-w-xl mx-8" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="ابحث عن منتج..."
                className="w-full bg-secondary/10 text-secondary placeholder-secondary/50 rounded-full py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary/50" />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary/50">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isSearchFocused && (
              <div className="absolute mt-2 w-full bg-primary/95 backdrop-blur-md rounded-lg shadow-xl border border-secondary/10 overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center p-3 hover:bg-secondary/5 border-b border-secondary/5 last:border-0"
                      onClick={clearSearch}
                    >
                      <div className="w-12 h-12 rounded bg-secondary/5 overflow-hidden">
                        <img src={product.displayImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 text-right pr-2">
                        <h4 className="text-secondary font-medium">{product.title}</h4>
                        <p className="text-xs text-secondary/60">{product.category?.name}</p>
                      </div>
                    </Link>
                  ))
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-secondary/50">
                    لا توجد نتائج للبحث عن "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isMobileSearchOpen && (
              <div className="fixed inset-x-0 top-16 z-50 bg-primary/95 backdrop-blur-md p-3 md:hidden shadow-lg" ref={searchRef}>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    placeholder="ابحث عن منتج..."
                    className="w-full bg-secondary/10 text-secondary placeholder-secondary/50 rounded-full py-2 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary/50" />
                  {searchQuery && (
                    <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary/50">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => { setIsMobileSearchOpen(false); clearSearch(); }} className="absolute -top-10 right-2 text-secondary/70">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto bg-primary/90 rounded-lg border border-secondary/10">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center p-3 hover:bg-secondary/5 border-b border-secondary/5 last:border-0"
                        onClick={() => { setIsMobileSearchOpen(false); clearSearch(); }}
                      >
                        <div className="w-10 h-10 rounded bg-secondary/5 overflow-hidden">
                          <img src={product.displayImage} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-right pr-2">
                          <h4 className="text-secondary font-medium text-sm">{product.title}</h4>
                          <p className="text-xs text-secondary/60">{product.category?.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {isSearchFocused && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                  <div className="mt-2 p-3 text-center text-secondary/50 bg-primary/90 rounded-lg border border-secondary/10">
                    لا توجد نتائج
                  </div>
                )}
              </div>
            )}
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="md:hidden p-2 text-secondary">
              <Search className="h-6 w-6" />
            </button>

            <nav className="hidden md:block">
              <ul className="flex gap-6 items-center">
                <li><Link to="/" className="text-secondary hover:text-accent">الرئيسية</Link></li>
                <li className="relative group">
                  <button className="text-secondary hover:text-accent flex items-center gap-1">
                    الأقسام <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-primary/95 backdrop-blur-lg rounded-lg shadow-xl border border-secondary/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-4 max-h-96 overflow-y-auto">
                      {categories.map(cat => (
                        <div key={cat.id} className="py-1">
                          <Link to={`/category/${cat.id}`} className="block py-2 text-secondary hover:text-accent font-medium">
                            {cat.name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li><a href="#contact" className="text-secondary hover:text-accent">تواصل معنا</a></li>
              </ul>
            </nav>

            <div className="relative">
              <button onClick={() => toggleCart(!isCartOpen)} className="relative p-2 text-secondary">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-primary text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer Simulation / Simple Preview */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary/95 backdrop-blur-md rounded-xl shadow-2xl border border-secondary/10 z-50 p-4"
          >
            <div className="flex justify-between items-center mb-4 border-b border-secondary/10 pb-2">
              <h3 className="text-secondary font-bold">سلة التسوق</h3>
              <button onClick={() => toggleCart(false)}><X className="h-5 w-5 text-secondary/50" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 items-center">
                  <img src={item.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 text-right">
                    <h4 className="text-secondary text-sm font-medium">
                      {item.title}
                      {item.size && <span className="text-xs font-normal text-secondary/70 mr-1">({item.size})</span>}
                    </h4>
                    <span className="text-accent font-bold text-xs">{item.price} ج</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-secondary">+</button>
                    <span className="text-secondary text-xs">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))} className="text-secondary">-</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-secondary/10">
              <div className="flex justify-between mb-4">
                <span className="text-secondary/60">المجموع:</span>
                <span className="text-accent font-bold">{cartTotal} ج</span>
              </div>
              <button
                onClick={() => { sendOrderViaWhatsApp(); toggleCart(false); }}
                className="w-full bg-[#25D366] text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                اكمال الطلب عبر واتساب
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-64 bg-primary z-50 shadow-xl md:hidden flex flex-col pt-20"
            ref={menuRef}
          >
            <nav className="p-4 space-y-4">
              <Link to="/" className="block text-secondary text-lg" onClick={() => setIsMenuOpen(false)}>الرئيسية</Link>
              <div className="space-y-2">
                <span className="text-secondary/50 text-sm">الأقسام</span>
                {categories.map(cat => (
                  <Link key={cat.id} to={`/category/${cat.id}`} className="block pr-4 text-secondary" onClick={() => setIsMenuOpen(false)}>
                    {cat.name}
                  </Link>
                ))}
              </div>
              <a href="#contact" className="block text-secondary text-lg" onClick={() => setIsMenuOpen(false)}>تواصل معنا</a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
