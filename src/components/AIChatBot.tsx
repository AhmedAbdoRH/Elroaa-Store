import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Service, Category, StoreSettings } from '../types/database';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

// =====================
// إعدادات Groq API
// =====================
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY; 
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"; 
const GROQ_MODEL = "openai/gpt-oss-120b"; 

const RenderMessageWithLinks = ({ text }: { text: string }) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(linkRegex);

    return (
        <div className="whitespace-pre-wrap font-medium">
            {parts.map((part, i) => {
                if (i % 3 === 1) {
                    const url = parts[i + 1];
                    return (
                        <React.Fragment key={i}>
                            <span>{part}</span>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 mb-2 flex items-center justify-center gap-2 text-center bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-semibold py-1.5 px-3 rounded-lg transition-all border border-emerald-500/50"
                            >
                                <ExternalLink className="w-3 h-3" />
                                عرض المنتج
                            </a>
                        </React.Fragment>
                    );
                }
                if (i % 3 === 2) {
                    return null;
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
};

export default function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'أهلاً بيك في معرض السماح - فوربيد 🏠\nازاي أقدر أساعدك في اختيار المفروشات؟',
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [storeData, setStoreData] = useState<{
        products: Service[];
        categories: Category[];
        storeSettings: StoreSettings | null;
    }>({
        products: [],
        categories: [],
        storeSettings: null
    });

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && storeData.products.length === 0) {
            fetchStoreData();
        }
    }, [isOpen]);

    const fetchStoreData = async () => {
        try {
            const { data: products, error: productsError } = await supabase
                .from('services')
                .select(`
                    *,
                    category:categories(*),
                    sizes:product_sizes(*)
                `)
                .order('created_at', { ascending: false });
            if (productsError) throw productsError;
            
            console.log('ChatBot Debug - Products with sizes:', products);

            const { data: categories, error: categoriesError } = await supabase.from('categories').select('*').order('name');
            if (categoriesError) throw categoriesError;

            const { data: storeSettings, error: storeError } = await supabase.from('store_settings').select('*').single();
            if (storeError && storeError.code !== 'PGRST116') console.error('Error fetching store settings:', storeError);

            setStoreData({ products: products || [], categories: categories || [], storeSettings: storeSettings || null });
        } catch (error) {
            console.error('Error fetching store data:', error);
        }
    };

    const generateStoreContext = () => {
        const { products, storeSettings } = storeData;
        let context = `أنت مساعد ذكي لمعرض "${storeSettings?.store_name || 'معرض السماح - فوربيد'}".\n\n`;

        if (products.length > 0) {
            context += `قائمة مختصرة للمنتجات (أهم 40 منتج):\n`;
            products.slice(0, 40).forEach(product => {
                const productUrl = `https://alsamah-store.com/product/${product.id}`;
                context += `▫️ ${product.title}`;
                
                if (product.has_multiple_sizes && product.sizes && product.sizes.length > 0) {
                    const validPrices = product.sizes.map(s => parseFloat(s.price as any)).filter(p => !isNaN(p) && p > 0);
                    const validSalePrices = product.sizes.map(s => parseFloat(s.sale_price as any)).filter(p => !isNaN(p) && p > 0);
                    const minPrice = validSalePrices.length > 0 ? Math.min(...validSalePrices) : (validPrices.length > 0 ? Math.min(...validPrices) : null);
                    if (minPrice) context += ` | يبدأ من ${minPrice} ج.م`;
                    context += ` | المقاسات: ${product.sizes.map(s => s.size).join(', ')}`;
                } else {
                    const price = product.sale_price || product.price;
                    if (price) context += ` | السعر: ${price} ج.م`;
                }
                
                if (product.category?.name) context += ` | الفئة: ${product.category.name}`;
                context += ` | الرابط: ${productUrl}\n`;
            });
            context += '\n';
        }

        context += `تعليمات الرد:
1.  كن ودود وتحدث باللهجة المصرية العامية.
2.  اجعل ردودك مختصرة ومباشرة قدر الإمكان.
3.  عند اقتراح أي منتج، يجب أن تذكر نبذة قصيرة عنه ثم تضع رابطه مباشرةً باستخدام تنسيق الماركدون هكذا: [النبذة المختصرة عن المنتج واسمه](رابط المنتج الذي تم تزويدك به).
4.  مهم جداً: لا تعرض المنتجات في جداول أبداً. كل منتج يجب أن يكون في فقرة خاصة به مع زر "عرض المنتج" تحته.
5.  عند ذكر أسعار المنتجات متعددة المقاسات، اذكر أقل سعر متاح مع توضيح أنه "ابتداءً من" هذا السعر.
6.  إذا سأل العميل عن أسعار مقاسات معينة، اذكر الأسعار المحددة لكل مقاس.
7.  عند السؤال عن "كم سعر المنتج" أو "كم يكلف"، اذكر أقل سعر متاح مع توضيح أنه "ابتداءً من" هذا السعر.
8.  إذا سأل العميل عن مقاس معين (مثل "كم سعر المقاس الكبير")، اذكر السعر المحدد لذلك المقاس.
9.  فهم أسئلة المقاسات: عندما يسأل العميل "اكبر مقاس بكام" أو "المقاس الكبير بكام" أو "المقاس الصغير بكام"، يجب أن تذكر المنتجات المتاحة مع أسعار أكبر أو أصغر مقاس حسب السؤال.
10. إذا سأل العميل عن "اكبر مقاس" أو "المقاس الكبير"، اذكر المنتجات مع أعلى سعر متاح.
11. إذا سأل العميل عن "اصغر مقاس" أو "المقاس الصغير"، اذكر المنتجات مع أقل سعر متاح.
12. شجع العميل على طرح المزيد من الأسئلة بقول "لو حابب تفاصيل أكتر، أنا موجود يا فندم." في نهاية الرد.
13. إذا لم تجد المنتج المطلوب، اقترح أقرب منتج مشابه له.
14. لا تذكر أي معلومات تواصل مثل رقم الواتساب
15. لا تنادي العميل بكلمة "يا باشا" بل "يا فندم" (ومش لازم دايمًا تناديه بيها).
16. استخدم إيموجيز بسيطة وملائمة في الردود لإضافة لمسة ودية، 
17. قبل اسم المنتج ضيف ▫️
18. بلاش تحط كلمة "عرض المنتج" يكفي زر عرض المنتج اسفل النبذه فقط 
19. رقم التواصل (لو العميل طلبه فقط) : 0 10 27381559
20. استخدم صياغة محايدة أو مذكر، وما تستعملش صيغة المؤنث إلا لو العميلة بنفسها وضحت إنها أنثى أو ظهر من كلامها بشكل واضح انها انثى 
.`;

        return context;
    };

    const sendToAI = async (userMessage: string): Promise<string> => {
        const systemPrompt = generateStoreContext();

        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Groq API Error:', errorData);
                throw new Error(`فشل في الاتصال بالخدمة: ${errorData.error?.message || 'خطأ غير معروف'}`);
            }

            const data = await response.json();
            const textResponse = data?.choices?.[0]?.message?.content;

            return textResponse?.trim() || 'معلش، مافهمتش سؤالك\nممكن توضحلي محتاج ايه بالظبط.';
        } catch (error) {
            console.error('AI Error:', error);
            return 'بعتذر جداً، في مشكلة في الخدمة حالياً. جرب تاني كمان شوية أو تواصل معانا واتساب.';
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        const aiResponseText = await sendToAI(userMessage.text);
        
        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: aiResponseText,
            isUser: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <MessageCircle className="w-6 h-6" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[60] w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <Bot className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">مساعد معرض السماح</h3>
                                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        متصل الآن
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                        >
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl ${
                                            message.isUser
                                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                                : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                                        }`}
                                    >
                                        {!message.isUser ? (
                                            <RenderMessageWithLinks text={message.text} />
                                        ) : (
                                            <p className="whitespace-pre-wrap font-medium">{message.text}</p>
                                        )}
                                        <span className={`text-[10px] mt-1 block opacity-50 ${message.isUser ? 'text-right' : 'text-left'}`}>
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-slate-800 border-t border-slate-700">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="relative"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder="اكتب استفسارك هنا..."
                                    className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim() || isLoading}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                            <p className="text-[10px] text-center text-slate-500 mt-2">
                                مساعد ذكي مدعوم بالذكاء الاصطناعي لمعرض السماح
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
