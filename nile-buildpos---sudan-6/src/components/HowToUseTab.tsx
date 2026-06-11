import React, { useState } from 'react';
import { 
  FileSpreadsheet, ArrowLeftRight, ShoppingCart, Table, AlertTriangle, 
  HelpCircle, Settings, Users, Store, ClipboardCheck, BarChart3, 
  Wallet, BookOpen, ChevronLeft, Download, Eye, Layers, Lightbulb, CheckCircle2 
} from 'lucide-react';

interface HowToUseTabProps {
  isDarkMode: boolean;
  lang: 'ar' | 'en';
}

export default function HowToUseTab({ isDarkMode, lang }: HowToUseTabProps) {
  const [activeSection, setActiveSection] = useState<string>('excel');

  const excelColumns = [
    {
      col: "A",
      header: lang === 'ar' ? "الاسم (Name)" : "Name",
      desc: lang === 'ar' ? "اسم الصنف أو المنتج بوضوح (مثال: لمبة فينولايت 9 وات)" : "The clear name of the product (e.g., LED Phenolite Bulb 9W).",
      required: true,
      badge: lang === 'ar' ? "إلزامي" : "Required"
    },
    {
      col: "B",
      header: lang === 'ar' ? "عدد الكراتين (Num_Cartons)" : "Num_Cartons",
      desc: lang === 'ar' ? "كمية الكراتين المتوفرة حالياً في المخزن للبدء بها." : "Initial count of cartons available in warehouse.",
      required: true,
      badge: lang === 'ar' ? "إلزامي (عشري أو صحيح)" : "Required (Dec/Int)"
    },
    {
      col: "C",
      header: lang === 'ar' ? "حبات الكرتونة (Pieces_Per_Carton)" : "Pieces_Per_Carton",
      desc: lang === 'ar' ? "سعة الكرتونة الواحدة من القطع الفردية للبيع المفرد." : "Capacity of one carton measured in individual pieces.",
      required: true,
      badge: lang === 'ar' ? "إلزامي" : "Required"
    },
    {
      col: "D",
      header: lang === 'ar' ? "سعر شراء الكرتون (Carton_Purchase_Price)" : "Carton_Purchase_Price",
      desc: lang === 'ar' ? "سعر التكلفة لكل كرتونة واحدة عند شرائها." : "Cost price paid for purchasing one carton.",
      required: true,
      badge: lang === 'ar' ? "إلزامي" : "Required"
    },
    {
      col: "E",
      header: lang === 'ar' ? "سعر بيع الكرتون (Carton_Selling_Price)" : "Carton_Selling_Price",
      desc: lang === 'ar' ? "سعر بيع الكرتونة الكاملة لعملاء الجملة." : "Selling price of a full carton to wholesale customers.",
      required: false,
      badge: lang === 'ar' ? "يمكن حسابه تلقائياً" : "Auto-computed if empty"
    },
    {
      col: "F",
      header: lang === 'ar' ? "سعر بيع الحبة (Piece_Selling_Price)" : "Piece_Selling_Price",
      desc: lang === 'ar' ? "سعر بيع الحبة الواحدة بالتجزئة في الكاشير." : "Retail selling price for a single individual piece.",
      required: false,
      badge: lang === 'ar' ? "يمكن حسابه تلقائياً" : "Auto-computed if empty"
    }
  ];

  const sections = [
    {
      id: 'excel',
      title: lang === 'ar' ? 'مستندات الإكسل واستيراد الأصناف' : 'Excel Import Guidelines',
      icon: FileSpreadsheet,
      badge: lang === 'ar' ? 'هام للمستخدم' : 'Critical'
    },
    {
      id: 'pos',
      title: lang === 'ar' ? 'نظام الكاشير والمبيعات السريعة' : 'POS Sales Terminal',
      icon: ShoppingCart,
      badge: null
    },
    {
      id: 'inventory',
      title: lang === 'ar' ? 'المخازن والمستودعات والتسويات' : 'Warehouses & Audits',
      icon: Layers,
      badge: null
    },
    {
      id: 'finance',
      title: lang === 'ar' ? 'الحسابات والخزائن والعملات والأرباح' : 'Safes & Accounting Ledger',
      icon: Wallet,
      badge: null
    },
    {
      id: 'purchases',
      title: lang === 'ar' ? 'المشتريات وسلسلة الإمداد والشحن' : 'Purchasing & Supply Chain',
      icon: ClipboardCheck,
      badge: null
    }
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Cover / Header Card */}
      <div className={`relative rounded-[32px] overflow-hidden border p-8 md:p-10 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' 
          : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
      }`}>
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-500"></div>
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-[#0071e3]/10 text-[#0071e3] dark:bg-blue-500/10 dark:text-blue-400 rounded-full">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? "توجيهات التشغيل والتدريب" : "Operations & Training Center"}</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ fontFamily: 'Cairo, sans-serif' }}>
            {lang === 'ar' ? "دليل تشغيل النظام المحاسبي المتكامل" : "Comprehensive Accounting Suite Manual"}
          </h1>
          <p className="text-xs md:text-sm text-[#86868b] leading-relaxed">
            {lang === 'ar' 
              ? "مرحباً بك في مركز المساعدة التفاعلي. هنا تجد دليلاً تفصيلياً لشرح كل جزء من جوانب نظام البيع والمستودعات والمالية بما يضمن تسيير أعمالك باحترافية وسلاسة وتجنب ارتكاب أخطاء العمليات اليومية."
              : "Welcome to your Interactive Help Desk. Find instructions and criteria for handling sales, inventories, multi-warehouse supply, currencies cross-rates, and excel migrations."
            }
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <p className={`text-xs font-bold px-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
            {lang === 'ar' ? 'فهرس الشروحات المتاحة:' : 'Available Manuals:'}
          </p>
          <div className={`rounded-3xl border overflow-hidden p-2 transition-colors duration-300 ${
            isDarkMode ? 'bg-[#1c1c1e] border-zinc-800' : 'bg-white border-[#d2d2d7]'
          }`}>
            <nav className="space-y-1">
              {sections.map((sect) => {
                const Icon = sect.icon;
                const isActive = activeSection === sect.id;
                return (
                  <button
                    key={sect.id}
                    onClick={() => setActiveSection(sect.id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-start cursor-pointer ${
                      isActive 
                        ? 'bg-[#0071e3] text-white' 
                        : isDarkMode 
                          ? 'text-zinc-300 hover:bg-zinc-800/60' 
                          : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{sect.title}</span>
                    </div>
                    {sect.badge && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold select-none ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400'
                      }`}>
                        {sect.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Support card */}
          <div className={`rounded-3xl border p-5 space-y-3 transition-colors duration-300 ${
            isDarkMode ? 'bg-amber-500/5 border-amber-900/35' : 'bg-amber-50/40 border-amber-200/50'
          }`}>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>{lang === 'ar' ? "روابط مفيدة" : "Useful Tips"}</span>
            </h4>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
              {lang === 'ar'
                ? "هل تريد تحميل كشف المبيعات أو تسوية الجرد؟ يمكنك ذلك بالذهاب مباشرة لزر الإكسل الموجود في شاشات التقارير وجرد المستودع."
                : "You can download fully compiled sales ledger and stock audits at any point directly via Excel buttons in respective sheets."}
            </p>
          </div>
        </div>

        {/* Dynamic Detail Panel */}
        <div className="lg:col-span-8">
          {activeSection === 'excel' && (
            <div className={`rounded-[28px] border p-6 md:p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
            }`}>
              
              {/* Heading */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md sm:text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'مواصفات ترحيب واستيراد ملفات الإكسل (Excel)' : 'Excel Import Specifications & Schema'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' 
                      ? 'الشروط البرمجية والتخطيط اللازم لملفاتك لضمان قراءة أصناف مبيعاتك بنجاح وبسرعة هائلة.' 
                      : 'Software criteria & spreadsheet layouts for trouble-free stock loading.'}
                  </p>
                </div>
              </div>

              {/* Dynamic Excel Visual Chart */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#1d1d1f] dark:text-zinc-200 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-[#0071e3]" />
                  <span>{lang === 'ar' ? 'رسم تخطيطي لترتيب أعمدة الإكسل (جدول البيانات):' : 'Spreadsheet Grid Order Visualization:'}</span>
                </p>

                {/* Simulated Excel Grid */}
                <div className="border rounded-2xl overflow-hidden shadow-xs">
                  <div className="bg-[#f5f5f7] dark:bg-zinc-800 text-[#1d1d1f] dark:text-white px-4 py-2 border-b flex items-center justify-between text-[11px] font-bold">
                    <span className="font-mono">Sheet1 (ورقة الاستيراد)</span>
                    <span className="text-emerald-600 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {lang === 'ar' ? 'ترتيب الأعمدة مهم جداً' : 'Column placement has priority'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center font-mono">
                      <thead className="bg-gray-100 dark:bg-zinc-800/50 border-b text-[10px] text-gray-500">
                        <tr>
                          <th className="py-2.5 px-3 border-r">A (1)</th>
                          <th className="py-2.5 px-3 border-r">B (2)</th>
                          <th className="py-2.5 px-3 border-r">C (3)</th>
                          <th className="py-2.5 px-3 border-r">D (4)</th>
                          <th className="py-2.5 px-3 border-r">E (5)</th>
                          <th className="py-2.5 px-3">F (6)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-[11px] text-start bg-white dark:bg-zinc-900/40">
                        <tr className="bg-gray-50/50 dark:bg-zinc-800/35 font-bold text-center">
                          <td className="py-2.5 px-3 border-r border-[#e5e7eb] dark:border-zinc-800 text-[#0071e3]">الاسم / Name</td>
                          <td className="py-2.5 px-3 border-r border-[#e5e7eb] dark:border-zinc-800 text-purple-600">عدد الكراتين / Num_Cartons</td>
                          <td className="py-2.5 px-3 border-r border-[#e5e7eb] dark:border-zinc-800 text-teal-600">حبات الكرتونة / Pieces_Per_Carton</td>
                          <td className="py-2.5 px-3 border-r border-[#e5e7eb] dark:border-zinc-800 text-indigo-600">شراء الكرتون / Purchase_Price</td>
                          <td className="py-2.5 px-3 border-r border-[#e5e7eb] dark:border-zinc-800 text-orange-600">بيع الكرتون / Carton_Selling</td>
                          <td className="py-2.5 px-3 text-emerald-600">بيع الحبة / Piece_Selling</td>
                        </tr>
                        <tr className="text-center text-gray-400 dark:text-zinc-500">
                          <td className="py-2.5 px-3 border-r">لمبة توشيبا LED</td>
                          <td className="py-2.5 px-3 border-r">120</td>
                          <td className="py-2.5 px-3 border-r">20</td>
                          <td className="py-2.5 px-3 border-r">45000</td>
                          <td className="py-2.5 px-3 border-r">54000</td>
                          <td className="py-2.5 px-3">2700</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Detailed Columns Table */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-[#1d1d1f] dark:text-zinc-200">
                  {lang === 'ar' ? 'مواصفات كل حقل بالتفصيل:' : 'Technical breakdown per column:'}
                </p>

                <div className="space-y-3">
                  {excelColumns.map((col, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-start ${
                        isDarkMode ? 'bg-[#2c2c2e]/40 border-zinc-800/80' : 'bg-[#f5f5f7]/60 border-[#e5e5ea]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center font-bold bg-[#0071e3] text-white text-[10px] rounded-full">
                            {col.col}
                          </span>
                          <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">{col.header}</span>
                        </div>
                        <p className="text-[11px] text-[#6e6e73] leading-relaxed pl-7">
                          {col.desc}
                        </p>
                      </div>

                      <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold select-none shrink-0 self-start md:self-auto ${
                        col.required 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      }`}>
                        {col.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Smart Automation Warning and Fallback explanations */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 text-start ${
                isDarkMode ? 'bg-blue-950/20 border-blue-900/40 text-blue-300' : 'bg-blue-50/50 border-blue-200 text-blue-700'
              }`}>
                <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold">{lang === 'ar' ? 'الاحتساب التلقائي والذكاء في النظام:' : 'Auto-Optimization Magic:'}</h4>
                  <ul className="list-disc list-inside space-y-1 leading-relaxed text-[11px] text-gray-500 dark:text-zinc-300">
                    {lang === 'ar' ? (
                      <>
                        <li>إذا لم تكتب سعر بيع الحبات المفردة، سيقوم النظام تلقائياً بقسمة <span className="font-bold">سعر بيع الكرتونة</span> على <span className="font-bold">حبات الكرتونة</span> وتسجيل السعر المفقود بدقة!</li>
                        <li>إذا لم تكتب سعر بيع الكرتونة، سيضرب النظام تلقائياً <span className="font-bold">سعر بيع الحبة</span> في <span className="font-bold">حبات الكرتونة</span> لتوليد سعر الكرتونة آلياً.</li>
                        <li>سيقوم محرك النظام تلقائياً عند إجراء الاستيراد باحتساب إجمالي عدد القطع كـ <span className="font-bold">عدد الكراتين × حبات الكرتونة</span> لإنشاء المخزون الصحيح.</li>
                      </>
                    ) : (
                      <>
                        <li>Missing piece prices are safely generated by dividing the carton selling price by pieces-per-carton.</li>
                        <li>Missing carton prices are filled by multiplying the piece price by pieces-per-carton content.</li>
                        <li>Total starting pieces inventory is calculated on the fly as Carton count × Pieces/Carton.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

            </div>
          )}

          {activeSection === 'pos' && (
            <div className={`rounded-[28px] border p-6 md:p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
            }`}>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-[#0071e3] rounded-2xl shrink-0">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md sm:text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'آلية تشغيل الكاشير والمبيعات اليومية' : 'Point of Sales Operating Guide'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' ? 'كيف تبدأ بيع المنتجات واستخراج الفواتير وطباعتها بأشكال مختلفة' : 'How to use cashier terminal to checkout standard invoices.'}
                  </p>
                </div>
              </div>

              {/* Dynamic steps layout */}
              <div className="relative border-r-2 border-[#f5f5f7] dark:border-zinc-800 pr-6 mr-3 space-y-6 text-start text-xs">
                
                {/* Step 1 */}
                <div className="relative">
                  <span className="absolute -right-[33px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1c1c1e] shadow-xs"></span>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? '1. اختيار المنتجات والبحث السريع' : '1. Cataloging & Smart Barcode Search'}</h4>
                    <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                      {lang === 'ar'
                        ? "يمكنك استخدام شريط البحث لكتابة الاسم أو تمرير قارئ الباركود على المنتج لينعكس على الفور في عربة التسوق للزبون."
                        : "Use the search bar to filter products by code/title, or read barcodes directly using a laser barcode scanner."
                      }
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <span className="absolute -right-[33px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1c1c1e] shadow-xs"></span>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? '2. اختيار صيغة البيع (كرتونة أو حبة منفردة)' : '2. Selling Units Toggle (Cartons vs Pieces)'}</h4>
                    <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                      {lang === 'ar'
                        ? "بجانب كل منتج في العربة، يوجد زر لتبديل البيع. يمكنك بيع كرتونة كاملة أو حبات فرادى، وسيحسب النظام السعر المخصص للكرتونة أو الحبة تلقائياً وبأقصى دقة تفادياً للخلل الحسابي."
                        : "Inside the inventory cart, use the units switch to toggle between wholesales (carton price) and piece retails."
                      }
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <span className="absolute -right-[33px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1c1c1e] shadow-xs"></span>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? '3. اختيار طريقة الدفع وعتبات الفواتير الآجلة' : '3. Payment Modes (Cash, Checks, Instalments)'}</h4>
                    <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                      {lang === 'ar'
                        ? "يمكن دفع الفاتورة فوراً كاش أو عبر الحساب البنكي، أو جدولتها كأقساط للعميل. إذا اخترت نظام الأقساط، تستطيع تحديد الدفعة المقدمة والعميل لمتابعة ذمم الديون والتحصيلات اللاحقة بمرونة."
                        : "Mark invoice as cash, credit, or structured installments. Real-time updates automatically hit the cash registries."
                      }
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <span className="absolute -right-[33px] top-0.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#1c1c1e] shadow-xs"></span>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? '4. طباعة وإرسال الفاتورة' : '4. Invoicing Templates & Printing'}</h4>
                    <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                      {lang === 'ar'
                        ? "يدعم كاشير المبيعات طابعات الإيصالات الحرارية (80mm) وفواتير المقاس الكامل (A4). سيحتوي الإيصال على باركود QR مشفر للتحقق من سلامة الأرقام الضريبية والمستودعية للشركة."
                        : "Get structured receipts layout compatible with 1D/2D barcodes, 80mm thermal printers or digital PDFs shares."
                      }
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeSection === 'inventory' && (
            <div className={`rounded-[28px] border p-6 md:p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
            }`}>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md sm:text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'إدارة المخازن والمستودعات وعمليات الجرد المتقدم' : 'Multi-Warehouse Inventory & Audits'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' ? 'تفادي عجز المخازن، تسريع حركة البضائع، وتحويل المنتجات بين المواقع المختلفة' : 'Manage your warehouse stock transfers and audits smoothly.'}
                  </p>
                </div>
              </div>

              {/* Inventory Flow Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-start text-xs">
                
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700/80' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>{lang === 'ar' ? 'تعدد المستودعات والتحويل' : 'Warehouses & Stock Transfers'}</span>
                  </h4>
                  <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                    {lang === 'ar'
                      ? "يمكنك إنشاء مستودعات متعددة (مثل: المستودع المركزي، مستودع الخرطوم، المرفق الاحتياطي). يوفر النظام خيار تحويل البضائع بين المخازن بأثر فوري لحفظ السلامة الحجمية للقطع."
                      : "Create isolated warehouse entities to distribute stock, and log audit trails of physical item transfers securely."
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/40 border-zinc-700/80' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="font-bold text-[#1d1d1f] dark:text-white flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{lang === 'ar' ? 'تسوية الفروقات والجرد الدوري' : 'Audit Reconciliation & Adjustments'}</span>
                  </h4>
                  <p className="text-[11px] text-[#6e6e73] leading-relaxed">
                    {lang === 'ar'
                      ? "عند إجراء تسوية الجرد، يمكنك إدخال الكمية الفعلية المتبقية. يحسب النظام الفوارق تلقائياً ويلخص قيمة الخسائر أو الأرباح الناتجة عن تفاوت وتخريب المخزن."
                      : "Audit items on quarterly intervals. Punch in physical vs system stock to adjust valuation with direct ledger impacts."
                    }
                  </p>
                </div>

              </div>

            </div>
          )}

          {activeSection === 'finance' && (
            <div className={`rounded-[28px] border p-6 md:p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
            }`}>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md sm:text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'الإدارة المالية والخزائن والأرباح اليومية' : 'Accounting Ledger & Double-Entry Treasury'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' ? 'تتبع التدفقات المالية، الخزائن النقدية، المصروفات، وقوائم الأرباح الصافية بدقة متناهية' : 'Monitor cashbooks daily receipts, multi-currency conversion accounts.'}
                  </p>
                </div>
              </div>

              {/* Explanatory components */}
              <div className="space-y-4 text-start text-xs">
                
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-indigo-50/20 border-indigo-100'}`}>
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-400 mb-2">{lang === 'ar' ? 'تعدد العملات (الجنيه SDG واليوان CNY)' : 'Multi-Currency Safe Boxes'}</h4>
                  <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed">
                    {lang === 'ar'
                      ? "يدعم النظام إنشاء خزائن فرعية متعددة ومطابقة العملات مثل الجنيه السوداني لتعاملات المبيعات واليوان الصيني لاستيرادات بضائع الإضاءة وتحويل وتنزيل المبالغ ومطابقتها الفورية."
                      : "Set up separate cash safe categories for Sudanese Pounds (SDG) and Chinese Yuan (CNY) conversion models."
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-green-50/20 border-green-100'}`}>
                  <h4 className="font-bold text-green-900 dark:text-green-400 mb-2">{lang === 'ar' ? 'إجمالي الأرباح وقائمه الدخل (P&L)' : 'Real Profit & Loss Calculation'}</h4>
                  <p className="text-[11px] text-gray-600 dark:text-zinc-300 leading-relaxed">
                    {lang === 'ar'
                      ? "تحتسب الأرباح بصيغة ذكية: يتم تفادي إدراج رأس المال حيث يطرح النظام قيمة تكلفة السعر (سعر الشراء) من (سعر البيع) للمنتج مع خصم إجمالي المصروفات التشغيلية ليعطيك الأرباح الصافية الحقيقية."
                      : "P&L estimates filter cost of goods sold (COGS) exactly from transactions, giving you actual clean margins."
                    }
                  </p>
                </div>

              </div>

            </div>
          )}

          {activeSection === 'purchases' && (
            <div className={`rounded-[28px] border p-6 md:p-8 space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'
            }`}>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-2xl shrink-0">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-md sm:text-lg font-bold" style={{ fontFamily: 'Cairo, sans-serif' }}>
                    {lang === 'ar' ? 'سلسلة المشتريات والطلبات الدولية' : 'Purchasing & International Shipments'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' ? 'متابعة طلبات الموردين والشراء الخارجي بالتفصيل وتفريغ حمولات الحاويات' : 'Track orders status from oversea vendors and suppliers.'}
                  </p>
                </div>
              </div>

              {/* Purchase Guide list */}
              <div className="space-y-3 pb-3 text-start text-[11px] text-gray-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? "1. طلبات الشراء العابرة للحدود" : "1. Cross-border Purchase Requests"}</span>
                </div>
                <p className="pl-6 mb-3">
                  {lang === 'ar' 
                    ? "يمكنك إنشاء طلب عرض أسعار وتوجيه طلبات شراء للمصانع والتحقق من المنتجات المستوردة مع تقييم فروقات سعر الصرف بالعملات المختلفة."
                    : "Create Purchase Requests, issue RFQs, and cross-reference multiple vendor quotations seamlessly."}
                </p>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-[#1d1d1f] dark:text-zinc-100">{lang === 'ar' ? "2. استقبال المشتريات ودخول المخزن" : "2. Automated Ledger Receipt"}</span>
                </div>
                <p className="pl-6">
                  {lang === 'ar'
                    ? "بمجرد وصول طلب الشراء وتأكيد استلام الفاتورة، تضاف الكميات المدخلة (الكراتين والقطع) بشكل آلي وتدريجي لمخزون المستودع المحدد مع تدوين الحساب مستحق الدفع وإرساله لدائن الموردين."
                    : "Confirming incoming purchase invoices updates your warehouse stock instantly and issues credit dues to suppliers."}
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
