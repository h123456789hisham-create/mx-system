import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck, ShieldAlert, CheckCircle2, Search, Trash2,
  FileSpreadsheet, Download, RefreshCw, Calendar, ListFilter,
  SlidersHorizontal, AlertTriangle, Activity, Package, Sparkles,
  Filter, Check, ArrowDownUp, AlertCircle, TrendingDown, Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product, InventoryAudit, Invoice } from '../types';

interface InventoryAuditTabProps {
  lang: 'ar' | 'en';
  isDarkMode: boolean;
  inventory: Product[];
  audits: InventoryAudit[];
  sales: Invoice[];
  currentUser: any;
  onSaveInventory: (updated: Product[]) => void;
  onSaveAudits: (updated: InventoryAudit[]) => void;
  addToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export default function InventoryAuditTab({
  lang,
  isDarkMode,
  inventory,
  audits,
  sales,
  currentUser,
  onSaveInventory,
  onSaveAudits,
  addToast
}: InventoryAuditTabProps) {
  // Navigation: 'single' (Manual Target Audit) or 'bulk' (Full-Stock Grid Audit)
  const [auditMode, setAuditMode] = useState<'single' | 'bulk'>('single');
  
  // Search parameters
  const [productSearch, setProductSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Preset/Scheduling state: 'none', 'daily', 'weekly'
  const [presetType, setPresetType] = useState<'all' | 'daily' | 'weekly'>('all');

  // Single Audit Mode states
  const [singleProductId, setSingleProductId] = useState('');
  const [singleCartons, setSingleCartons] = useState<number | ''>('');
  const [singlePieces, setSinglePieces] = useState<number | ''>('');
  const [singleNotes, setSingleNotes] = useState('');

  // Bulk Audit Mode state: stores counts for EACH product in the filtered list
  // Keyed by productId
  const [bulkAuditState, setBulkAuditState] = useState<{
    [pId: string]: {
      cartons: number | '';
      pieces: number | '';
      notes: string;
      isEdited: boolean;
    };
  }>({});

  // Reset bulk audits state if inventory or filter changes
  const resetBulkState = (mode: 'match_system' | 'zero_all') => {
    const newState: typeof bulkAuditState = {};
    inventory.forEach(p => {
      if (mode === 'match_system') {
        const currentCartons = p.piecesPerCarton > 1 ? Math.floor(p.quantity / p.piecesPerCarton) : 0;
        const currentPieces = p.piecesPerCarton > 1 ? p.quantity % p.piecesPerCarton : p.quantity;
        newState[p.id] = {
          cartons: currentCartons,
          pieces: currentPieces,
          notes: '',
          isEdited: false
        };
      } else {
        newState[p.id] = {
          cartons: 0,
          pieces: 0,
          notes: '',
          isEdited: true // marked as edited to apply zeroing
        };
      }
    });
    setBulkAuditState(newState);
    addToast(
      lang === 'ar' 
        ? (mode === 'match_system' ? 'تمت مطابقة وحشو مسودة الجرد ببيانات السيستم الحالية للسهولة' : 'تم تصفير مسودة المدخلات الفعلية بالكامل')
        : (mode === 'match_system' ? 'Prefilled all inputs with current book levels' : 'Cleared all counted quantities'),
      'info'
    );
  };

  // Auto pre-fill with system quantities upon loading bulk grid if empty
  useEffect(() => {
    if (Object.keys(bulkAuditState).length === 0 && inventory.length > 0) {
      const initial: typeof bulkAuditState = {};
      inventory.forEach(p => {
        const currentCartons = p.piecesPerCarton > 1 ? Math.floor(p.quantity / p.piecesPerCarton) : 0;
        const currentPieces = p.piecesPerCarton > 1 ? p.quantity % p.piecesPerCarton : p.quantity;
        initial[p.id] = {
          cartons: currentCartons,
          pieces: currentPieces,
          notes: '',
          isEdited: false
        };
      });
      setBulkAuditState(initial);
    }
  }, [inventory, bulkAuditState]);

  // Identify categories for filters
  const categories = useMemo(() => {
    const list = new Set(inventory.map(p => p.category || (lang === 'ar' ? 'عام' : 'General')));
    return Array.from(list);
  }, [inventory, lang]);

  // Smart helper: Products sold in the last 24 hours (For Daily Audit preset)
  const activeProductsToday = useMemo(() => {
    const targetTime = Date.now() - 24 * 60 * 60 * 1000;
    const todaySales = sales.filter(s => s.createdAt >= targetTime);
    const activeIds = new Set<string>();
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productId) activeIds.add(item.productId);
      });
    });
    return activeIds;
  }, [sales]);

  // Filter products by search term, category and smart preset
  const filteredProducts = useMemo(() => {
    return inventory.filter(p => {
      // 1. Text Search filter
      const searchLower = productSearch.toLowerCase().trim();
      const nameArMatch = (p.name_ar || '').toLowerCase().includes(searchLower);
      const nameEnMatch = (p.name_en || '').toLowerCase().includes(searchLower);
      const barcodeMatch = (p.barcode || '').toLowerCase().includes(searchLower);
      const matchesSearch = searchLower === '' || nameArMatch || nameEnMatch || barcodeMatch;

      // 2. Category filter
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      // 3. Preset filter
      let matchesPreset = true;
      if (presetType === 'daily') {
        // Daily: Only items sold today, OR low stock items (quantity <= 15)
        const isSoldToday = activeProductsToday.has(p.id);
        const isLowStock = p.quantity <= 15;
        matchesPreset = isSoldToday || isLowStock;
      } else if (presetType === 'weekly') {
        // Weekly suggestions: Items with larger value/stock OR simply prioritizing based on category
        // In physical warehouse: we audit everything or items that have high shelf count
        matchesPreset = true; // Allows filtering via category instead
      }

      return matchesSearch && matchesCategory && matchesPreset;
    });
  }, [inventory, productSearch, selectedCategory, presetType, activeProductsToday]);

  // Single mode product matching helper
  const selectedSingleProduct = useMemo(() => {
    return inventory.find(p => p.id === singleProductId);
  }, [inventory, singleProductId]);

  // Compute live discrepancy for single mode
  const singleLiveComputation = useMemo(() => {
    if (!selectedSingleProduct) return null;
    const p = selectedSingleProduct;
    const totalActualPieces = p.piecesPerCarton > 1 
      ? ((Number(singleCartons) || 0) * p.piecesPerCarton) + (Number(singlePieces) || 0)
      : (Number(singlePieces) || 0);
      
    const discrepancy = totalActualPieces - p.quantity;
    const costImpact = discrepancy * (p.purchasePricePiece || 0);

    return {
      actualPieces: totalActualPieces,
      discrepancy,
      costImpact,
      isPerfect: discrepancy === 0,
      isExcess: discrepancy > 0,
      isShortage: discrepancy < 0
    };
  }, [selectedSingleProduct, singleCartons, singlePieces]);

  // Handle saving physical count details for Single Audit
  const handleSaveSingleAudit = () => {
    if (!selectedSingleProduct) {
      addToast(lang === 'ar' ? 'يرجى اختيار الصنف للبدء' : 'Please select a product first', 'warning');
      return;
    }
    const p = selectedSingleProduct;
    const cartCount = Number(singleCartons) || 0;
    const pcsCount = Number(singlePieces) || 0;

    const totalActualPieces = p.piecesPerCarton > 1 
      ? (cartCount * p.piecesPerCarton) + pcsCount 
      : pcsCount;

    const diffPcs = totalActualPieces - p.quantity;
    const diffValue = diffPcs * (p.purchasePricePiece || 0);

    // Build the audit object
    const newAudit: InventoryAudit = {
      id: Math.random().toString(36).substring(2, 11),
      productId: p.id,
      productNameAr: p.name_ar,
      productNameEn: p.name_en,
      numCartonsBefore: p.piecesPerCarton > 1 ? Math.floor(p.quantity / p.piecesPerCarton) : 0,
      piecesBefore: p.piecesPerCarton > 1 ? p.quantity % p.piecesPerCarton : p.quantity,
      totalPiecesBefore: p.quantity,
      numCartonsAfter: p.piecesPerCarton > 1 ? cartCount : 0,
      piecesAfter: p.piecesPerCarton > 1 ? pcsCount : totalActualPieces,
      totalPiecesAfter: totalActualPieces,
      discrepancyPcs: diffPcs,
      discrepancyValueSDG: diffValue,
      notes: singleNotes.trim() || (
        presetType === 'daily' 
          ? (lang === 'ar' ? 'مطابقة جرد يومي تلقائي' : 'Periodic Daily Audit')
          : (lang === 'ar' ? 'مطابقة جرد منفصل يدوي' : 'Manual Single Item Audit')
      ),
      createdAt: Date.now()
    };

    // Update quantities
    const updatedInv = inventory.map(item => {
      if (item.id === p.id) {
        return {
          ...item,
          quantity: totalActualPieces,
          numCartons: p.piecesPerCarton > 1 ? cartCount : item.numCartons
        };
      }
      return item;
    });

    onSaveInventory(updatedInv);
    onSaveAudits([newAudit, ...audits]);

    addToast(
      lang === 'ar' 
        ? `تم تحديث جرد (${p.name_ar}) بنجاح! الأثر المالي سجل في التقارير.` 
        : `PHYSICAL RECONCILIATION COMMITTED: Inventory updated for (${p.name_en})`,
      'success'
    );

    // Reset Inputs
    setSingleProductId('');
    setSingleCartons('');
    setSinglePieces('');
    setSingleNotes('');
  };

  // Handle saving all bulk inputs in a single transaction
  const handleSaveBulkAudit = () => {
    const editedProductIds = Object.keys(bulkAuditState).filter(id => bulkAuditState[id]?.isEdited);
    
    if (editedProductIds.length === 0) {
      addToast(
        lang === 'ar' 
          ? 'لم تقم بتعديل أو إدخال أي كميات جرد فعلية جديدة حتى الآن!' 
          : 'No items were edited in the physical sweep grid!', 
        'info'
      );
      return;
    }

    const updatedInventoryList = [...inventory];
    const newAuditRegistries: InventoryAudit[] = [];

    editedProductIds.forEach((productId) => {
      const editedState = bulkAuditState[productId];
      if (!editedState) return;

      const prodIndex = updatedInventoryList.findIndex(item => item.id === productId);
      if (prodIndex === -1) return;

      const p = updatedInventoryList[prodIndex];
      const cartVal = Number(editedState.cartons) || 0;
      const pcsVal = Number(editedState.pieces) || 0;

      const totalActualPieces = p.piecesPerCarton > 1 
        ? (cartVal * p.piecesPerCarton) + pcsVal 
        : pcsVal;

      const diffPcs = totalActualPieces - p.quantity;
      const diffValue = diffPcs * (p.purchasePricePiece || 0);

      // Audit History Entry
      const newAudit: InventoryAudit = {
        id: Math.random().toString(36).substring(2, 11),
        productId: p.id,
        productNameAr: p.name_ar,
        productNameEn: p.name_en,
        numCartonsBefore: p.piecesPerCarton > 1 ? Math.floor(p.quantity / p.piecesPerCarton) : 0,
        piecesBefore: p.piecesPerCarton > 1 ? p.quantity % p.piecesPerCarton : p.quantity,
        totalPiecesBefore: p.quantity,
        numCartonsAfter: p.piecesPerCarton > 1 ? cartVal : 0,
        piecesAfter: p.piecesPerCarton > 1 ? pcsVal : totalActualPieces,
        totalPiecesAfter: totalActualPieces,
        discrepancyPcs: diffPcs,
        discrepancyValueSDG: diffValue,
        notes: editedState.notes.trim() || (
          presetType === 'daily'
            ? (lang === 'ar' ? 'جرد يومي شامل بدفعة واحدة' : 'Daily Omni Count Cycle')
            : presetType === 'weekly'
              ? (lang === 'ar' ? 'جرد أسبوعي شامل للفروع' : 'Weekly Sweep Cycle')
              : (lang === 'ar' ? 'جرد شامل لكافة الأصناف' : 'Omni Batch Warehouse Count')
        ),
        createdAt: Date.now()
      };

      // Apply update inside list
      updatedInventoryList[prodIndex] = {
        ...p,
        quantity: totalActualPieces,
        numCartons: p.piecesPerCarton > 1 ? cartVal : p.numCartons
      };

      newAuditRegistries.push(newAudit);
    });

    onSaveInventory(updatedInventoryList);
    onSaveAudits([...newAuditRegistries, ...audits]);

    addToast(
      lang === 'ar' 
        ? `تم تنفيذ الجرد الشامل بنجاح! تم حفظ عدد (${newAuditRegistries.length}) محضراً للتسويات المكتشفة.` 
        : `OMNI BULK SWEEP SUCCESSFUL: Saved (${newAuditRegistries.length}) audit adjustments concurrently.`, 
      'success'
    );

    // Reset edits markers
    const resetState = { ...bulkAuditState };
    editedProductIds.forEach((productId) => {
      if (resetState[productId]) {
        resetState[productId].isEdited = false;
      }
    });
    setBulkAuditState(resetState);
  };

  // Helper to change single input inside bulk audit grid
  const handleBulkInputChanged = (
    productId: string, 
    field: 'cartons' | 'pieces' | 'notes', 
    val: any
  ) => {
    const current = bulkAuditState[productId] || { cartons: 0, pieces: 0, notes: '', isEdited: false };
    const updated = {
      ...current,
      [field]: val,
      isEdited: true
    };
    setBulkAuditState(prev => ({
      ...prev,
      [productId]: updated
    }));
  };

  // Dashboard Stats
  const auditStats = useMemo(() => {
    let lossCount = 0;
    let gainCount = 0;
    let totalLossVal = 0;
    let totalGainVal = 0;

    audits.forEach(a => {
      if (a.discrepancyValueSDG < 0) {
        lossCount++;
        totalLossVal += Math.abs(a.discrepancyValueSDG);
      } else if (a.discrepancyValueSDG > 0) {
        gainCount++;
        totalGainVal += a.discrepancyValueSDG;
      }
    });

    return {
      lossCount,
      gainCount,
      totalLossVal,
      totalGainVal,
      netImpact: totalGainVal - totalLossVal
    };
  }, [audits]);

  return (
    <div className="space-y-6 text-right select-none" dir="rtl">
      
      {/* Smart Preset & Mode Quick Toggle Bar */}
      <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-[#1d1d1f] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0071e3]" />
              <span>{lang === 'ar' ? 'الذكاء المجدول وخيارات الجرد التلقائي' : 'Smart Automated Inventory Auditing Presets'}</span>
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              {lang === 'ar' 
                ? 'اختر دورة الجرد التي تناسب عملك الآن، أو اختر الجرد المتفرّق للأصناف الفردية مقارنة بالجرد الإجمالي الشامل.' 
                : 'Select pre-scheduled audit cycles. Run single-item adjustments or bulk wholesale stock-taking.'}
            </p>
          </div>

          {/* Core mode switch tab */}
          <div className="flex bg-[#f5f5f7] p-1 rounded-xl self-start">
            <button
              onClick={() => setAuditMode('single')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                auditMode === 'single' 
                  ? 'bg-white text-[#1d1d1f] shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              🔍 {lang === 'ar' ? 'جرد منفرد (صنف محدد)' : 'Single Product Audit'}
            </button>
            <button
              onClick={() => setAuditMode('bulk')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                auditMode === 'bulk' 
                  ? 'bg-white text-[#1d1d1f] shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              📦 {lang === 'ar' ? 'جرد كلي شامل (لوحة شبكية)' : 'Omni Bulk Audit'}
            </button>
          </div>
        </div>

        {/* Preset Selector Rules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          
          {/* Preset 1: Full stock */}
          <button
            onClick={() => {
              setPresetType('all');
              setSelectedCategory('all');
            }}
            className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between ${
              presetType === 'all' 
                ? 'bg-[#0071e3]/5 border-[#0071e3] text-[#0071e3]' 
                : 'bg-gray-50 border-gray-200 text-[#1d1d1f] hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black">{lang === 'ar' ? '🗂️ جرد كلي مفتوح' : 'Full Warehouse Audit'}</span>
              {presetType === 'all' && <Check className="w-3.5 h-3.5" />}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
              {lang === 'ar' ? 'يقوم بعرض كافة البضائع والأصناف المسجلة دون أي تصفية.' : 'Lists all current inventory products without filter.'}
            </p>
          </button>

          {/* Preset 2: Daily Scheduled Audit */}
          <button
            onClick={() => {
              setPresetType('daily');
              setSelectedCategory('all');
              addToast(
                lang === 'ar' 
                  ? 'تم تفعيل فلتر الجرد اليومي للمنتجات الأكثر حركة والمباعة اليوم!' 
                  : 'Daily audit active: Showing products transacted today or low-stock.',
                'info'
              );
            }}
            className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between ${
              presetType === 'daily' 
                ? 'bg-amber-600/5 border-amber-600 text-amber-800' 
                : 'bg-gray-50 border-gray-200 text-[#1d1d1f] hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                {lang === 'ar' ? '⏰ جرد يومي تلقائي' : '⏰ Automated Daily Preset'}
              </span>
              {presetType === 'daily' && <Check className="w-3.5 h-3.5 text-amber-700" />}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
              {lang === 'ar' 
                ? 'يقوم بفلترة الأصناف التي بيعت اليوم أو التي اقترب مخزونها من العجز (<15 حبة) لمطابقتها في الكاونتر.' 
                : 'Filters specifically items sold today or items with low stock level for verification.'}
            </p>
          </button>

          {/* Preset 3: Weekly Scheduled Audit */}
          <button
            onClick={() => {
              setPresetType('weekly');
              addToast(
                lang === 'ar' 
                  ? 'تم تفعيل تخطيط الجرد الأسبوعي الدوري. يرجى تصفية فئة محددة لإتمام دورتها.' 
                  : 'Weekly Scheduled Audit active. Filter by category to run partial sweeps.',
                'info'
              );
            }}
            className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between ${
              presetType === 'weekly' 
                ? 'bg-emerald-600/5 border-emerald-600 text-emerald-800' 
                : 'bg-gray-50 border-gray-200 text-[#1d1d1f] hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black">{lang === 'ar' ? '📅 جرد دوري أسبوعي' : '📅 Weekly Scheduled Preset'}</span>
              {presetType === 'weekly' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
              {lang === 'ar' 
                ? 'تقسيم الجرد للمستودع أسبوعياً. يسمح بتصفية الأصناف حسب فروعها أو فئة الكرتنة.' 
                : 'Divide and sweep items. Recommended for cycling through specific categories.'}
            </p>
          </button>

        </div>
      </div>

      {/* Financial shrinkage & auditing statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#0071e3] rounded-2xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-extrabold uppercase block">{lang === 'ar' ? 'إجمالي المحاضر' : 'Total Audits'}</span>
            <div className="text-base font-black text-[#1d1d1f] font-mono leading-none mt-1">{audits.length} عملية جرد</div>
          </div>
        </div>

        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold block leading-tight">{lang === 'ar' ? 'عجز وبضائع تالفة (تكلفة)' : 'Cost of Shrinkage'}</span>
            <div className="text-base font-black text-red-650 font-mono leading-none mt-1">
              -{auditStats.totalLossVal.toLocaleString()} <span className="text-[10px]">SDG</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 font-extrabold block leading-tight">{lang === 'ar' ? 'فوائض مكاسب الجرد (تكلفة)' : 'Inventory Overages'}</span>
            <div className="text-base font-black text-emerald-650 font-mono leading-none mt-1">
              +{auditStats.totalGainVal.toLocaleString()} <span className="text-[10px]">SDG</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-2xs flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${auditStats.netImpact >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-extrabold block leading-tight">{lang === 'ar' ? 'صافي أثر فروقات الجرد' : 'Net Discrepancy Impact'}</span>
            <div className={`text-base font-black font-mono leading-none mt-1 ${auditStats.netImpact >= 0 ? 'text-emerald-600' : 'text-red-700'}`}>
              {auditStats.netImpact >= 0 ? '+' : ''}{auditStats.netImpact.toLocaleString()} <span className="text-[10px]">SDG</span>
            </div>
          </div>
        </div>

      </div>

      {/* CORE AUDIT INTERACTIVE GRID AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RIGHT SIDE: Dynamic Interactive Area depending on mode */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="bg-white border border-[#d2d2d7] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث باسم الصنف أو الباركود لتسريع العد...' : 'Search items by name, barcode...'}
                className="w-full text-xs pr-9 pl-3 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
              />
              <Search className="w-4 h-4 text-gray-450 absolute top-3.5 right-3" />
            </div>

            {/* Category Select Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 block shrink-0">
                <Filter className="w-3.5 h-3.5 inline ml-1" />{lang === 'ar' ? 'فئة الصنف:' : 'Category:'}
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs px-3.5 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-bold text-gray-800"
              >
                <option value="all">{lang === 'ar' ? 'كل الفئات' : 'All Categories'}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Smart count badge */}
            <div className="text-xs font-mono font-black text-[#0071e3] bg-blue-50 px-3 py-2 rounded-xl">
              {filteredProducts.length} {lang === 'ar' ? 'صنف مقترح للعد' : 'items suggestions'}
            </div>
          </div>

          {/* MODE 1: SINGLE AUDIT INTERFACE */}
          {auditMode === 'single' ? (
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-xs font-black text-[#1d1d1f] flex items-center gap-1.5 uppercase">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'خطوة الفحص والعد لصنف منفرد' : 'Single Product Audit & Verification'}</span>
                </h3>
                <span className="text-[10px] text-[#6e6e73] font-bold">
                  {lang === 'ar' ? 'أكثر دقة للمخازن الفردية' : 'High precision for specific checks'}
                </span>
              </div>

              {/* Product selector list box */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-gray-600 block">{lang === 'ar' ? 'اختر المنتج المراد مطابقة رفه الفعلي من القائمة:' : 'Target Product to Audit:'}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Select menu drop */}
                  <div>
                    <select
                      value={singleProductId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSingleProductId(id);
                        const p = inventory.find(item => item.id === id);
                        if (p) {
                          if (p.piecesPerCarton > 1) {
                            setSingleCartons(Math.floor(p.quantity / p.piecesPerCarton));
                            setSinglePieces(p.quantity % p.piecesPerCarton);
                          } else {
                            setSingleCartons('');
                            setSinglePieces(p.quantity);
                          }
                        } else {
                          setSingleCartons('');
                          setSinglePieces('');
                        }
                        setSingleNotes('');
                      }}
                      className="w-full text-xs px-3.5 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] font-bold text-[#1d1d1f]"
                    >
                      <option value="">-- {lang === 'ar' ? 'اختر الصنف المراد جرده من المستودع...' : 'Choose a product to start...'} --</option>
                      {filteredProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {lang === 'ar' ? p.name_ar : p.name_en} ({p.barcode || 'بلا باركود'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fast barcode entry instruction */}
                  <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl p-3 text-xs text-gray-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#0071e3] shrink-0" />
                    <span>
                      {lang === 'ar'
                        ? 'تلميح: إذا كان لديك قارئ باركود، مرّره على المنتج لتصفيته والوصول إليه بضغطة زر في صندوق البحث بالأعلى.'
                        : 'Tip: Scan barcodes to instantly filter down and locate that item across the grid above.'}
                    </span>
                  </div>

                </div>
              </div>

              {selectedSingleProduct ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  {/* Ledger Current Levels */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#f5f5f7] rounded-2xl p-4 border border-[#e2e2e7]">
                    
                    <div>
                      <span className="text-[9px] text-[#6e6e73] font-black uppercase block">{lang === 'ar' ? 'الكمية الحالية بالسيستم' : 'CURRENT SYSTEM QTY'}</span>
                      <span className="text-sm font-black font-mono text-[#0071e3] mt-1 block">
                        {selectedSingleProduct.quantity} {lang === 'ar' ? 'حبة' : 'pieces'}
                      </span>
                    </div>

                    {selectedSingleProduct.piecesPerCarton > 1 && (
                      <div>
                        <span className="text-[9px] text-[#6e6e73] font-black uppercase block">{lang === 'ar' ? 'تفكيك المخزون المقدر' : 'CURRENT CARTON UNIT'}</span>
                        <span className="text-xs font-bold text-gray-800 mt-1 block">
                          {Math.floor(selectedSingleProduct.quantity / selectedSingleProduct.piecesPerCarton)} كرتونة + {selectedSingleProduct.quantity % selectedSingleProduct.piecesPerCarton} حبة
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-[9px] text-[#6e6e73] font-black uppercase block">{lang === 'ar' ? 'سعر شراء القطعة' : 'UNIT BUY COST'}</span>
                      <span className="text-sm font-black font-mono text-emerald-800 mt-1 block">
                        {(selectedSingleProduct.purchasePricePiece || 0).toLocaleString()} SDG
                      </span>
                    </div>

                  </div>

                  {/* Count Form Input Fields */}
                  <div className="bg-emerald-50/15 border border-emerald-100 rounded-3xl p-5 space-y-4">
                    <h5 className="text-[10px] text-emerald-800 font-extrabold uppercase block">{lang === 'ar' ? 'العدد الفعلي المكتشف بالرف الآن (عد مادي يدوي):' : 'ACTUAL HAND COUNT ON SHELVES:'}</h5>
                    
                    {selectedSingleProduct.piecesPerCarton > 1 ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'عدد الكراتين المغلقة:' : 'Total Cartons Count:'}</label>
                          <input
                            type="number"
                            min="0"
                            value={singleCartons}
                            onChange={(e) => setSingleCartons(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-3 border border-[#d2d2d7] rounded-xl focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-bold bg-white text-gray-900"
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'عدد الحبات السائبة الإضافية:' : 'Extra Pieces Count:'}</label>
                          <input
                            type="number"
                            min="0"
                            value={singlePieces}
                            onChange={(e) => setSinglePieces(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full text-center py-3 border border-[#d2d2d7] rounded-xl focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-bold bg-white text-gray-900"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'إجمالي الحبات المفردة الفعلي بالرف:' : 'Total Pieces counted:'}</label>
                        <input
                          type="number"
                          min="0"
                          value={singlePieces}
                          onChange={(e) => setSinglePieces(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full text-center py-3 border border-[#d2d2d7] rounded-xl focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-bold bg-white text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-emerald-100/40 pt-3 text-xs">
                      <span className="text-gray-500">{lang === 'ar' ? 'مجموع الحبات الفعلية بالجرد المالي:' : 'Accumulated items in manual count:'}</span>
                      <span className="bg-emerald-100 text-emerald-800 font-black font-mono px-3 py-1 rounded-lg">
                        {singleLiveComputation?.actualPieces} {lang === 'ar' ? 'حبة' : 'pieces'}
                      </span>
                    </div>

                  </div>

                  {/* Discrepancy Display Board */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    singleLiveComputation?.isPerfect 
                      ? 'bg-gray-50 border-gray-250 text-gray-800' 
                      : singleLiveComputation?.isExcess
                        ? 'bg-emerald-50/40 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50/40 border-rose-300 text-rose-900'
                  }`}>
                    
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#6e6e73] font-bold block">{lang === 'ar' ? 'الفارق الناتج عن الحصر:' : 'DISCREPANCY VARIANCE'}</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        {singleLiveComputation?.isPerfect && (
                          <span className="text-xs text-gray-700">{lang === 'ar' ? 'مطابق لبيانات السيستم ١٠٠٪ 👍' : 'Perfect Book Balance match 👍'}</span>
                        )}
                        {!singleLiveComputation?.isPerfect && (
                          <span className={`text-xs font-black ${singleLiveComputation?.isExcess ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {singleLiveComputation?.isExcess ? `+${singleLiveComputation?.discrepancy}` : singleLiveComputation?.discrepancy} {lang === 'ar' ? 'حبة' : 'pieces'}
                            {singleLiveComputation?.isExcess ? ` (${lang === 'ar' ? 'وفر زائد بالرف' : 'Surplus overage'})` : ` (${lang === 'ar' ? 'عجز مفقود' : 'Deficit shrinkage'})`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[9px] text-[#6e6e73] font-black block">{lang === 'ar' ? 'القيمة المالية (تكلفة الشراء)' : 'STOCK VALUE IMPACT'}</span>
                      <span className={`text-sm font-black ${
                        singleLiveComputation?.isPerfect 
                          ? 'text-gray-705' 
                          : singleLiveComputation?.isExcess 
                            ? 'text-emerald-600' 
                            : 'text-rose-600'
                      }`}>
                        {singleLiveComputation?.isExcess ? '+' : ''}
                        {Math.round(singleLiveComputation?.costImpact || 0).toLocaleString()} SDG
                      </span>
                    </div>

                  </div>

                  {/* Notes input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1d1d1f] block">{lang === 'ar' ? 'ملاحظات المعاينة مبرراً للفروق إن وجدت:' : 'Observation notes & justification context:'}</label>
                    <textarea
                      rows={2}
                      value={singleNotes}
                      onChange={(e) => setSingleNotes(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: معالجة سوء رصد في الكاونتر أو تبرير كسر...' : 'Provide audit reasoning...'}
                      className="w-full text-xs p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  {/* Submit single count */}
                  <button
                    onClick={handleSaveSingleAudit}
                    className="w-full py-3.5 bg-[#1d1d1f] hover:bg-black text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2"
                  >
                    <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'ar' ? 'تعديل وحفظ رصيد هذا الصنف مبرراً بالسيستم' : 'Commit Single Item Reconciliation'}</span>
                  </button>

                </motion.div>
              ) : (
                <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <Package className="w-10 h-10 text-gray-300" />
                  <p className="text-xs font-semibold">
                    {lang === 'ar' 
                      ? 'يرجى اختيار الصنف المستهدف بالجرد من القائمة لعرض رصيده والبدء في مطابقة رفوفك الفعلية تلقائياً.' 
                      : 'Please select a warehouse target product from the drop-down to start audits.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            
            /* MODE 2: BULK AUDIT GRID INTERFACE */
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 md:p-6 shadow-xs space-y-5">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-black text-[#1d1d1f] flex items-center gap-1.5 uppercase">
                    <SlidersHorizontal className="w-5 h-5 text-purple-650" />
                    <span>{lang === 'ar' ? 'الشبكة الشاملة لجرد كامل المستودع كدفعة واحدة' : 'Wholesale Omni-Warehouse Sweep Grid'}</span>
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {lang === 'ar' 
                      ? 'قم بالمرور على الأصناف في الرفوف وأدخل كمياتها تدريجياً، وسيقوم النظام بتسية الكل بضغطة زر واحدة دون أي نقص.' 
                      : 'Perform physical count concurrently for multiple items. Perfect for massive routine loops.'}
                  </p>
                </div>

                {/* Bulk controls state triggers */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => resetBulkState('match_system')}
                    className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-150 border border-gray-300 text-gray-700 rounded-lg text-[10px] font-bold transition"
                  >
                    {lang === 'ar' ? '🔄 ملء مسودة بمطابقة السيستم' : 'Prefill Matching levels'}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetBulkState('zero_all')}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition"
                  >
                    {lang === 'ar' ? '🗑️ تصفير كل المسودات بالرف' : 'Reset Counting'}
                  </button>
                </div>
              </div>

              {/* DYNAMIC LIST GRID SCREEN */}
              <div className="overflow-x-auto border border-gray-150 rounded-2xl">
                <table className="w-full text-right text-[11px] leading-relaxed select-none">
                  <thead className="bg-slate-50 border-b border-gray-200 font-bold text-xs">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[120px]">{lang === 'ar' ? 'اسم الصنف' : 'Product'}</th>
                      <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'الرصيد الدفتري' : 'Book Stock'}</th>
                      <th className="py-2.5 px-3 text-center min-w-[180px] bg-purple-50/35">{lang === 'ar' ? 'الكمية الفعلية المكتشفة' : 'Actual Shelf Level Count'}</th>
                      <th className="py-2.5 px-2 text-center">{lang === 'ar' ? 'الفارق المالي المكتشف' : 'Financial Impact'}</th>
                      <th className="py-2.5 px-3">{lang === 'ar' ? 'ملاحظة التسوية والتبرير' : 'Reconciliation Note'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          {lang === 'ar' ? 'لا توجد بضائع تطابق التصفية الحالية.' : 'No products matched selection.'}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const itemState = bulkAuditState[p.id] || { cartons: 0, pieces: 0, notes: '', isEdited: false };
                        
                        // Calculated live units
                        const actualPieces = p.piecesPerCarton > 1
                          ? ((Number(itemState.cartons) || 0) * p.piecesPerCarton) + (Number(itemState.pieces) || 0)
                          : (Number(itemState.pieces) || 0);

                        const discrepancy = actualPieces - p.quantity;
                        const costImpactVal = discrepancy * (p.purchasePricePiece || 0);

                        return (
                          <tr 
                            key={p.id} 
                            className={`hover:bg-gray-50/50 transition duration-150 ${
                              itemState.isEdited ? 'bg-amber-50/20' : ''
                            }`}
                          >
                            {/* Product Info */}
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#1d1d1f] block text-[11px] max-w-[150px] truncate">{lang === 'ar' ? p.name_ar : p.name_en}</span>
                              <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{p.barcode || 'بلا باركود'} • {p.category}</span>
                            </td>

                            {/* Book Qty */}
                            <td className="py-3 px-2 text-center">
                              <span className="font-bold text-gray-700 block font-mono">
                                {p.quantity} {p.unit || (lang === 'ar' ? 'حبة' : 'pcs')}
                              </span>
                              {p.piecesPerCarton > 1 && (
                                <span className="text-[9px] text-gray-450 block mt-0.5">
                                  ({Math.floor(p.quantity / p.piecesPerCarton)} كرتونة + {p.quantity % p.piecesPerCarton} حبة)
                                </span>
                              )}
                            </td>

                            {/* Editable Shelf Count inputs */}
                            <td className="py-3 px-3 text-center bg-purple-50/5">
                              {p.piecesPerCarton > 1 ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-1/2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={itemState.cartons}
                                      onChange={(e) => handleBulkInputChanged(
                                        p.id, 
                                        'cartons', 
                                        e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                                      )}
                                      placeholder={lang === 'ar' ? 'كرتون' : 'ctn'}
                                      className="w-full text-center py-1 font-bold border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-650 bg-white"
                                    />
                                  </div>
                                  <div className="w-1/2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={itemState.pieces}
                                      onChange={(e) => handleBulkInputChanged(
                                        p.id, 
                                        'pieces', 
                                        e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                                      )}
                                      placeholder={lang === 'ar' ? 'حبيّة' : 'pcs'}
                                      className="w-full text-center py-1 font-bold border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-650 bg-white"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  value={itemState.pieces}
                                  onChange={(e) => handleBulkInputChanged(
                                    p.id, 
                                    'pieces', 
                                    e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0)
                                  )}
                                  placeholder={p.unit || (lang === 'ar' ? 'حبات' : 'pieces')}
                                  className="w-2/3 mx-auto text-center py-1 font-bold border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-650 bg-white"
                                />
                              )}
                              <div className="text-[9px] text-gray-400 mt-1 block font-mono">
                                {lang === 'ar' ? 'الإجمالي المقاس يدوياً:' : 'Total counted pieces:'} <span className="font-extrabold text-indigo-750">{actualPieces} حبة</span>
                              </div>
                            </td>

                            {/* Discrepancy column */}
                            <td className="py-3 px-2 text-center">
                              {discrepancy === 0 ? (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded block w-fit mx-auto">{lang === 'ar' ? 'متسق' : 'Match'}</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className={`px-1 rounded text-[9px] font-black inline-block ${
                                    discrepancy > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy} {lang === 'ar' ? 'حبة' : 'pcs'}
                                  </span>
                                  <span className={`block text-[9px] font-mono font-bold ${
                                    discrepancy > 0 ? 'text-emerald-600' : 'text-rose-650'
                                  }`}>
                                    {discrepancy > 0 ? '+' : ''}{Math.round(costImpactVal).toLocaleString()} SDG
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Adjustment Note */}
                            <td className="py-3 px-3">
                              <input
                                type="text"
                                value={itemState.notes}
                                onChange={(e) => handleBulkInputChanged(p.id, 'notes', e.target.value)}
                                placeholder={lang === 'ar' ? 'سبب الفرق...' : 'Variance justification...'}
                                className="w-full text-[10px] px-2 py-1 border border-gray-200 rounded-lg bg-gray-50"
                              />
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* SAVE ALL BULK EDITS */}
              <div className="flex justify-end p-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleSaveBulkAudit}
                  className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition"
                >
                  <Check className="w-4.5 h-4.5" />
                  <span>{lang === 'ar' ? 'اعتماد التعديلات وحفظ الجرد الشامل لكافة البضائع الملموسة' : 'Commit Bulk Reconciliation Entries'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* LEFT SIDE: Historical reconciliation logs report & archiver */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* LOGS TITLE */}
          <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-[#1d1d1f] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <span>{lang === 'ar' ? 'سجل وكشوف التسويات التاريخية السابقة' : 'Reconciliation Logs Archives'}</span>
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{lang === 'ar' ? 'محاضر تسويات الفوارق للطباعة والتصدير' : 'Past physical discrepancy notes'}</p>
              </div>

              {/* Export logs to Excel completely */}
              {audits.length > 0 && (
                <button
                  onClick={() => {
                    const excelAudits = audits.map(a => ({
                      'تاريخ التسوية': new Date(a.createdAt).toLocaleString(),
                      'اسم الصنف': a.productNameAr,
                      'شحنة السيستم (دفتري قبل)': `${a.totalPiecesBefore} حبة (${a.numCartonsBefore} كرتون + ${a.piecesBefore} حبة)`,
                      'عد الجرد (فعلي)': `${a.totalPiecesAfter} حبة (${a.numCartonsAfter} كرتون + ${a.piecesAfter} حبة)`,
                      'فوارق الرف بالقطع': a.discrepancyPcs > 0 ? `+${a.discrepancyPcs}` : a.discrepancyPcs,
                      'الأثر المالي بالدولار/الجملة (SDG)': a.discrepancyValueSDG,
                      'التبرير والسبب المستند': a.notes
                    }));
                    const ws = XLSX.utils.json_to_sheet(excelAudits);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Inventory Reconciliation Logs");
                    XLSX.writeFile(wb, "Nile_Audit_Reconciliation_Report_Periodic.xlsx");
                    addToast(lang === 'ar' ? 'تم تصدير سجلات التسويات إلى Excel بنجاح' : 'Audit logs report created successfully', 'success');
                  }}
                  className="p-2 border border-[#d2d2d7] bg-white text-emerald-600 rounded-lg hover:bg-gray-50"
                  title={lang === 'ar' ? 'تصدير كمحضر إكسل' : 'Export Audits Logs'}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick logs search */}
            <div className="relative">
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث في السجل باسم الصنف أو المبرر...' : 'Search logs...'}
                className="w-full text-xs pr-8 pl-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-gray-450 absolute top-2.5 right-2.5" />
            </div>

            {/* Logs items lists */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {audits.filter(a => {
                const q = auditSearch.toLowerCase();
                return (
                  a.productNameAr.toLowerCase().includes(q) ||
                  (a.productNameEn || '').toLowerCase().includes(q) ||
                  (a.notes || '').toLowerCase().includes(q)
                );
              }).length === 0 ? (
                <div className="py-12 text-center text-gray-450 text-[10px] bg-gray-50 rounded-2xl">
                  {lang === 'ar' ? 'لا توجد قيود تسوية سابقة مسجلة أو مطابقة لبحثك.' : 'No audit entries found.'}
                </div>
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
                  .slice(0, 30) // capped at 30 for swift performance
                  .map(rec => {
                    const isPositive = rec.discrepancyPcs >= 0;
                    return (
                      <div 
                        key={rec.id} 
                        className={`p-3 rounded-xl border flex flex-col gap-1 text-[10px] ${
                          isPositive ? 'bg-emerald-50/15 border-emerald-150' : 'bg-rose-50/15 border-rose-150'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#1d1d1f] max-w-[130px] truncate">{lang === 'ar' ? rec.productNameAr : rec.productNameEn}</span>
                          
                          {/* Trash log entry */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(lang === 'ar' ? 'حذف هذا السجل فقط بشكل أبدي؟ (لن تتبدل بضائع المستودع الحالية)' : 'Delete permanently?')) {
                                const list = audits.filter(a => a.id !== rec.id);
                                onSaveAudits(list);
                                addToast(lang === 'ar' ? 'تم حذف السجل بنجاح' : 'Log registry removed', 'info');
                              }
                            }}
                            className="text-gray-400 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-gray-450 text-[9px] font-mono font-bold">
                          <span>{new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={isPositive ? 'text-emerald-700' : 'text-red-700'}>
                            {isPositive ? '+' : ''}{rec.discrepancyPcs} حبة
                          </span>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-100 pt-1.5 mt-1 font-mono text-[9px]">
                          <span className="text-gray-500 max-w-[150px] truncate" title={rec.notes}>{rec.notes}</span>
                          <span className={`font-black ${isPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isPositive ? '+' : ''}{Math.round(rec.discrepancyValueSDG).toLocaleString()} SDG
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {audits.length > 30 && (
              <p className="text-[9px] text-gray-450 text-center leading-none">
                {lang === 'ar' ? '...يتم عرض أحدث 30 تسوية لتسريع تصفح السيستم...' : '...Showing latest 30 adjustments...'}
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
