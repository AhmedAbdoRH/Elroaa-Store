import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Facebook, Instagram, Twitter, Snail as Snapchat, Youtube, Phone, MapPin, MessageCircle } from 'lucide-react';
import type { StoreSettings } from '../types/database';

interface FooterProps {
  storeSettings?: StoreSettings | null;
}

export default function Footer({ storeSettings }: FooterProps) {
  const socialLinks = [
    { url: storeSettings?.facebook_url || "https://www.facebook.com/share/1bZQQuQinu/", icon: Facebook, label: 'Facebook' },
    { url: storeSettings?.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: storeSettings?.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: storeSettings?.snapchat_url, icon: Snapchat, label: 'Snapchat' },
    { url: storeSettings?.tiktok_url, icon: Youtube, label: 'TikTok' },
  ].filter(link => link.url);

  return (
    <footer id="contact" className="bg-[#F7F3E9] border-t border-[#D1A94F]/35">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          {/* Social Links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-4 mb-4">
              {socialLinks.map((link, index) => (
                link.url && (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2B3318] hover:text-[#2B3318] transition-colors duration-200 p-2 rounded-full bg-[#E3C778]/35 hover:bg-[#D1A94F] border border-[#D1A94F]/40"
                    title={link.label}
                  >
                    <link.icon className="h-6 w-6" />
                  </a>
                )
              ))}
            </div>
          )}

          {/* Branches and Contact Info */}
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Branch 1 */}
              <div className="bg-[#2B3318]/[0.04] rounded-xl p-4 border border-[#3A4522]/20">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#D1A94F] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-[#2B3318] font-semibold mb-2">قسم التوريدات</h3>
                    <p className="text-[#3A4522]/85 text-sm leading-relaxed">
                      توريد للمطاعم، المصانع، والمحلات بأسعار الجملة
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="bg-[#2B3318]/[0.04] rounded-xl p-4 border border-[#3A4522]/20">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#D1A94F] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-[#2B3318] font-semibold mb-2">مقر الشركة</h3>
                    <p className="text-[#3A4522]/85 text-sm leading-relaxed">
                      القليوبية - بنها / كفر شكر
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Numbers */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              {/* Phone Button */}
              <a
                href="tel:01553218800"
                className="group relative flex items-center gap-3 px-6 py-3 rounded-xl 
                           bg-[#2B3318] hover:bg-[#3A4522]
                           border border-[#D1A94F]/40
                           text-[#F7F3E9] shadow-md hover:shadow-lg
                           transform hover:-translate-y-0.5
                           transition-all duration-200 ease-out"
              >
                <Phone className="h-5 w-5 text-[#E3C778] transition-all duration-200 relative z-10" />
                <span className="text-[#F7F3E9] text-base font-semibold relative z-10 tabular-nums">01553218800</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/201003046674"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 px-6 py-3 rounded-xl 
                           bg-[#2B3318] hover:bg-[#3A4522]
                           border border-[#D1A94F]/40
                           text-[#F7F3E9] shadow-md hover:shadow-lg
                           transform hover:-translate-y-0.5
                           transition-all duration-200 ease-out"
              >
                <MessageCircle className="h-5 w-5 text-[#E3C778] transition-all duration-200 relative z-10" />
                <span className="text-[#F7F3E9] text-base font-semibold relative z-10 tabular-nums">01003046674</span>
              </a>
            </div>
          </div>

          {/* Developer Info */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl 
                           bg-[#2B3318]/[0.04]
                           border border-[#3A4522]/20 
                           shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
            <p className="text-[#3A4522]/75 text-xs">
              تم التطوير بواسطة
            </p>
            <div className="flex items-center gap-1.5" dir="ltr">
              <Target className="text-[#D1A94F] h-4 w-4" />
              <a href="https://Rhm-digital.com" 
                 className="text-[#2B3318] font-semibold underline-offset-4 hover:underline text-sm transition-all duration-200 hover:text-[#3A4522]">
                RHM Digital Solutions
              </a>
            </div>
          </div>

          <Link
            to="/admin/login"
            className="text-[#2B3318]/0 hover:text-[#2B3318] transition-colors duration-300 flex justify-center items-center"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </footer>
  );
}