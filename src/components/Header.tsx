import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, X, ChevronDown, Mic, MicOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, StoreSettings, Service } from '../types/database';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

interface HeaderProps {
  storeSettings?: StoreSettings | null;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export default function Header({ storeSettings }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Service[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState<string>(storeSettings?.logo_url || '/favicon.png');

  const menuRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const {
    toggleCart,
    itemCount,
    isCartOpen,
  } = useCart();

  useEffect(() => {
    setLogoSrc(storeSettings?.logo_url || '/favicon.png');
  }, [storeSettings?.logo_url]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    const cleaned = query.trim();
    if (cleaned.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*, category:categories(*)')
        .or(`title.ilike.%${cleaned}%,description.ilike.%${cleaned}%`)
        .limit(12);

      if (servicesError) {
        console.error('Supabase search error:', servicesError);
        throw servicesError;
      }

      const availableServices = (services || []).filter(
        (service) => service.is_available !== false
      );

      const formattedServices = availableServices.slice(0, 10).map(service => ({
        ...service,
        displayImage: service.image_url || '/favicon.png'
      }));

      setSearchResults(formattedServices);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    }
  }, []);

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startVoiceSearch = useCallback(() => {
    if (isListening) {
      stopVoiceSearch();
      return;
    }

    setVoiceNotice(null);

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      const msg = 'البحث الصوتي غير مدعوم في هذا المتصفح، جرب استخدام متصفح Chrome أو Edge.';
      setVoiceNotice(msg);
      setIsSearchFocused(true);
      toast.info(msg);
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'ar-EG';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript('');
        setVoiceNotice(null);
        setIsSearchFocused(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0]?.transcript || '';
        }
        const cleanedTranscript = transcript.replace(/[.,،؟?!]+$/g, '').trim();
        setVoiceTranscript(cleanedTranscript);
        if (cleanedTranscript) {
          setIsSearchFocused(true);
          handleSearch(cleanedTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          const msg = 'يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح لاستخدام البحث الصوتي.';
          setVoiceNotice(msg);
          setIsSearchFocused(true);
          toast.warning(msg);
        } else if (event.error === 'no-speech') {
          const msg = 'لم يتم التقاط صوت واضح، اضغط على الميكروفون وتحدث مرة أخرى.';
          setVoiceNotice(msg);
          setIsSearchFocused(true);
          toast.info(msg);
        } else if (event.error !== 'aborted') {
          const msg = 'تعذر تشغيل البحث الصوتي، تأكد من توصيل الميكروفون وحاول مرة أخرى.';
          setVoiceNotice(msg);
          setIsSearchFocused(true);
          toast.error(msg);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Voice search error:', err);
      setIsListening(false);
      const msg = 'تعذر تشغيل الميكروفون للبحث الصوتي.';
      setVoiceNotice(msg);
      setIsSearchFocused(true);
      toast.error(msg);
    }
  }, [handleSearch, isListening, stopVoiceSearch]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore abort cleanup error
        }
      }
    };
  }, []);

  const clearSearch = () => {
    stopVoiceSearch();
    setSearchQuery('');
    setVoiceTranscript('');
    setVoiceNotice(null);
    setSearchResults([]);
    setIsSearchFocused(false);
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
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        !target.closest('.mobile-menu-button')
      ) {
        setIsMenuOpen(false);
      }
      const clickedInsideDesktopSearch = desktopSearchRef.current?.contains(target);
      const clickedInsideMobileSearch = mobileSearchRef.current?.contains(target);
      if (!clickedInsideDesktopSearch && !clickedInsideMobileSearch) {
        setIsSearchFocused(false);
        setVoiceNotice(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSearchDropdown = () => {
    if (!isSearchFocused && !isListening && !voiceNotice) return null;

    const hasEnoughQuery = searchQuery.trim().length >= 2;
    if (!isListening && !voiceNotice && !hasEnoughQuery) return null;

    return (
      <div className="mt-2 w-full bg-[#F7F3E9] rounded-xl shadow-xl border border-[#D1A94F]/45 overflow-hidden z-50">
        {isListening && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#E3C778]/35 border-b border-[#D1A94F]/30 text-xs font-semibold text-[#2B3318]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#B12704] animate-ping" />
              <span>
                {voiceTranscript
                  ? `تم التقاط: "${voiceTranscript}"`
                  : 'جاري الاستماع... تحدث الآن باسم المنتج'}
              </span>
            </div>
            <button
              type="button"
              onClick={stopVoiceSearch}
              className="text-[#B12704] hover:opacity-80 font-bold whitespace-nowrap"
            >
              إيقاف
            </button>
          </div>
        )}

        {voiceNotice && !isListening && (
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#E3C778]/35 border-b border-[#D1A94F]/40 text-xs font-semibold text-[#2B3318]">
            <span>{voiceNotice}</span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-[#B12704] font-bold"
              aria-label="إغلاق التنبيه"
            >
              ✕
            </button>
          </div>
        )}

        {searchResults.length > 0 ? (
          <div className="max-h-72 overflow-y-auto divide-y divide-[#3A4522]/10">
            {searchResults.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="flex items-center p-3 hover:bg-[#E3C778]/25 transition-colors"
                onClick={clearSearch}
              >
                <div className="w-12 h-12 rounded-lg bg-[#2B3318]/10 overflow-hidden flex-shrink-0 border border-[#D1A94F]/30">
                  <img
                    src={product.displayImage || '/favicon.png'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.src.endsWith('/favicon.png')) {
                        img.src = '/favicon.png';
                      }
                    }}
                  />
                </div>
                <div className="flex-1 text-right pr-3 min-w-0">
                  <h4 className="text-[#2B3318] font-semibold text-sm truncate">{product.title}</h4>
                  <p className="text-xs text-[#3A4522] font-medium">{product.category?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : hasEnoughQuery ? (
          <div className="p-4 text-center text-sm text-[#3A4522]/80">
            لا توجد نتائج للبحث عن "{searchQuery}"
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 bg-[#2B3318] text-[#F7F3E9] border-b border-[#D1A94F]/35 shadow-md"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
      >
        <div className="container mx-auto px-4 h-[56px] md:h-[76px] flex items-center justify-between gap-4">
          {/* Zone 1: Mobile Menu Toggle & Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="md:hidden text-[#F7F3E9] hover:bg-[#3A4522] p-2 rounded-lg transition-colors mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <img
                src={logoSrc}
                alt={storeSettings?.store_name || 'شركة الرؤى للتجارة والتوريدات والعطارة'}
                width={56}
                height={56}
                className="h-10 w-10 md:h-14 md:w-14 rounded-full object-cover bg-[#F7F3E9] p-0.5 ring-1 ring-[#D1A94F]/60 shadow-sm flex-shrink-0"
                onError={() => {
                  if (logoSrc !== '/favicon.png') {
                    setLogoSrc('/favicon.png');
                  }
                }}
              />
              <span className="font-bold text-base md:text-lg text-[#F7F3E9] whitespace-nowrap">
                متجر <span className="text-[#E3C778]">الرؤى</span>
              </span>
            </Link>
          </div>

          {/* Zone 2: Desktop Search Bar (Always Visible & Active) with Voice Search */}
          <div className="hidden md:block relative flex-1 max-w-xl mx-4" ref={desktopSearchRef}>
            <div className="relative flex items-center">
              <input
                ref={desktopInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="ابحث عن منتج بالكتابة أو بالصوت..."
                className="w-full bg-[#F7F3E9] text-[#2B3318] placeholder-[#3A4522]/70 rounded-full py-2.5 pr-9 pl-24 text-sm font-medium border border-[#D1A94F]/50 focus:outline-none focus:ring-2 focus:ring-[#E3C778] shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A4522]/70 hover:text-[#2B3318] p-1"
                  aria-label="مسح البحث"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Voice Microphone & Search Icon Group */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startVoiceSearch}
                  aria-label={isListening ? 'إيقاف البحث الصوتي' : 'البحث الصوتي'}
                  aria-pressed={isListening}
                  title={isListening ? 'جاري الاستماع... اضغط للإيقاف' : 'اضغط للبحث الصوتي بالمايكروفون'}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                    isListening
                      ? 'bg-[#B12704] text-white shadow-sm ring-2 ring-[#E3C778] animate-pulse'
                      : 'bg-[#E3C778]/50 text-[#2B3318] hover:bg-[#D1A94F] hover:text-[#2B3318]'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <span className="h-4 w-px bg-[#3A4522]/25" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => {
                    desktopInputRef.current?.focus();
                    setIsSearchFocused(true);
                    if (searchQuery.trim().length >= 2) {
                      handleSearch(searchQuery);
                    }
                  }}
                  className="p-1.5 rounded-full text-[#2B3318] hover:bg-[#E3C778]/40 transition-colors"
                  aria-label="بحث"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="absolute top-full inset-x-0 z-50">
              {renderSearchDropdown()}
            </div>
          </div>

          {/* Zone 3: Navigation & Cart */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <nav className="hidden md:block">
              <ul className="flex gap-2 items-center text-sm font-semibold">
                <li>
                  <Link
                    to="/"
                    className="text-[#F7F3E9] hover:text-[#E3C778] hover:bg-[#3A4522] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    الرئيسية
                  </Link>
                </li>
                <li className="relative group">
                  <button
                    type="button"
                    className="text-[#F7F3E9] hover:text-[#E3C778] hover:bg-[#3A4522] px-3 py-2 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>الأقسام</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute top-full right-0 pt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150">
                    <div className="bg-[#F7F3E9] rounded-xl shadow-xl border border-[#D1A94F]/40 p-2 max-h-96 overflow-y-auto">
                      {categories.map(cat => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.id}`}
                          className="block px-3 py-2 rounded-lg text-[#2B3318] hover:bg-[#2B3318] hover:text-[#F7F3E9] font-medium text-sm transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-[#F7F3E9] hover:text-[#E3C778] hover:bg-[#3A4522] px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    تواصل معنا
                  </a>
                </li>
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => toggleCart(!isCartOpen)}
              className="relative p-2 md:p-2.5 rounded-xl bg-[#3A4522] hover:bg-[#D1A94F] text-[#F7F3E9] hover:text-[#2B3318] border border-[#D1A94F]/35 transition-colors flex items-center gap-2 shrink-0"
              aria-label="سلة التسوق"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="bg-[#E3C778] text-[#2B3318] text-[11px] font-extrabold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center tabular-nums">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Always-Visible Mobile Search Bar Row */}
        <div
          className="md:hidden bg-[#2B3318] px-3 pb-2.5 pt-0.5 relative"
          ref={mobileSearchRef}
        >
          <div className="relative flex items-center">
            <input
              ref={mobileInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="ابحث عن منتج بالكتابة أو بالصوت..."
              className="w-full bg-[#F7F3E9] text-[#2B3318] placeholder-[#3A4522]/70 rounded-full py-2 pr-9 pl-24 text-sm font-medium border border-[#D1A94F]/50 focus:outline-none focus:ring-2 focus:ring-[#E3C778] shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A4522]/70 hover:text-[#2B3318] p-1"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={startVoiceSearch}
                aria-label={isListening ? 'إيقاف البحث الصوتي' : 'البحث الصوتي'}
                aria-pressed={isListening}
                title={isListening ? 'جاري الاستماع... اضغط للإيقاف' : 'البحث الصوتي بالمايكروفون'}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${
                  isListening
                    ? 'bg-[#B12704] text-white ring-2 ring-[#E3C778] animate-pulse'
                    : 'bg-[#E3C778]/50 text-[#2B3318] hover:bg-[#D1A94F]'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <span className="h-4 w-px bg-[#3A4522]/25" aria-hidden="true" />
              <button
                type="button"
                onClick={() => {
                  mobileInputRef.current?.focus();
                  setIsSearchFocused(true);
                  if (searchQuery.trim().length >= 2) {
                    handleSearch(searchQuery);
                  }
                }}
                className="p-1.5 rounded-full text-[#2B3318] hover:bg-[#E3C778]/40 transition-colors"
                aria-label="بحث"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="absolute top-full inset-x-3 z-50">
            {renderSearchDropdown()}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 w-72 bg-[#2B3318] text-[#F7F3E9] z-[60] shadow-2xl md:hidden flex flex-col pt-16 border-l border-[#3A4522]"
            ref={menuRef}
          >
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-4 left-4 p-2 rounded-lg text-[#F7F3E9] hover:bg-[#3A4522]"
              aria-label="إغلاق القائمة"
            >
              <X className="h-6 w-6" />
            </button>
            <nav className="p-4 space-y-3 overflow-y-auto">
              <Link
                to="/"
                className="block px-3 py-2 rounded-lg text-[#F7F3E9] hover:bg-[#3A4522] font-bold text-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <div className="space-y-1.5 pt-2 border-t border-[#D1A94F]/25">
                <span className="block px-3 text-[#E3C778] text-xs font-semibold">الأقسام</span>
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className="block px-4 py-2 rounded-lg text-[#F7F3E9] hover:bg-[#3A4522] text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="pt-2 border-t border-[#D1A94F]/25">
                <a
                  href="#contact"
                  className="block px-3 py-2 rounded-lg text-[#F7F3E9] hover:bg-[#3A4522] font-bold text-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  تواصل معنا
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
