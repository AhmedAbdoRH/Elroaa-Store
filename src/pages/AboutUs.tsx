import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Clock, Award, Users, Star } from 'lucide-react';

export default function AboutUs() {
  return (
    <>
      <Helmet>
        <title>من نحن - شركة الرؤى للتجارة والتوريدات والعطارة | أفضل أنواع الأعشاب والتوابل في مصر</title>
        <meta name="description" content="شركة الرؤى للتجارة والتوريدات والعطارة - نقدم أفضل أنواع الأعشاب الطبيعية، التوابل، الزيوت العطرية، والمكسرات المختارة بعناية فائقة مع ضمان أعلى درجات النقاء والجودة." />
        <meta name="keywords" content="من نحن, شركة الرؤى, عطارة, توابل, أعشاب طبيعية, زيوت عطرية, مكسرات, توريدات مطاعم, توريد مصانع" />
        <link rel="canonical" href="https://elroaa-store.com/about" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              من نحن - <span className="text-[#CA8A04]">شركة الرؤى للتجارة والتوريدات والعطارة</span>
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              نحن رواد في مجال العطارة والتوريدات، نقدم جودة حقيقية بسعر عادل وننشر ثقافة المنتجات الطبيعية الصحية.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Our Story */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold text-[#CA8A04] mb-6">رؤيتنا ورسالتنا</h2>
              <div className="space-y-4 text-white/90 leading-relaxed">
                <p>
                  <strong>رؤيتنا:</strong> أن نكون من الرواد في مجال العطارة والتوريدات داخل مصر، من خلال تقديم منتجات طبيعية موثوقة وخدمة احترافية تبني الثقة طويلة المدى مع عملائنا.
                </p>
                <p>
                  <strong>رسالتنا:</strong> تقديم جودة حقيقية بسعر عادل، ونشر ثقافة المنتجات الطبيعية الصحية، مع تطوير مستمر في المنتجات والخدمات.
                </p>
                <p>
                  نحن نؤمن بأن الصحة تبدأ من الطبيعة، لذلك نسعى دائماً لتقديم أفضل ما تجود به الأرض لعملائنا الكرام.
                </p>
              </div>
            </div>

            {/* Our Values */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h2 className="text-3xl font-bold text-[#CA8A04] mb-6">قيمنا الأساسية</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Award className="h-8 w-8 text-[#CA8A04] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">الجودة</h3>
                    <p className="text-white/80">نوفر أفضل أنواع الأعشاب والتوابل طبقاً للمواصفات القياسية</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="h-8 w-8 text-[#CA8A04] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">التنوع والخبرة</h3>
                    <p className="text-white/80">فريق متخصص يقدم استشارات لاختيار أفضل المنتجات والتركيبات</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Star className="h-8 w-8 text-[#CA8A04] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">الالتزام</h3>
                    <p className="text-white/80">نلتزم بالدقة في المواعيد والشفافية التامة في التعامل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-[#CA8A04] mb-2">100%</div>
              <div className="text-white/80">منتجات طبيعية</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-[#CA8A04] mb-2">500+</div>
              <div className="text-white/80">صنف متاح</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-[#CA8A04] mb-2">24/7</div>
              <div className="text-white/80">خدمة عملاء</div>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mb-16">
            <h2 className="text-3xl font-bold text-[#CA8A04] mb-8 text-center">خدمات التوريد</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">توريدات تجارية</h3>
                <p className="text-white/80">
                  نوفر خدمات التوريد للمحلات، المصانع، المطاعم، وشركات التعبئة والتغليف بأسعار تنافسية وكميات حسب الطلب.
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">خلطات خاصة</h3>
                <p className="text-white/80">
                  نتميز بتقديم خلطات وتراكيب خاصة وحصرية تلبي احتياجات عملائنا الخاصة وتضمن لهم مذاقاً فريداً.
                </p>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <h2 className="text-3xl font-bold text-[#CA8A04] mb-6">ساعات العمل</h2>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Clock className="h-6 w-6 text-[#CA8A04]" />
              <span className="text-xl text-white">يومياً من 9:00 صباحاً إلى 10:00 مساءً</span>
            </div>
            <p className="text-white/80">
              نحن متاحون لخدمتكم على مدار الساعة عبر الهاتف والواتساب
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
