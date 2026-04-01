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
    <footer className="bg-primary backdrop-blur-md border-t border-secondary/10">
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
                    className="text-secondary/80 hover:text-accent transition-colors duration-300"
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
              <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/10">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-secondary font-semibold mb-2">قسم التوريدات</h3>
                    <p className="text-secondary/80 text-sm leading-relaxed">
                      توريد للمطاعم، المصانع، والمحلات بأسعار الجملة
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/10">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-secondary font-semibold mb-2">مقر الشركة</h3>
                    <p className="text-secondary/80 text-sm leading-relaxed">
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
                           bg-gradient-to-r from-green-600/25 to-green-500/25 
                           hover:from-green-600/40 hover:to-green-500/40
                           border border-green-500/30 hover:border-green-400/50
                           shadow-[0_4px_15px_rgba(34,197,94,0.15)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.3)]
                           transform hover:-translate-y-1 hover:scale-[1.02]
                           transition-all duration-300 ease-out"
              >
                <span className="absolute inset-0 rounded-xl bg-green-400/10 opacity-0 
                                 group-hover:opacity-100 transition-opacity duration-300"></span>
                <Phone className="h-5 w-5 text-green-400 group-hover:text-green-300 
                                  group-hover:animate-pulse transition-all duration-300 relative z-10" />
                <span className="text-secondary text-base font-semibold relative z-10">01553218800</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/201003046674"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-3 px-6 py-3 rounded-xl 
                           bg-gradient-to-r from-green-600/25 to-green-500/25 
                           hover:from-green-600/40 hover:to-green-500/40
                           border border-green-500/30 hover:border-green-400/50
                           shadow-[0_4px_15px_rgba(34,197,94,0.15)] hover:shadow-[0_6px_25px_rgba(34,197,94,0.3)]
                           transform hover:-translate-y-1 hover:scale-[1.02]
                           transition-all duration-300 ease-out"
              >
                <span className="absolute inset-0 rounded-xl bg-green-400/10 opacity-0 
                                 group-hover:opacity-100 transition-opacity duration-300"></span>
                <MessageCircle className="h-5 w-5 text-green-400 group-hover:text-green-300 
                                          group-hover:animate-pulse transition-all duration-300 relative z-10" />
                <span className="text-secondary text-base font-semibold relative z-10">01003046674</span>
              </a>
            </div>
          </div>

          {/* Developer Info */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl 
                           bg-gradient-to-r from-secondary/5 to-accent/5 
                           border border-secondary/10 
                           shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
            <p className="text-secondary text-opacity-60 text-xs">
              تم التطوير بواسطة
            </p>
            <div className="flex items-center gap-1.5" dir="ltr">
              <Target className="text-green-500 h-4 w-4" />
              <a href="https://Rhm-digital.com" 
                 className="text-secondary text-opacity-90 font-semibold underline-offset-4 hover:underline text-sm transition-all duration-300 hover:text-green-500">
                RHM Digital Solutions
              </a>
            </div>
          </div>

          <Link
            to="/admin/login"
            className="text-secondary/0 hover:text-accent transition-colors duration-300 flex justify-center items-center"
          >
            لوحة التحكم
          </Link>
        </div>
      </div>
    </footer>
  );
}