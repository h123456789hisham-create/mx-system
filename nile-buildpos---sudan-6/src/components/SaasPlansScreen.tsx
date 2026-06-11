import React, { useState } from 'react';
import { 
  CheckCircle, ShieldAlert, Award, ExternalLink, Calendar, 
  Sparkles, LogOut, ArrowLeft, Send, Check
} from 'lucide-react';
import { SaasSettings, SystemUser } from '../types';

interface SaasPlansScreenProps {
  saasSettings: SaasSettings;
  currentUser: SystemUser | null;
  onLogout: () => void;
  lang: 'ar' | 'en';
}

export default function SaasPlansScreen({
  saasSettings,
  currentUser,
  onLogout,
  lang
}: SaasPlansScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [guestEmail, setGuestEmail] = useState(currentUser?.email || '');
  const [guestName, setGuestName] = useState(currentUser?.name || '');

  const monthlyPrice = saasSettings.monthlyPrice || 15000;
  const annualPrice = saasSettings.annualPrice || 120000;
  const currency = saasSettings.currency || 'SDG';
  const rawWhatsApp = saasSettings.whatsAppNumber || '+249997444409';

  const handleSubscribeClick = () => {
    const userEmail = guestEmail.trim() || 'غير محدد';
    const userName = guestName.trim() || 'مشترك جديد';
    const planName = selectedPlan === 'annual' ? 'الباقة السنوية' : 'الباقة الشهرية';
    const planPrice = selectedPlan === 'annual' ? annualPrice.toLocaleString() : monthlyPrice.toLocaleString();

    const textMessage = `السلام عليكم ورحمة الله وبركاته،
أود الاشتراك وتفعيل حسابي في النظام المحاسبي المتكامل.
لقد اخترت: [ ${planName} ] بسعر ${planPrice} ${currency}.

بيانات الدخول المطلوبة:
- الاسم: ${userName}
- البريد الإلكتروني: ${userEmail}

سأقوم بإرسال لقطة شاشة (Screenshot) للإشعار البنكي لسعر الخطة بالأسفل للتأكيد والتفعيل. شكراً لكم.`;

    const cleanPhone = rawWhatsApp.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone || '249997444409'}?text=${encodeURIComponent(textMessage)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12 px-4 flex items-center justify-center text-right" dir="rtl">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Pricing Info & Form Selection */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <span className="bg-amber-50 text-amber-700 font-extrabold px-3 py-1 rounded-full text-[10.5px] border border-amber-200">
                ⚠️ يرجى تفعيل اشتراكك للمتابعة
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition text-xs font-bold"
              >
                <span>تسجيل الخروج</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-xl font-black text-gray-950">النظام بحاجة إلى تفعيل ترخيص الاشتراك</h1>
              <p className="text-xs text-gray-500">
                أهلاً بك في نظام النبلاء المحاسبي المتكامل. نعتذر، حسابك الحالي مسجل كـ <strong>{currentUser?.name || guestName || 'ضيف'}</strong> ولكنه غير مفعل أو انتهت صلاحيته السنوية/الشهرية. يرجى تفعيل الاشتراك عبر باقاتنا الميسرة أدناه لوصل قاعدة بياناتك:
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="bg-[#f5f5f7] p-1.5 rounded-2xl flex items-center border border-gray-200">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Calendar className="w-4 h-4 inline ml-1 shrink-0" />
                <span>الاشتراك الشهري (٣٠ يوم)</span>
              </button>
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'bg-gradient-to-r from-gray-900 to-blue-950 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-4 h-4 inline ml-1 shrink-0 text-amber-400" />
                <span>الاشتراك السنوي الشامل</span>
                <span className="absolute -top-2 left-4 bg-red-500 text-white text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-full uppercase">
                  توفير ضخم 🔥
                </span>
              </button>
            </div>

            {/* Price Visualization */}
            <div className="bg-gradient-to-br from-gray-50 via-slate-50/20 to-blue-50/20 p-5 rounded-2xl border border-gray-150 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">الخطة التفعيلية المختارة:</span>
                <span className="text-sm font-black text-gray-900">
                  {selectedPlan === 'annual' ? 'الاشتراك السنوي الممتاز' : 'الاشتراك التجاري الشهري'}
                </span>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black font-mono text-blue-600 block">
                  {selectedPlan === 'annual' ? annualPrice.toLocaleString() : monthlyPrice.toLocaleString()}
                </span>
                <span className="text-[10px] font-extrabold text-gray-500 font-mono -mt-1 block">
                  {currency} {selectedPlan === 'annual' ? '/ سنوياً' : '/ شهرياً'}
                </span>
              </div>
            </div>

            {/* Inputs for verification */}
            <div className="space-y-3.5 text-xs font-bold text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-150">
              <span className="text-[10.5px] text-blue-600 block">📝 معلومات الحساب لتسريع مطابقتك وتدقيق تحويلك:</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-gray-600">اسم المستخدم للولوج:</label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسم الشركة أو اسمك..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-white border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-gray-600">البريد الإلكتروني للوج:</label>
                  <input
                    type="email"
                    required
                    disabled={!!currentUser}
                    placeholder="name@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full bg-white border border-[#d2d2d7] px-3 py-2 rounded-xl text-xs font-mono font-bold outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubscribeClick}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>اشترك الآن وأرسل الإشعار البنكي للتفعيل عبر الواتساب</span>
          </button>
        </div>

        {/* Right Side: Features List & Guarantees */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#1c1c1e] via-[#121212] to-gray-950 text-white rounded-3xl p-6 shadow-xl border border-gray-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black tracking-tight">ما الذي تحصل عليه في النظام؟</h2>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                تحصل على ترخيص كامل على السحابة يضمن إدارة كافة عمليات شركتك من أي جهاز وفي أي زمن.
              </p>
            </div>

            <div className="space-y-2.5">
              {saasSettings.featuresList?.map((feat, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed text-gray-250">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800/80 pt-4 mt-6 text-[10.5px] text-gray-400 leading-relaxed space-y-1">
            <strong className="text-white block font-bold">ℹ️ طريقة تأكيد وتسوية الاشتراك:</strong>
            <p>
              ١. اختر خطتك، وادخل إيميلك واضغط تفعيل ليفتح واتساب المالك بـ <strong className="text-white">{rawWhatsApp}</strong>.
            </p>
            <p>
              ٢. حول رسوم الاشتراك عبر تطبيقك البنكي المفضل وأرسل لقطة شاشة للإشعار.
            </p>
            <p>
              ٣. يقوم المالك بتفعيل الإيميل فوراً وإرسال كلمة السر المؤقتة لك للدخول بثقة بالغة وعمر آمن.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
