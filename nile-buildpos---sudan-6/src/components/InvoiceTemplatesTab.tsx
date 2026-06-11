import React, { useState, useMemo } from 'react';
import { 
  FileText, Sliders, Eye, Download, UploadCloud, Check, RotateCcw, 
  FileCheck, Palette, Trash2, Plus, Printer, Building, Phone, 
  ShieldAlert, Globe, HelpCircle, FileSignature, Sparkles, CheckCircle2,
  Maximize2, EyeOff, Layout, Layers, HelpCircle as HelpIcon, FileSpreadsheet, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvoiceTemplateConfig, CustomDocument, Branch } from '../types';

interface InvoiceTemplatesTabProps {
  templateConfig: InvoiceTemplateConfig;
  onUpdateConfig: (config: InvoiceTemplateConfig) => void;
  documents: CustomDocument[];
  onAddDocument: (doc: CustomDocument) => void;
  onDeleteDocument: (id: string) => void;
  branches: Branch[];
  lang: 'ar' | 'en';
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function InvoiceTemplatesTab({
  templateConfig,
  onUpdateConfig,
  documents,
  onAddDocument,
  onDeleteDocument,
  branches,
  lang,
  addToast
}: InvoiceTemplatesTabProps) {
  
  // Tab states: 'customize' or 'documents'
  const [activeSubTab, setActiveSubTab] = useState<'customize' | 'documents'>('customize');
  
  // Interactive Live Preview State (mock bill details)
  const [previewSize, setPreviewSize] = useState<'sm' | 'lg'>('lg');
  const [showWatermark, setShowWatermark] = useState(true);

  // Document states
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<'pdf' | 'xlsx' | 'docx' | 'image' | 'preset_invoice' | 'rules'>('pdf');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Form Fields for settings
  const [companyName, setCompanyName] = useState(templateConfig.companyName || 'مؤسسة النبلاء للاستيراد والبيع المتعدد');
  const [logoUrl, setLogoUrl] = useState(templateConfig.logoUrl || '');
  const [phone, setPhone] = useState(templateConfig.phone || '0123456789');
  const [email, setEmail] = useState(templateConfig.email || 'nobles.trade@gmail.com');
  const [address, setAddress] = useState(templateConfig.address || 'الخرطوم - السوق المحلي، مربع ٤');
  const [taxNumber, setTaxNumber] = useState(templateConfig.taxNumber || '٣١٠١٥٨٩٤٢'); // الرقم الضريبي
  const [commercialRegister, setCommercialRegister] = useState(templateConfig.commercialRegister || '١٢٢٩٤-س'); // السجل التجاري
  const [headerNotes, setHeaderNotes] = useState(templateConfig.headerNotes || 'الموزع المعتمد لبيع قطع الغيار والحلول التقنية المتطورة');
  const [footerNotes, setFooterNotes] = useState(templateConfig.footerNotes || 'شكراً لتعاملكم معنا! نسعد بخدمتكم في أي وقت.');
  const [primaryColor, setPrimaryColor] = useState(templateConfig.primaryColor || '#0071e3');
  const [layout, setLayout] = useState<'thermal-80mm' | 'a4-modern' | 'a4-classic' | 'a4-minimalist' | 'a4-professional'>(templateConfig.layout || 'a4-modern');
  const [showLogo, setShowLogo] = useState(templateConfig.showLogo ?? true);
  const [showQrCode, setShowQrCode] = useState(templateConfig.showQrCode ?? true);
  const [showBranchInfo, setShowBranchInfo] = useState(templateConfig.showBranchInfo ?? true);
  const [termsAndConditions, setTermsAndConditions] = useState(templateConfig.termsAndConditions || '١. البضاعة المباعة لا تسترد بعد مرور ٣ أيام.\n٢. يجب إرفاق الفاتورة الأصلية عند طلب الاستبدال.\n٣. الضمان يشمل الكسر المصنعي للقطع الكهربائية.');
  const [authorizedSignatureName, setAuthorizedSignatureName] = useState(templateConfig.authorizedSignatureName || 'المهندس / أحمد مصطفى');
  const [sealImageUrl, setSealImageUrl] = useState(templateConfig.sealImageUrl || 'https://i.imgur.com/vH3gGzT.png'); // sample circular stamp dummy
  const [watermarkText, setWatermarkText] = useState(templateConfig.watermarkText || 'مؤسسة النبلاء الأصلية');

  // Apply Changes
  const handleSaveConfig = () => {
    const updated: InvoiceTemplateConfig = {
      id: templateConfig.id || 'primary_template',
      layout,
      companyName: companyName.trim(),
      logoUrl: logoUrl.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      taxNumber: taxNumber.trim() || undefined,
      commercialRegister: commercialRegister.trim() || undefined,
      headerNotes: headerNotes.trim() || undefined,
      footerNotes: footerNotes.trim() || undefined,
      primaryColor,
      showLogo,
      showQrCode,
      showBranchInfo,
      termsAndConditions: termsAndConditions.trim() || undefined,
      authorizedSignatureName: authorizedSignatureName.trim() || undefined,
      sealImageUrl: sealImageUrl.trim() || undefined,
      watermarkText: watermarkText.trim() || undefined
    };

    onUpdateConfig(updated);
    addToast(lang === 'ar' ? 'تم حفظ قالب الفواتير والإعدادات البصرية بنجاح' : 'Invoice styling config updated successfully', 'success');
  };

  // Preset Layout Selector Handler
  const handleApplyLayoutPreset = (type: typeof layout) => {
    setLayout(type);
    if (type === 'thermal-80mm') {
      setPrimaryColor('#1d1d1f'); // Charcoal
    } else if (type === 'a4-classic') {
      setPrimaryColor('#0f172a'); // Slate
    } else if (type === 'a4-professional') {
      setPrimaryColor('#1e3a8a'); // Royal Blue
    } else if (type === 'a4-modern') {
      setPrimaryColor('#059669'); // Emerald
    } else {
      setPrimaryColor('#1d1d1f'); // Minimalist
    }
    addToast(lang === 'ar' ? 'طبق نمط القالب المختار على لوحة المعاينة' : 'Selected blueprint style applied to mockup', 'info');
  };

  // Add Custom document record
  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) {
      addToast(lang === 'ar' ? 'يرجى كتابة عنوان للمستند' : 'Please provide a document title', 'error');
      return;
    }

