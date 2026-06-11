import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, Search, Trash2, Edit, FileSpreadsheet, Download, 
  Check, Settings, CreditCard, BarChart3, Package, 
  ShoppingCart, Store, X, Globe, RefreshCw, AlertTriangle, 
  Minus, Percent, Printer, TrendingUp, Info, Sun, Moon, Coins, ArrowLeftRight, ArrowLeft,
  ShieldAlert, ClipboardCheck, CheckCircle2, Users, Wallet, Landmark,
  Laptop, PlusSquare, History, LogOut, Lock, UserCheck, Key, UploadCloud, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

import { 
  Product, Invoice, InvoiceItem, InstallmentPayment, StoreSettings, ToastMessage, Expense, 
  ChinaTransfer, InventoryAudit, Customer, Warehouse, StockTransfer, PriceList,
  Supplier, PurchaseRequest, PurchaseRFQ, PurchaseOrder, PurchaseInvoice,
  PurchaseReturn, DebitNote, SupplierPayment, PurchaseSettings,
  CashSafe, BankAccount, FinanceTransaction, FinanceSettings, Branch,
  InvoiceTemplateConfig, CustomDocument, POSTerminal, POSSession, SystemUser, SaasSettings
} from './types';
import { getTranslation, LanguageCode } from './translations';
import ExcelImportModal from './components/ExcelImportModal';
import FinanceTab from './components/FinanceTab';
import PurchasesTab from './components/PurchasesTab';
import CustomersTab from './components/CustomersTab';
import InventoryManager from './components/InventoryManager';
import ReportsTab from './components/ReportsTab';
import BranchesManager from './components/BranchesManager';
import InvoiceTemplatesTab from './components/InvoiceTemplatesTab';
import PosManager from './components/PosManager';
import SaasAdmin from './components/SaasAdmin';
import SaasPlansScreen from './components/SaasPlansScreen';
import SaasPasswordResetModal from './components/SaasPasswordResetModal';
import HowToUseTab from './components/HowToUseTab';
import InventoryAuditTab from './components/InventoryAuditTab';
import p2pLogo from './p2p_logo.jpg';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "",
  currency: "SDG",
  taxRate: 15,
  isTaxEnabled: false,
  lowStockThreshold: 10,
  storeTagline: ""
};

const DEFAULT_TEMPLATE_CONFIG: InvoiceTemplateConfig = {
  id: 'primary_template',
  layout: 'a4-modern',
  companyName: 'مؤسسة النبلاء للاستيراد والبيع المتعدد',
  logoUrl: '',
  phone: '0123456789',
  email: 'nobles.trade@gmail.com',
  address: 'الخرطوم - السوق المحلي، مربع ٤',
  taxNumber: '٣١٠١٥٨٩٤٢',
  commercialRegister: '١٢٢٩٤-س',
  headerNotes: 'الموزع المعتمد لبيع قطع الغيار والحلول التقنية المتطورة',
  footerNotes: 'شكراً لتعاملكم معنا! نسعد بخدمتكم في أي وقت.',
  primaryColor: '#0071e3',
  showLogo: true,
  showQrCode: true,
  showBranchInfo: true,
  termsAndConditions: '١. البضاعة المباعة لا تسترد بعد مرور ٣ أيام.\n٢. يجب إرفاق الفاتورة الأصلية عند طلب الاستبدال.\n٣. الضمان يشمل الكسر المصنعي للقطع الكهربائية.',
  authorizedSignatureName: 'المهندس / أحمد مصطفى',
  sealImageUrl: 'https://i.imgur.com/vH3gGzT.png',
  watermarkText: 'مؤسسة النبلاء الأصلية'
};


const DEFAULT_PURCHASE_SETTINGS: PurchaseSettings = {
  defaultTaxRate: 15,
  isTaxEnabled: false,
  paymentTerms: "COD"
};

const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  expenseCategories: ['رواتب', 'إيجار', 'كهرباء ومياه', 'مصاريف تشغيلية', 'نثريات', 'أخرى'],
  defaultSourceType: 'other'
};

export function formatProductStock(qty: number, piecesPerCarton: number, lang: 'ar' | 'en') {
  if (!piecesPerCarton || piecesPerCarton <= 1) {
    return lang === 'ar' ? `${qty} حبة` : `${qty} Pcs`;
  }
  const fullCartons = Math.floor(qty / piecesPerCarton);
  const remPieces = qty % piecesPerCarton;
  
  if (fullCartons === 0) {
    return lang === 'ar' ? `كرتونة ناقصة (بها ${remPieces} حبة متبقية)` : `Incomplete carton (${remPieces} Pcs left)`;
  }
  if (remPieces === 0) {
    return lang === 'ar' ? `${fullCartons} كرتون كامل` : `${fullCartons} Full Cartons`;
  }
  return lang === 'ar' 
    ? `${fullCartons} كرتون كامل + كرتونة ناقصة (بها ${remPieces} حبة)` 
    : `${fullCartons} Full + Incomplete (${remPieces} Pcs)`;
}

// Tafqeet Helper
export function tafqeetArabic(num: number): string {
  const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
  const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
  const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
  
  if (num === 0) return "صفر";
  const floored = Math.floor(num);
  let result = "";
  
  let workingNum = floored;
  if (workingNum >= 1000000) {
    const millions = Math.floor(workingNum / 1000000);
    result += (millions === 1 ? "مليون" : millions === 2 ? "مليونان" : units[millions] + " ملايين") + " ";
    workingNum %= 1000000;
  }
  
  if (workingNum >= 1000) {
    if (result !== "") result += "و ";
    const thousands = Math.floor(workingNum / 1000);
    result += (thousands === 1 ? "ألف" : thousands === 2 ? "ألفان" : units[thousands] + " آلاف") + " ";
    workingNum %= 1000;
  }
  
  if (workingNum >= 100) {
    if (result !== "") result += "و ";
    const hunds = Math.floor(workingNum / 100);
    result += hundreds[hunds] + " ";
    workingNum %= 100;
  }
  
  if (workingNum > 0) {
    if (result !== "") result += "و ";
    if (workingNum < 10) {
      result += units[workingNum];
    } else if (workingNum < 20) {
      if (workingNum === 10) result += "عشرة";
      else if (workingNum === 11) result += "أحد عشر";
      else if (workingNum === 12) result += "اثنا عشر";
      else result += units[workingNum - 10] + " عشر";
    } else {
      const u = workingNum % 10;
      const t = Math.floor(workingNum / 10);
      if (u > 0) {
        result += units[u] + " و " + tens[t];
      } else {
        result += tens[t];
      }
    }
  }
  return result.trim();
}

interface PrintInvoiceContentProps {
  layout: 'thermal' | 'a4-modern' | 'a4-classic';
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  settings: StoreSettings;
  branches: Branch[];
  lang: 'ar' | 'en';
}

