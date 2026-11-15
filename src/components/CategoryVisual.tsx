import { useState, useEffect } from 'react';
import { getCategoryImageUrl, subscribeToCategoryImages } from '../utils/categoryImagesManager';

interface CategoryVisualProps {
  categoryId?: string;
  categoryName: string;
  customImageUrl?: string | null;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .trim();
}

type CategoryIconKey =
  | 'herbs'
  | 'incense'
  | 'legumes'
  | 'spices'
  | 'oils'
  | 'honey'
  | 'therapy'
  | 'coffee'
  | 'bakery'
  | 'mixes'
  | 'sauces'
  | 'nuts'
  | 'dairy'
  | 'ramadan'
  | 'default';

function detectCategoryKey(name: string): CategoryIconKey {
  const n = normalizeArabic(name);

  if (n.includes('ياميش') || n.includes('رمضان') || n.includes('بلح') || n.includes('تمر') || n.includes('قمر الدين')) {
    return 'ramadan';
  }
  if (n.includes('بلبن') || n.includes('البان') || n.includes('لبن') || n.includes('سمن') || n.includes('زبده') || n.includes('جبن')) {
    return 'dairy';
  }
  if (n.includes('مكسرات') || n.includes('تسالي') || n.includes('لوز') || n.includes('فستق') || n.includes('كاجو') || n.includes('لب')) {
    return 'nuts';
  }
  if (n.includes('مزاج') || n.includes('صوص') || n.includes('تتبيل') || n.includes('صلصه') || n.includes('كاتشب')) {
    return 'sauces';
  }
  if (n.includes('خلطات') || n.includes('تركيبات') || n.includes('وصفات')) {
    return 'mixes';
  }
  if (n.includes('حلويات') || n.includes('دقيق') || n.includes('كاكاو') || n.includes('فانيليا') || n.includes('مخبوز')) {
    return 'bakery';
  }
  if (n.includes('قهوه') || n.includes('مشروبات') || n.includes('شاي') || n.includes('نسكافيه') || n.includes('بن')) {
    return 'coffee';
  }
  if (n.includes('علاج') || n.includes('عنايه') || n.includes('شخصيه') || n.includes('بشره') || n.includes('شعر')) {
    return 'therapy';
  }
  if (n.includes('عسل') || n.includes('نحل') || n.includes('شمع') || n.includes('غذاء الملكات')) {
    return 'honey';
  }
  if (n.includes('زيوت') || n.includes('زيت')) {
    return 'oils';
  }
  if (n.includes('توابل') || n.includes('بهارات') || n.includes('فلفل') || n.includes('كمون') || n.includes('كركم')) {
    return 'spices';
  }
  if (n.includes('بقوليات') || n.includes('حبوب') || n.includes('عدس') || n.includes('فول') || n.includes('ارز')) {
    return 'legumes';
  }
  if (n.includes('بخور') || n.includes('روائح') || n.includes('عطور') || n.includes('مسك') || n.includes('عود')) {
    return 'incense';
  }
  if (n.includes('اعشاب') || n.includes('عشب') || n.includes('طبيعيه')) {
    return 'herbs';
  }
  return 'default';
}

