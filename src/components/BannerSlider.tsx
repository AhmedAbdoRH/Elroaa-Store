import { useEffect, useRef, useState } from 'react';
import type { Banner } from '../types/database';

interface BannerSliderProps {
  banners: Banner[];
}

const SLIDE_INTERVAL = 4000;

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [fadeIn, setFadeIn] = useState(false);
  useEffect(() => {
    setTimeout(() => setFadeIn(true), 50);
  }, []);
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, SLIDE_INTERVAL);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [current, banners]);

  if (!banners.length) return null;

  return (
    <div
      className={`relative w-full h-[170px] md:h-[100px] lg:h-[260px] xl:h-[300px] flex items-center justify-center overflow-hidden rounded-none mt-16 md:mt-8 fade-in-banner${fadeIn ? ' fade-in-active' : ''}`}
    >
      {/* تأثير Fade-in للبانر عند أول تحميل */}
      <style>{`
        .fade-in-banner {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.9s cubic-bezier(.4,0,.2,1), transform 0.9s cubic-bezier(.4,0,.2,1);
        }
        .fade-in-banner.fade-in-active {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {banner.type === 'image' && banner.image_url ? (
            banner.image_url.endsWith('.webm') ? (
              <video
                src={banner.image_url}
                className="w-full h-full min-h-full object-cover object-center"
                autoPlay
                loop
                muted
                playsInline
                style={{ borderRadius: 0 }}
              />
            ) : (
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full h-full min-h-full object-cover object-center"
                style={{ borderRadius: 0 }}
              />
            )
          ) : (
            <div className="w-full h-full min-h-full flex flex-col justify-center items-center bg-white/5 backdrop-blur-xl p-2 sm:p-4 md:p-5 lg:p-6 border border-white/10 shadow-2xl">
              {banner.title && (
  <h1
  className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1 text-center text-white max-w-lg lg:max-w-2xl"
  style={{ fontFamily: `'Cairo', 'Tajawal', 'Amiri', 'Arial', 'sans-serif'`, letterSpacing: '0.03em', lineHeight: '1.2', marginBottom: '0.4rem' }}
>
  {banner.title}
</h1>
)}
{banner.description && (
  <p
    className="text-xs sm:text-xs md:text-sm lg:text-base mb-2 text-center text-gray-300 max-w-md lg:max-w-lg"
    style={{ fontFamily: `'Cairo', 'Tajawal', 'Amiri', 'Arial', 'sans-serif'`, letterSpacing: '0.02em', lineHeight: '1.5', marginTop: '0', marginBottom: '0.6rem' }}
  >
    {banner.description}
  </p>
) }
            </div>
          )}
        </div>
      ))}
      {/* المؤشرات */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {banners.map((_, idx) => (
            <button
              key={idx}
              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300 border border-white/20 hover:scale-110
                ${current === idx ? 'bg-white/40 w-4 sm:w-5' : 'bg-white/15 hover:bg-white/25'}
              `}
              onClick={() => setCurrent(idx)}
              aria-label={`انتقل إلى البانر رقم ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
