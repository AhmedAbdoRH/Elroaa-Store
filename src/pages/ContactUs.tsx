import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Clock, Mail, MessageCircle } from 'lucide-react';

export default function ContactUs() {
  return (
    <>
      <Helmet>
        <title>اتصل بنا - معرض السماح للمفروشات | بنها وأسنيت كفر شكر</title>
        <meta name="description" content="تواصل مع معرض السماح للمفروشات - فرع بنها: 01222582955، فرع أسنيت كفر شكر: 01013210146. نقدم أفضل المفروشات والأثاث المنزلي في مصر." />
        <meta name="keywords" content="اتصل بنا, معرض السماح للمفروشات, بنها, أسنيت كفر شكر, هاتف, واتساب, مفروشات, أثاث منزلي" />
        <link rel="canonical" href="https://alsamah-store.com/contact" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              <span className="text-[#FFD700]">اتصل بنا</span> - معرض السماح للمفروشات
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              نحن هنا لخدمتكم! تواصلوا معنا للحصول على أفضل المفروشات والأثاث المنزلي 
              في بنها وأسنيت كفر شكر. فريقنا متاح لمساعدتكم في اختيار المنتجات المناسبة.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-6">معلومات الاتصال</h2>
                
                {/* Phone Numbers */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Phone className="h-8 w-8 text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">الفرع الأول - بنها</h3>
                      <a 
                        href="tel:01222582955" 
                        className="text-green-400 text-lg hover:text-green-300 transition-colors"
                      >
                        01222582955
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Phone className="h-8 w-8 text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white">الفرع الثاني - أسنيت كفر شكر</h3>
                      <a 
                        href="tel:01013210146" 
                        className="text-green-400 text-lg hover:text-green-300 transition-colors"
                      >
                        01013210146
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="mt-8 p-6 bg-green-600/20 rounded-xl border border-green-500/30">
                  <div className="flex items-center gap-4 mb-4">
                    <MessageCircle className="h-8 w-8 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">واتساب</h3>
                  </div>
                  <p className="text-white/80 mb-4">
                    تواصلوا معنا عبر الواتساب للحصول على استشارة مجانية
                  </p>
                  <a 
                    href="https://wa.me/201013210146" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    ابدأ المحادثة
                  </a>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-6">ساعات العمل</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-6 w-6 text-[#FFD700]" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">الأحد - الخميس</h3>
                      <p className="text-white/80">9:00 صباحاً - 10:00 مساءً</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Clock className="h-6 w-6 text-[#FFD700]" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">الجمعة - السبت</h3>
                      <p className="text-white/80">9:00 صباحاً - 10:00 مساءً</p>
                    </div>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-4">
                  * نحن متاحون على مدار الساعة عبر الهاتف والواتساب
                </p>
              </div>
            </div>

            {/* Branches Info */}
            <div className="space-y-8">
              {/* Branch 1 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-6">الفرع الأول - بنها</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-[#FFD700] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">العنوان</h3>
                      <p className="text-white/80 leading-relaxed">
                        شارع الكوبري. بجوار مول الأهرام والبمبي للأجهزة الكهربائية، بنها، القليوبية
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Phone className="h-6 w-6 text-green-400" />
                    <a 
                      href="tel:01222582955" 
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      01222582955
                    </a>
                  </div>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-6">الفرع الثاني - أسنيت كفر شكر</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-[#FFD700] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">العنوان</h3>
                      <p className="text-white/80 leading-relaxed">
                        شارع الجمعية الزراعية بجوار صيدلية الدكتور أحمد كرم مسعود، أسنيت كفر شكر، القليوبية
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Phone className="h-6 w-6 text-green-400" />
                    <a 
                      href="tel:01013210146" 
                      className="text-green-400 hover:text-green-300 transition-colors"
                    >
                      01013210146
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <h2 className="text-3xl font-bold text-[#FFD700] mb-6">خدماتنا</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">استشارة مجانية</h3>
                <p className="text-white/80">نقدم استشارة مجانية لاختيار المفروشات المناسبة</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">توصيل مجاني</h3>
                <p className="text-white/80">توصيل مجاني للمناطق القريبة من فروعنا</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">ضمان الجودة</h3>
                <p className="text-white/80">ضمان شامل على جميع منتجاتنا</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