function CategorySvgVector({ iconKey }: { iconKey: CategoryIconKey }) {
  switch (iconKey) {
    case 'herbs':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M24 39V20" stroke="#3B4B1B" strokeWidth="2.8" strokeLinecap="round" />
          <path
            d="M24 27C15 27 10 20 11 11C19 11 25 16 24 27Z"
            fill="#65A30D"
            stroke="#3B4B1B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 22C33 22 38 15 37 7C29 7 23 12 24 22Z"
            fill="#4D7C0F"
            stroke="#3B4B1B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M24 34C18 34 14 30 14 25C19 25 24 28 24 34Z"
            fill="#84CC16"
            stroke="#3B4B1B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <ellipse cx="24" cy="40" rx="10" ry="2.5" fill="#4B5E26" fillOpacity="0.22" />
        </svg>
      );

    case 'incense':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M19 17C17 13 21 10 19 6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
          <path d="M25 16C23 12 27 9 25 5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
          <path d="M30 17C28 14 31 11 29 8" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 22H34L31 30H17L14 22Z" fill="#D97706" stroke="#78350F" strokeWidth="2" strokeLinejoin="round" />
          <path d="M19 30H29L32 39H16L19 30Z" fill="#B45309" stroke="#78350F" strokeWidth="2" strokeLinejoin="round" />
          <path d="M13 40H35" stroke="#78350F" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24" cy="26" r="2" fill="#FDE68A" />
        </svg>
      );

    case 'legumes':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M9 24H39C39 33 32.5 39 24 39C15.5 39 9 33 9 24Z"
            fill="#A16207"
            stroke="#451A03"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <ellipse cx="17" cy="21" rx="4" ry="2.8" transform="rotate(-15 17 21)" fill="#FBBF24" stroke="#78350F" strokeWidth="1.5" />
          <ellipse cx="24" cy="18" rx="4.2" ry="3" fill="#EA580C" stroke="#7C2D12" strokeWidth="1.5" />
          <ellipse cx="31" cy="21" rx="4" ry="2.8" transform="rotate(15 31 21)" fill="#84CC16" stroke="#365314" strokeWidth="1.5" />
          <ellipse cx="21" cy="23" rx="3.5" ry="2.4" fill="#FDE047" stroke="#854D0E" strokeWidth="1.4" />
          <ellipse cx="28" cy="23" rx="3.5" ry="2.4" fill="#D97706" stroke="#78350F" strokeWidth="1.4" />
        </svg>
      );

    case 'spices':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M10 25H38C38 34 32 39 24 39C16 39 10 34 10 25Z"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="2.2"
          />
          <path d="M13 25C13 18 18 14 24 14C30 14 35 18 35 25Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.8" />
          <path d="M16 25C16 20 20 17 24 17C28 17 32 20 32 25Z" fill="#F59E0B" />
          <path d="M31 19L40 10" stroke="#B45309" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="24" cy="22" r="2" fill="#FEF08A" />
        </svg>
      );

    case 'oils':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <rect x="20" y="7" width="8" height="5" rx="1.5" fill="#78350F" />
          <path
            d="M21 12H27L29 18C33 20 35 24 35 30C35 36.5 30.5 40 24 40C17.5 40 13 36.5 13 30C13 24 15 20 19 18L21 12Z"
            fill="#FACC15"
            stroke="#854D0E"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M24 22C24 22 29 27 29 31C29 33.8 26.8 36 24 36C21.2 36 19 33.8 19 31C19 27 24 22 24 22Z"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="1.5"
          />
          <path d="M13 16C10 14 9 11 11 9C14 9 15 12 13 16Z" fill="#65A30D" stroke="#3B4B1B" strokeWidth="1.5" />
        </svg>
      );

    case 'honey':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M14 18H34L36 25V36C36 38.8 33.8 41 31 41H17C14.2 41 12 38.8 12 36V25L14 18Z"
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="16" y="13" width="16" height="5" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1.8" />
          <polygon points="24,23 28.5,25.5 28.5,30.5 24,33 19.5,30.5 19.5,25.5" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
          <path d="M31 11L39 7" stroke="#92400E" strokeWidth="2.4" strokeLinecap="round" />
          <ellipse cx="29" cy="12" rx="3.5" ry="2.5" transform="rotate(-25 29 12)" fill="#D97706" />
        </svg>
      );

    case 'therapy':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <circle cx="24" cy="25" r="14" fill="#ECFCCB" stroke="#4B5E26" strokeWidth="2.2" />
          <path d="M24 17V33M16 25H32" stroke="#4B5E26" strokeWidth="4.5" strokeLinecap="round" />
          <path
            d="M32 10C37 10 40 13 39 18C34 18 31 15 32 10Z"
            fill="#65A30D"
            stroke="#3B4B1B"
            strokeWidth="1.8"
          />
        </svg>
      );

    case 'coffee':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M18 12C17 9 20 8 19 5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <path d="M25 12C24 9 27 8 26 5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M11 18H31V29C31 34.5 26.5 39 21 39C15.5 39 11 34.5 11 29V18Z"
            fill="#6F4E37"
            stroke="#3E2723"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M31 21H34.5C36.7 21 38.5 22.8 38.5 25C38.5 27.2 36.7 29 34.5 29H31" stroke="#3E2723" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M9 41H33" stroke="#5D4037" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="21" cy="27" rx="3.2" ry="4.5" transform="rotate(-20 21 27)" fill="#A16207" stroke="#FDE68A" strokeWidth="1.2" />
        </svg>
      );

    case 'bakery':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M15 17C12 17 10 14 11 11C12 8.5 15 8 17 9C18.5 7 21.5 6.5 24 6.5C26.5 6.5 29.5 7 31 9C33 8 36 8.5 37 11C38 14 36 17 33 17H15Z"
            fill="#FEF3C7"
            stroke="#92400E"
            strokeWidth="2"
          />
          <path
            d="M13 17H35L37 37C37 39 35.5 40.5 33.5 40.5H14.5C12.5 40.5 11 39 11 37L13 17Z"
            fill="#FDE68A"
            stroke="#92400E"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M24 23L25.5 26.5L29 27L26.3 29.5L27 33L24 31.2L21 33L21.7 29.5L19 27L22.5 26.5L24 23Z" fill="#D97706" />
        </svg>
      );

    case 'mixes':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M30 21L38 10" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
          <path
            d="M10 22H38C38 31 32 37 24 37C16 37 10 31 10 22Z"
            fill="#57534E"
            stroke="#292524"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path d="M16 39H32" stroke="#292524" strokeWidth="3" strokeLinecap="round" />
          <path d="M18 19C16 14 19 10 23 11C24 15 22 18 18 19Z" fill="#65A30D" stroke="#365314" strokeWidth="1.5" />
          <circle cx="28" cy="18" r="2.2" fill="#F59E0B" />
        </svg>
      );

    case 'sauces':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path d="M21 7H27L26 14H22L21 7Z" fill="#DC2626" stroke="#7F1D1D" strokeWidth="1.8" />
          <rect
            x="16"
            y="14"
            width="16"
            height="25"
            rx="5"
            fill="#EF4444"
            stroke="#7F1D1D"
            strokeWidth="2.2"
          />
          <rect x="19" y="21" width="10" height="9" rx="2" fill="#FEF3C7" />
          <circle cx="24" cy="25.5" r="2.5" fill="#65A30D" />
        </svg>
      );

    case 'nuts':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <ellipse cx="18" cy="24" rx="7" ry="11" transform="rotate(-25 18 24)" fill="#D97706" stroke="#78350F" strokeWidth="2" />
          <path d="M14 19C16 22 18 25 20 29" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="31" cy="26" rx="7" ry="10" transform="rotate(20 31 26)" fill="#FBBF24" stroke="#78350F" strokeWidth="2" />
          <ellipse cx="30" cy="26" rx="3" ry="6" transform="rotate(20 30 26)" fill="#84CC16" />
          <circle cx="24" cy="15" r="5" fill="#B45309" stroke="#78350F" strokeWidth="1.8" />
        </svg>
      );

    case 'dairy':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <rect x="19" y="7" width="10" height="4" rx="1.5" fill="#0284C7" />
          <path
            d="M19 11H29L33 19V37C33 39.2 31.2 41 29 41H19C16.8 41 15 39.2 15 37V19L19 11Z"
            fill="#FFFFFF"
            stroke="#0369A1"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <rect x="16" y="24" width="16" height="8" fill="#E0F2FE" />
          <path d="M24 25C24 25 27 28 27 29.8C27 31.5 25.7 32.8 24 32.8C22.3 32.8 21 31.5 21 29.8C21 28 24 25 24 25Z" fill="#0284C7" />
        </svg>
      );

    case 'ramadan':
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <path
            d="M27 8C19.5 8 13.5 14 13.5 21.5C13.5 29 19.5 35 27 35C29.8 35 32.4 34.1 34.5 32.6C29.5 32.3 25.5 28.1 25.5 23C25.5 17.9 29.5 13.7 34.5 13.4C32.4 10.1 29.9 8 27 8Z"
            fill="#FACC15"
            stroke="#A16207"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M35 16L36.2 18.8L39 19.2L37 21.2L37.5 24L35 22.6L32.5 24L33 21.2L31 19.2L33.8 18.8L35 16Z" fill="#F59E0B" />
          <ellipse cx="22" cy="39" rx="6" ry="3.2" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <ellipse cx="32" cy="38" rx="5.5" ry="3" fill="#92400E" stroke="#451A03" strokeWidth="1.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="15" fill="#ECFCCB" stroke="#4B5E26" strokeWidth="2.2" />
          <path
            d="M24 33C17 33 14 27 16 19C22 19 26 24 24 33Z"
            fill="#65A30D"
            stroke="#3B4B1B"
            strokeWidth="1.8"
          />
          <path
            d="M24 30C31 30 34 24 32 16C26 16 22 21 24 30Z"
            fill="#4B5E26"
            stroke="#2E3B16"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