    const doc: CustomDocument = {
      id: Math.random().toString(36).substring(2, 11),
      title: newDocTitle.trim(),
      fileType: newDocType,
      notes: newDocNotes.trim() || undefined,
      fileSize: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
      createdAt: Date.now()
    };

    onAddDocument(doc);
    addToast(lang === 'ar' ? 'تم حفظ المستند الجديد/الفاتورة الجاهزة' : 'Successfully registered new document', 'success');
    
    // reset
    setNewDocTitle('');
    setNewDocNotes('');
    setIsDocModalOpen(false);
  };

  // Simulate file drag actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      let type: typeof newDocType = 'pdf';
      if (ext === 'xlsx' || ext === 'xls') type = 'xlsx';
      else if (ext === 'docx' || ext === 'doc') type = 'docx';
      else if (['png', 'jpg', 'jpeg', 'svg'].includes(ext || '')) type = 'image';

      const doc: CustomDocument = {
        id: Math.random().toString(36).substring(2, 11),
        title,
        fileType: type,
        notes: lang === 'ar' ? 'مرفوع عبر سحب وإفلات فوري' : 'Automated drag-and-drop upload',
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        createdAt: Date.now()
      };

      onAddDocument(doc);
      addToast(lang === 'ar' ? `تم قراءة ورفع الملف: ${file.name}` : `Document uploaded: ${file.name}`, 'success');
    }
  };

  // Quick reset parameters to standard Nobel values
  const handleResetDefaults = () => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في استعادة الإعدادات المصنعية للقوالب؟' : 'Reset all template configurations to defaults?')) {
      setCompanyName('مؤسسة النبلاء للاستيراد والبيع المتعدد');
      setLogoUrl('');
      setPhone('0123456789');
      setEmail('nobles.trade@gmail.com');
      setAddress('الخرطوم - السوق المحلي، مربع ٤');
      setTaxNumber('٣١٠١٥٨٩٤٢');
      setCommercialRegister('١٢٢٩٤-س');
      setHeaderNotes('الموزع المعتمد لبيع قطع الغيار والحلول التقنية المتطورة');
      setFooterNotes('شكراً لتعاملكم معنا! نسعد بخدمتكم في أي وقت.');
      setPrimaryColor('#0071e3');
      setLayout('a4-modern');
      setShowLogo(true);
      setShowQrCode(true);
      setShowBranchInfo(true);
      setTermsAndConditions('١. البضاعة المباعة لا تسترد بعد مرور ٣ أيام.\n٢. يجب إرفاق الفاتورة الأصلية عند طلب الاستبدال.\n٣. الضمان يشمل الكسر المصنعي للقطع الكهربائية.');
      setAuthorizedSignatureName('المهندس / أحمد مصطفى');
      setSealImageUrl('https://i.imgur.com/vH3gGzT.png');
      setWatermarkText('مؤسسة النبلاء الأصلية');
      addToast(lang === 'ar' ? 'تمت استعادة الإعدادات الافتراضية بنجاح' : 'Configurations reset to system defaults', 'info');
    }
  };

  // Preview mock items
  const mockInvoiceItems = [
    { code: 'P034', name: 'إسبـيرات بستم ومكبس هيدروليك ياباني كوماتسو', qty: 2, price: 45000, total: 90000 },
    { code: 'P112', name: 'طقم جلب ورباط تعليق خلفي مقوى مرسيدس شاحنات', qty: 5, price: 18000, total: 90000 },
    { code: 'P055', name: 'سير ناقل حـركة ميكانيكي عريض مضاد للحرارة الكرتون', qty: 10, price: 7500, total: 75000 }
  ];

  const subTotal = mockInvoiceItems.reduce((sum, item) => sum + item.total, 0);
  const taxPct = 15;
  const taxVal = Math.round(subTotal * (taxPct / 100));
  const discountVal = 12000;
  const finalTotal = subTotal + taxVal - discountVal;

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-5 no-print">
        <div>
          <h2 className="text-xl font-black text-[#1d1d1f] tracking-tight flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#0071e3]" />
            <span>{lang === 'ar' ? 'إعدادات قوالب الفواتير وإدارة الملفات والمستندات' : 'Smart Billing Templates & Asset Manager'}</span>
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'تخصيص قوالب الطباعة (حراري 80مم أو A4 الملونة والمبسطة)، كتابة ترويسة وشروط الفواتير وتوثيق مستندات الأصول الجاهزة' 
              : 'Customize print blueprints (Small Thermal vs A4 corporate styles), write invoice contracts, upload trade documents'}
          </p>
        </div>

        {/* SUBTAB TOGGLER */}
        <div className="bg-[#f5f5f7] p-1 rounded-2xl border border-[#d2d2d7]/50 flex gap-1 self-start md:self-auto shrink-0 shadow-xs">
          <button
            onClick={() => setActiveSubTab('customize')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'customize' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصميم الفاتورة والمعاينة' : 'Blueprint & Styling'}</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'documents' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'أرشيف وحافظة المستندات' : 'Documents & Presets'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: CUSTOMIZER & LIVE PREVIEW */}
        {activeSubTab === 'customize' && (
          <motion.div
            key="customize-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            
            {/* LEFT PROFILE SETTINGS FORM */}
            <div className="lg:col-span-5 bg-white border border-[#d2d2d7] rounded-3xl p-5 space-y-5 shadow-xs">
              
              <div className="border-b border-[#f5f5f7] pb-3 flex items-center justify-between">
                <span className="text-xs font-black text-gray-900 flex items-center gap-1">
                  <Palette className="w-4 h-4 text-[#0071e3]" />
                  <span>{lang === 'ar' ? 'تخصيص البيانات والهوية البصرية' : 'Brand Cosmetics & Text'}</span>
                </span>
                
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="text-[10px] text-red-500 hover:text-red-700 font-extrabold flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'ar' ? 'استعادة الافتراضي' : 'Factory Reset'}</span>
                </button>
              </div>

              {/* Layout Blueprint selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5 text-gray-400" />
                  <span>{lang === 'ar' ? 'اختر تخطيط وحجم الهيكل المطبوع فورا' : 'Select Layout Standard & Architecture'}</span>
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApplyLayoutPreset('thermal-80mm')}
                    className={`p-3 rounded-xl border text-right transition flex flex-col justify-between h-[80px] ${
                      layout === 'thermal-80mm' 
                        ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]' 
                        : 'border-gray-200 hover:border-gray-300 bg-[#f5f5f7]/50'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900 block">{lang === 'ar' ? 'الكاشير الصغير (Thermal 80mm)' : 'Compact Thermal'}</span>
                    <span className="text-[9px] text-[#6e6e73] leading-tight block">
                      {lang === 'ar' ? 'ملائم للطابعات السريعة وبكر النقد الصغير' : 'Perfect for fast point-of-sale receipt slips'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('a4-modern')}
                    className={`p-3 rounded-xl border text-right transition flex flex-col justify-between h-[80px] ${
                      layout === 'a4-modern' 
                        ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]' 
                        : 'border-gray-200 hover:border-gray-300 bg-[#f5f5f7]/50'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900 block">{lang === 'ar' ? 'ورق A4 عصري ملون' : 'Corporate A4 Modern'}</span>
                    <span className="text-[9px] text-[#6e6e73] leading-tight block">
                      {lang === 'ar' ? 'تلوين كامل وجداول وعمدان عريضة ومظهر دقيق' : 'Gradients with high-contrast lines and grids'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('a4-classic')}
                    className={`p-3 rounded-xl border text-right transition flex flex-col justify-between h-[80px] ${
                      layout === 'a4-classic' 
                        ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]' 
                        : 'border-gray-200 hover:border-gray-300 bg-[#f5f5f7]/50'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900 block">{lang === 'ar' ? 'تخطيط A4 الفاخر' : 'Classic Executive A4'}</span>
                    <span className="text-[9px] text-[#6e6e73] leading-tight block">
                      {lang === 'ar' ? 'إطار مزدوج رسمي وخطوط دقيقة مع ترويسة تقليدية' : 'Twin frame borders with high styling discipline'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleApplyLayoutPreset('a4-minimalist')}
                    className={`p-3 rounded-xl border text-right transition flex flex-col justify-between h-[80px] ${
                      layout === 'a4-minimalist' 
                        ? 'border-[#0071e3] bg-[#0071e3]/5 ring-1 ring-[#0071e3]' 
                        : 'border-gray-200 hover:border-gray-300 bg-[#f5f5f7]/50'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900 block">{lang === 'ar' ? 'تخطيط A4 الفني الهادئ' : 'Minimalist A4 Mono'}</span>
                    <span className="text-[9px] text-[#6e6e73] leading-tight block">
                      {lang === 'ar' ? 'أبيض وأسود معتمد، مساحات فارغة مريحة وتصميم معتدل' : 'Whitespace focus with minimal ink usage'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                
                {/* Brand Color Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'اللون المميز للفاتورة' : 'Core Theme Color Code'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent block"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full text-xs font-mono px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                    {/* Quick presets colors */}
                    <div className="flex gap-1">
                      {['#0071e3', '#059669', '#1e3a8a', '#111827', '#b91c1c'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setPrimaryColor(c)}
                          className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'عنوان الشركة / المؤسسة *' : 'Corporate Identity Title *'}</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Tax Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'الرقم الضريبي للمؤسسة' : 'Tax Vat Registration'}</label>
                    <input
                      type="text"
                      value={taxNumber}
                      placeholder="e.g. 310158942"
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  {/* Commercial Register */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'السجل التجاري' : 'Commercial Record Number'}</label>
                    <input
                      type="text"
                      value={commercialRegister}
                      placeholder="e.g. 12294"
                      onChange={(e) => setCommercialRegister(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Contact Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'رقم الهاتف وقنوات التواصل' : 'Sales Desk Phone'}</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'البريد الإلكتروني للبيع والفوترة' : 'Invoices Email Desk'}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Company address */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'الموقع الجغرافي المعنون' : 'Trade Office Address'}</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>

                {/* Header Notes Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'نبذة علوية للترويسة (Header Notes)' : 'Header Corporate Motto'}</label>
                  <textarea
                    rows={2}
                    value={headerNotes}
                    onChange={(e) => setHeaderNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none resize-none"
                  />
                </div>

                {/* Terms and conditions */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'شروط وأحكام الفاتورة والارتجاع *' : 'Printed Terms & Return Clauses *'}</label>
                  <textarea
                    rows={3}
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none resize-none text-[10px] leading-relaxed"
                  />
                </div>

                {/* Custom authorization variables */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'المخول بالتوقيع والإصدار' : 'Authorized Signee'}</label>
                    <input
                      type="text"
                      value={authorizedSignatureName}
                      onChange={(e) => setAuthorizedSignatureName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'رابط الختم الرقمي (Stamp URL)' : 'Digital Seal Stamp URL'}</label>
                    <input
                      type="text"
                      value={sealImageUrl}
                      onChange={(e) => setSealImageUrl(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono text-[9px]"
                    />
                  </div>
                </div>

                {/* Logo placeholder url or upload simulator */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block text-right">{lang === 'ar' ? 'رابط صورة الشعار (Logo URL)' : 'Corporate Logo Image URL'}</label>
                  <input
                    type="text"
                    value={logoUrl}
                    placeholder="https://yourdomain.com/logo.png"
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono text-[10px]"
                  />
                </div>

                {/* Watermark texts */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'عبارة الخلفية المائية للفاتورة' : 'Diagonal Watermark Word'}</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'ملاحظة الفاتورة السفلية' : 'Bottom Footer Note'}</label>
                    <input
                      type="text"
                      value={footerNotes}
                      onChange={(e) => setFooterNotes(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Checkboxes configuration togglers */}
                <div className="bg-[#f5f5f7] p-3 rounded-2xl border border-[#d2d2d7]/50 grid grid-cols-1 gap-2 pt-2 text-[11px] text-gray-600 select-none">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] w-3.5 h-3.5"
                    />
                    <span className="font-extrabold text-gray-800">{lang === 'ar' ? 'إظهار شعار الشركة في أعلى الفاتورة' : 'Draw corporate logo'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] w-3.5 h-3.5"
                    />
                    <span className="font-extrabold text-gray-800">{lang === 'ar' ? 'توليد كود الاستجابة السريعة التجاري (QR Code)' : 'Print quick QR Code tag'}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBranchInfo}
                      onChange={(e) => setShowBranchInfo(e.target.checked)}
                      className="rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] w-3.5 h-3.5"
                    />
                    <span className="font-extrabold text-gray-800">{lang === 'ar' ? 'إظهار اسم وبيانات الفرع البائع المعتمد' : 'Show selling branch info node'}</span>
                  </label>
                </div>

                {/* Submit action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'حفـظ الهوية وتعديل الفاتورة' : 'Deploy Design Settings'}</span>
                  </button>
                </div>

              </div>

            </div>

            {/* RIGHT SIDE: LIVE DYNAMIC BILLING PREVIEW */}
            <div className="lg:col-span-7 space-y-3">
              
              <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-2xl p-4 flex items-center justify-between shadow-xs select-none">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <div>
                    <span className="text-xs font-black text-gray-900 block">{lang === 'ar' ? 'معاينة حية للمظهر الجديد والطباعة' : 'Live Print Mockup Platform'}</span>
                    <span className="text-[10px] text-gray-400 block">{lang === 'ar' ? 'تتحرك لوحة المعاينة ديناميكياً مع تعديلك للبيانات' : 'Renders instantly custom titles on layout'}</span>
                  </div>
                </div>

                {/* Controllers */}
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setShowWatermark(!showWatermark)}
                    className={`px-2.5 py-1.5 rounded-xl border font-bold transition flex items-center gap-1 ${
                      showWatermark 
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700' 
                        : 'border-gray-200 text-gray-500 bg-white'
                    }`}
                  >
                    {showWatermark ? <CheckCircle2 className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{lang === 'ar' ? 'الخلفية المائية' : 'Watermark'}</span>
                  </button>
                  
                  <button
                    onClick={() => handleSaveConfig()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'اعتماد' : 'Apply'}</span>
                  </button>
                </div>
              </div>

              {/* LIVE EMBEDDED IFRAME OR CUSTOM COMPACT RENDER */}
              <div className="border border-[#d2d2d7] bg-[#f5f5f7] rounded-3xl p-6 min-h-[500px] flex items-center justify-center overflow-x-auto relative">
                
                {/* 1. RENDER OPTION: THERMAL 80MM */}
                {layout === 'thermal-80mm' && (
                  <div 
                    className="bg-white text-gray-900 text-[10px] font-sans p-6 rounded-lg shadow-xl border w-[300px] relative shrink-0 leading-normal" 
                    dir="rtl"
                  >
                    {showWatermark && watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none rotate-[30deg] font-black text-xs select-none">
                        {watermarkText}
                      </div>
                    )}

                    <div className="text-center space-y-1.5 pb-3 border-b border-dashed border-gray-400">
                      {showLogo && (
                        <div className="w-10 h-10 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-gray-400 font-bold text-xs">
                          {logoUrl ? <img src={logoUrl} className="w-full h-full rounded-full object-contain" alt="Logo" referrerPolicy="no-referrer" /> : 'St'}
                        </div>
                      )}
                      <h4 className="text-xs font-black text-[#1d1d1f]">{companyName}</h4>
                      <p className="text-[8px] text-gray-500">{headerNotes}</p>
                      <p className="font-mono text-[8px] text-gray-600 mt-1">Invoice: #TX-90342</p>
                    </div>

                    <div className="space-y-1 py-3 text-[8px] border-b border-dashed border-gray-400 text-gray-600">
                      <div className="flex justify-between">
                        <span>التاريخ والوقت:</span>
                        <span className="font-mono">2026-06-07 20:45</span>
                      </div>
                      <div className="flex justify-between">
                        <span>الرقم الضريبي للهيئة:</span>
                        <span className="font-mono">{taxNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>رقم السجل التجاري:</span>
                        <span className="font-mono font-bold">{commercialRegister}</span>
                      </div>
                      {showBranchInfo && (
                        <div className="flex justify-between text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded mt-1 font-medium">
                          <span>الجهة المصدّرة:</span>
                          <span>الفرع الرئيسي الرئيسي</span>
                        </div>
                      )}
                      <div className="flex justify-between mt-1">
                        <span>طريقة السداد:</span>
                        <span className="font-bold">كاشير ونقد فوري</span>
                      </div>
                    </div>

                    {/* Table items */}
                    <div className="py-2">
                      <table className="w-full text-[8px] text-right">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-200">
                            <th className="pb-1">البند والمادة</th>
                            <th className="text-center pb-1">الكمية</th>
                            <th className="text-left pb-1">المجموع</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {mockInvoiceItems.map((item, index) => (
                            <tr key={index}>
                              <td className="py-1">
                                <span className="font-bold text-gray-900 block truncate max-w-[130px]">{item.name}</span>
                                <span className="text-[7px] text-gray-400">{item.price.toLocaleString()} SDG</span>
                              </td>
                              <td className="text-center font-mono">{item.qty} ق</td>
                              <td className="text-left font-bold text-gray-900">{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Math values */}
                    <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-[8px]">
                      <div className="flex justify-between">
                        <span>المجموع الأساسي:</span>
                        <span className="font-mono">{subTotal.toLocaleString()} SDG</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>قيمة الخصم المعتمد:</span>
                        <span className="font-mono">-{discountVal.toLocaleString()} SDG</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>ضريبة المبيعات ({taxPct}%):</span>
                        <span className="font-mono">+{taxVal.toLocaleString()} SDG</span>
                      </div>
                      <div className="flex justify-between text-xs font-black border-t border-gray-200 pt-1.5 mt-1 text-gray-950">
                        <span>المجموع الإجمالي:</span>
                        <span>{finalTotal.toLocaleString()} SDG</span>
                      </div>
                    </div>

                    {/* QR code and footer signature */}
                    <div className="pt-4 border-t border-dashed border-gray-300 text-center space-y-2">
                      {showQrCode && (
                        <div className="w-16 h-16 bg-gray-50 border border-gray-200 mx-auto flex items-center justify-center p-1.5 rounded">
                          <img 
                            src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Invoice-TX-90342-Total-253000-Tax-310158942" 
                            className="w-full h-full object-contain" 
                            alt="Invoice QR"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-0.5 text-[8px] text-gray-500">
                        <p className="font-bold text-gray-700">{footerNotes}</p>
                        <p>رقم الهاتف: {phone} • البريد: {email}</p>
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. RENDER OPTION: CORPORATE A4 MODERN STYLE */}
                {layout === 'a4-modern' && (
                  <div 
                    className="bg-white text-gray-900 text-xs font-sans p-8 rounded-2xl shadow-xl border w-[550px] space-y-6 relative shrink-0" 
                    dir="rtl"
                  >
                    {/* Watermark layer */}
                    {showWatermark && watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[30deg] font-black text-3xl select-none">
                        {watermarkText}
                      </div>
                    )}

                    {/* Styled header stripe */}
                    <div className="h-2 rounded-t-lg absolute top-0 left-0 right-0" style={{ backgroundColor: primaryColor }} />

                    {/* Document Brand Banner */}
                    <div className="flex justify-between items-start pt-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {showLogo && (
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold shrink-0">
                              {logoUrl ? <img src={logoUrl} className="w-full h-full rounded-lg object-contain" alt="Logo" referrerPolicy="no-referrer" /> : 'St'}
                            </div>
                          )}
                          <h3 className="text-sm font-black tracking-tight" style={{ color: primaryColor }}>{companyName}</h3>
                        </div>
                        <p className="text-[9px] text-[#6e6e73] leading-relaxed max-w-[280px]">{headerNotes}</p>
                        <div className="text-[9px] text-gray-400 font-medium">الرقم الضريبي للهيئة: {taxNumber} • السجل: {commercialRegister}</div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-xl font-bold uppercase tracking-tight block" style={{ color: primaryColor }}>{lang === 'ar' ? 'فاتورة بيع رسمية' : 'Tax Invoice'}</span>
                        <div className="text-[10px] text-gray-500 font-mono mt-1 space-y-0.5" dir="ltr">
                          <div>Invoice No: <span className="font-bold text-gray-900">TX-90244-SUD</span></div>
                          <div>Date: <span className="text-gray-900">2026-06-07</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Billing address parameters */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 text-[10px] text-gray-600">
                      <div>
                        <span className="font-extrabold text-[#1d1d1f] block mb-1">{lang === 'ar' ? 'الفاتورة موجهة إلى العميل:' : 'Charge To:'}</span>
                        <p className="font-bold text-indigo-700">شركة المهند للمعدات والمشاريع المحدودة</p>
                        <p>{lang === 'ar' ? 'المدينة: الخرطوم، حي الكافوري' : 'City: Khartoum North'}</p>
                        <p>رقم تواصل العميل: ٠٩١٢٣٤٥٦٧٨</p>
                      </div>

                      <div>
                        <span className="font-extrabold text-[#1d1d1f] block mb-1">{lang === 'ar' ? 'نقطة المبيعات والإرسال:' : 'Dispatch Point:'}</span>
                        {showBranchInfo ? (
                          <>
                            <p className="font-bold">المقر الرئيسي للشركة</p>
                            <p>الموقع: {address}</p>
                            <p>هاتف المبيعات: {phone}</p>
                          </>
                        ) : (
                          <p className="italic text-gray-400">لم تدرج بيانات الفرع في تصميم الطباعة</p>
                        )}
                      </div>
                    </div>

                    {/* Main Items table */}
                    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-[10px] text-right">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 font-extrabold border-b border-gray-200">
                            <th className="py-2.5 px-3">{lang === 'ar' ? 'الكود' : 'Code'}</th>
                            <th className="py-2.5 px-3">{lang === 'ar' ? 'البيان والمواد الموصوفة' : 'Item Description'}</th>
                            <th className="py-2.5 px-3 text-center">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                            <th className="py-2.5 px-3 text-left">{lang === 'ar' ? 'السعر' : 'Unit Price'}</th>
                            <th className="py-2.5 px-3 text-left" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>{lang === 'ar' ? 'المجموع' : 'Subtotal'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {mockInvoiceItems.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/40">
                              <td className="py-2.5 px-3 font-mono text-gray-500 font-bold">{item.code}</td>
                              <td className="py-2.5 px-3 font-semibold text-gray-900">{item.name}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-extrabold text-gray-800">{item.qty} {lang === 'ar' ? 'حبة' : 'pcs'}</td>
                              <td className="py-2.5 px-3 text-left font-mono">{item.price.toLocaleString()}</td>
                              <td className="py-2.5 px-3 text-left font-mono font-bold" style={{ color: primaryColor }}>{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Executive summaries math */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 max-w-[280px]">
                        <span className="text-[9px] font-extrabold text-gray-400 block mb-1 uppercase tracking-wider">{lang === 'ar' ? 'شروط الطباعة والضمان' : 'TERMS & DECLARATION'}</span>
                        <p className="text-[8px] text-gray-500 leading-relaxed whitespace-pre-line">{termsAndConditions}</p>
                      </div>

                      <div className="w-[180px] space-y-1.5 text-right font-medium text-[10px]">
                        <div className="flex justify-between text-gray-500">
                          <span>{lang === 'ar' ? 'المجموع الفرعي:' : 'Gross Sum'}</span>
                          <span className="font-mono">{subTotal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>{lang === 'ar' ? 'قيمة الخصم الاستثنائي:' : 'Deducted Discount'}</span>
                          <span className="font-mono">-{discountVal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>{lang === 'ar' ? 'ضريبة تشغيل مضافة:' : 'VAT Tax'} ({taxPct}%)</span>
                          <span className="font-mono">+{taxVal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between font-black text-xs border-t border-gray-200 pt-2" style={{ color: primaryColor }}>
                          <span>{lang === 'ar' ? 'الإجمالي المطلوب:' : 'Final Payable'}</span>
                          <span className="font-sans font-black">{finalTotal.toLocaleString()} SDG</span>
                        </div>
                      </div>
                    </div>

                    {/* Authorized Signatures and QR */}
                    <div className="pt-5 border-t border-gray-100 flex justify-between items-end">
                      <div className="flex items-center gap-3">
                        {showQrCode ? (
                          <div className="w-16 h-16 border border-gray-200 p-1 rounded-lg">
                            <img 
                              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SudanInvoiceA4-TX-90244-SUD" 
                              className="w-full h-full object-contain" 
                              alt="A4 QR"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 border border-dashed border-gray-100 rounded" />
                        )}
                        <p className="text-[8px] text-gray-400 max-w-[150px] leading-snug">
                          {lang === 'ar' ? 'فاتورة مشفرة طبقاً لقواعد الضرائب وتحويلات النقد بالسودان.' : 'Structured, encrypted invoice compliant with regional commercial guidelines.'}
                        </p>
                      </div>

                      {/* Seal image and signature wrapper */}
                      <div className="flex items-center gap-4 text-left">
                        {sealImageUrl && (
                          <div className="w-14 h-14 bg-transparent shrink-0 opacity-70">
                            <img src={sealImageUrl} className="w-full h-full object-contain pointer-events-none" alt="Company stamp seal" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="text-right space-y-1">
                          <span className="text-[9px] text-gray-400 block">{lang === 'ar' ? 'توقيع المدير المعتمد:' : 'Approving Officer:'}</span>
                          <p className="font-sans font-bold text-[#1d1d1f] border-b border-gray-300 pb-1 text-[10px]">{authorizedSignatureName}</p>
                          <span className="text-[8px] text-gray-400 block">{lang === 'ar' ? 'تحقّق أصل وتدقيق' : 'Electronic copy verified'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-2 text-[8px] text-gray-400 border-t border-gray-100">
                      {footerNotes} • {phone} • {email}
                    </div>

                  </div>
                )}

                {/* 3. RENDER OPTION: EXECUTIVE A4 CLASSIC */}
                {layout === 'a4-classic' && (
                  <div 
                    className="bg-white text-gray-900 text-xs font-sans p-8 rounded-none border-[3px] border-double w-[550px] space-y-6 relative shrink-0" 
                    style={{ borderColor: primaryColor }}
                    dir="rtl"
                  >
                    {showWatermark && watermarkText && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[30deg] font-black text-3xl select-none">
                        {watermarkText}
                      </div>
                    )}

                    <div className="text-center border-b-[2px] pb-4 space-y-1" style={{ borderColor: primaryColor }}>
                      <h2 className="text-base font-black tracking-widest" style={{ color: primaryColor }}>
                        {companyName.toUpperCase()}
                      </h2>
                      <p className="text-[10px] tracking-wide text-gray-500 font-serif">{headerNotes}</p>
                      <div className="text-[9px] text-gray-400 mt-1">
                        الرقم الضريبي: {taxNumber} • السجل التجاري: {commercialRegister} • البريد: {email}
                      </div>
                    </div>

                    {/* Invoice ID Banner */}
                    <div className="flex justify-between items-center text-[10px] text-gray-700 bg-gray-100/60 p-2 border border-gray-200">
                      <span>{lang === 'ar' ? 'مستند: فاتورة ضريبية رسمية للبيع' : 'OFFICIAL COMMERCIAL TAX INVOICE'}</span>
                      <span className="font-bold font-mono">CODE: TX-CL-8032</span>
                    </div>

                    {/* Classic layout tables */}
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div className="space-y-1 border border-gray-200 p-2.5">
                        <span className="font-bold block border-b pb-1 mb-1">{lang === 'ar' ? 'العميل المستلم:' : 'Consignee Details:'}</span>
                        <p className="font-black text-gray-900">شركة المهند للمعدات والمشاريع المحدودة</p>
                        <p>الخرطوم - كافوري، مربع ٣</p>
                        <p>هاتف العميل: ٠٩١٢٣٤٥٦٧٨</p>
                      </div>

                      <div className="space-y-1 border border-gray-200 p-2.5">
                        <span className="font-bold block border-b pb-1 mb-1">{lang === 'ar' ? 'شحن وتسليم الفروع:' : 'Billing Office link:'}</span>
                        {showBranchInfo ? (
                          <>
                            <p className="font-bold">المقر الرئيسي والمستودعات</p>
                            <p>العنوان: {address}</p>
                            <p>تليفون: {phone}</p>
                          </>
                        ) : (
                          <p className="text-gray-400 italic">مقر مبيعات افتراضي غير محدد</p>
                        )}
                      </div>
                    </div>

                    {/* Table listing */}
                    <div>
                      <table className="w-full text-[10px] text-right border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-300">
                            <th className="border-l border-gray-300 p-2 text-center w-[40px]">{lang === 'ar' ? 'رقم' : 'No'}</th>
                            <th className="border-l border-gray-300 p-2">{lang === 'ar' ? 'الصنف والبيان التفصيلي' : 'Particulars'}</th>
                            <th className="border-l border-gray-300 p-2 text-center w-[60px]">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                            <th className="border-l border-gray-300 p-2 text-left w-[80px]">{lang === 'ar' ? 'سعر الوحدة' : 'Rate'}</th>
                            <th className="p-2 text-left w-[100px]">{lang === 'ar' ? 'إجمالي المجموع' : 'Amount SDG'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockInvoiceItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="border-l border-gray-350 p-2 text-center font-mono">{idx + 1}</td>
                              <td className="border-l border-gray-350 p-2 font-bold">{item.name}</td>
                              <td className="border-l border-gray-350 p-2 text-center font-mono">{item.qty}</td>
                              <td className="border-l border-gray-350 p-2 text-left font-mono">{item.price.toLocaleString()}</td>
                              <td className="p-2 text-left font-mono font-bold">{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Classic math summary */}
                    <div className="flex justify-between items-start text-[10px]">
                      <div className="w-[280px] space-y-1">
                        <span className="font-bold block border-b pb-1 text-[9px] tracking-wider uppercase">{lang === 'ar' ? 'شروط الارتجاع والضوابط' : 'CONDITIONS & WARANTIES'}</span>
                        <p className="text-[8px] text-gray-500 whitespace-pre-line leading-relaxed">{termsAndConditions}</p>
                      </div>

                      <div className="w-[180px] border border-gray-350 p-2 space-y-1 bg-gray-50/70 font-bold">
                        <div className="flex justify-between text-gray-600 font-medium text-[9px]">
                          <span>المجموع الإجمالي الأساسي:</span>
                          <span className="font-mono">{subTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600 text-[9px]">
                          <span>الخصم المسموح به:</span>
                          <span className="font-mono">-{discountVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 text-[9px]">
                          <span>ضريبة بيع ({taxPct}%):</span>
                          <span className="font-mono">+{taxVal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-400 pt-1.5 text-xs text-gray-950 font-black">
                          <span>الصافي النهائي:</span>
                          <span className="font-mono" style={{ color: primaryColor }}>{finalTotal.toLocaleString()} SDG</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures classic */}
                    <div className="pt-6 flex justify-between items-center text-[10px] border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {showQrCode ? (
                          <div className="w-12 h-12 border p-1 rounded bg-white">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SudanClassic-TX-CL-8032" className="w-[100%] h-[100%]" alt="Classic QR" />
                          </div>
                        ) : null}
                        <div>
                          <p className="text-[8px] text-gray-400">{footerNotes}</p>
                        </div>
                      </div>

                      <div className="text-center font-bold space-y-1">
                        <p className="text-gray-400 text-[9px]">{lang === 'ar' ? 'مراجعة وتوثيق الحسابات:' : 'Executive Approval Desk:'}</p>
                        <p className="font-serif border-b w-[120px] mx-auto pb-1 text-gray-900">{authorizedSignatureName}</p>
                        <span className="text-[7px] text-gray-400 uppercase tracking-widest">{lang === 'ar' ? 'ختم الشركة المعتمد' : 'Corporate Seal Area'}</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* 4. RENDER OPTION: MINIMALIST A4 MONO STYLE */}
                {layout === 'a4-minimalist' && (
                  <div 
                    className="bg-white text-gray-950 text-xs font-sans p-8 rounded-xl border border-gray-200 w-[550px] space-y-6 shrink-0" 
                    dir="rtl"
                  >
                    <div className="flex justify-between items-start border-b border-gray-300 pb-4">
                      <div>
                        <h2 className="text-base font-black text-gray-950">{companyName}</h2>
                        <p className="text-[9px] text-gray-400 font-medium">{headerNotes}</p>
                        <p className="text-[8px] text-gray-500 mt-1">الرقم الضريبي: {taxNumber} • الهاتف: {phone}</p>
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-extrabold uppercase tracking-wide">فاتورة نقدية</h3>
                        <p className="text-[9px] text-gray-400 font-mono mt-0.5">#{Math.round(Math.random()*100000)}</p>
                      </div>
                    </div>

                    {/* Table minimalistic without borders */}
                    <div className="space-y-2">
                      <div className="border-b uppercase text-[9px] font-extrabold text-gray-400 pb-1">{lang === 'ar' ? 'قائمة الأصناف والمواد المبيعة' : 'INVOICED LINE ITEMS'}</div>
                      <table className="w-full text-[10px] text-right">
                        <thead>
                          <tr className="border-b text-gray-500">
                            <th className="pb-1 font-bold">{lang === 'ar' ? 'البند' : 'Item'}</th>
                            <th className="pb-1 text-center font-bold w-[60px]">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                            <th className="pb-1 text-left font-bold w-[100px]">{lang === 'ar' ? 'سعر الوحدة' : 'Rate'}</th>
                            <th className="pb-1 text-left font-bold w-[100px]">{lang === 'ar' ? 'المجموع' : 'Total'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {mockInvoiceItems.map((item, is) => (
                            <tr key={is}>
                              <td className="py-2.5">
                                <span className="font-extrabold text-gray-950 block">{item.name}</span>
                                <span className="text-[8px] text-gray-400 font-mono">CODE: {item.code}</span>
                              </td>
                              <td className="text-center py-2.5 font-mono">{item.qty}</td>
                              <td className="text-left py-2.5 font-mono">{item.price.toLocaleString()}</td>
                              <td className="text-left font-bold py-2.5 font-mono">{item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Minimalist total list block */}
                    <div className="flex justify-end pt-3">
                      <div className="w-[200px] space-y-1.5 text-right font-medium text-[10px] border-t border-gray-300 pt-2">
                        <div className="flex justify-between">
                          <span>المجموع التأسيسي:</span>
                          <span className="font-mono">{subTotal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>الخصم الممنوح:</span>
                          <span className="font-mono">-{discountVal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الضريبة:</span>
                          <span className="font-mono">+{taxVal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between font-black text-xs border-t-2 border-gray-950 pt-2 mt-1">
                          <span>الإجمالي الصافي:</span>
                          <span className="font-sans font-black">{finalTotal.toLocaleString()} SDG</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-4 border-t border-dashed text-[8px] text-gray-400 leading-relaxed">
                      {footerNotes} • {phone} • {email}
                    </div>

                  </div>
                )}

              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 2: PORTFOLIO & PRESETS DOCUMENTS MANAGER */}
        {activeSubTab === 'documents' && (
          <motion.div
            key="documents-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            
            {/* Drag and drop zone simulator */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 py-10 text-center transition-all cursor-pointer ${
                dragActive 
                  ? 'border-[#0071e3] bg-[#0071e3]/5 scale-[0.99]' 
                  : 'border-[#d2d2d7] hover:border-gray-400 bg-white shadow-xs'
              }`}
            >
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-14 h-14 bg-blue-50 text-[#0071e3] rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#1d1d1f]">{lang === 'ar' ? 'سحب المرفقات وإفلات المستندات مباشرة' : 'Drag & Drop Operational Files'}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                    {lang === 'ar' 
                      ? 'يمكنك سحب عقود المبيعات، صور الختام الرقمي، فواتير إكسيل المسبقة، أو ملفات الشروط والضمان وإسقاطها فوراً لتحميلها للأرشيف' 
                      : 'Drop contract PDFs, Excel ledger presets, or warranty agreements directly here to archive'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold rounded-xl transition shadow-xs"
                  >
                    {lang === 'ar' ? 'تصفح الملفات يدوياً' : 'Browse Local Files'}
                  </button>
                  <span className="text-[10px] text-gray-400">{lang === 'ar' ? 'أو' : 'or'}</span>
                  <button
                    onClick={() => {
                      // preset mock generator
                      const sampleDocs: CustomDocument[] = [
                        { id: 'doc_1', title: 'البنود التجارية العامة وعقد الارتجاع والضمان.pdf', fileType: 'pdf', notes: 'العقد المطبوع الرسمي للارتجاع', fileSize: '1.2 MB', createdAt: Date.now() },
                        { id: 'doc_2', title: 'جدول الحسابات الختامي معتمد-إيرادات مبيعات الفروع.xlsx', fileType: 'xlsx', notes: 'توليد حسابات الفروع ربع السنوي', fileSize: '2.4 MB', createdAt: Date.now() - 3600000 },
                        { id: 'doc_3', title: 'الرخصة والشهادة الضريبية الموثقة للمؤسسة.jpeg', fileType: 'image', notes: 'صورة الرخصة المعتمدة للاستيراد', fileSize: '850 KB', createdAt: Date.now() - 7200000 }
                      ];
                      sampleDocs.forEach(d => onAddDocument(d));
                      addToast(lang === 'ar' ? 'تم توليد ٣ مستندات وأصول نموذجية للأرشيف' : 'Generated 3 sample business documents', 'success');
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-xl transition"
                  >
                    {lang === 'ar' ? 'توليد عينات نموذجية' : 'Inject Ready Blueprints'}
                  </button>
                </div>
              </div>
            </div>

            {/* DOCUMENTS GRID TABLE ARCHIVE LIST */}
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-xs space-y-4">
              
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900">{lang === 'ar' ? 'حافظة وأرشيف المستندات والوثائق المطبوعة' : 'Secured Digital Document Safe'}</h3>
                  <p className="text-[10px] text-[#6e6e73]">{lang === 'ar' ? 'تتبع وتحرير ملفات الختامة وعقود الضمان والملخصات اليدوية' : 'Manage corporate seals, customized warranty print drafts, and backup sheets'}</p>
                </div>
                
                <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {documents.length} {lang === 'ar' ? 'مستند محفوظ' : 'documents'}
                </span>
              </div>

              {documents.length === 0 ? (
                <div className="text-center py-16 text-gray-400 space-y-3">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-xs">{lang === 'ar' ? 'الأرشيف فارغ حالياً. اسحب أي ملفات أو انقر لتوليد أصولك الآن' : 'Your Document Vault is currently empty'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="border border-[#d2d2d7]/70 rounded-2xl p-4 hover:border-gray-300 bg-[#f5f5f7]/20 flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs bg-white">
                          {doc.fileType === 'pdf' ? (
                            <FileSignature className="w-5 h-5 text-red-500" />
                          ) : doc.fileType === 'xlsx' ? (
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                          ) : doc.fileType === 'image' ? (
                            <Palette className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-500" />
                          )}
                        </div>

                        <div className="space-y-0.5 truncate flex-1 text-right">
                          <h4 className="text-[11px] font-extrabold text-gray-900 truncate" title={doc.title}>{doc.title}</h4>
                          <span className="text-[9px] text-[#6e6e73] bg-gray-100 px-1.5 py-0.5 rounded font-mono font-bold block w-fit">
                            {doc.fileSize || 'Unknown Size'} • {doc.fileType.toUpperCase()}
                          </span>
                          {doc.notes && (
                            <p className="text-[9px] text-gray-400 truncate leading-relaxed mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 text-[10px]">
                        <span className="text-gray-400">
                          {new Date(doc.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              addToast(lang === 'ar' ? 'يجري محاكاة تنزيل الملف وضغطه على جهازك الآن...' : 'Simulating secure file compilation...', 'info');
                            }}
                            className="p-1 hover:bg-white border rounded text-gray-600 transition flex items-center gap-1"
                            title={lang === 'ar' ? 'تنزيل الملف' : 'Download asset'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الملف من الأرشيف نهائياً؟' : 'Confirm file elimination?')) {
                                onDeleteDocument(doc.id);
                                addToast(lang === 'ar' ? 'تم حذف الملف وسجل الضمان بنجاح' : 'Document deleted successfully', 'info');
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition"
                            title={lang === 'ar' ? 'حذف من الأرشيف' : 'Delete asset'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: MANUAL ADD DOCUMENT DIALOGUE */}
      <AnimatePresence>
        {isDocModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="px-6 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-gray-900">{lang === 'ar' ? 'إضافة وثيقة أو بند فاتورة يدوياً' : 'Register Official Document'}</h3>
                  <p className="text-[10px] text-gray-500">{lang === 'ar' ? 'أرفق ملفاً مسجلاً أو بند شروط لوغو معتمد' : 'Input meta parameters to archive file template'}</p>
                </div>
                <button
                  onClick={() => setIsDocModalOpen(false)}
                  className="p-1 hover:bg-gray-200 text-gray-400 rounded-full transition"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDocSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'اسم الوثيقة والملف الموصوف *' : 'Document Title *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ar' ? 'مثال: اتفاقية تحصيل بيع بالتقسيط' : 'e.g., Regional installment agreement'}
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'نوع الملف' : 'Asset Type'}</label>
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    >
                      <option value="pdf">PDF Reader (.pdf)</option>
                      <option value="xlsx">Excel Sheet (.xlsx)</option>
                      <option value="docx">Word Contract (.docx)</option>
                      <option value="image">Image Logo Stamp (.png/.jpg)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'أمان التشفير' : 'Security Level'}</label>
                    <div className="flex items-center gap-1.5 py-2.5 text-[10px] text-emerald-600 font-extrabold select-none">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lang === 'ar' ? 'مشفر عالي الأمان' : 'SSL Encrypted Safe'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'ملاحظات إضافية حول الاستخدام' : 'Operation Notes'}</label>
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'الاستخدام المحدد للورقة أو المستند...' : 'General remarks...'}
                    value={newDocNotes}
                    onChange={(e) => setNewDocNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsDocModalOpen(false)}
                    className="px-4 py-2 bg-[#f5f5f7] hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    {lang === 'ar' ? 'إلغـاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {lang === 'ar' ? 'إضافة للثيم' : 'Confirm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Compact SVG Icon helper to prevent import issue
interface XCircleIconProps extends React.SVGProps<SVGSVGElement> {}
const XCircleIcon: React.FC<XCircleIconProps> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);
