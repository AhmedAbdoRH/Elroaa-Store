import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Clock, Mail, MessageCircle } from 'lucide-react';

export default function ContactUs() {
  return (
    <>
      <Helmet>
        <title>اتصل بنا - شركة الرؤى للتجارة والتوريدات والعطارة | تواصل معنا</title>
        <meta name="description" content="تواصل مع شركة الرؤى للتجارة والتوريدات والعطارة - نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، والزيوت العطرية. متاحون لخدمتكم وتلبية طلبات التوريد." />
        <meta name="keywords" content="اتصل بنا, شركة الرؤى, عطارة, توابل, هاتف, واتساب, توريدات مطاعم, توريد مصانع" />
        <link rel="canonical" href="https://elroaa-store.com/contact" />
      </Helmet>

      <div className="min-h-screen bg-[#F7F3E9] py-16 pt-28">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-[#2B3318] mb-6">
              <span className="text-[#D1A94F]">اتصل بنا</span> - شركة الرؤى للتجارة
            </h1>
            <p className="text-xl text-[#3A4522] max-w-3xl mx-auto leading-relaxed">
              نحن هنا لخدمتكم! تواصلوا معنا للحصول على أفضل أنواع الأعشاب والتوابل والزيوت العطرية. 
              فريقنا متاح لمساعدتكم في اختيار المنتجات المناسبة وتلبية طلبات التوريد.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#D1A94F]/35 shadow-sm">
                <h2 className="text-3xl font-bold text-[#2B3318] mb-6">معلومات الاتصال</h2>
                
                {/* Phone Numbers */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Phone className="h-8 w-8 text-[#2B3318] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-[#2B3318]">قسم المبيعات والتوريدات</h3>
                      <a 
                        href="tel:01553218800" 
                        className="text-[#3A4522] text-lg font-semibold hover:text-[#D1A94F] transition-colors"
                      >
                        01553218800
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Phone className="h-8 w-8 text-[#2B3318] flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-[#2B3318]">خدمة العملاء</h3>
                      <a 
                        href="tel:01003046674" 
                        className="text-[#3A4522] text-lg font-semibold hover:text-[#D1A94F] transition-colors"
                      >
                        01003046674
                      </a>
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="mt-8 p-6 bg-[#2B3318] rounded-xl border border-[#D1A94F]/40 text-[#F7F3E9]">
                  <div className="flex items-center gap-4 mb-4">
                    <MessageCircle className="h-8 w-8 text-[#E3C778]" />
                    <h3 className="text-xl font-semibold text-[#F7F3E9]">واتساب</h3>
                  </div>
                  <p className="text-[#F7F3E9]/85 mb-4">
                    تواصلوا معنا عبر الواتساب للاستفسارات وطلبات التوريد السريعة
                  </p>
                  <a 
                    href="https://wa.me/201003046674" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#E3C778] hover:bg-[#D1A94F] text-[#2B3318] font-bold px-6 py-3 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    ابدأ المحادثة
                  </a>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#D1A94F]/35 shadow-sm">
                <h2 className="text-3xl font-bold text-[#2B3318] mb-6">ساعات العمل</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-6 w-6 text-[#D1A94F]" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#2B3318]">يومياً</h3>
                      <p className="text-[#3A4522]">9:00 صباحاً - 10:00 مساءً</p>
                    </div>
                  </div>
                </div>
                <p className="text-[#3A4522]/75 text-sm mt-4">
                  * نحن متاحون للرد على استفساراتكم عبر الواتساب على مدار الساعة
                </p>
              </div>
            </div>

            {/* Branches Info */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#D1A94F]/35 shadow-sm">
                <h2 className="text-3xl font-bold text-[#2B3318] mb-6">مقر الشركة</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-[#D1A94F] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-[#2B3318] mb-2">العنوان</h3>
                      <p className="text-[#3A4522] leading-relaxed">
                        جمهورية مصر العربية، القليوبية، بنها / كفر شكر
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-[#D1A94F]/35 shadow-sm">
                <h2 className="text-3xl font-bold text-[#2B3318] mb-6">خدماتنا</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-[#3A4522]/[0.06] rounded-xl p-4 border border-[#3A4522]/15">
                    <h3 className="text-lg font-semibold text-[#2B3318] mb-2">توريدات للمطاعم والمصانع</h3>
                    <p className="text-[#3A4522] text-sm">نوفر أجود أنواع التوابل والأعشاب بكميات تجارية وأسعار تنافسية.</p>
                  </div>
                  <div className="bg-[#3A4522]/[0.06] rounded-xl p-4 border border-[#3A4522]/15">
                    <h3 className="text-lg font-semibold text-[#2B3318] mb-2">خلطات عطارة خاصة</h3>
                    <p className="text-[#3A4522] text-sm">تجهيز خلطات وتوابل حصرية حسب طلب العملاء لضمان مذاق فريد.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-[#2B3318] rounded-2xl p-8 border border-[#D1A94F]/40 text-center shadow-md">
            <h2 className="text-3xl font-bold text-[#E3C778] mb-6">خدماتنا</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#3A4522]/60 rounded-xl p-6 border border-[#D1A94F]/25">
                <h3 className="text-xl font-semibold text-[#F7F3E9] mb-2">استشارة مجانية</h3>
                <p className="text-[#F7F3E9]/85">نقدم استشارة مجانية لاختيار أفضل أنواع التوابل والتركيبات</p>
              </div>
              <div className="bg-[#3A4522]/60 rounded-xl p-6 border border-[#D1A94F]/25">
                <h3 className="text-xl font-semibold text-[#F7F3E9] mb-2">توصيل سريع</h3>
                <p className="text-[#F7F3E9]/85">توصيل سريع لطلبات التوريد والجملة لجميع المحافظات</p>
              </div>
              <div className="bg-[#3A4522]/60 rounded-xl p-6 border border-[#D1A94F]/25">
                <h3 className="text-xl font-semibold text-[#F7F3E9] mb-2">ضمان النقاء</h3>
                <p className="text-[#F7F3E9]/85">نضمن أعلى درجات النقاء والجودة لجميع منتجاتنا الطبيعية</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