export default function CategoryVisual({
  categoryId,
  categoryName,
  customImageUrl,
  isActive = false,
  size = 'md',
}: CategoryVisualProps) {
  const [storedImage, setStoredImage] = useState<string | null>(
    () => customImageUrl || getCategoryImageUrl(categoryId)
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    setStoredImage(customImageUrl || getCategoryImageUrl(categoryId));
    return subscribeToCategoryImages(() => {
      setImgFailed(false);
      setStoredImage(customImageUrl || getCategoryImageUrl(categoryId));
    });
  }, [categoryId, customImageUrl]);

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
        ? 'w-12 h-12 rounded-xl'
        : 'w-9 h-9 md:w-11 md:h-11 rounded-xl';

  const iconKey = detectCategoryKey(categoryName);

  if (storedImage && !imgFailed) {
    return (
      <div
        className={`${sizeClasses} overflow-hidden flex-shrink-0 border shadow-sm transition-colors ${
          isActive
            ? 'bg-[#f5f6db] border-[#f5f6db]/80'
            : 'bg-[#f5f6db] border-[#4B5E26]/20'
        }`}
      >
        <img
          src={storedImage}
          alt={categoryName}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses} p-1.5 flex items-center justify-center flex-shrink-0 border shadow-sm transition-colors ${
        isActive
          ? 'bg-[#f5f6db] border-[#f5f6db]/80'
          : 'bg-[#f5f6db]/90 border-[#4B5E26]/20'
      }`}
    >
      <CategorySvgVector iconKey={iconKey} />
    </div>
  );
}
