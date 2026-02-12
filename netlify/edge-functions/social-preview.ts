import { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const userAgent = request.headers.get("user-agent") || "";
  const url = new URL(request.url);

  // قائمة بـ User-Agents التي تطلبها تطبيقات التواصل الاجتماعي لإظهار المعاينة
  const isCrawler = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|Pinterest|Slackbot|TelegramBot|Googlebot|bingbot|yandexbot/i.test(userAgent);

  if (!isCrawler) {
    return context.next();
  }

  // استخراج المعرف من المسار /service/:id أو /product/:id
  const pathParts = url.pathname.split('/');
  const serviceId = pathParts[pathParts.length - 1];

  // إذا لم يكن المسار لمنتج معين، أكمل الطلب بشكل طبيعي
  if (!serviceId || (!url.pathname.includes('/service/') && !url.pathname.includes('/product/'))) {
    return context.next();
  }

  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in Edge Function");
    return context.next();
  }

  try {
    // جلب بيانات المنتج مباشرة من Supabase باستخدام REST API
    const response = await fetch(
      `${supabaseUrl}/rest/v1/services?id=eq.${serviceId}&select=title,description,image_url`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();
    const product = data?.[0];

    if (!product) {
      return context.next();
    }

    // تجهيز رابط الصورة ليكون كاملاً (Absolute URL)
    let imageUrl = product.image_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${url.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
    }

    // إنشاء صفحة HTML بسيطة تحتوي فقط على الـ Meta Tags المطلوبة للواتساب
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${product.title} | معرض السماح للمفروشات</title>
  <meta name="description" content="${(product.description || '').slice(0, 160)}">
  
  <meta property="og:type" content="product">
  <meta property="og:url" content="${request.url}">
  <meta property="og:title" content="${product.title}">
  <meta property="og:description" content="${(product.description || '').slice(0, 200)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${product.title}">
  <meta name="twitter:description" content="${(product.description || '').slice(0, 200)}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <meta http-equiv="refresh" content="0;url=${request.url}">
</head>
<body>
  <h1>${product.title}</h1>
  <p>${product.description || ''}</p>
  <img src="${imageUrl}" />
  <script>window.location.href = "${request.url}";</script>
</body>
</html>`;

    return new Response(html, {
      headers: { 
        "content-type": "text/html; charset=UTF-8",
        "x-robots-tag": "noindex" 
      },
    });
  } catch (error) {
    console.error("Error in Social Preview Edge Function:", error);
    return context.next();
  }
};