export function PrintInvoiceContent({ layout, invoice, config, settings, branches, lang }: PrintInvoiceContentProps) {
  const activeBranch = branches.find(b => b.id === invoice.branchId) || branches.find(b => b.isHeadquarters) || {
    name: 'المقر الرئيسي',
    address: 'السودان',
    phone: ''
  };

  const primaryColor = config.primaryColor || '#0071e3';

  // 1. THERMAL THERMAL PAPER LAYOUT (80mm) //
  if (layout === 'thermal') {
    return (
      <div className="w-full max-w-[320px] mx-auto text-right p-1 text-black font-mono text-[11px] leading-tight space-y-4" dir="rtl">
        <div className="text-center space-y-1 pb-2 border-b border-dashed border-gray-300">
          {config.showLogo ? (
            <img src={config.logoUrl || p2pLogo} className="w-24 h-24 mx-auto object-contain mb-1" alt="Logo" referrerPolicy="no-referrer" />
          ) : null}
          <h2 className="text-sm font-black">{config.companyName || settings.storeName}</h2>
          {config.headerNotes && <p className="text-[9px] text-gray-600">{config.headerNotes}</p>}
          <p className="text-[9px] text-gray-500 font-bold">نسخة العميل المعتمدة</p>
          <p className="text-[9px] font-mono" dir="ltr">No: {invoice.invoiceNumber}</p>
        </div>

        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>التاريخ والوقت:</span>
            <span className="font-mono">{new Date(invoice.createdAt).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
          </div>

          <div className="flex justify-between">
            <span>طريقة الدفع:</span>
            <span className="font-bold">
              {invoice.paymentMethod === 'cash' ? 'نقدي' : invoice.paymentMethod === 'transfer' ? 'تحويل بنكي' : 'شيك مصرفي'}
            </span>
          </div>

          {config.showBranchInfo && (
            <div className="flex justify-between text-gray-600">
              <span>الفرع:</span>
              <span className="font-medium">{activeBranch.name}</span>
            </div>
          )}

          {invoice.customerName && (
            <div className="flex justify-between border-t border-dashed border-gray-200 pt-1 mt-1 font-bold">
              <span>العميل:</span>
              <span>{invoice.customerName}</span>
            </div>
          )}

          {invoice.transactionNumber && invoice.printTransactionNumber && (
            <div className="flex justify-between font-mono bg-gray-50 p-1 rounded mt-1">
              <span>رقم العملية:</span>
              <span>{invoice.transactionNumber}</span>
            </div>
          )}
        </div>

        {/* Goods listing table */}
        <div className="border-t border-b border-dashed border-gray-300 py-1">
          <table className="w-full text-[10px] text-right">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-1">الصنف</th>
                <th className="text-center pb-1">الكمية</th>
                <th className="text-left pb-1">المجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-gray-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1">
                    <span className="font-bold block text-black">{lang === 'ar' ? item.name_ar : item.name_en}</span>
                    <span className="text-[9px] text-gray-500">{item.price.toLocaleString()} {settings.currency}</span>
                  </td>
                  <td className="py-1 text-center font-mono">{item.qty} حبة</td>
                  <td className="py-1 text-left font-mono font-bold">{(item.subtotal).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculations */}
        <div className="space-y-1 text-[10px] pt-1">
          <div className="flex justify-between text-gray-700">
            <span>المجموع الفرعي:</span>
            <span className="font-mono">{invoice.items.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()}</span>
          </div>
          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>الخصم المباشر:</span>
              <span className="font-mono">-{invoice.discountAmount.toLocaleString()}</span>
            </div>
          )}
          {invoice.taxAmount > 0 && (
            <div className="flex justify-between text-gray-700">
              <span>ضريبة ({invoice.taxRate ?? settings.taxRate}%):</span>
              <span className="font-mono">+{invoice.taxAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-xs border-t border-dashed border-gray-300 pt-1 text-black">
            <span>الإجمالي النهائي:</span>
            <span className="font-mono">{invoice.total.toLocaleString()} {settings.currency}</span>
          </div>

          {!invoice.isInstallment && invoice.paymentMethod === 'cash' && (
            <div className="text-[9px] text-gray-500 border-t border-dashed border-gray-200 pt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>المستلم نقداً:</span>
                <span className="font-mono">{invoice.amountReceived?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-dashed border-gray-100 mt-0.5 pt-0.5">
                <span>المسترجع للعميل:</span>
                <span className="font-mono">{invoice.amountChange?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {invoice.isInstallment && (
          <div className="border border-black p-2 rounded-lg bg-gray-50 space-y-1 text-[9px]">
            <div className="font-bold text-center border-b border-black pb-0.5 text-black">جدولة التقسيط المعتمدة</div>
            <div className="flex justify-between">
              <span>المدفوع مقدماً:</span>
              <span>{invoice.amountReceived?.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="flex justify-between font-bold text-red-700">
              <span>الباقي ائتمان:</span>
              <span>{invoice.amountRemaining?.toLocaleString()} {settings.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>تاريخ الاستحقاق:</span>
              <span>{invoice.installmentDate}</span>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-dashed border-gray-300 space-y-1">
          <p className="font-extrabold text-[10px] text-black">{config.footerNotes || 'نشكر لكم زيارتكم الكريمة!'}</p>
          {config.showQrCode && (
            <div className="py-2 flex justify-center">
              {/* Responsive clean native QR visual pattern */}
              <div className="w-20 h-20 bg-white border border-gray-300 p-1 rounded-sm grid grid-cols-4 gap-0.5 opacity-85">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`w-full h-full ${((i * i + 3) % 5 === 0 || (i + 1) % 3 === 0) ? 'bg-black' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          )}
          {config.taxNumber && <p className="text-[8px] text-gray-500">الرقم الضريبي الموحد: {config.taxNumber}</p>}
          <p className="text-[7px] text-gray-400 font-mono">طبع عبر نظام جيل النيل لإدارة الأنشطة</p>
        </div>
      </div>
    );
  }

  // 2. LARGE A4 CORPORATE DESIGN //
  const isModern = layout === 'a4-modern';
  
  return (
    <div 
      className={`w-full mx-auto text-right p-8 relative selection:bg-brand font-sans min-h-[1050px] flex flex-col justify-between ${
        isModern ? 'bg-white text-gray-800' : 'bg-white text-slate-900 border-[10px] border-double border-slate-300'
      }`} 
      dir="rtl"
    >
      {/* Background Watermark */}
      {config.watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <span className="text-[7vw] font-black text-gray-900/[0.03] uppercase tracking-widest -rotate-30 select-none whitespace-nowrap">
            {config.watermarkText}
          </span>
        </div>
      )}

      <div className="z-10 relative space-y-6">
        
        {/* TOP COMPONENT HEADER BLOCK */}
        <div className="flex justify-between items-start border-b pb-6 border-gray-200">
          <div className="space-y-2">
            {config.showLogo ? (
              <img src={config.logoUrl || p2pLogo} className="h-24 w-auto object-contain max-w-[250px] mb-2" alt="Company Logo" referrerPolicy="no-referrer" />
            ) : (
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {(config.companyName || settings.storeName).substring(0, 1)}
              </div>
            )}
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{config.companyName || settings.storeName}</h1>
            {config.headerNotes && <p className="text-xs text-gray-500 max-w-sm leading-relaxed">{config.headerNotes}</p>}
          </div>

          <div className="text-left space-y-1.5 font-mono text-[11px] text-gray-500">
            <div className="text-lg font-black tracking-tight" style={{ color: primaryColor }}>
              {invoice.isInstallment ? 'فاتورة بيع بالتقسيط' : 'فاتورة ضريبة مبسطة'}
            </div>
            <div>رقم المستند: <span className="font-bold text-gray-900 text-xs">{invoice.invoiceNumber}</span></div>
            <div>التاريخ: <span className="text-gray-900 font-bold">{new Date(invoice.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span></div>
            {config.taxNumber && <div>الرقم الضريبي VAT: <span className="text-gray-900 font-bold">{config.taxNumber}</span></div>}
            {config.commercialRegister && <div>السجل التجاري C.R: <span className="text-gray-900 font-bold">{config.commercialRegister}</span></div>}
          </div>
        </div>

        {/* METADATA CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 rounded-[16px] bg-gray-50 border border-gray-200/60 text-xs space-y-2.5">
            <h3 className="font-black text-gray-905 tracking-tight text-xs border-b pb-1.5 flex items-center gap-1.5" style={{ color: primaryColor }}>
              <span>معلومات سداد الفاتورة</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>طريقة الدفع:</div>
              <div className="font-bold text-gray-950">
                {invoice.paymentMethod === 'cash' ? 'نقدي (Cash)' : invoice.paymentMethod === 'transfer' ? 'بنكك / تحويل مالي' : 'شيك بنكي'}
              </div>

              <div>الفرع المصدّر:</div>
              <div className="font-bold text-gray-950">{activeBranch.name}</div>

              {invoice.transactionNumber && invoice.printTransactionNumber && (
                <>
                  <div>رقم العملية/التحويل:</div>
                  <span className="font-bold text-gray-900 font-mono">{invoice.transactionNumber}</span>
                </>
              )}

              {config.phone && (
                <>
                  <div>تليفون المؤسسة:</div>
                  <span className="font-mono text-gray-950 font-bold">{config.phone}</span>
                </>
              )}
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-gray-50 border border-gray-200/60 text-xs space-y-2.5">
            <h3 className="font-black text-gray-905 tracking-tight text-xs border-b pb-1.5 flex items-center gap-1.5" style={{ color: primaryColor }}>
              <span>بيانات العميل المستلم (Billed To)</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-gray-600">
              <div>اسم العميل الكريم:</div>
              <div className="font-bold text-gray-950">{invoice.customerName || 'عميل نقدي مبيعات عابر'}</div>

              {config.email && (
                <>
                  <div>البريد الإلكتروني:</div>
                  <div className="font-bold text-gray-950 font-mono">{config.email}</div>
                </>
              )}

              {config.address && (
                <>
                  <div>عنوان المؤسسة:</div>
                  <div className="font-bold text-gray-950">{config.address}</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* GRAND A4 TABULAR ROW DISPLAY */}
        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="text-white font-bold" style={{ backgroundColor: primaryColor }}>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3">اسم الصنف البرمجي ووصفه الدقيق</th>
                <th className="p-3 text-center">الكمية المسلمة</th>
                <th className="p-3 text-left">سعر الوحدة</th>
                <th className="p-3 text-left">المجموع الصافي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, id) => (
                <tr key={id} className={id % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-3 text-center text-gray-400 font-mono">{id + 1}</td>
                  <td className="p-3 font-semibold text-gray-900">
                    {lang === 'ar' ? item.name_ar : item.name_en}
                    {item.saleUnit && (
                      <span className="mr-2 text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {item.saleUnit === 'carton' ? 'بيع بالكرتونة' : 'بيع بالحبة'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-gray-950">{item.qty} حبة</td>
                  <td className="p-3 text-left font-mono">{(item.price).toLocaleString()}</td>
                  <td className="p-3 text-left font-mono font-bold text-gray-950">{(item.subtotal).toLocaleString()} SDG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MATH CALCULATION SHAPESHIFTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Terms & Seals Box on the Left */}
          <div className="space-y-4">
            {config.termsAndConditions && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/50 space-y-1">
                <span className="font-bold text-[10px] text-gray-500 block uppercase tracking-wider">الشروط والأحكام الخاصة بالمؤسسة:</span>
                <p className="text-[9px] text-gray-650 whitespace-pre-line leading-relaxed">{config.termsAndConditions}</p>
              </div>
            )}

            {invoice.isInstallment && (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 space-y-2 text-xs">
                <div className="font-bold text-rose-900 border-b border-rose-100 pb-1">مخطط وجدول الاستحقاقات والتقسيط المالي:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-rose-800">
                  <div>الدفعة الأولى المستلمة:</div>
                  <div className="font-bold font-mono text-left">{invoice.amountReceived?.toLocaleString()} SDG</div>
                  <div>المبلغ المتبقي ائتمان:</div>
                  <div className="font-bold font-mono text-left">{invoice.amountRemaining?.toLocaleString()} SDG</div>
                  <div>تاريخ استحقاق كامل القسط:</div>
                  <div className="font-bold text-left">{invoice.installmentDate}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sums Calculation Box on the Right */}
          <div className="p-5 rounded-[20px] border border-gray-200/80 bg-gray-50 text-xs space-y-3 font-mono">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الكلي للمبيعات الفرعية:</span>
              <span>{invoice.items.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString()} SDG</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-red-650 font-bold">
                <span>الخصم المسموح به:</span>
                <span>-{invoice.discountAmount.toLocaleString()} SDG</span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>ضريبة القيمة المضافة ({invoice.taxRate ?? settings.taxRate}%):</span>
                <span>+{invoice.taxAmount.toLocaleString()} SDG</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm border-t border-gray-200 pt-3 text-gray-950">
              <span className="font-sans">الإجمالي المطلوب سداده:</span>
              <span className="text-lg font-bold" style={{ color: primaryColor }}>{invoice.total.toLocaleString()} SDG</span>
            </div>

            {/* In Words Tafqeet Display */}
            <div className="text-[10px] bg-white border border-gray-100 p-2.5 rounded-lg text-emerald-800 font-sans font-bold leading-normal text-center select-all cursor-copy">
              <span>فقط وقدره: </span>
              <span>{tafqeetArabic(invoice.total)}</span>
              <span> جنيه سوداني لا غير</span>
            </div>
          </div>
        </div>

        {/* AUTH SIGNATURES AND OFFICIAL SEAL STAMP AT THE ABSOLUTE BOTTOM */}
        <div className="flex justify-between items-center pt-10 border-t border-gray-200">
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500">اسم المندوب المفوّض بالإدارة:</p>
            <p className="text-xs font-black text-gray-900 border-b border-dashed border-gray-400 pb-1 min-w-[150px] text-center">
              {config.authorizedSignatureName || 'المهندس / المدير العام'}
            </p>
          </div>

          {config.sealImageUrl && (
            <div className="relative select-none pointer-events-none w-24 h-24 flex items-center justify-center">
              <img 
                src={config.sealImageUrl} 
                className="w-full h-full object-contain absolute opacity-80" 
                alt="Official Seal Stamp" 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] font-black tracking-widest text-[#0071e3]/20 border border-[#0071e3]/20 rounded-full p-2.5 uppercase select-none">
                موقّع ومختوم
              </span>
            </div>
          )}

          <div className="text-left">
            <p className="text-[10px] text-gray-400">توقيع المستلم للسلع البضاعة:</p>
            <div className="h-10 w-32 border-b border-dashed border-gray-400" />
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="z-10 relative pt-8 border-t border-gray-100 text-center space-y-1 text-gray-400 text-[10px] leading-relaxed">
        <p className="font-bold text-gray-550 text-xs">
          {config.footerNotes || 'شكراً جزيلاً لتعاملكم معنا! نتطلع لخدمتكم مرة أخرى.'}
        </p>
        <p className="font-mono text-[9px] text-gray-450">
          طبع عبر النظام المحاسبي المتكامل لشركة جيل النيل للحلول الرقمية • www.nilesoft.sd
        </p>
      </div>
    </div>
  );
}

export default function App() {

  // --- Core Persistent State ---
  const [lang, setLang] = useState<LanguageCode>('ar');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sudan_dark_mode') === 'true';
  });
  const [currentTab, setCurrentTab] = useState<'pos' | 'sales' | 'inventory' | 'expenses' | 'china' | 'reports' | 'settings' | 'customers' | 'branches' | 'templates' | 'saas_admin' | 'guide'>('pos');
  const [showGuestPlans, setShowGuestPlans] = useState<boolean>(false);
  const [showDemoAccountsInfo, setShowDemoAccountsInfo] = useState<boolean>(false);
  const [saasSettings, setSaasSettings] = useState<SaasSettings>({
    monthlyPrice: 15000,
    annualPrice: 120000,
    currency: 'SDG',
    whatsAppNumber: '+249997444409',
    featuresList: [
      "إصدار عدد غير محدود من فواتير المبيعات ونقاط البيع",
      "إدارة المخزون وتفاصيل العجز والعهد والتحويلات",
      "التحويلات والحسابات وحركية الصين المتكاملة والأرباح والديون",
      "الإدارة المالية وحركة الخزائن وصناديق الحساب والعملاء الموردين",
      "التقارير السحابية الفورية ومراقبة تسويات الورديات والمحاسبة"
    ]
  });
  
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('sudan_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const isSubscriberActive = useMemo(() => {
    if (!currentUser) return false;
    
    // SuperAdmin / SaaS owner main emails get lifetime access
    const emailLower = currentUser.email.trim().toLowerCase();
    if (emailLower === 'hisham.yo005@gmail.com') {
      return true;
    }
    
    // Check if explicitly inactive
    if (currentUser.subscriptionStatus === 'inactive') {
      return false;
    }
    
    // Check if expired
    if (currentUser.subscriptionStatus === 'expired') {
      return false;
    }
    
    if (currentUser.subscriptionExpiry && currentUser.subscriptionExpiry < Date.now()) {
      return false;
    }
    
    // By default, if some accounts are already created in the system and don't have subscription settings, let's treat them active so they aren't mysteriously locked out of their old accounts, but newly made accounts will use subscription fields
    return true;
  }, [currentUser]);

  const [inventorySubTab, setInventorySubTab] = useState<'list' | 'audit' | 'advanced'>('list');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [sales, setSales] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [chinaTransfers, setChinaTransfers] = useState<ChinaTransfer[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  
  // --- Invoice Templates & Documents States ---
  const [templateConfig, setTemplateConfig] = useState<InvoiceTemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [documents, setDocuments] = useState<CustomDocument[]>([]);

  // --- Purchases & Supply Chain States ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [rfqs, setRfqs] = useState<PurchaseRFQ[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [purchaseSettings, setPurchaseSettings] = useState<PurchaseSettings>(DEFAULT_PURCHASE_SETTINGS);
  
  // --- Finance States ---
  const [safes, setSafes] = useState<CashSafe[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [financeTransactions, setFinanceTransactions] = useState<FinanceTransaction[]>([]);
  const [financeSettings, setFinanceSettings] = useState<FinanceSettings>(DEFAULT_FINANCE_SETTINGS);

  // --- Branch States ---
  const [branches, setBranches] = useState<Branch[]>([]);

  // --- POS Terminals, Sessions & Controls ---
  const [terminals, setTerminals] = useState<POSTerminal[]>([]);
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [posSubTab, setPosSubTab] = useState<'checkout' | 'sessions' | 'terminals' | 'reports'>('checkout');

  // Open POS Session Form Modal states
  const [isOpeningSessionModalOpen, setIsOpeningSessionModalOpen] = useState(false);
  const [selectedTerminalForSession, setSelectedTerminalForSession] = useState<string>('');
  const [sessionCashierName, setSessionCashierName] = useState<string>('');
  const [sessionOpeningBalance, setSessionOpeningBalance] = useState<string>('0');
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Close POS Session Form Modal states
  const [isClosingSessionModalOpen, setIsClosingSessionModalOpen] = useState(false);
  const [closingSessionId, setClosingSessionId] = useState<string>('');
  const [sessionActualClosingBalance, setSessionActualClosingBalance] = useState<string>('0');
  const [sessionClosingNotes, setSessionClosingNotes] = useState<string>('');

  // POS Terminal list form modal state
  const [isAddTerminalModalOpen, setIsAddTerminalModalOpen] = useState(false);
  const [newTerminalName, setNewTerminalName] = useState('');
  const [newTerminalCode, setNewTerminalCode] = useState('');
  const [newTerminalBranchId, setNewTerminalBranchId] = useState('');

  
  // --- Local Transaction State ---
  const [cart, setCart] = useState<{ product: Product; qty: number; saleUnit: 'piece' | 'carton'; customPrice?: number }[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountInput, setDiscountInput] = useState<number>(0);

  // --- Search / Filters ---
  const [inventorySearch, setInventorySearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventorySortField, setInventorySortField] = useState<keyof Product>('name_ar');
  const [inventorySortAsc, setInventorySortAsc] = useState(true);

  // --- Interactive Modals Triggering ---
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printLayout, setPrintLayout] = useState<'thermal' | 'a4-modern' | 'a4-classic'>('thermal');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (isPrintModalOpen && templateConfig.layout) {
      setPrintLayout(templateConfig.layout as any || 'thermal');
    }
  }, [isPrintModalOpen, templateConfig.layout]);

  // --- Deletion Double Confirms ---
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // --- Checkout Processing Info ---
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check'>('cash');
  const [amountReceivedInput, setAmountReceivedInput] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [checkoutNotesInput, setCheckoutNotesInput] = useState<string>('');
  
  // Custom transaction number switches and inputs
  const [transactionNumberInput, setTransactionNumberInput] = useState<string>('');
  const [printTransactionNumber, setPrintTransactionNumber] = useState<boolean>(true);

  // Installments state
  const [isInstallment, setIsInstallment] = useState<boolean>(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [installmentDateInput, setInstallmentDateInput] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split('T')[0];
  });
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [selectedCheckoutBranchId, setSelectedCheckoutBranchId] = useState<string>('');

  const [installmentCountInput, setInstallmentCountInput] = useState<number>(3);
  const [installmentInterval, setInstallmentInterval] = useState<'monthly' | 'weekly' | 'biweekly' | 'custom'>('monthly');
  const [installmentsList, setInstallmentsList] = useState<InstallmentPayment[]>([]);

  // --- Purge Database Security Key ---
  const [purgeConfirmText, setPurgeConfirmText] = useState('');

  // --- Toast Manager State ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // --- Product Modal Form State ---
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formCategory, setFormCategory] = useState('أخرى');
  
  // new carton forms inputs
  const [formNumCartons, setFormNumCartons] = useState<number | ''>('');
  const [formPiecesPerCarton, setFormPiecesPerCarton] = useState<number | ''>('');
  const [formCartonPurchasePrice, setFormCartonPurchasePrice] = useState<number | ''>('');
  const [formCartonSellingPrice, setFormCartonSellingPrice] = useState<number | ''>('');
  const [formPieceSellingPrice, setFormPieceSellingPrice] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState('كرتون');

  // --- Inventory Audit Form State ---
  const [auditProductId, setAuditProductId] = useState('');
  const [auditCartons, setAuditCartons] = useState<number | ''>('');
  const [auditPieces, setAuditPieces] = useState<number | ''>('');
  const [auditNotes, setAuditNotes] = useState('');

  // --- Reports Ledger Date Filter ---
  const [reportStartDate, setReportStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return start.toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportPaymentFilter, setReportPaymentFilter] = useState('all');

  // --- Dedicated Sales Tab States ---
  const [salesSubTab, setSalesSubTab] = useState<'dashboard' | 'history' | 'installments'>('dashboard');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesStartDate, setSalesStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return start.toISOString().split('T')[0];
  });
  const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesPaymentFilter, setSalesPaymentFilter] = useState('all');
  const [salesInstallmentFilter, setSalesInstallmentFilter] = useState<'all' | 'fullyPaid' | 'outstanding'>('all');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [installmentPayAmountInput, setInstallmentPayAmountInput] = useState<string>('');

  // i18n helper
  const t = (key: string, params?: Record<string, any>) => getTranslation(lang, key, params);

  // --- Computed Physical Inventory Audit Selectors ---
  const selectedAuditProduct = useMemo(() => {
    return inventory.find(p => p.id === auditProductId);
  }, [inventory, auditProductId]);

  const actualCountedPieces = useMemo(() => {
    if (!selectedAuditProduct) return 0;
    const cartonsCount = Number(auditCartons) || 0;
    const piecesCount = Number(auditPieces) || 0;
    return selectedAuditProduct.piecesPerCarton > 1
      ? (cartonsCount * selectedAuditProduct.piecesPerCarton) + piecesCount
      : piecesCount;
  }, [selectedAuditProduct, auditCartons, auditPieces]);

  const discrepancyPcs = useMemo(() => {
    if (!selectedAuditProduct) return 0;
    return actualCountedPieces - selectedAuditProduct.quantity;
  }, [selectedAuditProduct, actualCountedPieces]);

  const discrepancyValueSDG = useMemo(() => {
    if (!selectedAuditProduct) return 0;
    return discrepancyPcs * (selectedAuditProduct.purchasePricePiece || 0);
  }, [selectedAuditProduct, discrepancyPcs]);

  const compressLogoImage = (base64Str: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Str || !base64Str.startsWith('data:image/')) {
        resolve(base64Str || '');
        return;
      }
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressed);
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  // --- Local Server Sync Helpers ---
  const fetchWithTenant = (url: string, options?: RequestInit) => {
    const tid = currentUser?.tenantId || '';
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = tid ? `${url}${separator}tenantId=${tid}` : url;
    return fetch(finalUrl, options);
  };

  const syncInventory = async (data: Product[]) => {
    try {
      await fetchWithTenant('/api/data/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory: data })
      });
    } catch (e) {
      console.error('Failed to sync inventory:', e);
    }
  };

  const syncSystemUsers = async (data: SystemUser[]) => {
    try {
      await fetchWithTenant('/api/data/systemUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemUsers: data })
      });
    } catch (e) {
      console.error('Failed to sync system users:', e);
    }
  };

  const saveSystemUsersToStorage = (updated: SystemUser[]) => {
    setSystemUsers(updated);
    localStorage.setItem('sudan_system_users', JSON.stringify(updated));
    syncSystemUsers(updated);
  };

  const syncSaasSettings = async (data: SaasSettings) => {
    try {
      await fetchWithTenant('/api/data/saasSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saasSettings: data })
      });
    } catch (e) {
      console.error('Failed to sync SaaS settings:', e);
    }
  };

  const saveSaasSettingsToStorage = (updated: SaasSettings) => {
    setSaasSettings(updated);
    localStorage.setItem('sudan_saas_settings', JSON.stringify(updated));
    syncSaasSettings(updated);
  };

  const syncSales = async (data: Invoice[]) => {
    try {
      await fetchWithTenant('/api/data/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sales: data })
      });
    } catch (e) {
      console.error('Failed to sync sales:', e);
    }
  };

  const syncExpenses = async (data: Expense[]) => {
    try {
      await fetchWithTenant('/api/data/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: data })
      });
    } catch (e) {
      console.error('Failed to sync expenses:', e);
    }
  };

  const syncChinaTransfers = async (data: ChinaTransfer[]) => {
    try {
      await fetchWithTenant('/api/data/chinaTransfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chinaTransfers: data })
      });
    } catch (e) {
      console.error('Failed to sync China transfers:', e);
    }
  };

  const syncSuppliers = async (data: Supplier[]) => {
    try {
      await fetchWithTenant('/api/data/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppliers: data })
      });
    } catch (e) {
      console.error('Failed to sync suppliers:', e);
    }
  };

  const syncPurchaseRequests = async (data: PurchaseRequest[]) => {
    try {
      await fetchWithTenant('/api/data/purchaseRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseRequests: data })
      });
    } catch (e) {
      console.error('Failed to sync purchase requests:', e);
    }
  };

  const syncRfqs = async (data: PurchaseRFQ[]) => {
    try {
      await fetchWithTenant('/api/data/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfqs: data })
      });
    } catch (e) {
      console.error('Failed to sync rfqs:', e);
    }
  };

  const syncPurchaseOrders = async (data: PurchaseOrder[]) => {
    try {
      await fetchWithTenant('/api/data/purchaseOrders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrders: data })
      });
    } catch (e) {
      console.error('Failed to sync purchase orders:', e);
    }
  };

  const syncPurchaseInvoices = async (data: PurchaseInvoice[]) => {
    try {
      await fetchWithTenant('/api/data/purchaseInvoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseInvoices: data })
      });
    } catch (e) {
      console.error('Failed to sync purchase invoices:', e);
    }
  };

  const syncPurchaseReturns = async (data: PurchaseReturn[]) => {
    try {
      await fetchWithTenant('/api/data/purchaseReturns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseReturns: data })
      });
    } catch (e) {
      console.error('Failed to sync purchase returns:', e);
    }
  };

  const syncDebitNotes = async (data: DebitNote[]) => {
    try {
      await fetchWithTenant('/api/data/debitNotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debitNotes: data })
      });
    } catch (e) {
      console.error('Failed to sync debit notes:', e);
    }
  };

  const syncSupplierPayments = async (data: SupplierPayment[]) => {
    try {
      await fetchWithTenant('/api/data/supplierPayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierPayments: data })
      });
    } catch (e) {
      console.error('Failed to sync supplier payments:', e);
    }
  };

  const syncPurchaseSettings = async (data: PurchaseSettings) => {
    try {
      await fetchWithTenant('/api/data/purchaseSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseSettings: data })
      });
    } catch (e) {
      console.error('Failed to sync purchase settings:', e);
    }
  };

  const syncSafes = async (data: CashSafe[]) => {
    try {
      await fetchWithTenant('/api/data/safes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safes: data })
      });
    } catch (e) {
      console.error('Failed to sync safes:', e);
    }
  };

  const syncBankAccounts = async (data: BankAccount[]) => {
    try {
      await fetchWithTenant('/api/data/bankAccounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccounts: data })
      });
    } catch (e) {
      console.error('Failed to sync bank accounts:', e);
    }
  };

  const syncFinanceTransactions = async (data: FinanceTransaction[]) => {
    try {
      await fetchWithTenant('/api/data/financeTransactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeTransactions: data })
      });
    } catch (e) {
      console.error('Failed to sync finance transactions:', e);
    }
  };

  const syncFinanceSettings = async (data: FinanceSettings) => {
    try {
      await fetchWithTenant('/api/data/financeSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeSettings: data })
      });
    } catch (e) {
      console.error('Failed to sync finance settings:', e);
    }
  };

  const syncSettings = async (data: StoreSettings) => {
    try {
      await fetchWithTenant('/api/data/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data })
      });
    } catch (e) {
      console.error('Failed to sync settings:', e);
    }
  };

  const syncCustomers = async (data: Customer[]) => {
    try {
      await fetchWithTenant('/api/data/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: data })
      });
    } catch (e) {
      console.error('Failed to sync customers:', e);
    }
  };

  const syncTerminals = async (data: POSTerminal[]) => {
    try {
      await fetchWithTenant('/api/data/posTerminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posTerminals: data })
      });
    } catch (e) {
      console.error('Failed to sync POS terminals:', e);
    }
  };

  const syncSessions = async (data: POSSession[]) => {
    try {
      await fetchWithTenant('/api/data/posSessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posSessions: data })
      });
    } catch (e) {
      console.error('Failed to sync POS sessions:', e);
    }
  };

  const syncWarehouses = async (data: Warehouse[]) => {
    try {
      await fetchWithTenant('/api/data/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouses: data })
      });
    } catch (e) {
      console.error('Failed to sync warehouses:', e);
    }
  };

  const syncStockTransfers = async (data: StockTransfer[]) => {
    try {
      await fetchWithTenant('/api/data/stockTransfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockTransfers: data })
      });
    } catch (e) {
      console.error('Failed to sync stock transfers:', e);
    }
  };

  const syncPriceLists = async (data: PriceList[]) => {
    try {
      await fetchWithTenant('/api/data/priceLists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceLists: data })
      });
    } catch (e) {
      console.error('Failed to sync price lists:', e);
    }
  };

  const syncBranches = async (data: Branch[]) => {
    try {
      await fetchWithTenant('/api/data/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branches: data })
      });
    } catch (e) {
      console.error('Failed to sync branches:', e);
    }
  };

  const syncTemplateConfig = async (data: InvoiceTemplateConfig) => {
    try {
      await fetchWithTenant('/api/data/invoiceTemplateSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceTemplateSettings: data })
      });
    } catch (e) {
      console.error('Failed to sync invoice templates:', e);
    }
  };

  const syncDocuments = async (data: CustomDocument[]) => {
    try {
      await fetchWithTenant('/api/data/customDocuments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDocuments: data })
      });
    } catch (e) {
      console.error('Failed to sync custom documents:', e);
    }
  };

  const handleUpdateTemplateConfig = (updated: InvoiceTemplateConfig) => {
    setTemplateConfig(updated);
    localStorage.setItem('sudan_invoice_template_settings', JSON.stringify(updated));
    syncTemplateConfig(updated);
  };

  const handleAddDocument = (newDoc: CustomDocument) => {
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem('sudan_custom_documents', JSON.stringify(updated));
    syncDocuments(updated);
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    localStorage.setItem('sudan_custom_documents', JSON.stringify(updated));
    syncDocuments(updated);
  };


  const handleAddBranch = (newBranch: Branch) => {
    let updated = [...branches, newBranch];
    if (newBranch.isHeadquarters) {
      updated = updated.map(b => b.id !== newBranch.id ? { ...b, isHeadquarters: false } : b);
    }
    setBranches(updated);
    localStorage.setItem('sudan_branches', JSON.stringify(updated));
    syncBranches(updated);
  };

  const handleUpdateBranch = (updatedBranch: Branch) => {
    let updated = branches.map(b => b.id === updatedBranch.id ? updatedBranch : b);
    if (updatedBranch.isHeadquarters) {
      updated = updated.map(b => b.id !== updatedBranch.id ? { ...b, isHeadquarters: false } : b);
    }
    setBranches(updated);
    localStorage.setItem('sudan_branches', JSON.stringify(updated));
    syncBranches(updated);
  };

  const handleDeleteBranch = (id: string) => {
    const updated = branches.filter(b => b.id !== id);
    setBranches(updated);
    localStorage.setItem('sudan_branches', JSON.stringify(updated));
    syncBranches(updated);
  };

  const saveInventoryToStorage = (updated: Product[]) => {
    setInventory(updated);
    localStorage.setItem('sudan_inventory', JSON.stringify(updated));
    syncInventory(updated);
  };

  const saveCustomersToStorage = (updated: Customer[]) => {
    setCustomers(updated);
    localStorage.setItem('sudan_customers', JSON.stringify(updated));
    syncCustomers(updated);
  };

  const saveWarehousesToStorage = (updated: Warehouse[]) => {
    setWarehouses(updated);
    localStorage.setItem('sudan_warehouses', JSON.stringify(updated));
    syncWarehouses(updated);
  };

  const saveStockTransfersToStorage = (updated: StockTransfer[]) => {
    setStockTransfers(updated);
    localStorage.setItem('sudan_stock_transfers', JSON.stringify(updated));
    syncStockTransfers(updated);
  };

  const savePriceListsToStorage = (updated: PriceList[]) => {
    setPriceLists(updated);
    localStorage.setItem('sudan_price_lists', JSON.stringify(updated));
    syncPriceLists(updated);
  };

  const saveSalesToStorage = (updated: Invoice[]) => {
    setSales(updated);
    localStorage.setItem('sudan_sales', JSON.stringify(updated));
    syncSales(updated);
  };

  const saveTerminalsToStorage = (updated: POSTerminal[]) => {
    setTerminals(updated);
    localStorage.setItem('sudan_pos_terminals', JSON.stringify(updated));
    syncTerminals(updated);
  };

  const saveSessionsToStorage = (updated: POSSession[]) => {
    setSessions(updated);
    localStorage.setItem('sudan_pos_sessions', JSON.stringify(updated));
    syncSessions(updated);
  };

  const saveCurrentSessionIdToStorage = (id: string | null) => {
    setCurrentSessionId(id);
    if (id) {
      localStorage.setItem('sudan_pos_current_session_id', id);
    } else {
      localStorage.removeItem('sudan_pos_current_session_id');
    }
  };

  const saveExpensesToStorage = (updated: Expense[]) => {
    setExpenses(updated);
    localStorage.setItem('sudan_expenses', JSON.stringify(updated));
    syncExpenses(updated);
  };

  const saveChinaTransfersToStorage = (updated: ChinaTransfer[]) => {
    setChinaTransfers(updated);
    localStorage.setItem('sudan_china_transfers', JSON.stringify(updated));
    syncChinaTransfers(updated);
  };

  const saveSuppliersToStorage = (updated: Supplier[]) => {
    setSuppliers(updated);
    localStorage.setItem('sudan_suppliers', JSON.stringify(updated));
    syncSuppliers(updated);
  };

  const savePurchaseRequestsToStorage = (updated: PurchaseRequest[]) => {
    setPurchaseRequests(updated);
    localStorage.setItem('sudan_purchase_requests', JSON.stringify(updated));
    syncPurchaseRequests(updated);
  };

  const saveRfqsToStorage = (updated: PurchaseRFQ[]) => {
    setRfqs(updated);
    localStorage.setItem('sudan_rfqs', JSON.stringify(updated));
    syncRfqs(updated);
  };

  const savePurchaseOrdersToStorage = (updated: PurchaseOrder[]) => {
    setPurchaseOrders(updated);
    localStorage.setItem('sudan_purchase_orders', JSON.stringify(updated));
    syncPurchaseOrders(updated);
  };

  const savePurchaseInvoicesToStorage = (updated: PurchaseInvoice[]) => {
    setPurchaseInvoices(updated);
    localStorage.setItem('sudan_purchase_invoices', JSON.stringify(updated));
    syncPurchaseInvoices(updated);
  };

  const savePurchaseReturnsToStorage = (updated: PurchaseReturn[]) => {
    setPurchaseReturns(updated);
    localStorage.setItem('sudan_purchase_returns', JSON.stringify(updated));
    syncPurchaseReturns(updated);
  };

  const saveDebitNotesToStorage = (updated: DebitNote[]) => {
    setDebitNotes(updated);
    localStorage.setItem('sudan_debit_notes', JSON.stringify(updated));
    syncDebitNotes(updated);
  };

  const saveSupplierPaymentsToStorage = (updated: SupplierPayment[]) => {
    setSupplierPayments(updated);
    localStorage.setItem('sudan_supplier_payments', JSON.stringify(updated));
    syncSupplierPayments(updated);
  };

  const savePurchaseSettingsToStorage = (updated: PurchaseSettings) => {
    setPurchaseSettings(updated);
    localStorage.setItem('sudan_purchase_settings', JSON.stringify(updated));
    syncPurchaseSettings(updated);
  };

  const saveSafesToStorage = (updated: CashSafe[]) => {
    setSafes(updated);
    localStorage.setItem('sudan_safes', JSON.stringify(updated));
    syncSafes(updated);
  };

  const saveBankAccountsToStorage = (updated: BankAccount[]) => {
    setBankAccounts(updated);
    localStorage.setItem('sudan_bank_accounts', JSON.stringify(updated));
    syncBankAccounts(updated);
  };

  const saveFinanceTransactionsToStorage = (updated: FinanceTransaction[]) => {
    setFinanceTransactions(updated);
    localStorage.setItem('sudan_finance_transactions', JSON.stringify(updated));
    syncFinanceTransactions(updated);
  };

  const saveFinanceSettingsToStorage = (updated: FinanceSettings) => {
    setFinanceSettings(updated);
    localStorage.setItem('sudan_finance_settings', JSON.stringify(updated));
    syncFinanceSettings(updated);
  };

  const saveSettingsToStorage = (updated: StoreSettings) => {
    setSettings(updated);
    localStorage.setItem('sudan_settings', JSON.stringify(updated));
    syncSettings(updated);
  };

  const syncAudits = async (data: InventoryAudit[]) => {
    try {
      await fetchWithTenant('/api/data/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audits: data })
      });
    } catch (e) {
      console.error('Failed to sync audits:', e);
    }
  };

  const saveAuditsToStorage = (updated: InventoryAudit[]) => {
    setAudits(updated);
    localStorage.setItem('sudan_audits', JSON.stringify(updated));
    syncAudits(updated);
  };

  // --- Initial Mount Load Service ---
  useEffect(() => {
    const fetchEverything = async () => {
      let serverData: any = null;
      try {
        const res = await fetchWithTenant('/api/data');
        if (res.ok) {
          serverData = await res.json();
        }
      } catch (err) {
        console.warn('Backend data load skipped or offline:', err);
      }

      // 1. Inventory Sync
      let finalInventory: Product[] = [];
      if (serverData && serverData.inventory) {
        finalInventory = serverData.inventory;
      } else {
        const savedInventory = localStorage.getItem('sudan_inventory');
        if (savedInventory) {
          try {
            finalInventory = JSON.parse(savedInventory);
          } catch (e) {
            console.error(e);
          }
        }
        // If there's neither server nor localstorage, keep it blank for production!
      }
      setInventory(finalInventory);
      localStorage.setItem('sudan_inventory', JSON.stringify(finalInventory));

      // 2. Sales Sync
      let finalSales: Invoice[] = [];
      if (serverData && serverData.sales) {
        finalSales = serverData.sales;
      } else {
        const savedSales = localStorage.getItem('sudan_sales');
        if (savedSales) {
          try {
            finalSales = JSON.parse(savedSales);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setSales(finalSales);
      localStorage.setItem('sudan_sales', JSON.stringify(finalSales));

      // 3. Expenses Sync
      let finalExpenses: Expense[] = [];
      if (serverData && serverData.expenses) {
        finalExpenses = serverData.expenses;
      } else {
        const savedExpenses = localStorage.getItem('sudan_expenses');
        if (savedExpenses) {
          try {
            finalExpenses = JSON.parse(savedExpenses);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setExpenses(finalExpenses);
      localStorage.setItem('sudan_expenses', JSON.stringify(finalExpenses));

      // 4. China Transfers Sync
      let finalChinaTransfers: ChinaTransfer[] = [];
      if (serverData && serverData.chinaTransfers) {
        finalChinaTransfers = serverData.chinaTransfers;
      } else {
        const savedChinaTransfers = localStorage.getItem('sudan_china_transfers');
        if (savedChinaTransfers) {
          try {
            finalChinaTransfers = JSON.parse(savedChinaTransfers);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setChinaTransfers(finalChinaTransfers);
      localStorage.setItem('sudan_china_transfers', JSON.stringify(finalChinaTransfers));

      // 5. Settings Sync
      let finalSettings = DEFAULT_SETTINGS;
      if (serverData && serverData.settings) {
        finalSettings = serverData.settings;
      } else {
        const savedSettings = localStorage.getItem('sudan_settings');
        if (savedSettings) {
          try {
            finalSettings = JSON.parse(savedSettings);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setSettings(finalSettings);
      localStorage.setItem('sudan_settings', JSON.stringify(finalSettings));

      // 6. Audits Sync
      let finalAudits: InventoryAudit[] = [];
      if (serverData && serverData.audits) {
        finalAudits = serverData.audits;
      } else {
        const savedAudits = localStorage.getItem('sudan_audits');
        if (savedAudits) {
          try {
            finalAudits = JSON.parse(savedAudits);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setAudits(finalAudits);
      localStorage.setItem('sudan_audits', JSON.stringify(finalAudits));

      // 7. Customers Sync
      let finalCustomers: Customer[] = [];
      if (serverData && serverData.customers) {
        finalCustomers = serverData.customers;
      } else {
        const savedCustomers = localStorage.getItem('sudan_customers');
        if (savedCustomers) {
          try {
            finalCustomers = JSON.parse(savedCustomers);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setCustomers(finalCustomers);
      localStorage.setItem('sudan_customers', JSON.stringify(finalCustomers));

      // 8. Warehouses Sync
      let finalWarehouses: Warehouse[] = [];
      if (serverData && serverData.warehouses) {
        finalWarehouses = serverData.warehouses;
      } else {
        const savedWarehouses = localStorage.getItem('sudan_warehouses');
        if (savedWarehouses) {
          try {
            finalWarehouses = JSON.parse(savedWarehouses);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setWarehouses(finalWarehouses);
      localStorage.setItem('sudan_warehouses', JSON.stringify(finalWarehouses));

      // 9. Stock Transfers Sync
      let finalTransfers: StockTransfer[] = [];
      if (serverData && serverData.stockTransfers) {
        finalTransfers = serverData.stockTransfers;
      } else {
        const savedTransfers = localStorage.getItem('sudan_stock_transfers');
        if (savedTransfers) {
          try {
            finalTransfers = JSON.parse(savedTransfers);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setStockTransfers(finalTransfers);
      localStorage.setItem('sudan_stock_transfers', JSON.stringify(finalTransfers));

      // 10. Price Lists Sync
      let finalPriceLists: PriceList[] = [];
      if (serverData && serverData.priceLists) {
        finalPriceLists = serverData.priceLists;
      } else {
        const savedPriceLists = localStorage.getItem('sudan_price_lists');
        if (savedPriceLists) {
          try {
            finalPriceLists = JSON.parse(savedPriceLists);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setPriceLists(finalPriceLists);
      localStorage.setItem('sudan_price_lists', JSON.stringify(finalPriceLists));

      // 11. Suppliers Sync
      let finalSuppliers: Supplier[] = [];
      if (serverData && serverData.suppliers) {
        finalSuppliers = serverData.suppliers;
      } else {
        const savedSuppliers = localStorage.getItem('sudan_suppliers');
        if (savedSuppliers) {
          try { finalSuppliers = JSON.parse(savedSuppliers); } catch (e) { console.error(e); }
        }
      }
      setSuppliers(finalSuppliers);
      localStorage.setItem('sudan_suppliers', JSON.stringify(finalSuppliers));

      // 12. Purchase Requests Sync
      let finalRequests: PurchaseRequest[] = [];
      if (serverData && serverData.purchaseRequests) {
        finalRequests = serverData.purchaseRequests;
      } else {
        const savedRequests = localStorage.getItem('sudan_purchase_requests');
        if (savedRequests) {
          try { finalRequests = JSON.parse(savedRequests); } catch (e) { console.error(e); }
        }
      }
      setPurchaseRequests(finalRequests);
      localStorage.setItem('sudan_purchase_requests', JSON.stringify(finalRequests));

      // 13. RFQs Sync
      let finalRfqs: PurchaseRFQ[] = [];
      if (serverData && serverData.rfqs) {
        finalRfqs = serverData.rfqs;
      } else {
        const savedRfqs = localStorage.getItem('sudan_rfqs');
        if (savedRfqs) {
          try { finalRfqs = JSON.parse(savedRfqs); } catch (e) { console.error(e); }
        }
      }
      setRfqs(finalRfqs);
      localStorage.setItem('sudan_rfqs', JSON.stringify(finalRfqs));

      // 14. Purchase Orders Sync
      let finalOrders: PurchaseOrder[] = [];
      if (serverData && serverData.purchaseOrders) {
        finalOrders = serverData.purchaseOrders;
      } else {
        const savedOrders = localStorage.getItem('sudan_purchase_orders');
        if (savedOrders) {
          try { finalOrders = JSON.parse(savedOrders); } catch (e) { console.error(e); }
        }
      }
      setPurchaseOrders(finalOrders);
      localStorage.setItem('sudan_purchase_orders', JSON.stringify(finalOrders));

      // 15. Purchase Invoices Sync
      let finalInvoices: PurchaseInvoice[] = [];
      if (serverData && serverData.purchaseInvoices) {
        finalInvoices = serverData.purchaseInvoices;
      } else {
        const savedInvoices = localStorage.getItem('sudan_purchase_invoices');
        if (savedInvoices) {
          try { finalInvoices = JSON.parse(savedInvoices); } catch (e) { console.error(e); }
        }
      }
      setPurchaseInvoices(finalInvoices);
      localStorage.setItem('sudan_purchase_invoices', JSON.stringify(finalInvoices));

      // 16. Purchase Returns Sync
      let finalReturns: PurchaseReturn[] = [];
      if (serverData && serverData.purchaseReturns) {
        finalReturns = serverData.purchaseReturns;
      } else {
        const savedReturns = localStorage.getItem('sudan_purchase_returns');
        if (savedReturns) {
          try { finalReturns = JSON.parse(savedReturns); } catch (e) { console.error(e); }
        }
      }
      setPurchaseReturns(finalReturns);
      localStorage.setItem('sudan_purchase_returns', JSON.stringify(finalReturns));

      // 17. Debit Notes Sync
      let finalDebitNotes: DebitNote[] = [];
      if (serverData && serverData.debitNotes) {
        finalDebitNotes = serverData.debitNotes;
      } else {
        const savedDebitNotes = localStorage.getItem('sudan_debit_notes');
        if (savedDebitNotes) {
          try { finalDebitNotes = JSON.parse(savedDebitNotes); } catch (e) { console.error(e); }
        }
      }
      setDebitNotes(finalDebitNotes);
      localStorage.setItem('sudan_debit_notes', JSON.stringify(finalDebitNotes));

      // 18. Supplier Payments Sync
      let finalPayments: SupplierPayment[] = [];
      if (serverData && serverData.supplierPayments) {
        finalPayments = serverData.supplierPayments;
      } else {
        const savedPayments = localStorage.getItem('sudan_supplier_payments');
        if (savedPayments) {
          try { finalPayments = JSON.parse(savedPayments); } catch (e) { console.error(e); }
        }
      }
      setSupplierPayments(finalPayments);
      localStorage.setItem('sudan_supplier_payments', JSON.stringify(finalPayments));

      // 19. Purchase Settings Sync
      let finalPSettings = DEFAULT_PURCHASE_SETTINGS;
      if (serverData && serverData.purchaseSettings) {
        finalPSettings = serverData.purchaseSettings;
      } else {
        const savedPSettings = localStorage.getItem('sudan_purchase_settings');
        if (savedPSettings) {
          try { finalPSettings = JSON.parse(savedPSettings); } catch (e) { console.error(e); }
        }
      }
      setPurchaseSettings(finalPSettings);
      localStorage.setItem('sudan_purchase_settings', JSON.stringify(finalPSettings));

      // 20. Safes Sync
      let finalSafes: CashSafe[] = [];
      if (serverData && serverData.safes) {
        finalSafes = serverData.safes;
      } else {
        const savedSafes = localStorage.getItem('sudan_safes');
        if (savedSafes) {
          try { finalSafes = JSON.parse(savedSafes); } catch (e) { console.error(e); }
        }
      }
      setSafes(finalSafes);
      localStorage.setItem('sudan_safes', JSON.stringify(finalSafes));

      // 21. Bank Accounts Sync
      let finalBankAccounts: BankAccount[] = [];
      if (serverData && serverData.bankAccounts) {
        finalBankAccounts = serverData.bankAccounts;
      } else {
        const savedBankAccounts = localStorage.getItem('sudan_bank_accounts');
        if (savedBankAccounts) {
          try { finalBankAccounts = JSON.parse(savedBankAccounts); } catch (e) { console.error(e); }
        }
      }
      setBankAccounts(finalBankAccounts);
      localStorage.setItem('sudan_bank_accounts', JSON.stringify(finalBankAccounts));

      // 22. Finance Transactions Sync
      let finalFinanceTransactions: FinanceTransaction[] = [];
      if (serverData && serverData.financeTransactions) {
        finalFinanceTransactions = serverData.financeTransactions;
      } else {
        const savedFinanceTransactions = localStorage.getItem('sudan_finance_transactions');
        if (savedFinanceTransactions) {
          try { finalFinanceTransactions = JSON.parse(savedFinanceTransactions); } catch (e) { console.error(e); }
        }
      }
      setFinanceTransactions(finalFinanceTransactions);
      localStorage.setItem('sudan_finance_transactions', JSON.stringify(finalFinanceTransactions));

      // 23. Finance Settings Sync
      let finalFinanceSettings = DEFAULT_FINANCE_SETTINGS;
      if (serverData && serverData.financeSettings) {
        finalFinanceSettings = serverData.financeSettings;
      } else {
        const savedFinanceSettings = localStorage.getItem('sudan_finance_settings');
        if (savedFinanceSettings) {
          try { finalFinanceSettings = JSON.parse(savedFinanceSettings); } catch (e) { console.error(e); }
        }
      }
      setFinanceSettings(finalFinanceSettings);
      localStorage.setItem('sudan_finance_settings', JSON.stringify(finalFinanceSettings));

      // 24. Branches Sync
      let finalBranches: Branch[] = [];
      if (serverData && serverData.branches && serverData.branches.length > 0) {
        finalBranches = serverData.branches;
      } else {
        const savedBranches = localStorage.getItem('sudan_branches');
        if (savedBranches) {
          try {
            const parsed = JSON.parse(savedBranches);
            if (Array.isArray(parsed) && parsed.length > 0) {
              finalBranches = parsed;
            }
          } catch (e) { console.error(e); }
        }
      }
      if (finalBranches.length === 0) {
        finalBranches = [
          {
            id: 'branch_hq',
            name: 'المقر الرئيسي (الفرع الأساسي)',
            code: 'HQ-MAIN',
            city: 'الخرطوم',
            address: 'شارع الجمهورية',
            phone: '0123456789',
            manager: 'الإدارة العامة',
            status: 'active',
            isHeadquarters: true,
            createdAt: Date.now()
          }
        ];
      }
      setBranches(finalBranches);
      localStorage.setItem('sudan_branches', JSON.stringify(finalBranches));

      // 25. Invoice Templates Custom Settings Sync
      let finalTemplatesConfig = DEFAULT_TEMPLATE_CONFIG;
      if (serverData && serverData.invoiceTemplateSettings) {
        finalTemplatesConfig = serverData.invoiceTemplateSettings;
      } else {
        const savedTemplatesConfig = localStorage.getItem('sudan_invoice_template_settings');
        if (savedTemplatesConfig) {
          try {
            finalTemplatesConfig = JSON.parse(savedTemplatesConfig);
          } catch (e) { console.error(e); }
        }
      }
      setTemplateConfig(finalTemplatesConfig);
      localStorage.setItem('sudan_invoice_template_settings', JSON.stringify(finalTemplatesConfig));

      // 26. Custom Documents safe archive sync
      let finalDocuments: CustomDocument[] = [];
      if (serverData && serverData.customDocuments) {
        finalDocuments = serverData.customDocuments;
      } else {
        const savedDocs = localStorage.getItem('sudan_custom_documents');
        if (savedDocs) {
          try {
            finalDocuments = JSON.parse(savedDocs);
          } catch (e) { console.error(e); }
        }
      }
      setDocuments(finalDocuments);
      localStorage.setItem('sudan_custom_documents', JSON.stringify(finalDocuments));

      // 27. POS Terminals Loader & Default Seeding
      let finalTerminals: POSTerminal[] = [];
      if (serverData && serverData.posTerminals) {
        finalTerminals = serverData.posTerminals;
      } else {
        const savedTerminals = localStorage.getItem('sudan_pos_terminals');
        if (savedTerminals) {
          try {
            finalTerminals = JSON.parse(savedTerminals);
          } catch (e) { console.error(e); }
        }
      }
      if (finalTerminals.length === 0) {
        finalTerminals = [
          { id: 'term-1', name: 'نقطة بيع الصالة الرئيسية', code: 'POS-01', branchId: '', status: 'active', createdAt: Date.now() },
          { id: 'term-2', name: 'كاشير مبيعات التجزئة', code: 'POS-02', branchId: '', status: 'active', createdAt: Date.now() },
          { id: 'term-3', name: 'رصيف الشحن الخارجي', code: 'POS-03', branchId: '', status: 'active', createdAt: Date.now() }
        ];
      }
      setTerminals(finalTerminals);
      localStorage.setItem('sudan_pos_terminals', JSON.stringify(finalTerminals));

      // 28. POS Sessions Loader
      let finalSessions: POSSession[] = [];
      if (serverData && serverData.posSessions) {
        finalSessions = serverData.posSessions;
      } else {
        const savedSessions = localStorage.getItem('sudan_pos_sessions');
        if (savedSessions) {
          try {
            finalSessions = JSON.parse(savedSessions);
          } catch (e) { console.error(e); }
        }
      }
      setSessions(finalSessions);
      localStorage.setItem('sudan_pos_sessions', JSON.stringify(finalSessions));

      // 29. Active POS Session ID
      const savedActiveSessionId = localStorage.getItem('sudan_pos_current_session_id');
      setCurrentSessionId(savedActiveSessionId || null);

      // 30. System Users Sync
      let finalUsers: SystemUser[] = [];
      if (serverData && serverData.systemUsers) {
        finalUsers = serverData.systemUsers;
      } else {
        const savedUsers = localStorage.getItem('sudan_system_users');
        if (savedUsers) {
          try {
            finalUsers = JSON.parse(savedUsers);
          } catch (e) {
            console.error(e);
          }
        }
      }
      setSystemUsers(finalUsers);
      localStorage.setItem('sudan_system_users', JSON.stringify(finalUsers));

      // 31. SaaS Settings Sync
      if (serverData && serverData.saasSettings) {
        setSaasSettings(serverData.saasSettings);
        localStorage.setItem('sudan_saas_settings', JSON.stringify(serverData.saasSettings));
      } else {
        const savedSettings = localStorage.getItem('sudan_saas_settings');
        if (savedSettings) {
          try {
            setSaasSettings(JSON.parse(savedSettings));
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    fetchEverything();
  }, [currentUser?.tenantId]);

  // --- Dark Mode Toggler helper ---
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('sudan_dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Enforce cashier user is locked strictly to the POS tab and valid sub-tabs
  useEffect(() => {
    if (currentUser && currentUser.role === 'cashier') {
      if (currentTab !== 'pos') {
        setCurrentTab('pos');
      }
      if (posSubTab === 'terminals' || posSubTab === 'reports') {
        setPosSubTab('checkout');
      }
    }
  }, [currentUser, currentTab, posSubTab]);

  // Clean real-time auto detection of cashier's current open shift session
  useEffect(() => {
    if (currentUser && currentUser.role === 'cashier') {
      const activeSess = sessions.find(s => s.status === 'open' && s.cashierName === currentUser.name);
      if (activeSess) {
        if (currentSessionId !== activeSess.id) {
          setCurrentSessionId(activeSess.id);
          localStorage.setItem('sudan_pos_current_session_id', activeSess.id);
        }
      } else {
        if (currentSessionId !== null) {
          setCurrentSessionId(null);
          localStorage.removeItem('sudan_pos_current_session_id');
        }
      }
    }
  }, [currentUser, sessions, currentSessionId]);

  // --- Beautiful Toast Engine ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Inventory Form Modal Setups ---
  const openAddProductModal = () => {
    setEditingProduct(null);
    setFormNameAr('');
    setFormNameEn('');
    setFormCategory('أخرى');
    setFormNumCartons('');
    setFormPiecesPerCarton('');
    setFormCartonPurchasePrice('');
    setFormCartonSellingPrice('');
    setFormPieceSellingPrice('');
    setFormUnit('كرتون');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormNameAr(product.name_ar);
    setFormNameEn(product.name_en);
    setFormCategory(product.category);
    setFormNumCartons(product.numCartons || '');
    setFormPiecesPerCarton(product.piecesPerCarton || '');
    setFormCartonPurchasePrice(product.cartonPurchasePrice || '');
    setFormCartonSellingPrice(product.cartonSellingPrice || '');
    setFormPieceSellingPrice(product.price || '');
    setFormUnit(product.unit || 'كرتون');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNameAr.trim() && !formNameEn.trim()) {
      addToast(lang === 'ar' ? 'الرجاء إدخال اسم المنتج!' : 'Please enter product name!', 'error');
      return;
    }

    const cartons = Number(formNumCartons) || 0;
    const piecesPerCarton = Number(formPiecesPerCarton) || 1;
    const cartonPurchasePrice = Number(formCartonPurchasePrice) || 0;
    let cartonSellingPrice = Number(formCartonSellingPrice) || 0;
    let pieceSellingPrice = Number(formPieceSellingPrice) || 0;

    // Strict Fallback Auto Calculations before saving
    if (cartonSellingPrice > 0 && pieceSellingPrice === 0) {
      pieceSellingPrice = Math.round(cartonSellingPrice / piecesPerCarton);
    } else if (pieceSellingPrice > 0 && cartonSellingPrice === 0) {
      cartonSellingPrice = pieceSellingPrice * piecesPerCarton;
    }

    const totalPiecesInStock = cartons * piecesPerCarton;
    const calculatedPurchasePiece = piecesPerCarton > 0 ? (cartonPurchasePrice / piecesPerCarton) : 0;

    if (editingProduct) {
      // update
      const updated = inventory.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name_ar: formNameAr.trim() || formNameEn.trim(),
            name_en: formNameEn.trim() || formNameAr.trim(),
            category: formCategory,
            numCartons: cartons,
            piecesPerCarton: piecesPerCarton,
            cartonPurchasePrice: cartonPurchasePrice,
            cartonSellingPrice: cartonSellingPrice,
            purchasePricePiece: calculatedPurchasePiece,
            price: pieceSellingPrice,
            initialQuantity: totalPiecesInStock,
            quantity: totalPiecesInStock, // Recalculated for real-world usage setup
            unit: formUnit
          };
        }
        return p;
      });
      saveInventoryToStorage(updated);
      addToast(lang === 'ar' ? 'تم تعديل المنتج بنجاح' : 'Product updated successfully');
    } else {
      // add new
      const newProd: Product = {
        id: Math.random().toString(36).substring(2, 11),
        barcode: '',
        name_ar: formNameAr.trim() || formNameEn.trim(),
        name_en: formNameEn.trim() || formNameAr.trim(),
        category: formCategory,
        numCartons: cartons,
        piecesPerCarton: piecesPerCarton,
        cartonPurchasePrice: cartonPurchasePrice,
        cartonSellingPrice: cartonSellingPrice,
        purchasePricePiece: calculatedPurchasePiece,
        price: pieceSellingPrice,
        initialQuantity: totalPiecesInStock,
        quantity: totalPiecesInStock,
        unit: formUnit,
        createdAt: Date.now()
      };
      saveInventoryToStorage([newProd, ...inventory]);
      addToast(lang === 'ar' ? 'تمت إضافة المنتج الجديد' : 'New product added successfully');
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProductConfirm = (p: Product) => {
    setDeleteTarget(p);
  };

  const handleExposeDelete = () => {
    if (!deleteTarget) return;
    const updated = inventory.filter(p => p.id !== deleteTarget.id);
    saveInventoryToStorage(updated);
    setCart(prev => prev.filter(c => c.product.id !== deleteTarget.id));
    addToast(t('deleteSuccess'), 'success');
    setDeleteTarget(null);
  };

  const handleApplyAuditAdjustment = (p: Product, cartonsCount: number, piecesCount: number, notesText: string) => {
    const totalActualPieces = p.piecesPerCarton > 1 
      ? (cartonsCount * p.piecesPerCarton) + piecesCount 
      : piecesCount;
      
    const diffPcs = totalActualPieces - p.quantity;
    const diffValue = diffPcs * (p.purchasePricePiece || 0);
    
    // Save Audit history record
    const newAudit: InventoryAudit = {
      id: Math.random().toString(36).substring(2, 11),
      productId: p.id,
      productNameAr: p.name_ar,
      productNameEn: p.name_en,
      numCartonsBefore: p.piecesPerCarton > 1 ? Math.floor(p.quantity / p.piecesPerCarton) : 0,
      piecesBefore: p.piecesPerCarton > 1 ? p.quantity % p.piecesPerCarton : p.quantity,
      totalPiecesBefore: p.quantity,
      numCartonsAfter: p.piecesPerCarton > 1 ? cartonsCount : 0,
      piecesAfter: p.piecesPerCarton > 1 ? piecesCount : totalActualPieces,
      totalPiecesAfter: totalActualPieces,
      discrepancyPcs: diffPcs,
      discrepancyValueSDG: diffValue,
      notes: notesText.trim() || (lang === 'ar' ? 'تعديل كميات وتسوية مخزن يدوية' : 'Manual inventory adjustment'),
      createdAt: Date.now()
    };
    
    // Update product quantity on shelf
    const updatedInv = inventory.map(item => {
      if (item.id === p.id) {
        return {
          ...item,
          quantity: totalActualPieces,
          numCartons: p.piecesPerCarton > 1 ? cartonsCount : item.numCartons
        };
      }
      return item;
    });
    
    saveInventoryToStorage(updatedInv);
    saveAuditsToStorage([newAudit, ...audits]);
    
    addToast(lang === 'ar' ? `تم تسوية وتحديث كميات (${p.name_ar}) بنجاح!` : `Stock adjusted for (${p.name_ar})`, 'success');
  };

  // --- Excel Parser callback ---
  const handleImportComplete = (importedProducts: Product[], successCount: number, skippedCount: number) => {
    const finalInv = [...importedProducts, ...inventory];
    saveInventoryToStorage(finalInv);
    addToast(t('importSummary', { success: successCount, skipped: skippedCount }), 'success');
  };

  // --- Helper to sum total pieces of a product currently in the cart ---
  const getCartPiecesCount = (productId: string, currentCart: { product: Product; qty: number; saleUnit: 'piece' | 'carton'; customPrice?: number }[]) => {
    return currentCart.reduce((sum, item) => {
      if (item.product.id === productId) {
        const pcs = item.saleUnit === 'carton' ? item.qty * item.product.piecesPerCarton : item.qty;
        return sum + pcs;
      }
      return sum;
    }, 0);
  };

  // --- POS Cashier Cart Actions ---
  const addToCart = (product: Product, saleUnit: 'piece' | 'carton' = 'piece') => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.saleUnit === saleUnit);
      const currentPiecesInCart = getCartPiecesCount(product.id, prev);
      const piecesToAdd = saleUnit === 'carton' ? product.piecesPerCarton : 1;
      
      if (currentPiecesInCart + piecesToAdd > product.quantity) {
        addToast(
          lang === 'ar' 
            ? 'تنبيه: لقد تجاوزت الكمية المتاحة في المخازن!' 
            : 'Warning: Exceeded stock count on shelf.', 
          'error'
        );
        return prev;
      }
      
      if (existing) {
        return prev.map(item => 
          (item.product.id === product.id && item.saleUnit === saleUnit)
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...prev, { product, qty: 1, saleUnit }];
    });
  };

  const updateCartQty = (productId: string, saleUnit: 'piece' | 'carton', qtyDelta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.saleUnit === saleUnit) {
          const nextQty = item.qty + qtyDelta;
          if (nextQty <= 0) return null;
          
          const otherItemsPieces = prev
            .filter(c => c.product.id !== productId || c.saleUnit !== saleUnit)
            .reduce((sum, c) => sum + (c.saleUnit === 'carton' ? c.qty * c.product.piecesPerCarton : c.qty), 0);
          const nextItemPieces = saleUnit === 'carton' ? nextQty * item.product.piecesPerCarton : nextQty;
          
          if (otherItemsPieces + nextItemPieces > item.product.quantity) {
            addToast(
              lang === 'ar' 
                ? 'الكمية المطلوبة غير متوفرة بالكامل بالمخزن.' 
                : 'Warning: Exceeded stock count.', 
              'info'
            );
            return item;
          }
          return { ...item, qty: nextQty };
        }
        return item;
      }).filter(Boolean) as typeof cart;
    });
  };

  const updateCartItemQtyDirect = (productId: string, saleUnit: 'piece' | 'carton', absoluteValue: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.saleUnit === saleUnit) {
          const matchedProd = inventory.find(p => p.id === productId);
          if (!matchedProd) return item;
          
          let val = Math.max(1, absoluteValue);
          const otherItemsPieces = prev
            .filter(c => c.product.id !== productId || c.saleUnit !== saleUnit)
            .reduce((sum, c) => sum + (c.saleUnit === 'carton' ? c.qty * c.product.piecesPerCarton : c.qty), 0);
          const nextItemPieces = saleUnit === 'carton' ? val * item.product.piecesPerCarton : val;
          
          if (otherItemsPieces + nextItemPieces > matchedProd.quantity) {
            const remainingPcs = matchedProd.quantity - otherItemsPieces;
            val = saleUnit === 'carton' 
              ? Math.floor(remainingPcs / matchedProd.piecesPerCarton) 
              : remainingPcs;
            
            addToast(
              lang === 'ar' 
                ? 'تم تعيين الحد الأقصى للمخزون المتوفر' 
                : 'Set to maximum available stock', 
              'info'
            );
            if (val <= 0) return null;
          }
          return { ...item, qty: val };
        }
        return item;
      }).filter(Boolean) as typeof cart;
    });
  };

  const updateCartPriceDirect = (productId: string, saleUnit: 'piece' | 'carton', customizedPrice: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.saleUnit === saleUnit) {
          return { ...item, customPrice: Math.max(0, customizedPrice) };
        }
        return item;
      });
    });
  };

  const resolveProductPrice = (product: Product, saleUnit: 'piece' | 'carton'): number => {
    const defaultPrice = saleUnit === 'carton' ? product.cartonSellingPrice : product.price;
    if (!selectedPriceListId) return defaultPrice;
    
    const pl = priceLists.find(p => p.id === selectedPriceListId && p.isActive);
    if (!pl) return defaultPrice;

    // Check if there is an explicit override for this product
    const override = pl.productPrices?.[product.id];
    if (override) {
      if (saleUnit === 'carton' && override.cartonPrice !== undefined && override.cartonPrice > 0) {
        return override.cartonPrice;
      }
      if (saleUnit === 'piece' && override.piecePrice !== undefined && override.piecePrice > 0) {
        return override.piecePrice;
      }
    }

    // Otherwise apply default modifier rate if not fixed sheet
    if (pl.discountType === 'markup') {
      return defaultPrice * (1 + pl.value / 100);
    } else if (pl.discountType === 'markdown') {
      return defaultPrice * (1 - pl.value / 100);
    }
    
    return defaultPrice;
  };

  const removeCartItem = (productId: string, saleUnit: 'piece' | 'carton') => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.saleUnit === saleUnit)));
    addToast(lang === 'ar' ? 'تم الحذف من السلة' : 'Removed item from cart');
  };

  // Subtotal and Total calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.customPrice !== undefined 
        ? item.customPrice 
        : resolveProductPrice(item.product, item.saleUnit);
      return sum + (price * item.qty);
    }, 0);
  }, [cart, selectedPriceListId, priceLists]);

  const discountAmount = useMemo(() => {
    const val = Number(discountInput) || 0;
    if (discountType === 'percent') {
      return (cartSubtotal * val) / 100;
    }
    return val;
  }, [cartSubtotal, discountType, discountInput]);

  const taxAmount = useMemo(() => {
    if (!settings.isTaxEnabled) return 0;
    const base = cartSubtotal - discountAmount;
    return (base * settings.taxRate) / 100;
  }, [cartSubtotal, discountAmount, settings]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount + taxAmount);
  }, [cartSubtotal, discountAmount, taxAmount]);

  useEffect(() => {
    if (!isInstallment) return;
    const remaining = Math.max(0, cartTotal - (parseFloat(amountPaidInput) || 0));
    if (remaining <= 0) {
      setInstallmentsList([]);
      return;
    }
    const count = installmentCountInput || 1;
    const itemAmount = Math.round((remaining / count) * 100) / 100;
    let baseDate = new Date(installmentDateInput || new Date().toISOString().split('T')[0]);
    
    const schedule: InstallmentPayment[] = [];
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        if (installmentInterval === 'monthly') {
          baseDate.setMonth(baseDate.getMonth() + 1);
        } else if (installmentInterval === 'weekly') {
          baseDate.setDate(baseDate.getDate() + 7);
        } else if (installmentInterval === 'biweekly') {
          baseDate.setDate(baseDate.getDate() + 14);
        }
      }
      
      const dueDateStr = isNaN(baseDate.getTime()) 
        ? new Date().toISOString().split('T')[0] 
        : baseDate.toISOString().split('T')[0];
        
      const amt = i === count - 1 ? (remaining - (itemAmount * (count - 1))) : itemAmount;
      
      schedule.push({
        id: 'INST-' + (i + 1) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        index: i + 1,
        dueDate: dueDateStr,
        amount: Math.round(amt * 100) / 100,
        amountPaid: 0,
        status: 'unpaid'
      });
    }
    setInstallmentsList(schedule);
  }, [isInstallment, cartTotal, amountPaidInput, installmentCountInput, installmentInterval, installmentDateInput]);

  const updateSingleInstallmentInput = (id: string, field: 'dueDate' | 'amount', value: any) => {
    setInstallmentsList(prev => prev.map(inst => {
      if (inst.id === id) {
        if (field === 'amount') {
          return { ...inst, amount: parseFloat(value) || 0 };
        }
        return { ...inst, [field]: value };
      }
      return inst;
    }));
  };

  // Checkout inputs helpers
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      addToast(lang === 'ar' ? 'السلة فارغة!' : 'Basket empty!', 'error');
      return;
    }
    setAmountReceivedInput(Math.ceil(cartTotal).toString());
    setAmountPaidInput(Math.ceil(cartTotal).toString());
    setPaymentMethod('cash');
    setIsInstallment(false);
    setTransactionNumberInput('');
    setCustomerNameInput('');
    setCheckoutNotesInput('');
    
    const hq = branches.find(b => b.isHeadquarters);
    setSelectedCheckoutBranchId(hq ? hq.id : (branches[0]?.id || ''));
    
    setIsCheckoutOpen(true);
  };

  const checkoutChangeDue = useMemo(() => {
    const received = parseFloat(amountReceivedInput) || 0;
    return Math.max(0, received - cartTotal);
  }, [amountReceivedInput, cartTotal]);

  const handleProcessCheckoutPayment = () => {
    const received = parseFloat(amountReceivedInput) || 0;
    const paidInstallmentAmount = parseFloat(amountPaidInput) || 0;

    if (!isInstallment && paymentMethod === 'cash' && received < cartTotal) {
      addToast(t('amountErr'), 'error');
      return;
    }

    // Deduct quantities in Inventory
    const updatedInventory = inventory.map(p => {
      const totalPcsDeducted = cart
        .filter(c => c.product.id === p.id)
        .reduce((sum, item) => {
          const itemPcs = item.saleUnit === 'carton' ? item.qty * p.piecesPerCarton : item.qty;
          return sum + itemPcs;
        }, 0);
        
      if (totalPcsDeducted > 0) {
        return {
          ...p,
          quantity: Math.max(0, p.quantity - totalPcsDeducted)
        };
      }
      return p;
    });
    saveInventoryToStorage(updatedInventory);

    // Build Invoice record
    const uniqueInvoiceNum = 'INV-' + Date.now().toString().slice(-6);
    const invoiceItems: InvoiceItem[] = cart.map(item => {
      const actualUnitPrice = item.customPrice !== undefined 
        ? item.customPrice 
        : resolveProductPrice(item.product, item.saleUnit);
      return {
        productId: item.product.id,
        name_ar: item.product.name_ar + (item.saleUnit === 'carton' ? ' (كرتونة)' : ' (قطعة)'),
        name_en: item.product.name_en + (item.saleUnit === 'carton' ? ' (Carton)' : ' (Piece)'),
        price: actualUnitPrice,
        qty: item.qty,
        subtotal: actualUnitPrice * item.qty,
        unit: item.saleUnit === 'carton' ? (lang === 'ar' ? 'كرتونة' : 'Carton') : (lang === 'ar' ? 'حبة' : 'Piece')
      };
    });

    const finalPaid = isInstallment ? paidInstallmentAmount : (paymentMethod === 'cash' ? received : cartTotal);
    const finalRemaining = isInstallment ? Math.max(0, cartTotal - paidInstallmentAmount) : 0;

    const newInvoice: Invoice = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber: uniqueInvoiceNum,
      items: invoiceItems,
      discountType,
      discountValue: discountInput,
      discountAmount,
      taxEnabled: settings.isTaxEnabled,
      taxRate: settings.taxRate,
      taxAmount,
      total: cartTotal,
      paymentMethod,
      amountReceived: finalPaid,
      amountChange: !isInstallment && paymentMethod === 'cash' ? checkoutChangeDue : 0,
      createdAt: Date.now(),
      transactionNumber: transactionNumberInput.trim() || undefined,
      printTransactionNumber: transactionNumberInput.trim() ? printTransactionNumber : false,
      customerName: customerNameInput.trim() || undefined,
      notes: checkoutNotesInput.trim() || undefined,
      isInstallment,
      installmentDate: isInstallment ? installmentDateInput : undefined,
      amountPaid: isInstallment ? finalPaid : undefined,
      amountRemaining: isInstallment ? finalRemaining : undefined,
      installmentCount: isInstallment ? installmentCountInput : undefined,
      installmentsList: isInstallment ? installmentsList : undefined,
      branchId: selectedCheckoutBranchId || undefined,
      sessionId: currentSessionId || undefined,
      cashierName: currentUser?.name || undefined
    };

    saveSalesToStorage([newInvoice, ...sales]);

    // Update active POS Session if it exists
    if (currentSessionId) {
      const updatedSessions = sessions.map(s => {
        if (s.id === currentSessionId && s.status === 'open') {
          const invoiceTotal = newInvoice.total;
          const isCash = newInvoice.paymentMethod === 'cash';
          const isTransfer = newInvoice.paymentMethod === 'transfer';
          const isCheck = newInvoice.paymentMethod === 'check';
          return {
            ...s,
            salesTotal: s.salesTotal + invoiceTotal,
            cashSalesTotal: s.cashSalesTotal + (isCash ? invoiceTotal : 0),
            transferSalesTotal: s.transferSalesTotal + (isTransfer ? invoiceTotal : 0),
            checkSalesTotal: s.checkSalesTotal + (isCheck ? invoiceTotal : 0),
            invoicesCount: s.invoicesCount + 1
          };
        }
        return s;
      });
      saveSessionsToStorage(updatedSessions);
    }

    setSelectedInvoice(newInvoice);

    // Auto register customer if they don't exist
    const custName = customerNameInput.trim();
    if (custName) {
      const exists = customers.find(c => c.name.trim().toLowerCase() === custName.toLowerCase());
      if (!exists) {
        const newCust: Customer = {
          id: 'cust_' + Math.random().toString(36).substring(2, 9),
          name: custName,
          phone: '-',
          category: 'regular',
          creditLimit: 0,
          status: 'active',
          createdAt: Date.now()
        };
        const updatedCustomers = [newCust, ...customers];
        setCustomers(updatedCustomers);
        localStorage.setItem('sudan_customers', JSON.stringify(updatedCustomers));
        syncCustomers(updatedCustomers);
      }
    }

    // Reset checkout states
    setCart([]);
    setDiscountInput(0);
    setIsCheckoutOpen(false);
    setIsPrintModalOpen(true);
    setIsInstallment(false);
    setInstallmentCountInput(3);
    setInstallmentInterval('monthly');
    setInstallmentsList([]);
    addToast(t('paymentSuccess'), 'success');
  };

  const handlePrintCommand = () => {
    window.print();
  };

  // --- Search filtered products in inventory / cashier ---
  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      const search = inventorySearch.toLowerCase().trim();
      const matchSearch = 
        !search ||
        p.name_ar.toLowerCase().includes(search) ||
        p.name_en.toLowerCase().includes(search);

      const matchCategory = 
        inventoryCategoryFilter === 'all' || 
        p.category === inventoryCategoryFilter;

      return matchSearch && matchCategory;
    });
  }, [inventory, inventorySearch, inventoryCategoryFilter]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let valA = a[inventorySortField];
      let valB = b[inventorySortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return inventorySortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return inventorySortAsc ? numA - numB : numB - numA;
    });
    return sorted;
  }, [filteredProducts, inventorySortField, inventorySortAsc]);

  const toggleSort = (field: keyof Product) => {
    if (inventorySortField === field) {
      setInventorySortAsc(!inventorySortAsc);
    } else {
      setInventorySortField(field);
    }
  };

  // --- Sales Metrics and rankings computations ---
  const processedSalesData = useMemo(() => {
    // We parse the dates safely with local midnight to 11:59pm coverage
    const startObj = salesStartDate ? new Date(salesStartDate + 'T00:00:00') : null;
    const endObj = salesEndDate ? new Date(salesEndDate + 'T23:59:59') : null;

    const filtered = sales.filter(inv => {
      // 1. Date Range Filter
      const invDate = new Date(inv.createdAt);
      if (startObj && invDate < startObj) return false;
      if (endObj && invDate > endObj) return false;

      // 2. Payment Method Filter
      if (salesPaymentFilter !== 'all' && inv.paymentMethod !== salesPaymentFilter) return false;

      // 3. Installment Status Filter
      if (salesInstallmentFilter === 'outstanding') {
        if (!inv.isInstallment || (inv.amountRemaining || 0) <= 0) return false;
      } else if (salesInstallmentFilter === 'fullyPaid') {
        if (inv.isInstallment && (inv.amountRemaining || 0) > 0) return false;
      }

      // 4. Search Filter
      if (salesSearchQuery.trim()) {
        const query = salesSearchQuery.toLowerCase();
        const matchesInvoiceNum = inv.invoiceNumber.toLowerCase().includes(query);
        const matchesCustomer = inv.customerName?.toLowerCase().includes(query) || false;
        const matchesNotes = inv.notes?.toLowerCase().includes(query) || false;
        const matchesTx = inv.transactionNumber?.toLowerCase().includes(query) || false;
        const matchesProducts = inv.items.some(item => 
          item.name_ar.toLowerCase().includes(query) || item.name_en.toLowerCase().includes(query)
        );
        return matchesInvoiceNum || matchesCustomer || matchesNotes || matchesTx || matchesProducts;
      }

      return true;
    });

    // Compute metrics
    let totalRevenue = 0;
    let totalCashReceived = 0;
    let totalTransferReceived = 0;
    let totalCheckReceived = 0;
    let totalInstallmentPaid = 0;
    let totalAmountRemainingToCollect = 0;
    let totalCOGS = 0;

    filtered.forEach(inv => {
      totalRevenue += inv.total;
      
      if (inv.isInstallment) {
        totalInstallmentPaid += inv.amountPaid || 0;
        totalAmountRemainingToCollect += inv.amountRemaining || 0;
      } else {
        if (inv.paymentMethod === 'cash') totalCashReceived += inv.total;
        if (inv.paymentMethod === 'transfer') totalTransferReceived += inv.total;
        if (inv.paymentMethod === 'check') totalCheckReceived += inv.total;
      }

      inv.items.forEach(item => {
        const prod = inventory.find(p => p.id === item.productId);
        if (prod) {
          const costPrice = prod.purchasePricePiece || 0;
          const isCarton = item.unit === 'كرتونة' || item.unit === 'Carton';
          const qtyInPieces = isCarton ? item.qty * prod.piecesPerCarton : item.qty;
          totalCOGS += qtyInPieces * costPrice;
        }
      });
    });

    const netProfit = totalRevenue - totalCOGS;

    // Rank best selling products
    const itemSummary: Record<string, { productId: string; name_ar: string; name_en: string; qtyPieces: number; revenue: number; transactions: number }> = {};
    filtered.forEach(inv => {
      inv.items.forEach(item => {
        const prod = inventory.find(p => p.id === item.productId);
        const isCarton = item.unit === 'كرتونة' || item.unit === 'Carton';
        const pieces = prod ? (isCarton ? item.qty * prod.piecesPerCarton : item.qty) : item.qty;
        
        if (!itemSummary[item.productId]) {
          itemSummary[item.productId] = {
            productId: item.productId,
            name_ar: prod?.name_ar || item.name_ar,
            name_en: prod?.name_en || item.name_en,
            qtyPieces: 0,
            revenue: 0,
            transactions: 0
          };
        }
        itemSummary[item.productId].qtyPieces += pieces;
        itemSummary[item.productId].revenue += item.subtotal;
        itemSummary[item.productId].transactions += 1;
      });
    });

    const topSellingList = Object.values(itemSummary)
      .sort((a, b) => b.qtyPieces - a.qtyPieces);

    return {
      filteredSales: filtered,
      totalRevenue,
      totalCashReceived,
      totalTransferReceived,
      totalCheckReceived,
      totalInstallmentPaid,
      totalAmountRemainingToCollect,
      totalCOGS,
      netProfit,
      topSellingList
    };
  }, [sales, salesStartDate, salesEndDate, salesPaymentFilter, salesInstallmentFilter, salesSearchQuery, inventory]);

  // --- Reports calculations ---
  const processedReportsMetrics = useMemo(() => {
    // Filter transactions landing within start/end dates
    const inRange = sales.filter(inv => {
      const invDateStr = new Date(inv.createdAt).toISOString().split('T')[0];
      const matchDate = invDateStr >= reportStartDate && invDateStr <= reportEndDate;
      const matchPayment = reportPaymentFilter === 'all' || inv.paymentMethod === reportPaymentFilter;
      return matchDate && matchPayment;
    });

    const totalRevenue = inRange.reduce((sum, inv) => sum + inv.total, 0);
    const invoicesCount = inRange.length;

    // Calculate top product charts top 5
    const itemSalesSummary: Record<string, { name_ar: string; name_en: string; qty: number; total: number }> = {};
    inRange.forEach(inv => {
      inv.items.forEach(item => {
        if (!itemSalesSummary[item.productId]) {
          itemSalesSummary[item.productId] = {
            name_ar: item.name_ar,
            name_en: item.name_en,
            qty: 0,
            total: 0
          };
        }
        itemSalesSummary[item.productId].qty += item.qty;
        itemSalesSummary[item.productId].total += item.subtotal;
      });
    });

    const topProducts = Object.values(itemSalesSummary)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Dynamic calculations for profits and inventory costs
    const totalInventoryEstCost = inventory.reduce((sum, p) => sum + ((p.purchasePricePiece || 0) * (p.initialQuantity || 0)), 0);
    
    // Total spent expenses in report range
    const filteredExpenses = expenses.filter(exp => {
      const expDateStr = new Date(exp.date).toISOString().split('T')[0];
      return expDateStr >= reportStartDate && expDateStr <= reportEndDate;
    });
    const totalExpensesSum = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      filteredSales: inRange,
      totalRevenue,
      invoicesCount,
      topProducts,
      totalInventoryEstCost,
      totalExpensesSum
    };
  }, [sales, reportStartDate, reportEndDate, reportPaymentFilter, inventory, expenses]);

  const handleExportSalesToExcel = () => {
    if (processedReportsMetrics.filteredSales.length === 0) {
      addToast(lang === 'ar' ? 'لا توجد بيانات لتصديرها!' : 'No data to export!', 'error');
      return;
    }

    const exportRows = processedReportsMetrics.filteredSales.map(inv => ({
      'رقم الفاتورة': inv.invoiceNumber,
      'التاريخ': new Date(inv.createdAt).toLocaleString(),
      'طريقة الدفع': inv.paymentMethod,
      'قيمة المبيعات': inv.total,
      'المستلم': inv.amountReceived,
      'شروط بيع بالتقسيط': inv.isInstallment ? 'نعم - بالتقسيط' : 'نقدي كامل',
      'باقي قسط مستحق': inv.isInstallment ? inv.amountRemaining : 0,
      'تاريخ استحقاق قسط': inv.isInstallment ? inv.installmentDate : '',
      'رقم العملية': inv.transactionNumber || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales LEDGER");
    XLSX.writeFile(wb, `Sales_Ledger_${reportStartDate}_to_${reportEndDate}.xlsx`);
    addToast(lang === 'ar' ? 'تم تصدير سجل المبيعات كملف إكسل' : 'Sales exported successfully');
  };

  const handleCollectInstallmentPayment = () => {
    if (!payingInvoice) return;
    const payAmt = parseFloat(installmentPayAmountInput) || 0;
    if (payAmt <= 0) {
      addToast(lang === 'ar' ? 'الرجاء إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than zero', 'error');
      return;
    }
    const currentRemaining = payingInvoice.amountRemaining || 0;
    if (payAmt > currentRemaining) {
      addToast(lang === 'ar' ? 'المبلغ المدفوع يتجاوز المبلغ المتبقي!' : 'Payment amount exceeds remaining amount!', 'error');
      return;
    }

    const updatedRemaining = Math.max(0, currentRemaining - payAmt);
    const updatedPaid = (payingInvoice.amountPaid || 0) + payAmt;
    
    // Distribute paid amount across individual installments
    let remainsToDistribute = payAmt;
    const originalList = payingInvoice.installmentsList || [];
    let updatedInstallmentsList: InstallmentPayment[] = [];
    
    if (originalList.length > 0) {
      updatedInstallmentsList = originalList.map(inst => {
        if (remainsToDistribute <= 0) return inst;
        
        const installmentOutstanding = inst.amount - inst.amountPaid;
        if (installmentOutstanding <= 0) return inst;
        
        const payToThisOne = Math.round(Math.min(remainsToDistribute, installmentOutstanding) * 100) / 100;
        const newAmountPaid = Math.round((inst.amountPaid + payToThisOne) * 100) / 100;
        remainsToDistribute = Math.round((remainsToDistribute - payToThisOne) * 100) / 100;
        
        return {
          ...inst,
          amountPaid: newAmountPaid,
          status: newAmountPaid >= inst.amount ? 'paid' : 'partial',
          paidDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash'
        };
      });
    } else {
      // For legacy invoices without structured installments, generate a single one with updated paid
      updatedInstallmentsList = [
        {
          id: 'INST-LEGACY-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          index: 1,
          dueDate: payingInvoice.installmentDate || new Date().toISOString().split('T')[0],
          amount: payingInvoice.total - (payingInvoice.amountPaid || 0),
          amountPaid: payAmt,
          status: updatedRemaining <= 0 ? 'paid' : 'partial',
          paidDate: new Date().toISOString().split('T')[0]
        }
      ];
    }

    // Find the next outstanding installment due date
    const nextOutstanding = updatedInstallmentsList.find(inst => inst.status !== 'paid');
    const nextInstallmentDate = nextOutstanding ? nextOutstanding.dueDate : undefined;

    const updatedInvoices = sales.map(inv => {
      if (inv.id === payingInvoice.id) {
        return {
          ...inv,
          amountPaid: updatedPaid,
          amountRemaining: updatedRemaining,
          installmentsList: updatedInstallmentsList,
          installmentDate: nextInstallmentDate
        };
      }
      return inv;
    });

    saveSalesToStorage(updatedInvoices);
    setPayingInvoice(null);
    setInstallmentPayAmountInput('');
    addToast(lang === 'ar' ? 'تم تسجيل سداد القسط بنجاح' : 'Installment payment recorded successfully', 'success');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    const targetInvoice = sales.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return;

    const confirmMsg = lang === 'ar' 
      ? `هل أنت متأكد من إلغاء الفاتورة ${targetInvoice.invoiceNumber}؟ سيتم إرجاع المنتجات المباعة للمخزون.`
      : `Are you sure you want to cancel invoice ${targetInvoice.invoiceNumber}? Sold products will be returned to inventory.`;
      
    if (!window.confirm(confirmMsg)) return;

    const updatedInventory = inventory.map(product => {
      let totalToRestock = 0;
      targetInvoice.items.forEach(item => {
        if (item.productId === product.id) {
          const isCarton = item.unit === 'كرتونة' || item.unit === 'Carton';
          const pcs = isCarton ? item.qty * product.piecesPerCarton : item.qty;
          totalToRestock += pcs;
        }
      });

      if (totalToRestock > 0) {
        return {
          ...product,
          quantity: product.quantity + totalToRestock
        };
      }
      return product;
    });

    saveInventoryToStorage(updatedInventory);

    const updatedSales = sales.filter(inv => inv.id !== invoiceId);
    saveSalesToStorage(updatedSales);

    addToast(lang === 'ar' ? 'تم إلغاء الفاتورة وإعادة الكميات للمخزن بنجاح' : 'Invoice canceled and quantities returned to stock successfully', 'success');
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsToStorage(settings);
    addToast(t('settingsSaved'), 'success');
  };

  // --- USER Accounts Administration helpers ---
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [employeeDeleteConfirmId, setEmployeeDeleteConfirmId] = useState<string | null>(null);
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'cashier'>('cashier');
  const [userFormPassword, setUserFormPassword] = useState('');

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = userFormEmail.trim();
    const sanitizedName = userFormName.trim();
    const sanitizedPassword = userFormPassword.trim();

    if (!sanitizedName || !sanitizedEmail || !sanitizedPassword) {
      addToast(lang === 'ar' ? 'يرجى ملء كافة حقول نموذج المستخدم' : 'Please fill all user form fields', 'error');
      return;
    }

    if (editingUser) {
      // Update
      const updated = systemUsers.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: sanitizedName,
            email: sanitizedEmail.toLowerCase(),
            role: userFormRole,
            password: sanitizedPassword
          };
        }
        return u;
      });
      // Update active currentUser object if updating own profile
      if (currentUser && currentUser.id === editingUser.id) {
        const selfMatch = updated.find(u => u.id === currentUser.id);
        if (selfMatch) {
          setCurrentUser(selfMatch);
          localStorage.setItem('sudan_current_user', JSON.stringify(selfMatch));
        }
      }
      saveSystemUsersToStorage(updated);
      addToast(lang === 'ar' ? 'تم تحديث بيانات المستخدم بنجاح' : 'User account updated successfully', 'success');
    } else {
      // Check duplicate email
      if (systemUsers.some(u => u.email.toLowerCase() === sanitizedEmail.toLowerCase())) {
        addToast(lang === 'ar' ? 'هذا البريد الإلكتروني مسجل لموظف آخر بالفعل!' : 'This email is already registered to another user!', 'error');
        return;
      }

      // Create new
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        name: sanitizedName,
        email: sanitizedEmail.toLowerCase(),
        role: userFormRole,
        password: sanitizedPassword,
        isLocked: false,
        tenantId: currentUser?.tenantId || '' // Safely link other users/employees to the owner's store tenant ID
      };
      saveSystemUsersToStorage([...systemUsers, newUser]);
      addToast(lang === 'ar' ? 'تم إضافة حساب الموظف الجديد بنجاح' : 'New employee account added successfully', 'success');
    }

    // Reset Form
    setEditingUser(null);
    setUserFormName('');
    setUserFormEmail('');
    setUserFormRole('cashier');
    setUserFormPassword('');
  };

  const handleEditUserClick = (u: SystemUser) => {
    setEditingUser(u);
    setUserFormName(u.name);
    setUserFormEmail(u.email);
    setUserFormRole(u.role);
    setUserFormPassword(u.password);
  };

  const handleToggleLockUser = (u: SystemUser) => {
    if (u.id === currentUser?.id) {
      addToast(lang === 'ar' ? 'لا يمكنك قفل حسابك الفعال حالياً!' : 'You cannot lock your own running account!', 'error');
      return;
    }
    const updated = systemUsers.map(item => {
      if (item.id === u.id) {
        return { ...item, isLocked: !item.isLocked };
      }
      return item;
    });
    saveSystemUsersToStorage(updated);
    addToast(lang === 'ar' ? 'تم تعديل حالة الحساب بنجاح' : 'User lock status toggled successfully', 'success');
  };

  const handleDeleteUser = (uId: string) => {
    if (uId === currentUser?.id) {
      addToast(lang === 'ar' ? 'لا يمكنك حذف حسابك الخاص الذي تستخدمه حالياً!' : 'You cannot delete your own account!', 'error');
      return;
    }
    
    if (employeeDeleteConfirmId === uId) {
      const updated = systemUsers.filter(u => u.id !== uId);
      saveSystemUsersToStorage(updated);
      addToast(lang === 'ar' ? 'تم إزالة حساب الموظف بنجاح' : 'Account deleted successfully', 'success');
      setEmployeeDeleteConfirmId(null);
    } else {
      setEmployeeDeleteConfirmId(uId);
      addToast(
        lang === 'ar' 
          ? '⚠️ انقر على سلة المهملات الحمراء مرة أخرى لتأكيد حذف الموظف نهائياً!' 
          : '⚠️ Click the red trash button again to confirm permanent deletion!', 
        'error'
      );
      // Auto cancel after 5 seconds of inactivity
      setTimeout(() => {
        setEmployeeDeleteConfirmId(prev => prev === uId ? null : prev);
      }, 5000);
    }
  };

  const handlePurgeAllDataAction = () => {
    if (purgeConfirmText.trim() !== 'أوافق') {
      addToast(lang === 'ar' ? 'الرجاء كتابة أوافق للمتابعة!' : 'Please type required confirm code!', 'error');
      return;
    }

    localStorage.removeItem('sudan_inventory');
    localStorage.removeItem('sudan_sales');
    localStorage.removeItem('sudan_expenses');
    localStorage.removeItem('sudan_china_transfers');
    localStorage.removeItem('sudan_settings');
    localStorage.removeItem('sudan_suppliers');
    localStorage.removeItem('sudan_purchase_requests');
    localStorage.removeItem('sudan_rfqs');
    localStorage.removeItem('sudan_purchase_orders');
    localStorage.removeItem('sudan_purchase_invoices');
    localStorage.removeItem('sudan_purchase_returns');
    localStorage.removeItem('sudan_debit_notes');
    localStorage.removeItem('sudan_supplier_payments');
    localStorage.removeItem('sudan_purchase_settings');
    localStorage.removeItem('sudan_safes');
    localStorage.removeItem('sudan_bank_accounts');
    localStorage.removeItem('sudan_finance_transactions');
    localStorage.removeItem('sudan_finance_settings');

    setInventory([]);
    setSales([]);
    setExpenses([]);
    setChinaTransfers([]);
    setSuppliers([]);
    setPurchaseRequests([]);
    setRfqs([]);
    setPurchaseOrders([]);
    setPurchaseInvoices([]);
    setPurchaseReturns([]);
    setDebitNotes([]);
    setSupplierPayments([]);
    setPurchaseSettings(DEFAULT_PURCHASE_SETTINGS);
    setSafes([]);
    setBankAccounts([]);
    setFinanceTransactions([]);
    setFinanceSettings(DEFAULT_FINANCE_SETTINGS);
    setBranches([]);

    setCart([]);
    setSettings(DEFAULT_SETTINGS);
    setPurgeConfirmText('');

    // Trigger backend purge
    fetchWithTenant('/api/data/purge', { method: 'POST' })
      .then(() => {
        addToast(t('clearAllSuccess'), 'success');
      })
      .catch(e => {
        console.error('Server purge failed:', e);
        addToast(t('clearAllSuccess'), 'success');
      });
  };

  // --- LOGIN PORTAL UI STATES & INTERACTIONS ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (!loginEmail || !loginPassword) {
      setLoginError(lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please provide both email and password');
      return;
    }
    
    // Find matching user
    const foundUser = systemUsers.find(u => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!foundUser) {
      setLoginError(lang === 'ar' ? 'عذرا، حساب المستخدم هذا غير مسجل بالنظام' : 'User account not found');
      return;
    }
    
    if (foundUser.isLocked) {
      setLoginError(lang === 'ar' ? 'هذا الحساب معطل حالياً من قِبل الإدارة!' : 'This account has been deactivated!');
      return;
    }

    if (foundUser.password !== loginPassword) {
      setLoginError(lang === 'ar' ? 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى' : 'Incorrect password');
      return;
    }
    
    // Success!
    setCurrentUser(foundUser);
    localStorage.setItem('sudan_current_user', JSON.stringify(foundUser));
    
    // Set default tab based on role
    if (foundUser.role === 'cashier') {
      setCurrentTab('pos');
    } else {
      setCurrentTab('pos');
    }
    
    addToast(lang === 'ar' ? `مرحباً بك مجدداً، ${foundUser.name}` : `Welcome back, ${foundUser.name}`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sudan_current_user');
    
    // Clear merchant localstorage operational keys
    const merchantKeys = [
      'sudan_inventory', 'sudan_sales', 'sudan_expenses', 'sudan_china_transfers',
      'sudan_settings', 'sudan_audits', 'sudan_customers', 'sudan_warehouses',
      'sudan_stock_transfers', 'sudan_price_lists', 'sudan_suppliers',
      'sudan_purchase_requests', 'sudan_rfqs', 'sudan_purchase_orders',
      'sudan_purchase_invoices', 'sudan_purchase_returns', 'sudan_debit_notes',
      'sudan_supplier_payments', 'sudan_purchase_settings', 'sudan_safes',
      'sudan_bank_accounts', 'sudan_finance_transactions', 'sudan_finance_settings',
      'sudan_branches', 'sudan_invoice_template_settings', 'sudan_custom_documents',
      'sudan_pos_terminals', 'sudan_pos_sessions', 'sudan_pos_current_session_id'
    ];
    merchantKeys.forEach(k => localStorage.removeItem(k));

    setLoginEmail('');
    setLoginPassword('');
    addToast(lang === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully', 'info');
  };

  // --- SaaS Subscription and Password Guards ---
  if (showGuestPlans) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowGuestPlans(false)}
          className="fixed top-6 left-6 z-50 px-4 py-2 bg-gray-950 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer border border-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'ar' ? 'الرجوع لتسجيل الدخول' : 'Back to Login'}</span>
        </button>
        <SaasPlansScreen
          saasSettings={saasSettings}
          currentUser={null}
          onLogout={() => setShowGuestPlans(false)}
          lang={lang}
        />
      </div>
    );
  }

  if (currentUser && !isSubscriberActive) {
    return (
      <SaasPlansScreen
        saasSettings={saasSettings}
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
      />
    );
  }

  if (currentUser && currentUser.isTemporaryPassword) {
    return (
      <SaasPasswordResetModal
        currentUser={currentUser}
        onUpdateUsers={saveSystemUsersToStorage}
        systemUsers={systemUsers}
        onPasswordChanged={(updatedUser) => {
          setCurrentUser(updatedUser);
          localStorage.setItem('sudan_current_user', JSON.stringify(updatedUser));
        }}
        addToast={addToast}
        lang={lang}
      />
    );
  }

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#121212] text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'}`} dir="rtl">
        <div className="absolute top-6 left-6 flex items-center gap-2">
          <button
            onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
            className={`px-3 py-1.5 transition rounded-lg text-xs font-bold font-mono border ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 hover:bg-[#2d2d2d]' : 'bg-white border-[#d2d2d7] hover:bg-[#e2e2e7]'}`}
          >
            <Globe className="w-3.5 h-3.5 inline-block mr-1 align-middle" />
            <span>{lang === 'ar' ? 'EN' : 'العربية'}</span>
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-2 transition rounded-lg border ${isDarkMode ? 'bg-[#1e1e1e] border-gray-700 hover:bg-[#2d2d2d]' : 'bg-white border-[#d2d2d7] hover:bg-[#e2e2e7]'}`}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`w-full max-w-sm rounded-3xl p-8 shadow-2xl border ${isDarkMode ? 'bg-[#1c1c1e] border-gray-800' : 'bg-white border-[#d2d2d7]/50'}`}
        >
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 bg-[#0071e3] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0071e3]/20 mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">
              {lang === 'ar' ? 'تسجيل الدخول للنظام' : 'System Login'}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1 px-4 font-semibold">
              {lang === 'ar' ? 'نظام النبلاء المتكامل لإدارة المبيعات والمخازن' : 'Nobles Integrated Sales & Inventory System'}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 px-1">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400 font-mono">
                  @
                </span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={`w-full pr-9 pl-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition border ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] border-gray-700 text-white focus:border-[#0071e3]'
                      : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                  }`}
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1 px-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <Key className="w-3.5 h-3.5" />
                </span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={`w-full pr-9 pl-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition border ${
                    isDarkMode
                      ? 'bg-[#2c2c2e] border-gray-700 text-white focus:border-[#0071e3]'
                      : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#1d1d1f] focus:border-[#0071e3] focus:bg-white'
                  }`}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition shadow-lg shadow-[#0071e3]/10 hover:shadow-[#0071e3]/20 flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'دخول للنظام' : 'Access System'}</span>
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-gray-400 font-bold font-mono">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
          </div>

          <button
            type="button"
            onClick={() => setShowGuestPlans(true)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'عرض خطط الاشتراك وتفعيل الحساب' : 'View Subscription Plans & Sign Up'}</span>
          </button>

          {/* Quick Guidance Card wrapped in toggle to prevent customers from seeing the developer's email */}
          <div className="mt-4 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowDemoAccountsInfo(!showDemoAccountsInfo)}
              className="text-[10px] text-gray-400 hover:text-blue-500 underline transition cursor-pointer"
            >
              {showDemoAccountsInfo 
                ? (lang === 'ar' ? '✕ إخفاء بيانات حسابات المعاينة' : '✕ Hide Sandbox Demo Accounts')
                : (lang === 'ar' ? 'ℹ هل أنت زائر تجريبي؟ انقر لعرض حسابات المعاينة المتاحة' : 'ℹ Sandbox demo accounts for evaluation')}
            </button>

            {showDemoAccountsInfo && (
              <div className={`w-full mt-3 p-3 rounded-2xl border text-right animate-in fade-in duration-200 ${isDarkMode ? 'bg-[#2c2c2e]/60 border-gray-800' : 'bg-[#f5f5f7] border-[#d2d2d7]/50'}`}>
                <h4 className="text-[10px] font-bold text-gray-400 mb-2 border-b border-[#d2d2d7]/40 pb-1 flex items-center gap-1.5">
                  <span>💡 {lang === 'ar' ? 'حسابات التشغيل والتحقق المصنفة' : 'System Accounts'}</span>
                </h4>
                <div className="space-y-2 text-[10px] text-gray-500 font-medium leading-relaxed">
                  <div>
                    <p className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{lang === 'ar' ? '١. مدير النظام (لوحة الإدارة كاملة + الكاشير):' : '1. Manager (Dashboard + POS):'}</p>
                    <p className="font-mono mt-0.5 select-all text-[#0071e3]">hisham.yo005@gmail.com</p>
                    <p>{lang === 'ar' ? 'كلمة المرور: ' : 'Password: '} <span className="font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">123</span></p>
                  </div>
                  <div className="border-t border-[#d2d2d7]/45 pt-1.5">
                    <p className={`font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{lang === 'ar' ? '٢. موظف نقطة بيع (واجهة الكاشير فقط محجوبة):' : '2. Normal Cashier (POS View ONLY):'}</p>
                    <p className="font-mono mt-0.5 select-all text-[#34c759]">cashier1@nobles.com</p>
                    <p>{lang === 'ar' ? 'كلمة المرور: ' : 'Password: '} <span className="font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">123</span></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const logoShapeClass = (settings.logoShape || 'rounded') === 'circle' ? 'rounded-full' :
                         (settings.logoShape || 'rounded') === 'rounded' ? 'rounded-2xl' : 'rounded-none';
  const logoWidthVal = settings.logoWidth || 50;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-[#121214] text-zinc-100' : 'bg-[#fafafa] text-[#1d1d1f]'} flex flex-col font-sans relative antialiased pb-24 lg:pb-12 transition-colors duration-300`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ======================================================= */}
      {/* GORGEOUS NAVIGATION HEADER - DUAL DECK */}
      {/* ======================================================= */}
      <header className={`sticky top-0 z-40 border-b no-print backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-[#1c1c1e]/90 border-zinc-800' : 'bg-white/90 border-[#d2d2d7]'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-3 sm:gap-4">
          
          {/* Row 1: Brand details (on the right) and Controls/Lang/Mode/Profile (on the left) */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4">
            
            {/* Brand details - with logo, name and description on the right (start) */}
            <div className="flex items-center gap-3 sm:gap-4 text-start">
              <div 
                className={`bg-white flex items-center justify-center overflow-hidden shadow-sm border p-1 shrink-0 transform hover:scale-105 transition-all duration-200 ${logoShapeClass} ${isDarkMode ? 'border-zinc-700/65 bg-[#2c2c2e]' : 'border-[#d2d2d7]/85'}`}
                style={{ width: `${logoWidthVal + 12}px`, height: `${logoWidthVal + 12}px` }}
              >
                <img 
                  src={settings.logoUrl || p2pLogo} 
                  style={{ width: `${logoWidthVal}px`, height: `${logoWidthVal}px` }} 
                  className={`object-contain ${logoShapeClass}`} 
                  alt="Store Logo" 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="text-start">
                <h1 className={`text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-1.5 leading-tight ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`} style={{ fontFamily: 'Cairo, sans-serif' }}>
                  {settings.storeName || t('appName')}
                </h1>
                <p className={`text-[10px] sm:text-[11px] font-medium leading-none mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {settings.storeTagline !== undefined ? settings.storeTagline : t('tagline')}
                </p>
              </div>
            </div>

            {/* Controls (language, dark mode, logged-in status & logout) on the left (end) */}
            <div className="flex items-center justify-center sm:justify-end gap-2.5 w-full sm:w-auto">
              
              {/* Language Switch */}
              <button
                type="button"
                onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold font-mono transition border flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode 
                    ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] border-zinc-700 text-gray-200' 
                    : 'bg-[#f5f5f7] hover:bg-[#e2e2e7] border-[#d2d2d7] text-[#1d1d1f]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#0071e3]" />
                <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              {/* Dark Mode Switch */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className={`p-2 rounded-xl transition border cursor-pointer ${
                  isDarkMode 
                    ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] border-zinc-700 text-[#ffb800]' 
                    : 'bg-[#f5f5f7] hover:bg-[#e2e2e7] border-[#d2d2d7] text-gray-600'
                }`}
                title={lang === 'ar' ? 'تغيير المظهر' : 'Toggle Theme'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Logged in User Details & Logout Button */}
              {currentUser && (
                <div className={`flex items-center gap-2 border-r pl-2 pr-3 mr-1 ${isDarkMode ? 'border-zinc-800' : 'border-[#d2d2d7]/50'}`}>
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-[11.5px] font-black leading-none">
                      {currentUser.name}
                    </span>
                    <span className={`text-[9.5px] mt-1 font-bold ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {currentUser.role === 'admin' ? (lang === 'ar' ? 'المدير العام' : 'Admin Manager') : (lang === 'ar' ? 'موظف مبيعات' : 'Sales Cashier')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title={lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-[10px] font-bold">{lang === 'ar' ? 'خروج' : 'Exit'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Row 2: Desktop Sections/Tabs List (only visible on large screens) */}
          <div className={`hidden lg:block border-t pt-3 ${isDarkMode ? 'border-zinc-800/80' : 'border-gray-150'}`}>
            <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {[
                { id: 'pos', label: t('pos'), icon: ShoppingCart },
                { id: 'sales', label: lang === 'ar' ? 'المبيعات' : 'Sales', icon: TrendingUp },
                { id: 'customers', label: lang === 'ar' ? 'العملاء' : 'Customers', icon: Users },
                { id: 'inventory', label: t('inventory'), icon: Package },
                { id: 'expenses', label: lang === 'ar' ? 'الإدارة المالية' : 'Finance', icon: Wallet },
                { id: 'china', label: t('chinaTab'), icon: CreditCard },
                { id: 'branches', label: lang === 'ar' ? 'الفروع' : 'Branches', icon: Store },
                { id: 'templates', label: lang === 'ar' ? 'قوالب الفواتير' : 'Templates', icon: ClipboardCheck },
                { id: 'reports', label: t('reports'), icon: BarChart3 },
                { id: 'settings', label: t('settings'), icon: Settings },
                { id: 'guide', label: lang === 'ar' ? 'كيفية الاستخدام' : 'How to Use', icon: Info },
                ...(currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' ? [{ id: 'saas_admin', label: lang === 'ar' ? 'إدارة السحابة 👑' : 'SaaS Control 👑', icon: ShieldAlert }] : [])
              ].filter((item) => {
                if (currentUser?.role === 'cashier') {
                  return item.id === 'pos' || item.id === 'guide';
                }
                return true;
              }).map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#1c1c1e] text-white shadow-xs dark:bg-white dark:text-[#1c1c1e]' 
                        : isDarkMode 
                          ? 'text-gray-400 hover:bg-[#2c2c2e] hover:text-white' 
                          : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 shadow-2xs" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

        </div>
      </header>

      {/* ======================================================= */}
      {/* MOBILE LOWER RAIL TABS NAVIGATION */}
      {/* ======================================================= */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#d2d2d7] z-40 py-2 px-3 no-print flex justify-around">
        {[
          { id: 'pos', name: lang === 'ar' ? 'كاشير' : 'POS', icon: ShoppingCart },
          { id: 'sales', name: lang === 'ar' ? 'مبيعات' : 'Sales', icon: TrendingUp },
          { id: 'customers', name: lang === 'ar' ? 'العملاء' : 'Cust', icon: Users },
          { id: 'inventory', name: lang === 'ar' ? 'مخزن' : 'Stock', icon: Package },
          { id: 'expenses', name: lang === 'ar' ? 'المالية' : 'Finance', icon: Wallet },
          { id: 'china', name: lang === 'ar' ? 'مشتريات' : 'Purchases', icon: CreditCard },
          { id: 'branches', name: lang === 'ar' ? 'الفروع' : 'Branches', icon: Store },
          { id: 'templates', name: lang === 'ar' ? 'قوالب' : 'Templates', icon: ClipboardCheck },
          { id: 'reports', name: lang === 'ar' ? 'تقارير' : 'Reports', icon: BarChart3 },
          { id: 'settings', name: lang === 'ar' ? 'إعداد' : 'Settings', icon: Settings },
          { id: 'guide', name: lang === 'ar' ? 'دليل' : 'Guide', icon: Info },
          ...(currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' ? [{ id: 'saas_admin', name: lang === 'ar' ? 'إشراف' : 'SaaS', icon: ShieldAlert }] : [])
        ].filter((item) => {
          if (currentUser?.role === 'cashier') {
            return item.id === 'pos' || item.id === 'guide';
          }
          return true;
        }).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id as any)}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${
                isActive ? 'text-[#0071e3] font-bold' : 'text-[#6e6e73]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-medium truncate">{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================= */}
      {/* TOAST PANEL WRAPPER */}
      {/* ======================================================= */}
      <div className="fixed top-20 right-6 z-50 space-y-2 pointer-events-none no-print max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border text-xs font-bold leading-relaxed text-right ${
                toast.type === 'error' 
                  ? 'bg-red-50 text-red-700 border-red-200' 
                  : toast.type === 'info' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ======================================================= */}
      {/* MAIN VIEW CONTROLLER */}
      {/* ======================================================= */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <AnimatePresence mode="wait">
          
          {/* ======================================================= */}
          {/* TAB 1: POINT OF SALE (POS CASHIER) */}
          {/* ======================================================= */}
          {currentTab === 'pos' && (
            <motion.div
              key="pos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* POS SUB-NAVIGATION ROW */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm no-print">
                <div className="flex items-center gap-2">
                  <div className="bg-[#0071e3]/10 text-[#0071e3] p-2 rounded-lg">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-gray-900">إدارة ومراقبة نقاط البيع (POS Core)</h2>
                    <p className="text-[10px] text-gray-500 font-medium">الجلسات والورديات، شاشة المبيعات، والتقارير المالية الفورية</p>
                  </div>
                </div>

                <div className="flex bg-[#f5f5f7] p-1 rounded-xl border border-gray-200/80">
                  <button
                    onClick={() => setPosSubTab('checkout')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      posSubTab === 'checkout'
                        ? 'bg-white text-[#0071e3] shadow-sm font-black'
                        : 'text-gray-650 hover:text-gray-950 font-bold'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>شاشة البيع</span>
                  </button>
                  <button
                    onClick={() => setPosSubTab('sessions')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      posSubTab === 'sessions'
                        ? 'bg-white text-[#0071e3] shadow-sm font-black'
                        : 'text-gray-650 hover:text-gray-950 font-bold'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 shrink-0" />
                    <span>جلسات الوردية</span>
                    {sessions.some(s => s.status === 'open') && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    )}
                  </button>
                  {currentUser?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => setPosSubTab('terminals')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          posSubTab === 'terminals'
                            ? 'bg-white text-[#0071e3] shadow-sm font-black'
                            : 'text-gray-650 hover:text-gray-950 font-bold'
                        }`}
                      >
                        <PlusSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>نقاط البيع</span>
                      </button>
                      <button
                        onClick={() => setPosSubTab('reports')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                          posSubTab === 'reports'
                            ? 'bg-white text-[#0071e3] shadow-sm font-black'
                            : 'text-gray-650 hover:text-gray-950 font-bold'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                        <span>تقرير نقاط البيع</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {posSubTab === 'checkout' ? (
                !currentSessionId ? (
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12 shadow-xs">
                    <div className="w-16 h-16 bg-amber-100/80 rounded-full flex items-center justify-center mx-auto text-amber-600">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-amber-900">عذراً، يرجى فتح جلسة وردية أولاً للبدء بالبيع وتفقد الصندوق!</h3>
                      <p className="text-xs text-amber-700 leading-relaxed max-w-md mx-auto">
                        يلزم النظام تتبع جلسات البيع المنفتحة مع خزنة الوردية الافتتاحية للمطابقة المالية اليومية. يرجى بدء جلسة جديدة كمعالج مبيعات.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setPosSubTab('sessions');
                        if (terminals.length > 0) {
                          setSelectedTerminalForSession(terminals[0].id);
                        }
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-black shadow-md transition inline-flex items-center gap-1.5"
                    >
                      ⚡ بدء الوردية وفتح وردية بيع جديدة الآن
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Product Shelf browser area */}
              <div className="lg:col-span-8 space-y-5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch justify-between">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      className="w-full pl-3 pr-9 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] focus:border-[#0071e3] text-xs font-medium rounded-xl focus:outline-none"
                      placeholder={t('scanOrSearchProduct')}
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                  </div>

                  <select
                    className="bg-[#f5f5f7] border border-[#d2d2d7] text-xs font-medium px-3 rounded-xl focus:outline-none focus:border-[#0071e3]"
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  >
                    <option value="all">{t('allCategories')}</option>
                    <option value="حديد تسليح وتصنيع">{t('catRebar')}</option>
                    <option value="أسمنت ومواد جافة">{t('catCement')}</option>
                    <option value="طوب وبلوك وحصى">{t('catBricks')}</option>
                    <option value="سباكة وأدوات صحية">{t('catPlumbing')}</option>
                    <option value="كهربائيات وإنارة">{t('catElectrical')}</option>
                    <option value="بوهيات ومواد طلاء">{t('catPaints')}</option>
                    <option value="عدد وأدوات يدوية">{t('catTools')}</option>
                    <option value="أخرى">{t('catOthers')}</option>
                  </select>

                  {priceLists.length > 0 && (
                    <select
                      className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-black px-3 py-2 sm:py-0 rounded-xl focus:outline-none focus:border-purple-600 outline-none"
                      value={selectedPriceListId}
                      onChange={(e) => {
                        setSelectedPriceListId(e.target.value);
                        addToast(
                          lang === 'ar' 
                            ? 'تم تبديل قائمة الأسعار النشطة وتحديث السلة في الحال.' 
                            : 'Active Price Sheet changed, cart recalculated.', 
                          'success'
                        );
                      }}
                    >
                      <option value="">🏷️ قائمة الأسعار الافتراضية</option>
                      {priceLists
                        .filter(pl => pl.isActive)
                        .map(pl => (
                          <option key={pl.id} value={pl.id}>
                            🏷️ {pl.name} ({pl.discountType === 'markup' ? `+${pl.value}%` : pl.discountType === 'markdown' ? `-${pl.value}%` : 'مخصصة'})
                          </option>
                        ))
                      }
                    </select>
                  )}
                </div>

                {/* Grid list display */}
                {sortedProducts.length === 0 ? (
                  <div className="bg-[#f5f5f7]/50 rounded-2xl py-14 text-center border border-dashed border-[#d2d2d7]">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-[#6e6e73]">{lang === 'ar' ? 'المخزن فارغ تماماً حالياً' : 'Warehouse stock empty.'}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{lang === 'ar' ? 'الرجاء التوجه لعلامة "إدارة المخزن" لإضافة بضاعة حقيقية فوراً.' : 'Create items inside inventory to start selling.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {sortedProducts.map((p) => {
                      const inCart = cart.some(c => c.product.id === p.id);
                      const isLowStock = p.quantity <= settings.lowStockThreshold;
                      const isOutOfStock = p.quantity === 0;
                      const hasPack = p.piecesPerCarton > 1;
                      const remainingFormatted = formatProductStock(p.quantity, p.piecesPerCarton, lang);

                      return (
                        <motion.div
                          key={p.id}
                          className={`bg-white select-none border rounded-[20px] p-4 text-right flex flex-col justify-between min-h-[196px] shadow-xs transition-all duration-200 ${
                            isOutOfStock 
                              ? 'opacity-40 border-gray-200 bg-gray-50 pointer-events-none p-4' 
                              : inCart 
                                ? 'border-[#0071e3] ring-1 ring-[#0071e3]/10 bg-blue-50/5' 
                                : 'border-[#d2d2d7] hover:border-[#86868b] hover:shadow-xs'
                          }`}
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-extrabold text-[#6e6e73] block uppercase tracking-wider">{p.category}</span>
                            <h3 className="text-xs font-black text-[#1d1d1f] line-clamp-1 leading-snug">
                              {lang === 'ar' ? p.name_ar : p.name_en}
                            </h3>
                            {hasPack && (
                              <span className="text-[9px] text-[#0071e3] font-bold bg-[#f5f5f7] px-2 py-0.5 rounded-lg inline-block">
                                {p.piecesPerCarton} حبة/كرتون
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 pt-2">
                            {/* Price labels */}
                            <div className="text-[10px] space-y-0.5">
                              <div className="flex justify-between font-mono font-bold text-[#1d1d1f]">
                                <span className="text-gray-400">سعر الحبة:</span>
                                <span>{resolveProductPrice(p, 'piece').toLocaleString()} SDG</span>
                              </div>
                              {hasPack && (
                                <div className="flex justify-between font-mono font-bold text-gray-700">
                                  <span className="text-gray-400">سعر الكرتونة:</span>
                                  <span>{resolveProductPrice(p, 'carton').toLocaleString()} SDG</span>
                                </div>
                              )}
                            </div>

                            {/* Stock Indicator */}
                            <div className="flex flex-col border-t border-gray-100 pt-1 text-[10px] leading-tight">
                              <div className="flex justify-between items-center text-gray-500 font-medium">
                                <span>المخزون المتوفر:</span>
                                <span className={`font-mono font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {isOutOfStock ? t('statusEmpty') : `${p.quantity} حبة`}
                                </span>
                              </div>
                              {hasPack && p.quantity > 0 && (
                                <div className="text-[9px] font-bold text-[#86868b] mt-1" dir="rtl">
                                  {remainingFormatted}
                                </div>
                              )}
                            </div>

                            {/* Action Row */}
                            {!isOutOfStock ? (
                              hasPack ? (
                                <div className="flex gap-1.5 pt-1.5 border-t border-gray-50">
                                  <button
                                    onClick={() => addToCart(p, 'piece')}
                                    className="flex-1 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[9px] font-black transition text-center"
                                  >
                                    + قطعة
                                  </button>
                                  <button
                                    onClick={() => addToCart(p, 'carton')}
                                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[9px] font-black transition text-center"
                                  >
                                    + كرتونة
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(p, 'piece')}
                                  className="w-full py-1.5 bg-[#1d1d1f] text-white hover:bg-[#2d2d2f] rounded-lg text-[10px] font-black transition text-center"
                                >
                                  + إضافة قطعة
                                </button>
                              )
                            ) : (
                              <div className="text-center py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-black border border-gray-200">
                                {t('statusEmpty')}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Shopping Sales Basket Drawer Area */}
              <div className="lg:col-span-4 bg-white border border-[#d2d2d7] rounded-[24px] p-5 space-y-5 shadow-sm sticky top-24">
                <div className="flex items-center justify-between border-b border-[#f5f5f7] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#1d1d1f] rounded-lg text-white flex items-center justify-center font-bold text-[10px]">
                      {cart.length}
                    </div>
                    <h4 className="text-xs font-bold text-[#1d1d1f]">{t('invoiceSummary')}</h4>
                  </div>

                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        setCart([]);
                        addToast(lang === 'ar' ? 'تم تفريغ سلة المبيعات' : 'Cart cleared');
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      {t('clearCart')}
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="py-14 text-center space-y-3">
                    <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center mx-auto text-[#86868b]">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-[#6e6e73] font-medium px-4">
                      {t('cartEmpty')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {cart.map((item) => {
                      const isCarton = item.saleUnit === 'carton';
                      const itemPrice = item.customPrice !== undefined 
                        ? item.customPrice 
                        : (isCarton ? item.product.cartonSellingPrice : item.product.price);

                      return (
                        <div 
                          key={`${item.product.id}-${item.saleUnit}`} 
                          className={`p-3 rounded-xl border space-y-2.5 transition-colors ${
                            isCarton 
                              ? 'bg-emerald-50/30 border-emerald-200' 
                              : 'bg-[#f5f5f7] border-[#e2e2e7]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-[#1d1d1f] truncate">
                                {lang === 'ar' ? item.product.name_ar : item.product.name_en}
                              </h5>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[8px] text-[#6e6e73] block uppercase font-extrabold">{item.product.category}</span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                                  isCarton ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {isCarton ? (lang === 'ar' ? 'كرتونة كاملة' : 'Full Carton') : (lang === 'ar' ? 'حبة فردية' : 'Single Piece')}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeCartItem(item.product.id, item.saleUnit)}
                              className="text-gray-400 hover:text-red-500 transition-all p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Direct qty and price row */}
                          <div className="flex items-center justify-between gap-2 border-t border-dashed border-gray-200 pt-2">
                            {/* Quantity buttons control */}
                            <div className="flex items-center gap-1 bg-white border border-[#d2d2d7] rounded-lg px-1 py-0.5">
                              <button
                                onClick={() => updateCartQty(item.product.id, item.saleUnit, -1)}
                                className="w-5 h-5 bg-[#f5f5f7] hover:bg-gray-200 text-gray-700 rounded font-black text-xs flex items-center justify-center transition"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => updateCartItemQtyDirect(item.product.id, item.saleUnit, parseInt(e.target.value) || 0)}
                                className="w-8 text-center text-xs font-mono font-bold focus:outline-none"
                              />
                              <button
                                onClick={() => updateCartQty(item.product.id, item.saleUnit, 1)}
                                className="w-5 h-5 bg-[#f5f5f7] hover:bg-gray-200 text-gray-700 rounded font-black text-xs flex items-center justify-center transition"
                              >
                                +
                              </button>
                            </div>

                            {/* Live Unit Selling Price Modifier */}
                            <div className="flex items-center gap-1 bg-white border border-[#d2d2d7] rounded-lg px-2 py-0.5 flex-1 max-w-[125px]">
                              <span className="text-[8px] text-emerald-600 font-extrabold whitespace-nowrap">السعر:</span>
                              <input
                                type="number"
                                value={itemPrice}
                                onChange={(e) => updateCartPriceDirect(item.product.id, item.saleUnit, parseFloat(e.target.value) || 0)}
                                className="w-full text-center text-xs font-mono font-black border-none focus:outline-none"
                                min="0"
                              />
                            </div>

                            {/* Total per row */}
                            <div className="text-left shrink-0">
                              <span className="text-[8px] text-gray-400 block leading-none">إجمالي</span>
                              <span className="text-xs font-black text-[#1d1d1f] font-mono leading-none">
                                {(itemPrice * item.qty).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub discounts additions */}
                {cart.length > 0 && (
                  <div className="border-t border-[#f5f5f7] pt-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-[#6e6e73]">
                        <span>منح خصم مالي للفاتورة</span>
                        <div className="flex border border-[#d2d2d7] rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setDiscountType('fixed')}
                            className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
                              discountType === 'fixed' ? 'bg-[#1d1d1f] text-white' : 'bg-white text-gray-600'
                            }`}
                          >
                            SDG
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('percent')}
                            className={`px-2 py-0.5 text-[10px] font-bold ${
                              discountType === 'percent' ? 'bg-[#1d1d1f] text-white' : 'bg-white text-gray-600'
                            }`}
                          >
                            %
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          className="w-full px-3 py-2 bg-[#f5f5f7] text-xs font-mono rounded-xl border border-[#d2d2d7] focus:outline-none"
                          placeholder={discountType === 'percent' ? "أدخل النسبة المئوية %" : "خصم مباشر بالجنيه"}
                          value={discountInput || ''}
                          onChange={(e) => setDiscountInput(Math.max(0, parseFloat(e.target.value) || 0))}
                          min="0"
                        />
                        <div className="absolute top-2.5 left-3 text-gray-400">
                          {discountType === 'percent' ? <Percent className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">SDG</span>}
                        </div>
                      </div>
                    </div>

                    {/* Maths summaries items lists */}
                    <div className="space-y-1.5 text-xs text-[#6e6e73] pt-1 border-t border-[#f5f5f7]">
                      <div className="flex justify-between">
                        <span>{t('subtotal')}:</span>
                        <span className="font-semibold text-[#1d1d1f]">{cartSubtotal.toLocaleString()} SDG</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>{t('discount')}:</span>
                          <span className="font-semibold">-({discountAmount.toLocaleString()}) SDG</span>
                        </div>
                      )}
                      {settings.isTaxEnabled && (
                        <div className="flex justify-between">
                          <span>الضريبة ({settings.taxRate}%):</span>
                          <span className="font-semibold text-[#1d1d1f]">{taxAmount.toLocaleString()} SDG</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm font-black text-[#1d1d1f] border-t border-gray-100 pt-2 shrink-0">
                        <span>{t('total')}:</span>
                        <span className="text-[#0071e3] text-md font-sans">{cartTotal.toLocaleString()} SDG</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenCheckout}
                      className="w-full py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-2xl transition tracking-wide flex items-center justify-center gap-2 shadow-xs mt-3 select-none"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t('checkout')} ({cartTotal.toLocaleString()} SDG)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <PosManager
            lang={lang}
            terminals={terminals}
            sessions={sessions}
            currentSessionId={currentSessionId}
            posSubTab={posSubTab}
            setPosSubTab={setPosSubTab}
            branches={branches}
            settings={settings}
            saveTerminalsToStorage={saveTerminalsToStorage}
            saveSessionsToStorage={saveSessionsToStorage}
            saveCurrentSessionIdToStorage={saveCurrentSessionIdToStorage}
            addToast={(msg, type) => addToast(msg, type || 'success')}
            sales={sales}
            currentUser={currentUser}
            systemUsers={systemUsers}
          />
        )}
      </motion.div>
    )}

          {/* ======================================================= */}
          {/* TAB 1.5: ADVANCED SALES MANAGEMENT SUITE */}
          {/* ======================================================= */}
          {currentTab === 'sales' && (
            <motion.div
              key="sales"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              {/* Header with Title and Exports */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">سجل إدارة المبيعات المتكاملة</h2>
                  <p className="text-xs text-[#6e6e73]">تفاصيل الفواتير المصدرة، الأرباح الحقيقية، والتحصيلات الائتمانية للأقساط</p>
                </div>
                
                {/* Switch Sub-Tabs inside Sales layout */}
                <div className="flex bg-[#f5f5f7] p-1 rounded-2xl border border-[#d2d2d7] self-start md:self-auto select-none">
                  <button
                    onClick={() => setSalesSubTab('dashboard')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      salesSubTab === 'dashboard'
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    لوحة التحليلات والربح
                  </button>
                  <button
                    onClick={() => setSalesSubTab('history')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      salesSubTab === 'history'
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    دفتر الفواتير ({processedSalesData.filteredSales.length})
                  </button>
                  <button
                    onClick={() => setSalesSubTab('installments')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      salesSubTab === 'installments'
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    جدولة الديون والأقساط
                    {sales.filter(i => i.isInstallment && (i.amountRemaining || 0) > 0).length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* Filtering components bar (Shared except for some dashboards contexts) */}
              <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 grid grid-cols-1 md:grid-cols-5 gap-4 shadow-xs leading-normal">
                <div>
                  <label className="text-[10px] font-black text-gray-400 block mb-1">البحث المتقدم</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={salesSearchQuery}
                      onChange={(e) => setSalesSearchQuery(e.target.value)}
                      placeholder="رقم الفاتورة، العميل، صنف..."
                      className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] pr-8"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 block mb-1">من تاريخ</label>
                  <input
                    type="date"
                    value={salesStartDate}
                    onChange={(e) => setSalesStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 block mb-1">إلى تاريخ</label>
                  <input
                    type="date"
                    value={salesEndDate}
                    onChange={(e) => setSalesEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 block mb-1">طريقة السداد</label>
                  <select
                    value={salesPaymentFilter}
                    onChange={(e) => setSalesPaymentFilter(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                  >
                    <option value="all">جميع الطرق</option>
                    <option value="cash">نقدي كامل</option>
                    <option value="transfer">تحويل (بنكك)</option>
                    <option value="check">شيك مصرفي</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 block mb-1">نوع المبيعة</label>
                  <select
                    value={salesInstallmentFilter}
                    onChange={(e) => setSalesInstallmentFilter(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                  >
                    <option value="all">الكل (نقدي وبأقساط)</option>
                    <option value="outstanding">أقساط ديون معلقة متبقية</option>
                    <option value="fullyPaid">نقدي / أقساط مكتملة السداد</option>
                  </select>
                </div>
              </div>

              {/* VIEW 1: SALES ANALYTICS DASHBOARD */}
              {salesSubTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Performance widgets layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-white to-blue-50/10 border border-[#d2d2d7] rounded-3xl p-5 space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase">إجمالي قيمة المبيعات</span>
                        <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0071e3]">
                          <ShoppingCart className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-black text-[#1d1d1f] font-mono leading-none">
                        {processedSalesData.totalRevenue.toLocaleString()} <span className="text-xs font-sans font-normal text-gray-500">SDG</span>
                      </div>
                      <div className="text-[9px] text-[#6e6e73] flex items-center gap-1">
                        <span>إجمالي الفواتير الصادرة ضمن نطاق التصفية</span>
                      </div>
                    </div>

                    {/* Net Profits Card */}
                    <div className="bg-gradient-to-br from-white to-emerald-50/15 border border-[#d2d2d7] rounded-3xl p-5 space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-emerald-800 font-extrabold uppercase">صافي أرباح المبيعات الحقيقية</span>
                        <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-black text-emerald-600 font-mono leading-none">
                        {processedSalesData.netProfit.toLocaleString()} <span className="text-xs font-sans font-normal text-emerald-500 font-mono">SDG</span>
                      </div>
                      <div className="text-[9px] text-emerald-800">
                        {processedSalesData.totalRevenue > 0 
                          ? `هامش بيع حقيقي مقدر بنسبة ${Math.round((processedSalesData.netProfit / processedSalesData.totalRevenue) * 100)}% من المبيعات`
                          : "تكلفة البضاعة المباعة مخصومة من الإيراد"
                        }
                      </div>
                    </div>

                    {/* Outstanding Credit card */}
                    <div className="bg-gradient-to-br from-white to-amber-50/10 border border-[#d2d2d7] rounded-3xl p-5 space-y-2.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-amber-800 font-extrabold uppercase">ديون وأقساط مستحقة للتحصيل</span>
                        <div className="w-7 h-7 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-black text-amber-600 font-mono leading-none">
                        {processedSalesData.totalAmountRemainingToCollect.toLocaleString()} <span className="text-xs font-sans font-normal text-amber-500">SDG</span>
                      </div>
                      <div className="text-[9px] text-[#6e6e73] flex justify-between">
                        <span>المدفوع من الأقساط: {processedSalesData.totalInstallmentPaid.toLocaleString()} SDG</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Flow Channel Breakdowns */}
                  <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-4">
                    <h3 className="text-xs font-extrabold text-[#1d1d1f]">متحصلات الخزانة حسب قنوات السداد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Cash */}
                      <div className="space-y-2 border border-[#f5f5f7] rounded-2xl p-4 bg-gray-50/50">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-[#1d1d1f]">متحصلات النقد (الكاش)</span>
                          <span className="font-mono text-gray-500">
                            {processedSalesData.totalRevenue > 0 ? Math.round((processedSalesData.totalCashReceived / processedSalesData.totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                        <div className="text-md font-extrabold text-blue-700 font-mono">
                          {processedSalesData.totalCashReceived.toLocaleString()} SDG
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${processedSalesData.totalRevenue > 0 ? (processedSalesData.totalCashReceived / processedSalesData.totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Bank transfers */}
                      <div className="space-y-2 border border-[#f5f5f7] rounded-2xl p-4 bg-gray-50/50">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-[#1d1d1f]">تحويلات البنوك رقمياً (بنكك)</span>
                          <span className="font-mono text-gray-500">
                            {processedSalesData.totalRevenue > 0 ? Math.round((processedSalesData.totalTransferReceived / processedSalesData.totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                        <div className="text-md font-extrabold text-indigo-700 font-mono">
                          {processedSalesData.totalTransferReceived.toLocaleString()} SDG
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full" 
                            style={{ width: `${processedSalesData.totalRevenue > 0 ? (processedSalesData.totalTransferReceived / processedSalesData.totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Cashier checks */}
                      <div className="space-y-2 border border-[#f5f5f7] rounded-2xl p-4 bg-gray-50/50">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-[#1d1d1f]">شيكات مصرفية مضمونة</span>
                          <span className="font-mono text-gray-500">
                            {processedSalesData.totalRevenue > 0 ? Math.round((processedSalesData.totalCheckReceived / processedSalesData.totalRevenue) * 100) : 0}%
                          </span>
                        </div>
                        <div className="text-md font-extrabold text-purple-700 font-mono">
                          {processedSalesData.totalCheckReceived.toLocaleString()} SDG
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-600 h-full rounded-full" 
                            style={{ width: `${processedSalesData.totalRevenue > 0 ? (processedSalesData.totalCheckReceived / processedSalesData.totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Demanded Items layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Item list rankings */}
                    <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-extrabold text-[#1d1d1f]">الأصناف الأكثر حركة ومبيعاً (بالكمية)</h3>
                        <span className="text-[10px] text-gray-400 font-mono">الترتيب التنازلي</span>
                      </div>

                      {processedSalesData.topSellingList.length === 0 ? (
                        <div className="py-12 text-center text-[#6e6e73] text-xs">
                          لا توجد بيانات حركة بيع للمنتجات في الفترة المحددة.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {processedSalesData.topSellingList.slice(0, 5).map((item, index) => {
                            const totalQtyRep = processedSalesData.topSellingList.reduce((sum, i) => sum + i.qtyPieces, 0);
                            const itemPct = totalQtyRep > 0 ? Math.round((item.qtyPieces / totalQtyRep) * 100) : 0;
                            return (
                              <div key={item.productId} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-[#1d1d1f]">{index + 1}. {item.name_ar}</span>
                                  <span className="font-mono text-gray-600">{item.qtyPieces.toLocaleString()} قطعة</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${itemPct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono shrink-0 w-8 text-left">{itemPct}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sales financial contributions by product */}
                    <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-extrabold text-[#1d1d1f]">الأكثر مساهمة في حجم الإيرادات المالي</h3>
                        <span className="text-[10px] text-gray-400 font-mono">الترتيب حسب المجموع</span>
                      </div>

                      {processedSalesData.topSellingList.length === 0 ? (
                        <div className="py-12 text-center text-[#6e6e73] text-xs">
                          لا يوجد إيراد مسجل مالي في التواريخ المحددة.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {processedSalesData.topSellingList.slice(0, 5).map((item, index) => {
                            const itemPctRev = processedSalesData.totalRevenue > 0 ? Math.round((item.revenue / processedSalesData.totalRevenue) * 100) : 0;
                            return (
                              <div key={item.productId} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="font-bold text-[#1d1d1f]">{index + 1}. {item.name_ar}</span>
                                  <span className="font-mono text-[#0071e3] font-bold">{item.revenue.toLocaleString()} SDG</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-blue-500 h-full rounded-full"
                                      style={{ width: `${itemPctRev}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono shrink-0 w-8 text-left">{itemPctRev}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: INVOICES HISTORY LEDGER LIST */}
              {salesSubTab === 'history' && (
                <div className="bg-white border border-[#d2d2d7] rounded-[24px] overflow-hidden">
                  <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7] flex justify-between items-center">
                    <h3 className="text-xs font-extrabold text-[#1d1d1f]">حركة تفاصيل المبيعات المؤكدة بالنظام</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-gray-200 text-gray-800 px-2.5 py-1 rounded-full font-bold">
                        {processedSalesData.filteredSales.length} فاتورة
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right bg-white leading-normal select-none">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100 text-[10px]">
                          <th className="py-3 px-4 text-center">رقم الفاتورة</th>
                          <th className="py-3 px-4">التاريخ والوقت</th>
                          <th className="py-3 px-4">العميل / التفاصيل</th>
                          <th className="py-3 px-4">طريقة السداد</th>
                          <th className="py-3 px-4">حالة الفاتورة</th>
                          <th className="py-3 px-4 text-left">المجموع الإجمالي</th>
                          <th className="py-3 px-4 text-center">الإجراءات والتحكم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f5f5f7]">
                        {processedSalesData.filteredSales.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-[#6e6e73]">
                              لا توجد فواتير مبيعات مطابقة لمعايير البحث في الفترة الزمنية المختارة.
                            </td>
                          </tr>
                        ) : (
                          processedSalesData.filteredSales.map((inv) => (
                            <tr key={inv.id} className="hover:bg-[#f5f5f7]/20 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-center font-mono">
                                {inv.invoiceNumber}
                                {inv.transactionNumber && (
                                  <span className="block text-[9px] text-gray-400 font-normal">ع: {inv.transactionNumber}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-gray-500 font-mono">
                                {new Date(inv.createdAt).toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="font-bold text-[#1d1d1f] block">
                                  {inv.customerName || "عميل غير مسمى"}
                                </span>
                                <span className="text-[9px] text-gray-400 line-clamp-1">
                                  {inv.items.map(item => `${item.name_ar} (x${item.qty})`).join('، ')}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold">
                                {inv.paymentMethod === 'cash' ? "نقدي كاش" : inv.paymentMethod === 'transfer' ? "تحويل (بنكك)" : "شيك مصرفي"}
                              </td>
                              <td className="py-3.5 px-4">
                                {inv.isInstallment ? (
                                  <div className="space-y-0.5">
                                    <span className="inline-block bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                      تقسيط مجدول
                                    </span>
                                    {(inv.amountRemaining || 0) > 0 ? (
                                      <span className="block text-[9px] font-mono text-amber-600">متبقي: {inv.amountRemaining?.toLocaleString()} SDG</span>
                                    ) : (
                                      <span className="block text-[9px] font-bold text-emerald-600">تم السداد كاملاً</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    نقدي مباشر
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-left font-black text-[#1d1d1f] font-mono">
                                {inv.total.toLocaleString()} SDG
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setIsPrintModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-lg text-[10px] font-bold hover:bg-gray-100 transition"
                                  >
                                    طبع المعاينة
                                  </button>
                                  
                                  {inv.isInstallment && (inv.amountRemaining || 0) > 0 && (
                                    <button
                                      onClick={() => {
                                        setPayingInvoice(inv);
                                        setInstallmentPayAmountInput(inv.amountRemaining ? inv.amountRemaining.toString() : '');
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition whitespace-nowrap"
                                    >
                                      سداد قسط
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteInvoice(inv.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="إلغاء الفاتورة بالكامل وإرجاع المنتجات للمخزون"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: INSTALLMENTS ONLY TRACE SHEET */}
              {salesSubTab === 'installments' && (
                <div className="space-y-4">
                  {/* Stats summary of outstanding payments */}
                  <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-900">سجل المدفوعات والديون الآجلة (الأقساط)</h4>
                      <p className="text-xs text-amber-800">بيان تفصيلي بأسماء العملاء، وتواريخ الدفع لمطابقة السيولة وتفادي مشاكل التحصيل</p>
                    </div>
                    <div className="bg-white border border-amber-200 px-4 py-2.5 rounded-2xl flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-gray-400 block font-sans">قيد الانتظار للتحصيل</span>
                        <strong className="text-amber-700 font-extrabold text-md">{processedSalesData.totalAmountRemainingToCollect.toLocaleString()} SDG</strong>
                      </div>
                      <div className="w-px bg-gray-200 h-8" />
                      <div>
                        <span className="text-[9px] text-gray-400 block font-sans">عدد الفواتير الآجلة</span>
                        <strong className="text-[#1d1d1f] font-extrabold text-md">{sales.filter(i => i.isInstallment && (i.amountRemaining || 0) > 0).length} فواتير</strong>
                      </div>
                    </div>
                  </div>

                  {/* Main Installments list */}
                  <div className="bg-white border border-[#d2d2d7] rounded-[24px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right bg-white leading-normal select-none">
                        <thead>
                          <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100 text-[10px]">
                            <th className="py-3 px-4">اسم العميل</th>
                            <th className="py-3 px-4 text-center">رقم الفاتورة</th>
                            <th className="py-3 px-4">تاريخ المبيعة</th>
                            <th className="py-3 px-4 font-bold text-center">الأقساط والدفعات</th>
                            <th className="py-3 px-4">تاريخ القسط القادم</th>
                            <th className="py-3 px-4 text-left">قيمة الفاتورة الكلية</th>
                            <th className="py-3 px-4 text-left">المبلغ المسدد بالفعل</th>
                            <th className="py-3 px-4 text-left text-amber-700">المبلغ الآجل المتبقي</th>
                            <th className="py-3 px-4 text-center">خدمة التحصيل الدائم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f5f7]">
                          {sales.filter(inv => inv.isInstallment).length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-[#6e6e73]">
                                لا توجد مبيعات ائتمانية (بالتقسيط) مسجلة بالنظام حالياً.
                              </td>
                            </tr>
                          ) : (
                            sales.filter(inv => inv.isInstallment).map((inv) => (
                              <tr key={inv.id} className="hover:bg-[#f5f5f7]/20 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-[#1d1d1f]">
                                  {inv.customerName || "عميل بدون اسم"}
                                  {inv.notes && (
                                    <span className="block text-[9px] text-gray-400 font-normal">ملاحظة: {inv.notes}</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-center font-mono text-gray-600">
                                  {inv.invoiceNumber}
                                </td>
                                <td className="py-3.5 px-4 text-gray-500 font-mono">
                                  {new Date(inv.createdAt).toISOString().split('T')[0]}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {inv.installmentsList && inv.installmentsList.length > 0 ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-[10px] font-bold text-gray-750">
                                        {inv.installmentsList.filter(i => i.status === 'paid').length} / {inv.installmentsList.length} دفعات مسددة
                                      </span>
                                      {/* Mini visual indicator dot for each installment */}
                                      <div className="flex gap-1 justify-center">
                                        {inv.installmentsList.map((inst, idx) => (
                                          <span 
                                            key={inst.id || idx} 
                                            className={`w-2.5 h-2.5 rounded-full block border border-gray-100 ${
                                              inst.status === 'paid' ? 'bg-[#34c759]' : inst.status === 'partial' ? 'bg-[#0071e3]' : 'bg-gray-300'
                                            }`}
                                            title={`قسط ${inst.index}: ${inst.amount} SDG (${inst.status === 'paid' ? 'مسدد' : inst.status === 'partial' ? 'جزئي' : 'غير مسدد'})`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-[10px] italic">قسط رئيسي مفرد أو قديم</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  {(inv.amountRemaining || 0) > 0 ? (
                                    <span className="font-bold text-amber-700 font-mono block">
                                      {inv.installmentDate || "غير محدد"}
                                    </span>
                                  ) : (
                                    <span className="font-bold text-gray-400 block line-through">مكتمل السداد</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-left font-black font-mono">
                                  {inv.total.toLocaleString()} SDG
                                </td>
                                <td className="py-3.5 px-4 text-left font-mono text-emerald-700 font-bold">
                                  {inv.amountPaid?.toLocaleString()} SDG
                                </td>
                                <td className="py-3.5 px-4 text-left font-mono text-amber-700 font-black">
                                  {inv.amountRemaining?.toLocaleString()} SDG
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex justify-center">
                                    {(inv.amountRemaining || 0) > 0 ? (
                                      <button
                                        onClick={() => {
                                          setPayingInvoice(inv);
                                          setInstallmentPayAmountInput(inv.amountRemaining ? inv.amountRemaining.toString() : '');
                                        }}
                                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition whitespace-nowrap"
                                      >
                                        تسجيل تحصيل مالي
                                      </button>
                                    ) : (
                                      <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-[9px] font-bold">
                                        مكتمل ومعاد في الحساب
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* NESTED MODAL: PAY/COLLECT OUTSTANDING INSTALLMENT AMOUNT */}
              {payingInvoice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-2xl flex flex-col p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#f5f5f7] pb-3">
                      <h3 className="text-xs font-extrabold text-[#1d1d1f]">تسجيل تحصيل أقساط مجدولة</h3>
                      <button onClick={() => setPayingInvoice(null)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
 
                    <div className="bg-[#f5f5f7] rounded-xl p-3 text-xs space-y-1 block leading-normal text-right">
                      <span className="text-gray-500 font-bold block">الفاتورة المستهدفة: <strong className="font-mono text-[#1d1d1f] font-black">{payingInvoice.invoiceNumber}</strong></span>
                      <span className="text-gray-500 block">العميل المستفيد: <strong className="text-[#1d1d1f] font-black">{payingInvoice.customerName || "غير مسمى"}</strong></span>
                      <span className="text-gray-500 block">المبلغ الإجمالي للفاتورة: <strong className="text-[#1d1d1f] font-black">{payingInvoice.total.toLocaleString()} SDG</strong></span>
                      <span className="text-amber-800 font-bold block">المتبقي الآجل حالياً: <strong className="text-amber-700 font-black font-mono">{payingInvoice.amountRemaining?.toLocaleString()} SDG</strong></span>
                    </div>

                    {/* LIST OF STRUCTURED INDIVIDUAL INSTALLMENTS */}
                    {payingInvoice.installmentsList && payingInvoice.installmentsList.length > 0 && (
                      <div className="space-y-1.5 text-right border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-bold text-gray-500 block pb-1 border-b border-gray-100">تفاصيل وجدولة الدفعات لطلب التقسيط:</span>
                        <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1.5 scrollbar-thin">
                          {payingInvoice.installmentsList.map((inst) => {
                            const isPaid = inst.status === 'paid';
                            const isPartial = inst.status === 'partial';
                            return (
                              <div key={inst.id} className="flex items-center justify-between p-2 rounded-lg bg-[#f5f5f7] text-[10px]">
                                <div className="flex flex-col text-right leading-tight">
                                  <span className="font-bold text-gray-800">قسط {inst.index}: {inst.amount.toLocaleString()} SDG</span>
                                  <span className="text-[9px] text-gray-400 font-mono">تاريخ الاستحقاق: {inst.dueDate || "غير محدد"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {isPaid ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black shrink-0">مدفوع كاملاً</span>
                                  ) : (
                                    <>
                                      <span className={`px-1.5 py-0.5 rounded font-bold shrink-0 ${isPartial ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {isPartial ? `مسدد جزئياً (${inst.amountPaid} SDG)` : 'غير مسدد'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setInstallmentPayAmountInput((inst.amount - inst.amountPaid).toString())}
                                        className="bg-white border border-[#d2d2d7] rounded px-1.5 py-0.5 text-gray-700 hover:bg-gray-100 hover:text-black font-bold shadow-3xs text-[9px] transition"
                                      >
                                        اختيار التحصيل
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
 
                    <div className="space-y-1.5 text-right border-t border-gray-100 pt-3">
                      <label className="text-xs font-bold text-[#1d1d1f]">المبلغ المدفوع كقسط الآن (SDG):</label>
                      <input
                        type="number"
                        value={installmentPayAmountInput}
                        onChange={(e) => setInstallmentPayAmountInput(e.target.value)}
                        className="w-full text-sm font-mono px-3 py-2 border border-[#d2d2d7] rounded-xl bg-white focus:outline-none text-right"
                        min="1"
                        placeholder="أدخل قيمة القسط"
                      />
                    </div>
 
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleCollectInstallmentPayment}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 font-bold text-white text-xs rounded-xl transition shadow-sm"
                      >
                        تأكيد تحصيل المبالغ المحددة
                      </button>
                      <button
                        onClick={() => setPayingInvoice(null)}
                        className="px-4 py-2.5 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-xs font-bold hover:bg-gray-100 transition text-[#1d1d1f]"
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB 1.7: INTEGRATED CUSTOMERS LEDGER AND ACCOUNTS */}
          {/* ======================================================= */}
          {currentTab === 'customers' && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              <CustomersTab
                lang={lang}
                customers={customers}
                sales={sales}
                onSaveCustomers={saveCustomersToStorage}
                onSelectInvoiceForPrint={(inv) => {
                  setSelectedInvoice(inv);
                  setIsPrintModalOpen(true);
                }}
                addToast={(msg, type) => addToast(msg, type || 'success')}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: INVENTORY STOCK MANAGEMENT PAGE */}
          {/* ======================================================= */}
          {currentTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* SUB-TABS PILOTS: LIST, AUDIT & ADVANCED */}
              <div className="flex border-b border-[#d2d2d7] pb-px no-print overflow-x-auto whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setInventorySubTab('list')}
                  className={`px-5 py-3 text-xs font-bold transition-all relative shrink-0 ${
                    inventorySubTab === 'list' ? 'text-[#0071e3] border-b-2 border-[#0071e3] font-black' : 'text-[#6e6e73]'
                  }`}
                >
                  {lang === 'ar' ? '📋 قائمة المنتجات والأسعار' : '📋 Product Ledger List'}
                </button>
                <button
                  type="button"
                  onClick={() => setInventorySubTab('audit')}
                  className={`px-5 py-3 text-xs font-bold transition-all relative shrink-0 ${
                    inventorySubTab === 'audit' ? 'text-[#0071e3] border-b-2 border-[#0071e3] font-black' : 'text-[#6e6e73]'
                  }`}
                >
                  {lang === 'ar' ? '🔍 جرد المخزون الفعلي وتسوية الفوارق' : '🔍 Physical Inventory Audit & Adjustment'}
                </button>
                <button
                  type="button"
                  onClick={() => setInventorySubTab('advanced')}
                  className={`px-5 py-3 text-xs font-bold transition-all relative shrink-0 ${
                    inventorySubTab === 'advanced' ? 'text-purple-600 border-b-2 border-purple-600 font-extrabold' : 'text-[#6e6e73]'
                  }`}
                >
                  {lang === 'ar' ? '📦 إدارة المستودعات والتحويلات وقوائم الأسعار' : '📦 Multi-Warehouse & Price Lists Management'}
                </button>
              </div>

              {inventorySubTab === 'list' && (
                <>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{t('inventory')}</h2>
                  <p className="text-xs text-[#6e6e73]">{lang === 'ar' ? 'إدخال وتتبع بضائع الكراتين وأسعار الشراء والبيع والربحية' : 'Edit products, quantities, prices, and profit margins'}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={openAddProductModal}
                    className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('addProduct')}</span>
                  </button>

                  <button
                    onClick={() => setIsImporterOpen(true)}
                    className="px-4 py-2.5 bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#1d1d1f] rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>{t('importExcel')}</span>
                  </button>

                  {inventory.length > 0 && (
                    <button
                      onClick={() => {
                        const excelStock = inventory.map(p => ({
                          'اسم الصنف': p.name_ar,
                          'الفئة': p.category,
                          'عدد الكراتين': p.numCartons,
                          'حبات الكرتونة': p.piecesPerCarton,
                          'سعر شراء الكرتون': p.cartonPurchasePrice,
                          'سعر بيع الكرتون': p.cartonSellingPrice,
                          'سعر بيع الحبة': p.price,
                          'الكمية الأولية': p.initialQuantity,
                          'الكمية المتبقية': p.quantity,
                          'الوحدة': p.unit
                        }));
                        const ws = XLSX.utils.json_to_sheet(excelStock);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Stock Ledger");
                        XLSX.writeFile(wb, "Nile_Warehouse_Ledger.xlsx");
                        addToast(lang === 'ar' ? 'تم تصدير المخزون كملف إكسل' : 'Inventory exported successfully');
                      }}
                      className="px-4 py-2.5 bg-white border border-[#d2d2d7] hover:bg-[#f5f5f7] text-[#6e6e73] rounded-xl text-xs font-medium transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-[#0071e3]" />
                      <span>{lang === 'ar' ? 'تصدير كـ Excel' : 'Export Stock'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtering Search row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-white rounded-2xl p-4 border border-[#d2d2d7]">
                <div className="sm:col-span-8 relative">
                  <input
                    type="text"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full text-xs pl-3 pr-9 py-2.5 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7] focus:outline-none focus:border-[#0071e3]"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                </div>

                <div className="sm:col-span-4 select-none">
                  <select
                    value={inventoryCategoryFilter}
                    onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7] focus:outline-none"
                  >
                    <option value="all">{t('allCategories')}</option>
                    <option value="حديد تسليح وتصنيع">{t('catRebar')}</option>
                    <option value="أسمنت ومواد جافة">{t('catCement')}</option>
                    <option value="طوب وبلوك وحصى">{t('catBricks')}</option>
                    <option value="سباكة وأدوات صحية">{t('catPlumbing')}</option>
                    <option value="كهربائيات وإنارة">{t('catElectrical')}</option>
                    <option value="بوهيات ومواد طلاء">{t('catPaints')}</option>
                    <option value="عدد وأدوات يدوية">{t('catTools')}</option>
                    <option value="أخرى">{t('catOthers')}</option>
                  </select>
                </div>
              </div>

              {/* Inventory details ledger table container */}
              <div className="bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right bg-white">
                    <thead className="bg-[#f5f5f7] border-b border-[#d2d2d7] text-[#1d1d1f] text-xs font-bold leading-normal">
                      <tr>
                        <th onClick={() => toggleSort('name_ar')} className="py-3.5 px-4 cursor-pointer hover:text-[#0071e3] transition">اسم الصنف</th>
                        <th className="py-3.5 px-4 text-center">التعبئة والخطة</th>
                        <th className="py-3.5 px-3 text-center">الكمية الأساسية</th>
                        <th className="py-3.5 px-3 text-center">المباعة</th>
                        <th className="py-3.5 px-3 text-center">المتبقية</th>
                        <th className="py-3.5 px-4 text-left">شراء الكرتون</th>
                        <th className="py-3.5 px-4 text-left font-extrabold text-emerald-800">شراء الحبة</th>
                        <th className="py-3.5 px-4 text-left">بيع الحبة</th>
                        <th className="py-3.5 px-3 text-center">الربح %</th>
                        <th className="py-3.5 px-4 text-center">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f5f7] text-[11px]">
                      {sortedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-[#6e6e73]">
                            لا توجد بضائع مخزنة حالياً مطابقة لشروط البحث.
                          </td>
                        </tr>
                      ) : (
                        sortedProducts.map((p) => {
                          const isLowStock = p.quantity <= settings.lowStockThreshold;
                          const isOutOfStock = p.quantity === 0;

                          const soldQty = Math.max(0, (p.initialQuantity || 0) - p.quantity);
                          const profitAmount = p.price - (p.purchasePricePiece || 0);
                          const profitMarginPercent = p.purchasePricePiece > 0 
                            ? Math.round((profitAmount / p.purchasePricePiece) * 100) 
                            : 0;

                          return (
                            <tr key={p.id} className="hover:bg-[#f5f5f7]/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-[#1d1d1f]">
                                <div>{p.name_ar}</div>
                                {p.name_en && p.name_en !== p.name_ar && (
                                  <div className="text-[9px] text-gray-400 font-sans" dir="ltr">{p.name_en}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold font-mono">
                                  {p.numCartons} كرتون × {p.piecesPerCarton} حبة
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-[#1d1d1f]">
                                {p.initialQuantity} <span className="text-[10px] font-sans font-normal text-gray-400">قطعة</span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-[#6e6e73]">
                                {soldQty}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className={`font-black ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600'}`}>
                                  {p.quantity} حبة
                                </span>
                                {p.piecesPerCarton > 1 && p.quantity > 0 && (
                                  <div className="text-[10px] text-[#6e6e73] font-bold block mt-0.5">
                                    {formatProductStock(p.quantity, p.piecesPerCarton, lang)}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-left font-mono text-gray-600">
                                {p.cartonPurchasePrice ? `${p.cartonPurchasePrice.toLocaleString()} SDG` : '-'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-black text-emerald-800">
                                {p.purchasePricePiece ? `${Math.round(p.purchasePricePiece).toLocaleString()} SDG` : '-'}
                              </td>
                              <td className="py-3 px-4 text-left font-mono font-bold text-[#1d1d1f]">
                                {p.price.toLocaleString()} SDG
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className={`px-1.5 py-0.5 rounded-md font-bold ${profitMarginPercent > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
                                  {profitMarginPercent}%
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-[#6e6e73]">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditProductModal(p)}
                                    className="p-1 hover:bg-blue-50 hover:text-[#0071e3] rounded transition-all"
                                    title={t('edit')}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProductConfirm(p)}
                                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded transition-all"
                                    title={t('delete')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {inventorySubTab === 'audit' && (
            <InventoryAuditTab
              lang={lang}
              isDarkMode={isDarkMode}
              inventory={inventory}
              audits={audits}
              sales={sales}
              currentUser={currentUser}
              onSaveInventory={saveInventoryToStorage}
              onSaveAudits={saveAuditsToStorage}
              addToast={addToast}
            />
          )}

          {false && (
            <div className="space-y-6">
              {/* Title and description */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
                    {lang === 'ar' ? '🔍 جرد المخزن الفعلي وتسوية الفوارق' : '🔍 Physical Inventory Audit & Adjustment'}
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    {lang === 'ar' 
                      ? 'قم بمطابقة كميات البضائع المادية يدوياً وتعديل الأرصدة بالسيستم وتبرير فروقات الجرد لضمان دقة العمل والعمليات.' 
                      : 'Perform periodic hand count audits, override shelf levels, and calculate financial variance automatically.'}
                  </p>
                </div>

                {/* Export previous audits list to Excel */}
                {audits.length > 0 && (
                  <button
                    onClick={() => {
                      const excelAudits = audits.map(a => ({
                        'تاريخ التسوية': new Date(a.createdAt).toLocaleString(),
                        'اسم الصنف': a.productNameAr,
                        'الكمية بالسيستم قبل': `${a.totalPiecesBefore} حبة (${a.numCartonsBefore} كرتون + ${a.piecesBefore} حبة)`,
                        'الكمية الفعلية بالجرد': `${a.totalPiecesAfter} حبة (${a.numCartonsAfter} كرتون + ${a.piecesAfter} حبة)`,
                        'الفارق بالقطع': a.discrepancyPcs > 0 ? `+${a.discrepancyPcs}` : a.discrepancyPcs,
                        'تنظيم الأثر المالي (SDG)': a.discrepancyValueSDG,
                        'ملاحظات': a.notes
                      }));
                      const ws = XLSX.utils.json_to_sheet(excelAudits);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Audit Adjustments");
                      XLSX.writeFile(wb, "Nile_Warehouse_Audits_Logs.xlsx");
                      addToast(lang === 'ar' ? 'تم تصدير سجلات الجرد بنجاح' : 'Audit logs exported successfully');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 select-none self-start"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'تصدير كمحضر جرد Excel' : 'Export Audits Report'}</span>
                  </button>
                )}
              </div>

              {/* Quick dashboard cards for Inventory Audits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#d2d2d7] rounded-[20px] p-5 flex items-center gap-4 shadow-xs">
                  <div className="p-3 bg-blue-50 text-[#0071e3] rounded-full">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-extrabold uppercase block">{lang === 'ar' ? 'عمليات الجرد والضبط الموثقة' : 'Recorded Physical Audits'}</span>
                    <div className="text-lg font-black text-[#1d1d1f] font-mono leading-none mt-1">{audits.length} عملية</div>
                  </div>
                </div>

                <div className="bg-white border border-[#d2d2d7] rounded-[20px] p-5 flex items-center gap-4 shadow-xs">
                  <div className="p-3 bg-red-50 text-red-500 rounded-full">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-extrabold uppercase block">{lang === 'ar' ? 'خسائر عجز بضاعة (سعر شراء)' : 'Financial Inventory Shrinkage (Cost)'}</span>
                    <div className="text-lg font-black text-red-650 font-mono leading-none mt-1">
                      {audits.filter(a => a.discrepancyValueSDG < 0).reduce((sum, a) => sum + Math.abs(a.discrepancyValueSDG), 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#d2d2d7] rounded-[20px] p-5 flex items-center gap-4 shadow-xs">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6e6e73] font-extrabold uppercase block">{lang === 'ar' ? 'فوائض البضائع المكتشفة بالرف' : 'Surplus Goods Found (Cost)'}</span>
                    <div className="text-lg font-black text-emerald-600 font-mono leading-none mt-1">
                      {audits.filter(a => a.discrepancyValueSDG > 0).reduce((sum, a) => sum + a.discrepancyValueSDG, 0).toLocaleString()} <span className="text-xs">SDG</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Audit Interaction Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Perform Audit Form */}
                <div className="lg:col-span-5 bg-white border border-[#d2d2d7] rounded-3xl p-5 md:p-6 space-y-5 shadow-xs h-fit self-start">
                  <div className="border-b border-gray-150 pb-3">
                    <h4 className="text-xs font-black text-[#1d1d1f] flex items-center gap-1.5 uppercase tracking-wider">
                      <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'مطبخ إجراء تسوية جرد جديدة' : 'New Audit Reconciliation'}</span>
                    </h4>
                  </div>

                  {/* Dropdown product select */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-gray-500 block">{lang === 'ar' ? 'الصنف المستهدف بالجرد:' : 'Target Product to Count:'}</label>
                    <select
                      value={auditProductId}
                      onChange={(e) => {
                        const pId = e.target.value;
                        setAuditProductId(pId);
                        const matched = inventory.find(p => p.id === pId);
                        if (matched) {
                          if (matched.piecesPerCarton > 1) {
                            setAuditCartons(Math.floor(matched.quantity / matched.piecesPerCarton));
                            setAuditPieces(matched.quantity % matched.piecesPerCarton);
                          } else {
                            setAuditCartons('');
                            setAuditPieces(matched.quantity);
                          }
                        } else {
                          setAuditCartons('');
                          setAuditPieces('');
                        }
                        setAuditNotes('');
                      }}
                      className="w-full text-xs px-3.5 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] font-bold text-[#1d1d1f]"
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر منتج من المخزن لجرده...' : 'Select a product to count...'} --</option>
                      {inventory.map(p => (
                        <option key={p.id} value={p.id}>
                          {lang === 'ar' ? p.name_ar : p.name_en} ({p.quantity} حبة)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAuditProduct ? (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Current Book Level Summary */}
                      <div className="bg-[#f5f5f7] rounded-2xl p-4 border border-[#e2e2e7] space-y-2">
                        <span className="text-[9px] text-[#6e6e73] font-black uppercase text-right block">{lang === 'ar' ? 'الحالة الحالية بالسيستم (دفتري)' : 'CURRENT BOOK STATUS'}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#1d1d1f]">{lang === 'ar' ? 'الكمية الكلية الحالية:' : 'Total quantity:'}</span>
                          <span className="text-xs font-black font-mono text-[#0071e3] bg-blue-50/50 px-2 py-1 rounded-lg">{selectedAuditProduct.quantity} حبة</span>
                        </div>
                        {selectedAuditProduct.piecesPerCarton > 1 && (
                          <div className="flex items-center justify-between border-t border-dashed border-[#d2d2d7] pt-2 text-[10px] text-gray-500">
                            <span>{lang === 'ar' ? 'تفكيك الكراتين بالسيستم:' : 'System detailed Breakdown:'}</span>
                            <span className="font-bold">
                              {Math.floor(selectedAuditProduct.quantity / selectedAuditProduct.piecesPerCarton)} كرتون + {selectedAuditProduct.quantity % selectedAuditProduct.piecesPerCarton} حبة
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-dashed border-[#d2d2d7] pt-2 text-[10px] text-gray-500">
                          <span>{lang === 'ar' ? 'سعر تكلفة الحبة المعتمد:' : 'Unit Purchase Cost:'}</span>
                          <span className="font-bold font-mono text-emerald-800">
                            {selectedAuditProduct.purchasePricePiece ? `${Math.round(selectedAuditProduct.purchasePricePiece).toLocaleString()} SDG` : '0 SDG'}
                          </span>
                        </div>
                      </div>

                      {/* Manual counted count inputs */}
                      <div className="bg-emerald-50/10 border border-emerald-100 rounded-2xl p-4 space-y-4">
                        <span className="text-[9px] text-emerald-800 font-black uppercase block">{lang === 'ar' ? 'الكمية الفعلية المقاسة على الرف (عد يدوي):' : 'ACTUAL HAND COUNTED VALUES (SHELF)'}</span>
                        
                        {selectedAuditProduct.piecesPerCarton > 1 ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-600 block">{lang === 'ar' ? 'عدد الكراتين الكاملة:' : 'Full Pack Cartons:'}</label>
                              <input
                                type="number"
                                min="0"
                                value={auditCartons}
                                onChange={(e) => setAuditCartons(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold text-center px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-emerald-600 text-[#1d1d1f]"
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-600 block">{lang === 'ar' ? 'الحبات السائبة الزائدة:' : 'Extra Pieces Count:'}</label>
                              <input
                                type="number"
                                min="0"
                                value={auditPieces}
                                onChange={(e) => setAuditPieces(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full text-xs font-mono font-bold text-center px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-emerald-600 text-[#1d1d1f]"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-600 block">{lang === 'ar' ? 'إجمالي عدد الحبات الكلي الفعلي بالرف:' : 'Total Pieces counted:'}</label>
                            <input
                              type="number"
                              min="0"
                              value={auditPieces}
                              onChange={(e) => setAuditPieces(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full text-xs font-mono font-bold text-center px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-emerald-600 text-[#1d1d1f]"
                              placeholder="0"
                            />
                          </div>
                        )}

                        <div className="flex justify-between items-center bg-white border border-[#e2e2e7] rounded-xl px-3 py-2 text-xs">
                          <span className="text-[#6e6e73]">{lang === 'ar' ? 'إجمالي الحبات بالجرد الفعلي:' : 'Total Pieces in physical count:'}</span>
                          <span className="font-extrabold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">{actualCountedPieces} حبة</span>
                        </div>
                      </div>

                      {/* Live Discrepancy indicator and Financial impact */}
                      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                        discrepancyPcs === 0 
                          ? 'bg-gray-50 border-gray-200' 
                          : discrepancyPcs > 0 
                            ? 'bg-emerald-50/30 border-emerald-250' 
                            : 'bg-rose-50/30 border-rose-250'
                      }`}>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-[#6e6e73] font-black uppercase block">{lang === 'ar' ? 'فارق الجرد الفعلي:' : 'PHYSICAL DISCREPANCY'}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {discrepancyPcs === 0 ? (
                              <span className="text-xs font-bold text-gray-750">{lang === 'ar' ? 'متطابق تماماً' : 'Matched perfectly'}</span>
                            ) : (
                              <span className={`text-xs font-extrabold ${discrepancyPcs > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {discrepancyPcs > 0 ? `+${discrepancyPcs}` : discrepancyPcs} حبة 
                                {discrepancyPcs > 0 ? ` (${lang === 'ar' ? 'وفر زائد' : 'excess'})` : ` (${lang === 'ar' ? 'عجز مفقود' : 'shortage'})`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[9px] text-[#6e6e73] font-black block">{lang === 'ar' ? 'الأثر المالي المترتب:' : 'COST IMPACT AMOUNT'}</span>
                          <span className={`text-xs font-mono font-black ${discrepancyPcs === 0 ? 'text-gray-700' : discrepancyPcs > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {discrepancyValueSDG > 0 ? '+' : ''}{Math.round(discrepancyValueSDG).toLocaleString()} SDG
                          </span>
                        </div>
                      </div>

                      {/* Notes and corrections description */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#1d1d1f] block">{lang === 'ar' ? 'ملاحظات وتبرير الضبط الفعلي للرف:' : 'Audit logs & adjustments justification:'}</label>
                        <textarea
                          rows={2}
                          value={auditNotes}
                          onChange={(e) => setAuditNotes(e.target.value)}
                          className="w-full text-xs p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] transition text-[#1d1d1f]"
                          placeholder={lang === 'ar' ? 'أي ملاحظات جرد (مثال: جرد سنوي، معالجة تلف من رطوبة، كسر شاحنات، إلخ)...' : 'Type logs context...'}
                        />
                        {/* Fast suggestions tags */}
                        <div className="flex flex-wrap gap-1">
                          {[(lang === 'ar' ? 'جرد دوري شهري' : 'Regular Monthly Count'), 
                            (lang === 'ar' ? 'تلف بضاعة أو كسر' : 'Damaged Stock'), 
                            (lang === 'ar' ? 'خطأ كاشير إدخال سابق' : 'Cashier Entry Fix'), 
                            (lang === 'ar' ? 'تسوية بضائع تأسيسية' : 'Warehouse Setup Count')].map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAuditNotes(tag)}
                              className="text-[9px] bg-[#f5f5f7] text-[#6e6e73] font-bold border border-[#d2d2d7] px-2 py-0.5 rounded-md hover:bg-gray-200 transition"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Adjustment */}
                      <button
                        type="button"
                        onClick={() => {
                          handleApplyAuditAdjustment(
                            selectedAuditProduct, 
                            Number(auditCartons) || 0, 
                            Number(auditPieces) || 0, 
                            auditNotes
                          );
                          // Reset selection Form
                          setAuditProductId('');
                          setAuditCartons('');
                          setAuditPieces('');
                          setAuditNotes('');
                        }}
                        className="w-full py-3 bg-[#1d1d1f] hover:bg-black text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 select-none shadow-xs"
                      >
                        <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                        <span>{lang === 'ar' ? 'حفظ وضبط كميات المستودع الحالية' : 'Commit Audit & Refresh Levels'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center text-[#6e6e73] border border-dashed border-[#d2d2d7] rounded-2xl flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-gray-300" />
                      <p className="text-xs font-semibold max-w-[250px]">
                        {lang === 'ar' 
                          ? 'تفقد الرف يدوياً، ثم اختر بضاعة المستودع المرادة هنا لبدء مطابقة وجرد مخزونها وتحديث أرقامه فوراً.' 
                          : 'Select a warehouse product from the list above to view real time discrepancies and save audit logs.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Archives and Logs of Audits (Right block) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center gap-3 bg-white p-4 border border-[#d2d2d7] rounded-2xl">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={auditSearch}
                        onChange={(e) => setAuditSearch(e.target.value)}
                        placeholder={lang === 'ar' ? 'بحث في سجل التعديلات (باسم الصنف أو ملاحظة المحضر)...' : 'Search adjustments logs by product or tag...'}
                        className="w-full text-xs pl-3 pr-9 py-2.5 bg-[#f5f5f7] rounded-xl border border-[#d2d2d7] focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute top-3 right-3" />
                    </div>
                    <div className="text-xs font-black text-gray-500 block shrink-0 font-mono">
                      {audits.length} {lang === 'ar' ? 'سجل' : 'Logs'}
                    </div>
                  </div>

                  <div className="bg-white border border-[#d2d2d7] rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right bg-white text-[11px] select-none leading-relaxed">
                        <thead className="bg-[#f5f5f7] border-b border-[#d2d2d7] text-[#1d1d1f] font-bold text-xs">
                          <tr>
                            <th className="py-3 px-3">{lang === 'ar' ? 'تاريخ التسوية' : 'Timestamp'}</th>
                            <th className="py-3 px-3">{lang === 'ar' ? 'اسم الصنف' : 'Product'}</th>
                            <th className="py-3 px-2 text-center">{lang === 'ar' ? 'الرصيد السابق' : 'Before'}</th>
                            <th className="py-3 px-2 text-center">{lang === 'ar' ? 'رصيد الجرد الفعلي' : 'Counted'}</th>
                            <th className="py-3 px-2 text-center">{lang === 'ar' ? 'الفارق بالقطع' : 'Pcs Diff'}</th>
                            <th className="py-3 px-3 text-left">{lang === 'ar' ? 'الأثر المالي' : 'Financial Value'}</th>
                            <th className="py-3 px-3">{lang === 'ar' ? 'الملاحظات والسبب' : 'Notes'}</th>
                            <th className="py-3 px-2 text-center">{lang === 'ar' ? 'إجرء' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f5f5f7]">
                          {audits.filter(a => {
                            const q = auditSearch.toLowerCase();
                            return (
                              a.productNameAr.toLowerCase().includes(q) ||
                              (a.productNameEn || '').toLowerCase().includes(q) ||
                              (a.notes || '').toLowerCase().includes(q)
                            );
                          }).length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-[#6e6e73]">
                                {lang === 'ar' ? 'لا توجود تسويات جرد محفوظة مطابقة لبحثك في الأرشيف.' : 'No audit entries documented yet.'}
                              </td>
                            </tr>
                          ) : (
                            audits
                              .filter(a => {
                                const q = auditSearch.toLowerCase();
                                return (
                                  a.productNameAr.toLowerCase().includes(q) ||
                                  (a.productNameEn || '').toLowerCase().includes(q) ||
                                  (a.notes || '').toLowerCase().includes(q)
                                );
                              })
                              .map((rec) => {
                                const isPositive = rec.discrepancyPcs >= 0;
                                return (
                                  <tr key={rec.id} className="hover:bg-gray-50/50 transition duration-150">
                                    <td className="py-3 px-3 whitespace-nowrap text-gray-500 font-mono">
                                      {new Date(rec.createdAt).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-3 font-bold text-[#1d1d1f]">
                                      {lang === 'ar' ? rec.productNameAr : rec.productNameEn}
                                    </td>
                                    <td className="py-3 px-2 text-center font-mono font-bold text-gray-400">
                                      {rec.totalPiecesBefore} حبة
                                    </td>
                                    <td className="py-3 px-2 text-center font-mono font-bold text-emerald-800 bg-emerald-50/15">
                                      {rec.totalPiecesAfter} حبة
                                    </td>
                                    <td className="py-3 px-2 text-center font-mono">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                        rec.discrepancyPcs === 0 
                                          ? 'bg-gray-100 text-gray-700' 
                                          : isPositive 
                                            ? 'bg-emerald-50 text-emerald-700' 
                                            : 'bg-rose-50 text-rose-700'
                                      }`}>
                                        {rec.discrepancyPcs > 0 ? '+' : ''}{rec.discrepancyPcs}
                                      </span>
                                    </td>
                                    <td className={`py-3 px-3 text-left font-mono font-black ${isPositive ? 'text-emerald-700' : 'text-red-600'}`}>
                                      {rec.discrepancyValueSDG > 0 ? '+' : ''}{Math.round(rec.discrepancyValueSDG).toLocaleString()} SDG
                                    </td>
                                    <td className="py-3 px-3 text-gray-500 max-w-[130px] truncate" title={rec.notes}>
                                      {rec.notes}
                                    </td>
                                    <td className="py-3 px-2 text-center font-bold">
                                      <button
                                        onClick={() => {
                                          if (confirm(lang === 'ar' ? 'هل تود بالتأكيد حذف هذا السجل التاريخي لجرد الصنف؟ لا يمكن عكس هذه العملية.' : 'Delete entry? (No undo)')) {
                                            const updated = audits.filter(item => item.id !== rec.id);
                                            saveAuditsToStorage(updated);
                                            addToast(lang === 'ar' ? 'تم حذف السجل التاريخي بنجاح' : 'Audit entry deleted', 'info');
                                          }
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-1 transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {inventorySubTab === 'advanced' && (
            <InventoryManager
              lang={lang}
              inventory={inventory}
              onSaveInventory={saveInventoryToStorage}
              warehouses={warehouses}
              onSaveWarehouses={saveWarehousesToStorage}
              stockTransfers={stockTransfers}
              onSaveStockTransfers={saveStockTransfersToStorage}
              priceLists={priceLists}
              onSavePriceLists={savePriceListsToStorage}
              settings={settings}
              onSaveSettings={saveSettingsToStorage}
              addToast={addToast}
            />
          )}
        </motion.div>
      )}

          {/* ======================================================= */}
          {/* TAB 3: FINANCE & CASHFLOW HUB */}
          {/* ======================================================= */}
          {currentTab === 'expenses' && (
            <FinanceTab
              expenses={expenses}
              onSaveExpenses={saveExpensesToStorage}
              safes={safes}
              onSaveSafes={saveSafesToStorage}
              bankAccounts={bankAccounts}
              onSaveBankAccounts={saveBankAccountsToStorage}
              financeTransactions={financeTransactions}
              onSaveFinanceTransactions={saveFinanceTransactionsToStorage}
              financeSettings={financeSettings}
              onSaveFinanceSettings={saveFinanceSettingsToStorage}
              sales={sales}
              lang={lang}
              currency={settings.currency}
              addToast={addToast}
            />
          )}

          {/* ======================================================= */}
          {/* TAB 4: PURCHASING & SUPPLY CHAIN HUB */}
          {/* ======================================================= */}
          {currentTab === 'china' && (
            <PurchasesTab
              lang={lang}
              currency={settings.currency}
              inventory={inventory}
              onSaveInventory={saveInventoryToStorage}
              chinaTransfers={chinaTransfers}
              onAddTransfer={(newTr) => saveChinaTransfersToStorage([newTr, ...chinaTransfers])}
              onDeleteTransfer={(id) => saveChinaTransfersToStorage(chinaTransfers.filter(tr => tr.id !== id))}
              suppliers={suppliers}
              onSaveSuppliers={saveSuppliersToStorage}
              purchaseRequests={purchaseRequests}
              onSavePurchaseRequests={savePurchaseRequestsToStorage}
              rfqs={rfqs}
              onSaveRfqs={saveRfqsToStorage}
              purchaseOrders={purchaseOrders}
              onSavePurchaseOrders={savePurchaseOrdersToStorage}
              purchaseInvoices={purchaseInvoices}
              onSavePurchaseInvoices={savePurchaseInvoicesToStorage}
              purchaseReturns={purchaseReturns}
              onSavePurchaseReturns={savePurchaseReturnsToStorage}
              debitNotes={debitNotes}
              onSaveDebitNotes={saveDebitNotesToStorage}
              supplierPayments={supplierPayments}
              onSaveSupplierPayments={saveSupplierPaymentsToStorage}
              purchaseSettings={purchaseSettings}
              onSavePurchaseSettings={savePurchaseSettingsToStorage}
              addToast={addToast}
            />
          )}

          {/* ======================================================= */}
          {/* TAB 4.5: MULTI-BRANCH NETWORK HUB */}
          {/* ======================================================= */}
          {currentTab === 'branches' && (
            <motion.div
              key="branches"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <BranchesManager
                branches={branches}
                warehouses={warehouses}
                safes={safes}
                sales={sales}
                expenses={expenses}
                onAddBranch={handleAddBranch}
                onUpdateBranch={handleUpdateBranch}
                onDeleteBranch={handleDeleteBranch}
                lang={lang}
                currency={settings.currency}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: ADVANCED LEDGER & PERFORMANCE REPORTS */}
          {/* ======================================================= */}
          {currentTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <ReportsTab
                sales={sales}
                inventory={inventory}
                expenses={expenses}
                chinaTransfers={chinaTransfers}
                suppliers={suppliers}
                purchaseInvoices={purchaseInvoices}
                purchaseReturns={purchaseReturns}
                supplierPayments={supplierPayments}
                customers={customers}
                safes={safes}
                bankAccounts={bankAccounts}
                financeTransactions={financeTransactions}
                lang={lang}
                currency={settings.currency}
                addToast={addToast}
                setSelectedInvoice={setSelectedInvoice}
                setIsPrintModalOpen={setIsPrintModalOpen}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB 6: SYSTEM GLOBAL CONFIG SETTINGS */}
          {/* ======================================================= */}
          {currentTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 max-w-2xl mx-auto"
            >
              <div>
                <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">{t('settingsTitle')}</h2>
                <p className="text-xs text-[#6e6e73]">تخصيص البيانات الفوقية للفاتورة وعتبات التنبيه والضرائب</p>
              </div>

              {/* Subscription Status Card */}
              <div className="bg-white rounded-[24px] border border-[#d2d2d7] p-6 space-y-4 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-amber-500 to-indigo-500"></div>
                <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>تفاصيل اشتراكي وباقة الخدمة</span>
                    </h3>
                    <p className="text-[10px] text-[#6e6e73]">
                      متابعة وضع اشتراكك الفعلي وترقية الباقات لتجنب توقف الخدمات المحاسبية
                    </p>
                  </div>
                  {currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' ? (
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto select-none">
                      حساب الإدارة والملك المالك 👑
                    </span>
                  ) : (
                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold self-start sm:self-auto border select-none ${
                      currentUser?.subscriptionStatus === 'active' 
                        ? 'bg-green-50 text-green-600 border-green-200' 
                        : 'bg-red-50 text-[#ea4335] border-red-200'
                    }`}>
                      {currentUser?.subscriptionStatus === 'active' ? 'الحساب نشط ومفعل' : 'الاشتراك منتهي أو متوقف'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#f5f5f7]/60 p-4 rounded-xl border border-[#d2d2d7]/30 text-xs text-[#1d1d1f]">
                  <div className="space-y-1.5">
                    <span className="text-gray-400 block text-[10px] font-semibold">باقة الاشتراك الحالية</span>
                    <span className="font-extrabold block text-gray-800 text-sm">
                      {currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' ? 'الإدارة العامة ومتابعة SaaS' : (
                        currentUser?.subscriptionPlan === 'monthly' ? 'الخطة الشهرية المدفوعة' :
                        currentUser?.subscriptionPlan === 'annual' ? 'الخطة السنوية الاحترافية' : 'باقة تجريبية / غير محددة'
                      )}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-gray-400 block text-[10px] font-semibold">تاريخ نهاية صلاحية الاشتراك</span>
                    <span className="font-extrabold block text-gray-800 text-sm">
                      {currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' ? 'صلاحية أبدية مدى الحياة' : (
                        currentUser?.subscriptionExpiry 
                          ? new Date(currentUser.subscriptionExpiry).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) 
                          : 'غير محدد'
                      )}
                    </span>
                  </div>
                </div>

                {currentUser?.email.trim().toLowerCase() !== 'hisham.yo005@gmail.com' && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-[#d2d2d7]/50 pt-3">
                    <p className="text-gray-500 text-[10px] max-w-sm">
                      ترقية اشتراكك من شهري لسنوي يتيح لك مزايا إضافية وخصومات حصرية ويوفر عليك تكلفة التجديد الدوري!
                    </p>
                    <a
                      href={`https://wa.me/249997444409?text=${encodeURIComponent(
                        `أهلاً أستاذ هشام، أرغب في ترقية اشتراكي في نظام المبيعات والمخازن إلى الخطة السنوية لزيادة فترة الصلاحية. الحساب: ${currentUser?.email} (الاسم: ${currentUser?.name}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 bg-[#25D366] text-white hover:bg-[#20ba59] transition font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-xs"
                    >
                      <span className="font-mono">WhatsApp</span>
                      <span>ترقية الخطة إلى سنوي 🚀</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Store details form */}
              <form onSubmit={handleSaveStoreSettings} className={`rounded-[24px] border p-6 space-y-5 shadow-xs transition-colors duration-300 ${isDarkMode ? 'bg-[#1c1c1e] border-zinc-800 text-zinc-100' : 'bg-white border-[#d2d2d7] text-[#1d1d1f]'}`}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-300' : 'text-[#1d1d1f]'}`}>{t('storeName')}</label>
                      <input
                        type="text"
                        value={settings.storeName}
                        onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3] focus:ring-[#0071e3]' 
                            : 'bg-white border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[#0071e3]'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-300' : 'text-[#1d1d1f]'}`}>الشعار أو السطر التعريفي للمحل والشركة</label>
                      <input
                        type="text"
                        value={settings.storeTagline !== undefined ? settings.storeTagline : ''}
                        onChange={(e) => setSettings({ ...settings, storeTagline: e.target.value })}
                        placeholder="مثل: شريك استراتيجي في الابتكار"
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3] focus:ring-[#0071e3]' 
                            : 'bg-white border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[#0071e3]'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 select-none">
                      <label className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-300' : 'text-[#1d1d1f]'}`}>{t('currency')}</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none ${
                          isDarkMode 
                            ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3]' 
                            : 'bg-[#f5f5f7] border-[#d2d2d7] focus:border-[#0071e3]'
                        }`}
                      >
                        <option value="SDG" className={isDarkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-black'}>{t('currencySDG')}</option>
                        <option value="CNY" className={isDarkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-black'}>اليوان الصيني (¥ CNY)</option>
                        <option value="USD" className={isDarkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-black'}>دولار أمريكي (USD)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-300' : 'text-[#1d1d1f]'}`}>{t('alertStockLevel')}</label>
                      <input
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => setSettings({ ...settings, lowStockThreshold: Math.max(0, parseInt(e.target.value) || 0) })}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3] focus:ring-[#0071e3]' 
                            : 'bg-white border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[#0071e3]'
                        }`}
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Tax values enabled options */}
                  <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${isDarkMode ? 'bg-[#2c2c2e]/50 text-white' : 'bg-[#f5f5f7]'}`}>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold">{t('taxEnabled')}</span>
                      <p className={`text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-gray-400'}`}>إذا كان قيد التمكين، فسيتم اقتطاع الضريبة التلقائية لعمليات المبيعات.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.isTaxEnabled}
                      onChange={(e) => setSettings({ ...settings, isTaxEnabled: e.target.checked })}
                      className="w-5 h-5 accent-[#0071e3] cursor-pointer"
                    />
                  </div>

                  {settings.isTaxEnabled && (
                    <div className="space-y-1.5">
                      <label className={`text-xs font-bold block ${isDarkMode ? 'text-zinc-300' : 'text-[#1d1d1f]'}`}>معدل الضريبة (%)</label>
                      <input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                        className={`w-full text-xs px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-1 ${
                          isDarkMode 
                            ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3] focus:ring-[#0071e3]' 
                            : 'bg-white border-[#d2d2d7] focus:border-[#0071e3] focus:ring-[#0071e3]'
                        }`}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  )}

                  {/* Logo Configuration Block */}
                  <div className={`border-t pt-5 mt-4 space-y-4 ${isDarkMode ? 'border-zinc-800/80' : 'border-[#d2d2d7]/50'}`}>
                    <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-white' : 'text-[#1d1d1f]'}`}>
                      <ImageIcon className="w-4 h-4 text-[#0071e3]" />
                      <span>{lang === 'ar' ? 'شعار وهُوية الشركة (تعديل وتنسيق الصورة)' : 'Company Logo & Styling (Resize & Frame)'}</span>
                    </h4>
                    <p className={`text-[10px] ${isDarkMode ? 'text-zinc-400' : 'text-[#6e6e73]'}`}>
                      {lang === 'ar' 
                        ? 'قم بتحميل أو إدخال رابط الشعار الخاص بشركتك ليتم عرضه في أعلى ترويسة التطبيق بجمالية فائقة وتنسيقه حسب رغبتك.' 
                        : 'Upload or paste your company logo image to display it in the header banner with custom formatting.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Action Column for selection */}
                      <div className="space-y-3">
                        <label className={`text-[11px] font-bold block ${isDarkMode ? 'text-zinc-450' : 'text-gray-500'}`}>
                          {lang === 'ar' ? 'مصدر أو صورة الشعار:' : 'Logo Image Source:'}
                        </label>
                        
                        {/* Option to Upload file */}
                        <div 
                          className={`border-2 border-dashed transition rounded-2xl p-4 text-center cursor-pointer relative group ${
                            isDarkMode 
                              ? 'border-zinc-700 hover:border-[#0071e3] bg-[#2c2c2e]/40' 
                              : 'border-[#d2d2d7] hover:border-[#0071e3] bg-[#f5f5f7]/40'
                          }`}
                          onClick={() => document.getElementById('logoFileInput')?.click()}
                        >
                          <input 
                            type="file" 
                            id="logoFileInput" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  if (event.target?.result) {
                                    try {
                                      const compressed = await compressLogoImage(event.target.result as string);
                                      setSettings({ ...settings, logoUrl: compressed });
                                      addToast(lang === 'ar' ? 'تم استيراد شعار الشركة وضغطه بنجاح!' : 'Company logo loaded and compressed successfully!', 'success');
                                    } catch (err) {
                                      console.error("Error compressing logo image:", err);
                                      setSettings({ ...settings, logoUrl: event.target.result as string });
                                    }
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-[#0071e3] transition animate-bounce" />
                          <span className="text-[11px] font-bold block">{lang === 'ar' ? 'اختر ملف صورة من جهازك' : 'Choose an image file'}</span>
                          <span className="text-[9px] text-gray-400 block mt-0.5">
                            {lang === 'ar' ? 'يدعم السحب والإفلات (PNG, JPG, SVG)' : 'Supports drag & drop (PNG, JPG, SVG)'}
                          </span>
                        </div>

                        {/* Option to paste URL */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 block">
                            {lang === 'ar' ? 'أو أدخل رابط الشعار مباشرة من الإنترنت:' : 'Or enter a direct image web link:'}
                          </span>
                          <input
                            type="text"
                            placeholder="https://example.com/logo.png"
                            value={settings.logoUrl || ''}
                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                            className={`w-full text-xs px-3 py-2 border rounded-xl focus:outline-none ${
                              isDarkMode 
                                ? 'bg-[#2c2c2e] border-zinc-700 text-white focus:border-[#0071e3]' 
                                : 'bg-white border-[#d2d2d7] focus:border-[#0071e3]'
                            }`}
                          />
                        </div>

                        {settings.logoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setSettings({ ...settings, logoUrl: '' });
                              addToast(lang === 'ar' ? 'تم إزالة الشعار الخاص' : 'Custom logo removed', 'info');
                            }}
                            className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            ✕ {lang === 'ar' ? 'إزالة الشعار والعودة للافتراضي' : 'Clear logo & reset to default'}
                          </button>
                        )}
                      </div>

                      {/* Styling formatting selector column */}
                      <div className={`p-4 rounded-2xl border ${
                        isDarkMode 
                          ? 'bg-[#2c2c2e]/40 border-zinc-800' 
                          : 'bg-[#f5f5f7]/45 border-[#d2d2d7]/30'
                      }`}>
                        <span className="text-xs font-bold block border-b pb-1.5 mb-3 border-gray-300 dark:border-zinc-800">
                          {lang === 'ar' ? 'تنسيق مظهر الصورة الشعار:' : 'Logo Frame & Size Formatting:'}
                        </span>
                        
                        {/* 1. Shape Choice */}
                        <div className="space-y-1.5 mb-4">
                          <label className="text-[10px] font-bold text-gray-400 block">
                            {lang === 'ar' ? 'شكل الشعار (إطار دائري أو مربع):' : 'Logo Frame Shape Style:'}
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'circle', label: lang === 'ar' ? 'دائري كامل' : 'Circular' },
                              { id: 'rounded', label: lang === 'ar' ? 'حواف ناعمة' : 'Soft Rounded' },
                              { id: 'square', label: lang === 'ar' ? 'مربع حاد' : 'Sharp Square' }
                            ].map((shapeOpt) => (
                              <button
                                type="button"
                                key={shapeOpt.id}
                                onClick={() => setSettings({ ...settings, logoShape: shapeOpt.id as any })}
                                className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                                  (settings.logoShape || 'rounded') === shapeOpt.id
                                    ? 'bg-blue-600 border-transparent text-white'
                                    : isDarkMode
                                      ? 'bg-[#1c1c1e] border-zinc-700 text-gray-300 hover:bg-[#2c2c2e]'
                                      : 'bg-white border-[#d2d2d7] text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {shapeOpt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Width Choice */}
                        <div className="space-y-1.5 mb-4">
                          <label className="text-[10px] font-bold text-gray-400 block">
                            {lang === 'ar' ? 'مقاس عرض الشعار بالتطبيق:' : 'Set Logo Width (Pixel size):'}
                          </label>
                          <div className="grid grid-cols-5 gap-1.5">
                            {[35, 45, 55, 70, 90].map((widthPX) => (
                              <button
                                type="button"
                                key={widthPX}
                                onClick={() => setSettings({ ...settings, logoWidth: widthPX })}
                                className={`py-1 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
                                  (settings.logoWidth || 50) === widthPX
                                    ? 'bg-blue-600 border-transparent text-white'
                                    : isDarkMode
                                      ? 'bg-[#1c1c1e] border-zinc-700 text-gray-300 hover:bg-[#2c2c2e]'
                                      : 'bg-white border-[#d2d2d7] text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {widthPX}px
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview container */}
                        <div className="pt-1">
                          <span className="text-[10px] text-gray-400 block mb-1">
                            {lang === 'ar' ? 'المعاينة الحية للشعار:' : 'Header preview for the Logo Frame:'}
                          </span>
                          <div className={`p-2 rounded-xl border flex items-center justify-center h-16 overflow-hidden ${
                            isDarkMode ? 'bg-[#121214] border-zinc-800' : 'bg-white border-gray-200'
                          }`}>
                            <img 
                              src={settings.logoUrl || p2pLogo} 
                              className={`object-contain transition-all duration-300 ${
                                (settings.logoShape || 'rounded') === 'circle' ? 'rounded-full' :
                                (settings.logoShape || 'rounded') === 'rounded' ? 'rounded-xl' : 'rounded-none'
                              }`}
                              style={{ 
                                width: `${settings.logoWidth || 50}px`,
                                height: `${settings.logoWidth || 50}px` 
                              }}
                              alt="Store Logo Preview"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0071e3] text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition shadow-sm hover:shadow-xs cursor-pointer"
                    >
                      {t('saveSettings')}
                    </button>
                  </div>
                </div>
              </form>

              {/* Employee & Cashier Account Management */}
              <div className="bg-white rounded-[24px] border border-[#d2d2d7] p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#0071e3]" />
                    <span>إدارة حسابات الموظفين والكاشير</span>
                  </h3>
                  <p className="text-[10px] text-[#6e6e73] mt-0.5">
                    إضافة وتعديل حسابات الموظفين لتجهيز تسجيلات الدخول المنفصلة لنقاط بيع الكاشير
                  </p>
                </div>

                <form onSubmit={handleSaveUserForm} className="bg-[#f5f5f7]/50 p-4 rounded-2xl border border-[#d2d2d7]/50 space-y-4">
                  <div className="text-xs font-bold text-gray-500 border-b border-[#d2d2d7]/30 pb-1.5 flex items-center justify-between">
                    <span>{editingUser ? 'تعديل حـساب موظف' : 'إضافة حساب موظف جديد'}</span>
                    {editingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setUserFormName('');
                          setUserFormEmail('');
                          setUserFormRole('cashier');
                          setUserFormPassword('');
                        }}
                        className="text-[#0071e3] hover:underline"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">الاسم الكامل للموظف</label>
                      <input
                        type="text"
                        required
                        value={userFormName}
                        onChange={(e) => setUserFormName(e.target.value)}
                        placeholder="مثال: أحمد محمد البشير"
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] bg-white outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">البريد الإلكتروني للولوج</label>
                      <input
                        type="email"
                        required
                        value={userFormEmail}
                        onChange={(e) => setUserFormEmail(e.target.value)}
                        placeholder="cashier2@nobles.com"
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] bg-white outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">الدور وصلاحيات النظام</label>
                      <select
                        value={userFormRole}
                        onChange={(e) => setUserFormRole(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] bg-white rounded-xl outline-none"
                      >
                        <option value="cashier">موظف الكاشير المبيعات (واجهة البيع فقط)</option>
                        <option value="admin">مدير النظام العام (لوحة التحكم والمالية والمخازن)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">كلمة المرور للدخول</label>
                      <input
                        type="text"
                        required
                        value={userFormPassword}
                        onChange={(e) => setUserFormPassword(e.target.value)}
                        placeholder="الرقم السري"
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] bg-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2 bg-[#0071e3] text-white text-xs font-bold rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-1.5"
                  >
                    <span>{editingUser ? 'حفظ التحديثات' : 'إضافة الموظف الآن'}</span>
                  </button>
                </form>

                <div className="overflow-x-auto border border-[#d2d2d7]/60 rounded-2xl">
                  <table className="w-full border-collapse text-right text-xs">
                    <thead>
                      <tr className="bg-[#f5f5f7] border-b border-[#d2d2d7]/80 text-[#1d1d1f] font-bold">
                        <th className="p-3">الموظف والرحلة</th>
                        <th className="p-3">البريد الإلكتروني</th>
                        <th className="p-3">صلاحية النظام</th>
                        <th className="p-3 text-center">حالة الحساب</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {systemUsers
                        .filter((u) => {
                          const currentUserTid = (currentUser?.tenantId || '').trim().toLowerCase();
                          const userTid = (u.tenantId || '').trim().toLowerCase();
                          // Strictly filter to only show users who belong to this store's tenant ID
                          return userTid === currentUserTid;
                        })
                        .map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/50 transition">
                            <td className="p-3">
                              <span className="font-bold block text-gray-800">{u.name}</span>
                              {isSelf && <span className="text-[9px] bg-[#0071e3]/10 text-[#0071e3] px-1.5 py-0.5 rounded font-bold">أنت حالياً</span>}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-gray-600">{u.email}</td>
                            <td className="p-3">
                              {u.role === 'admin' ? (
                                <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">مدير النظام</span>
                              ) : (
                                <span className="text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">كاشير مبيعات</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {u.isLocked ? (
                                <span className="text-[10px] bg-red-100 text-[#ea4335] font-bold px-2 py-0.5 rounded-full">معطل مغلق</span>
                              ) : (
                                <span className="text-[10px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">نشط مفعل</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditUserClick(u)}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                                  title="تعديل الحساب"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleLockUser(u)}
                                  className={`p-1.5 rounded-lg transition ${u.isLocked ? 'hover:bg-green-150 text-green-600' : 'hover:bg-red-50 text-[#ea4335]'}`}
                                  disabled={isSelf}
                                  title={u.isLocked ? 'تنشيط الحساب' : 'تعطيل الحساب'}
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id)}
                                  className={`p-1.5 rounded-lg transition font-bold flex items-center gap-1 ${
                                    employeeDeleteConfirmId === u.id 
                                      ? 'bg-red-600 text-white animate-bounce text-[10px] px-2 shadow-xs' 
                                      : 'hover:bg-red-50 text-red-600'
                                  }`}
                                  disabled={isSelf}
                                  title={employeeDeleteConfirmId === u.id ? "انقر مجدداً لتأكيد حذف الموظف نهائياً" : "حذف الموظف نهائياً"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  {employeeDeleteConfirmId === u.id && <span>تأكيد الحذف؟</span>}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danger Zone security clear database */}
              <div className="bg-red-50/40 border border-red-200 rounded-[24px] p-6 space-y-5">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>{t('cautionArea')}</span>
                </div>
                <p className="text-xs text-[#6e6e73]">
                  {t('clearAllDataConfirm')}
                </p>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={purgeConfirmText}
                    onChange={(e) => setPurgeConfirmText(e.target.value)}
                    placeholder={t('typeAgree')}
                    className="w-full text-xs px-3 py-2.5 border border-red-200 rounded-xl bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePurgeAllDataAction}
                    className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition"
                  >
                    حذف وتصفير كافة البيانات نهائياً
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB 7: INVOICE PRINTING TEMPLATES AND CUSTOM DOCUMENTS */}
          {/* ======================================================= */}
          {currentTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <InvoiceTemplatesTab
                templateConfig={templateConfig}
                onUpdateConfig={handleUpdateTemplateConfig}
                documents={documents}
                onAddDocument={handleAddDocument}
                onDeleteDocument={handleDeleteDocument}
                branches={branches}
                lang={lang}
                addToast={addToast}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB: SAAS CONSOLE SUPERADMIN PANELS */}
          {/* ======================================================= */}
          {currentTab === 'saas_admin' && currentUser?.email.trim().toLowerCase() === 'hisham.yo005@gmail.com' && (
            <motion.div
              key="saas_admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <SaasAdmin
                systemUsers={systemUsers}
                saasSettings={saasSettings}
                onUpdateUsers={saveSystemUsersToStorage}
                onUpdateSaasSettings={saveSaasSettingsToStorage}
                addToast={addToast}
                lang={lang}
              />
            </motion.div>
          )}

          {/* ======================================================= */}
          {/* TAB: HOW TO USE GUIDE */}
          {/* ======================================================= */}
          {currentTab === 'guide' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <HowToUseTab
                isDarkMode={isDarkMode}
                lang={lang}
              />
            </motion.div>
          )}


        </AnimatePresence>
      </main>

      {/* ======================================================= */}
      {/* GLOBAL MODALS: PRODUCT ADD AND EDIT MODAL CONTAINER */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f5f7]">
                <h3 className="text-md font-bold text-[#1d1d1f]">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 hover:bg-[#f5f5f7] rounded-full text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-semibold text-[#1d1d1f]">{t('nameAr')}</label>
                    <input
                      type="text"
                      value={formNameAr}
                      onChange={(e) => setFormNameAr(e.target.value)}
                      placeholder="حديد تسليح الأسعد 12مم..."
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-semibold text-[#1d1d1f]">{t('nameEn')}</label>
                    <input
                      type="text"
                      value={formNameEn}
                      onChange={(e) => setFormNameEn(e.target.value)}
                      placeholder="AlAsad Steel 12mm..."
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#1d1d1f]">{t('category')}</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] bg-white rounded-xl focus:outline-none"
                  >
                    <option value="حديد تسليح وتصنيع">{t('catRebar')}</option>
                    <option value="أسمنت ومواد جافة">{t('catCement')}</option>
                    <option value="طوب وبلوك وحصى">{t('catBricks')}</option>
                    <option value="سباكة وأدوات صحية">{t('catPlumbing')}</option>
                    <option value="كهربائيات وإنارة">{t('catElectrical')}</option>
                    <option value="بوهيات ومواد طلاء">{t('catPaints')}</option>
                    <option value="عدد وأدوات يدوية">{t('catTools')}</option>
                    <option value="أخرى">{t('catOthers')}</option>
                  </select>
                </div>

                {/* Carton accounting configuration */}
                <div className="bg-gray-50 border border-[#e2e2e7] rounded-2xl p-4 space-y-4">
                  <span className="text-[10px] uppercase font-black tracking-wide text-gray-500 block">إعداد الكراتين والتعبئة</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">عدد الكراتين بالمستودع</label>
                      <input
                        type="number"
                        value={formNumCartons}
                        onChange={(e) => setFormNumCartons(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">عدد الحبات في الكرتونة الواحدة</label>
                      <input
                        type="number"
                        value={formPiecesPerCarton}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                          setFormPiecesPerCarton(val);
                          
                          // Recalculate selling price as well if set
                          const cartonSel = Number(formCartonSellingPrice) || 0;
                          const pcsVal = Number(val) || 1;
                          if (cartonSel > 0) {
                            setFormPieceSellingPrice(Math.round((cartonSel / pcsVal) * 100) / 100);
                          }
                        }}
                        className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                        min="1"
                        placeholder="12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">سعر شراء الكرتون الواحد (SDG)</label>
                      <input
                        type="number"
                        step="any"
                        value={formCartonPurchasePrice}
                        onChange={(e) => setFormCartonPurchasePrice(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1d1d1f]">سعر بيع الكرتون الواحد (SDG)</label>
                      <input
                        type="number"
                        step="any"
                        value={formCartonSellingPrice}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                          setFormCartonSellingPrice(val);
                          
                          const pcsPerCtn = Number(formPiecesPerCarton) || 1;
                          if (val !== '' && pcsPerCtn > 0) {
                            setFormPieceSellingPrice(Math.round((Number(val) / pcsPerCtn) * 100) / 100);
                          }
                        }}
                        className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                        min="0"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Calculated outputs for verification */}
                  {(Number(formNumCartons) > 0 || Number(formPiecesPerCarton) > 1) && (
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-white p-2.5 rounded-xl border border-dashed border-[#d2d2d7]">
                      <div>
                        <span>الكمية الكلية كحبات قطع:</span>
                        <span className="font-extrabold font-mono text-[#0071e3] block text-xs">{(Number(formNumCartons) * (Number(formPiecesPerCarton) || 1))} قطعة</span>
                      </div>
                      <div>
                        <span>سعر كلفة القطعة الواحدة:</span>
                        <span className="font-extrabold font-mono text-emerald-700 block text-xs">
                          {Number(formPiecesPerCarton) > 0 ? `${Math.round(Number(formCartonPurchasePrice) / Number(formPiecesPerCarton)).toLocaleString()} SDG` : '0 SDG'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-emerald-800 font-extrabold">سعر بيع الحبة المفردة (SDG)</label>
                    <input
                      type="number"
                      step="any"
                      value={formPieceSellingPrice}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                        setFormPieceSellingPrice(val);
                        
                        const pcsPerCtn = Number(formPiecesPerCarton) || 1;
                        if (val !== '' && pcsPerCtn > 0) {
                          setFormCartonSellingPrice(Math.round(Number(val) * pcsPerCtn * 100) / 100);
                        }
                      }}
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl bg-emerald-50/10 focus:border-[#0071e3] focus:outline-none"
                      min="0"
                      placeholder="مثال: 500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1d1d1f]">وحدة الجرد الفردية</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] bg-white rounded-xl focus:outline-none"
                    >
                      <option value="كرتون">كرتون</option>
                      <option value="قطعة">قطعة</option>
                      <option value="شوال">شوال</option>
                      <option value="طن">طن</option>
                      <option value="لفة">لفة</option>
                      <option value="جالون">جالون</option>
                      <option value="متر">متر</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#f5f5f7] flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-5 py-2.5 bg-white border border-[#d2d2d7] text-xs font-bold rounded-xl text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#0071e3] text-white text-xs font-semibold rounded-xl hover:bg-blue-600 transition"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* EXCEL SHEET LOADER MODAL CONTAINER */}
      {/* ======================================================= */}
      <ExcelImportModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportComplete={handleImportComplete}
        lang={lang}
      />

      {/* ======================================================= */}
      {/* DETAILED DOUBLE DELETION CONFIRMATION DIALOG */}
      {/* ======================================================= */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-[24px] border border-[#d2d2d7] p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-md font-bold text-[#1d1d1f]">{t('deleteConfirmTitle')}</h3>
              <p className="text-xs text-[#6e6e73]">
                {t('deleteConfirmContent', { name: lang === 'ar' ? deleteTarget.name_ar : deleteTarget.name_en })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-[#d2d2d7] rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleExposeDelete}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {t('deleteConfirmBtn')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* CHECKOUT MODAL: INSTALLMENTS & CHECK OPTION INTEGRATED */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-2xl flex flex-col p-6 space-y-5 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#f5f5f7] pb-3">
                <h3 className="text-md font-bold text-[#1d1d1f]">{t('completePayment')}</h3>
                <button onClick={() => setIsCheckoutOpen(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#f5f5f7] rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-[#6e6e73] block">المطلوب سداده بعد الحساب</span>
                <span className="text-xl font-black text-[#0071e3]">{cartTotal.toLocaleString()} SDG</span>
              </div>

              {/* Installment selection toggle */}
              <div className="flex items-center justify-between p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#1d1d1f]">{t('installmentSwitch')}</span>
                  <p className="text-[10px] text-gray-400">تقسيم الدفع إلى دفعة أولى مقدمة وقسط متبقي مجدول.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallment}
                  onChange={(e) => {
                    setIsInstallment(e.target.checked);
                    if (e.target.checked) {
                      setAmountPaidInput(Math.floor(cartTotal * 0.5).toString());
                    } else {
                      setAmountPaidInput(Math.ceil(cartTotal).toString());
                    }
                  }}
                  className="w-5 h-5 accent-[#0071e3]"
                />
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 select-none">
                <span className="text-xs font-semibold text-[#1d1d1f] block">{t('paymentMethod')}</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 border rounded-xl text-center transition-all ${
                      paymentMethod === 'cash' 
                        ? 'border-[#0071e3] bg-blue-50/20 text-[#0071e3]' 
                        : 'border-[#d2d2d7] text-gray-700 hover:border-[#86868b]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{t('payCash')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-3 border rounded-xl text-center transition-all ${
                      paymentMethod === 'transfer' 
                        ? 'border-[#0071e3] bg-indigo-50/20 text-[#0071e3]' 
                        : 'border-[#d2d2d7] text-gray-700 hover:border-[#86868b]'
                    }`}
                  >
                    <span className="text-xs font-bold block">تحويل بنكي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('check')}
                    className={`p-3 border rounded-xl text-center transition-all ${
                      paymentMethod === 'check' 
                        ? 'border-[#0071e3] bg-purple-50/20 text-[#0071e3]' 
                        : 'border-[#d2d2d7] text-gray-700 hover:border-[#86868b]'
                    }`}
                  >
                    <span className="text-xs font-bold block">شيك مصرفي</span>
                  </button>
                </div>
              </div>

              {/* Customer Info & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 relative">
                  <label className="text-[11px] font-bold text-[#1d1d1f] block">اسم العميل (اختياري)</label>
                  <input
                    type="text"
                    value={customerNameInput}
                    onChange={(e) => {
                      setCustomerNameInput(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="اسم العميل أو الجهة"
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white"
                  />
                  {showCustomerDropdown && customerNameInput.trim().length > 0 && (() => {
                    const matchedList = customers.filter(c => 
                      c.name.toLowerCase().includes(customerNameInput.toLowerCase())
                    );
                    if (matchedList.length === 0) return null;
                    return (
                      <div className="absolute z-[60] bg-white border border-[#d2d2d7] rounded-xl shadow-lg mt-1 max-h-36 overflow-y-auto w-full left-0 right-0 text-right">
                        {matchedList.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCustomerNameInput(c.name);
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-right px-3 py-2 text-xs hover:bg-[#f5f5f7] transition-colors border-b border-gray-150 last:border-0 block"
                          >
                            <span className="font-bold text-gray-900">{c.name}</span>
                            <span className="text-[9px] text-gray-400 block font-mono pr-1">{c.phone !== '-' ? c.phone : 'بلا رقم تسجيل'}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  
                  {/* Credit limit safety validation in real-time */}
                  {(() => {
                    const matchedCustomer = customers.find(c => c.name.trim().toLowerCase() === customerNameInput.trim().toLowerCase());
                    if (!matchedCustomer) return null;
                    
                    const customerDebt = sales
                      .filter(inv => inv.customerName?.trim().toLowerCase() === matchedCustomer.name.trim().toLowerCase())
                      .reduce((sum, inv) => sum + (inv.amountRemaining || 0), 0);
                      
                    const futureDebt = isInstallment ? Math.max(0, cartTotal - (parseFloat(amountPaidInput) || 0)) : 0;
                    const isLimitWarn = matchedCustomer.creditLimit > 0 && (customerDebt + futureDebt > matchedCustomer.creditLimit);
                    
                    return (
                      <div className="pt-1 select-none">
                        <span className={`text-[8.5px] font-bold block ${matchedCustomer.status === 'inactive' ? 'text-red-750' : 'text-emerald-700'}`}>
                          • فئة: {matchedCustomer.category === 'vip' ? 'VIP' : matchedCustomer.category === 'wholesale' ? 'جملة' : matchedCustomer.category === 'retailer' ? 'قطاعي' : 'عادي'}
                          {matchedCustomer.creditLimit > 0 && ` | حد الائتمان: ${matchedCustomer.creditLimit.toLocaleString()} SDG`}
                          {matchedCustomer.status === 'inactive' && ' (موقوف إدارياً!)'}
                        </span>
                        {isLimitWarn && (
                          <span className="bg-red-50 text-red-800 text-[8.5px] font-bold p-1 rounded-md mt-1 block border border-red-200">
                            ⚠️ تنبيه: العميل سيتخطى الحد الائتماني المسموح به!
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1d1d1f] block">ملاحظات الفاتورة</label>
                  <input
                    type="text"
                    value={checkoutNotesInput}
                    onChange={(e) => setCheckoutNotesInput(e.target.value)}
                    placeholder="ملاحظات أو تفاصيل تسليم"
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Branch Selection Dropdown */}
              <div className="space-y-1.5 border-t border-gray-100 pt-3">
                <label className="text-xs font-bold text-[#1d1d1f] block flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>{lang === 'ar' ? 'الفرع البائع المنسوب له الفاتورة' : 'Attributed/Issuing Branch'}</span>
                </label>
                <select
                  value={selectedCheckoutBranchId}
                  onChange={(e) => setSelectedCheckoutBranchId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white font-bold"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) {b.isHeadquarters ? `[${lang === 'ar' ? 'المقر الرئيسي' : 'HQ'}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Transaction Number */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1d1d1f]">رقم العملية / الحوالة (اختياري)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">طباعة الوثيقة</span>
                    <input
                      type="checkbox"
                      checked={printTransactionNumber}
                      onChange={(e) => setPrintTransactionNumber(e.target.checked)}
                      className="w-4 h-4 accent-black"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={transactionNumberInput}
                  onChange={(e) => setTransactionNumberInput(e.target.value)}
                  placeholder="مثال: FT2605179234"
                  className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none"
                />
              </div>

              {/* Installment parameters displays OR normal checks */}
              {isInstallment ? (
                <div className="space-y-4 bg-teal-50/40 border border-teal-200 p-4 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1f] block">المقدم المدفوع الآن (SDG)</label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full text-sm font-mono px-3 py-2 border border-[#d2d2d7] rounded-xl bg-white focus:outline-none"
                      min="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#1d1d1f] block">عدد الأقساط (الدفعات)</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={installmentCountInput}
                        onChange={(e) => setInstallmentCountInput(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl bg-white focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-[#1d1d1f] block">دورية الأقساط</label>
                      <select
                        value={installmentInterval}
                        onChange={(e) => setInstallmentInterval(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl bg-white focus:outline-none font-bold"
                      >
                        <option value="monthly">شهرياً</option>
                        <option value="weekly">أسبوعياً</option>
                        <option value="biweekly">كل أسبوعين</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1f] block">تاريخ استحقاق أول قسط</label>
                    <input
                      type="date"
                      value={installmentDateInput}
                      onChange={(e) => setInstallmentDateInput(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl bg-white focus:outline-none"
                    />
                  </div>

                  {/* DISPLAY COMPILED SCHEDULE SHEET WITH INLINE EDIT CAPABILITY */}
                  {installmentsList.length > 0 && (
                    <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-200">
                      <div className="text-[10px] font-bold text-gray-500 uppercase pb-1 border-b border-gray-100 flex justify-between">
                        <span>قائمة واستحقاقات الأقساط المتولدة:</span>
                        <span className="text-[#0071e3]">تعديل يدوي متاح</span>
                      </div>
                      
                      <div className="max-h-44 overflow-y-auto space-y-2 pt-1.5 scrollbar-thin">
                        {installmentsList.map((inst) => (
                          <div key={inst.id} className="flex items-center gap-2 bg-[#f5f5f7] p-2 rounded-lg text-xs justify-between">
                            <span className="font-bold text-gray-700 shrink-0">قسط {inst.index}:</span>
                            
                            {/* Due Date Editable */}
                            <input
                              type="date"
                              value={inst.dueDate}
                              onChange={(e) => updateSingleInstallmentInput(inst.id, 'dueDate', e.target.value)}
                              className="bg-white border border-[#d2d2d7] text-[10px] rounded px-1.5 py-0.5 outline-none max-w-[110px]"
                            />
                            
                            {/* Amount Editable */}
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={inst.amount}
                                onChange={(e) => updateSingleInstallmentInput(inst.id, 'amount', e.target.value)}
                                className="bg-white border border-[#d2d2d7] text-[10px] rounded px-1 text-left font-mono font-bold max-w-[80px]"
                              />
                              <span className="text-[9px] text-gray-400 shrink-0">SDG</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-teal-900 border-t border-teal-200/50 pt-2 font-bold leading-none">
                    <span>المبلغ المتبقي للتحصيل لاحقاً:</span>
                    <span className="font-mono text-sm">
                      {Math.max(0, cartTotal - (parseFloat(amountPaidInput) || 0)).toLocaleString()} SDG
                    </span>
                  </div>
                </div>
              ) : (
                paymentMethod === 'cash' && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#1d1d1f] block">{t('amountReceived')} (SDG)</label>
                      <input
                        type="number"
                        value={amountReceivedInput}
                        onChange={(e) => setAmountReceivedInput(e.target.value)}
                        className="w-full text-sm font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none"
                        min="0"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs">
                      <span>{t('amountChange')}</span>
                      <span className="font-bold text-sm font-mono">
                        {checkoutChangeDue.toLocaleString()} SDG
                      </span>
                    </div>
                  </div>
                )
              )}

              {/* Actions submit */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3 border border-[#d2d2d7] rounded-xl text-xs font-bold text-[#1d1d1f] hover:bg-gray-50 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleProcessCheckoutPayment}
                  className="flex-1 py-3 bg-[#34c759] hover:bg-[#2fb550] text-white rounded-xl text-xs font-bold tracking-tight transition"
                >
                  {t('confirmAndPrint')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* RECEIPTS PREVIEW MODAL WITH DIRECT PRINT CHANNELS */}
      {/* ======================================================= */}
      <AnimatePresence>
        {isPrintModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ${
                printLayout === 'thermal' ? 'max-w-sm' : 'max-w-4xl'
              }`}
            >
              <div className="px-6 py-4 border-b border-[#f5f5f7] flex justify-between items-center shrink-0">
                <span className="text-xs font-extrabold text-[#1d1d1f]">معاينة وتخصيص طباعة الفاتورة</span>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-gray-400 p-1 hover:bg-[#f5f5f7] rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Layout Switcher buttons inside modal preview window header */}
              <div className="px-6 py-3 bg-[#f5f5f7] border-b border-[#d2d2d7] flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="text-[11px] font-bold text-gray-700">تنسيق حجم الطباعة المصدّر:</span>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => setPrintLayout('thermal')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${printLayout === 'thermal' ? 'bg-[#0071e3] text-white shadow-xs' : 'bg-white hover:bg-gray-100 border border-[#d2d2d7] text-gray-700'}`}
                  >
                    حراري صغير (80mm)
                  </button>
                  <button 
                    onClick={() => setPrintLayout('a4-modern')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${printLayout === 'a4-modern' ? 'bg-[#0071e3] text-white shadow-xs' : 'bg-white hover:bg-gray-100 border border-[#d2d2d7] text-gray-700'}`}
                  >
                    كبير A4 عصري
                  </button>
                  <button 
                    onClick={() => setPrintLayout('a4-classic')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${printLayout === 'a4-classic' ? 'bg-[#0071e3] text-white shadow-xs' : 'bg-white hover:bg-gray-100 border border-[#d2d2d7] text-gray-700'}`}
                  >
                    كبير A4 كلاسيكي ملون
                  </button>
                </div>
              </div>

              {/* Invoice body preview wrapper */}
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm overflow-x-auto">
                  <div className="min-w-[300px]">
                    <PrintInvoiceContent
                      layout={printLayout}
                      invoice={selectedInvoice}
                      config={templateConfig}
                      settings={settings}
                      branches={branches}
                      lang={lang}
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer print commands */}
              <div className="p-4 bg-[#f5f5f7] border-t border-[#d2d2d7] flex gap-2 shrink-0">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-bold text-gray-700 hover:bg-white/80 transition"
                >
                  إغلاق النافذة
                </button>
                <button
                  onClick={handlePrintCommand}
                  className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طبع الفاتورة الآن (Print)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================= */}
      {/* EXCLUSIVELY HIDDEN NO-LAYOUT RENDERED FOR DIRECT PRINT OVERRIDE */}
      {/* ======================================================= */}
      {selectedInvoice && (
        <div className="print-only font-sans leading-normal" dir="rtl">
          <PrintInvoiceContent
            layout={printLayout}
            invoice={selectedInvoice}
            config={templateConfig}
            settings={settings}
            branches={branches}
            lang={lang}
          />
        </div>
      )}


    </div>
  );
}
