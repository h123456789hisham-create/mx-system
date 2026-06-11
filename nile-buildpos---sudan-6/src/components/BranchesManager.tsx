import React, { useState, useMemo } from 'react';
import { 
  Building2, MapPin, User, Wallet, Package, Phone, TrendingUp, 
  Plus, Edit, Trash2, CheckCircle2, AlertTriangle, Search, Target, 
  Settings, Award, HelpCircle, ArrowRightLeft, Landmark, Layers, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Branch, Warehouse, CashSafe, Invoice, Expense } from '../types';

interface BranchesManagerProps {
  branches: Branch[];
  warehouses: Warehouse[];
  safes: CashSafe[];
  sales: Invoice[];
  expenses: Expense[];
  onAddBranch: (branch: Branch) => void;
  onUpdateBranch: (branch: Branch) => void;
  onDeleteBranch: (id: string) => void;
  lang: 'ar' | 'en';
  currency: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function BranchesManager({
  branches,
  warehouses,
  safes,
  sales,
  expenses,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  lang,
  currency,
  addToast
}: BranchesManagerProps) {
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [associatedWarehouseId, setAssociatedWarehouseId] = useState('');
  const [associatedSafeId, setAssociatedSafeId] = useState('');
  const [targetSalesMonth, setTargetSalesMonth] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Handle Edit Trigger
  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setCode(branch.code);
    setCity(branch.city);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setManager(branch.manager || '');
    setStatus(branch.status);
    setIsHeadquarters(branch.isHeadquarters);
    setAssociatedWarehouseId(branch.associatedWarehouseId || '');
    setAssociatedSafeId(branch.associatedSafeId || '');
    setTargetSalesMonth(branch.targetSalesMonth || 0);
    setNotes(branch.notes || '');
    setIsFormOpen(true);
  };

  // Close Form and Reset Group
  const closeForm = () => {
    setEditingBranch(null);
    setName('');
    setCode('');
    setCity('');
    setAddress('');
    setPhone('');
    setManager('');
    setStatus('active');
    setIsHeadquarters(false);
    setAssociatedWarehouseId('');
    setAssociatedSafeId('');
    setTargetSalesMonth(0);
    setNotes('');
    setIsFormOpen(false);
  };

  // Handle Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast(lang === 'ar' ? 'يرجى إدخال اسم الفرع والترميز' : 'Please fill branch name and details', 'error');
      return;
    }

    if (!code.trim()) {
      addToast(lang === 'ar' ? 'يرجى إدخال رمز فريد للفرع' : 'Please provide a unique branch code', 'error');
      return;
    }

    // Check if code is already used (by another branch)
    const duplicateCode = branches.find(b => b.code.toLowerCase() === code.trim().toLowerCase() && b.id !== editingBranch?.id);
    if (duplicateCode) {
      addToast(lang === 'ar' ? 'رمز الفرع هذا مستخدم بالفعل لفرع آخر' : 'Branch code is already used by another branch', 'error');
      return;
    }

    const branchData: Branch = {
      id: editingBranch ? editingBranch.id : Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      manager: manager.trim() || undefined,
      status,
      isHeadquarters,
      associatedWarehouseId: associatedWarehouseId || undefined,
      associatedSafeId: associatedSafeId || undefined,
      targetSalesMonth: targetSalesMonth > 0 ? Number(targetSalesMonth) : undefined,
      notes: notes.trim() || undefined,
      createdAt: editingBranch ? editingBranch.createdAt : Date.now()
    };

    if (editingBranch) {
      onUpdateBranch(branchData);
      addToast(lang === 'ar' ? 'تم تحديث معلومات الفرع بنجاح' : 'Branch information updated successfully', 'success');
    } else {
      onAddBranch(branchData);
      addToast(lang === 'ar' ? 'تم إضافة الفرع الجديد لشبكة الفروع' : 'New branch successfully added to the grid', 'success');
    }

    closeForm();
  };

  // Calculate stats for a specific branch
  const getBranchMetrics = (branch: Branch) => {
    // We assume invoices carry an attribute `branchId` if selected. We'll default to attributing to headquarters if not defined or matching.
    const branchSales = sales.filter(inv => {
      // If invoice has branchId, match exactly. Otherwise, if the branch is headquarters, match invoices without branchId too.
      // E.g., @Legacy sales attribution
      const invBranchId = (inv as any).branchId;
      if (invBranchId) {
        return invBranchId === branch.id;
      }
      return branch.isHeadquarters;
    });

    const totalSalesValue = branchSales.reduce((sum, inv) => sum + inv.total, 0);
    const countSales = branchSales.length;

    // Expenses mapped to safe or associated branch explicitly
    const branchExpenses = expenses.filter(exp => {
      // If safe is associated with the branch, we can match expense from that safe
      if (branch.associatedSafeId && exp.sourceId === branch.associatedSafeId) {
        return true;
      }
      return (exp as any).branchId === branch.id;
    });
    
    const totalExpensesValue = branchExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Current Liquidity
    const safeObj = safes.find(s => s.id === branch.associatedSafeId);
    const currentLiquidity = safeObj ? safeObj.balance : 0;

    return {
      totalSalesValue,
      countSales,
      totalExpensesValue,
      currentLiquidity,
      salesTargetStatusPct: branch.targetSalesMonth && branch.targetSalesMonth > 0 
        ? Math.min(100, Math.round((totalSalesValue / branch.targetSalesMonth) * 100))
        : null
    };
  };

  // Filtered branches list
  const filteredBranches = useMemo(() => {
    return branches.filter(b => {
      const query = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(query) || 
             b.code.toLowerCase().includes(query) || 
             (b.city && b.city.toLowerCase().includes(query)) ||
             (b.manager && b.manager.toLowerCase().includes(query));
    });
  }, [branches, searchQuery]);

  // General network stats
  const totalActiveSales = useMemo(() => {
    return branches.reduce((sum, b) => sum + getBranchMetrics(b).totalSalesValue, 0);
  }, [branches, sales]);

  const totalMonthlyTargets = useMemo(() => {
    return branches.reduce((sum, b) => sum + (b.targetSalesMonth || 0), 0);
  }, [branches]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || null;
  const selectedBranchMetrics = selectedBranch ? getBranchMetrics(selectedBranch) : null;

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Analytics Widgets */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-5 no-print">
        <div>
          <h2 className="text-xl font-black text-[#1d1d1f] tracking-tight">
            {lang === 'ar' ? 'إدارة شبكة وفروع المؤسسة والبيع المتعدد' : 'Multi-Branch & Regional Enterprise Hub'}
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'تأسيس فروع البيع، ربط صناديق النقد والجرود والمستودعات بشكل مستقل لكل فرع، ومتابعة الأهداف الشهرية' 
              : 'Add enterprise branches, monitor targets, link regional stock warehouses and cash tills independently'}
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافـة فرع جديد' : 'Establish New Branch'}</span>
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">{lang === 'ar' ? 'إجمالي عدد الفروع' : 'Registered Branches'}</span>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-2xl font-mono font-black text-gray-900 block mt-2">
            {branches.length}
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">
            {branches.filter(b => b.status === 'active').length} {lang === 'ar' ? 'فروع نشطة حالياً بتشغيل كامل' : 'active branches'}
          </span>
        </div>

        <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-600 font-extrabold uppercase">{lang === 'ar' ? 'إجمالي المبيعات بالفروع' : 'Cross-Branch Sales'}</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-mono font-black text-emerald-600 block mt-2">
            {totalActiveSales.toLocaleString()} <span className="text-xs font-sans text-gray-400">{currency}</span>
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">
            {lang === 'ar' ? 'حركة الإقساط والكاشير المدمجة للشبكة' : 'Consolidated POS revenue across the grid'}
          </span>
        </div>

        <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-600 font-extrabold uppercase">{lang === 'ar' ? 'المستهدفات الشهرية الكلية' : 'Network Sales Targets'}</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-mono font-black text-indigo-600 block mt-2">
            {totalMonthlyTargets.toLocaleString()} <span className="text-xs font-sans text-gray-400">{currency}</span>
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">
            {totalMonthlyTargets > 0 
              ? `${Math.round((totalActiveSales / totalMonthlyTargets) * 100)}% ${lang === 'ar' ? 'نسبة الإنجاز الكلي' : 'total cumulative progress'}`
              : lang === 'ar' ? 'لم تضبط ميزانية مبيعات للفرع' : 'No target is registered yet'
            }
          </span>
        </div>

        <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-teal-600 font-extrabold uppercase">{lang === 'ar' ? 'المقر الرئيسي للمؤسسة' : 'Headquarters node'}</span>
            <Award className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-xs font-bold text-gray-800 truncate block mt-2.5">
            {branches.find(b => b.isHeadquarters)?.name || (lang === 'ar' ? 'لم يحدد فرع رئيسي بعد' : 'Not assigned yet')}
          </span>
          <span className="text-[9px] text-purple-600 font-medium mt-1 block">
            {lang === 'ar' ? 'يستقبل المبيعات التأسيسية للمخزن كمركز قياسي' : 'Primary focal point of retail and transfers'}
          </span>
        </div>
      </div>

      {/* MAIN TWO COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANEL: BRANCHES SEARCH & GRID LIST */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Quick inline search in branches */}
          <div className="bg-white border border-[#d2d2d7] rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'ابحث باسم الفرع، المدينة، أو المدير المسؤول...' : 'Search directory for branches...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-10 pl-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7]/80 rounded-xl focus:outline-none focus:border-[#0071e3]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-[#f5f5f7] hover:bg-gray-100 text-gray-600 text-xs rounded-xl"
              >
                {lang === 'ar' ? 'مسح التصفية' : 'Reset'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBranches.length === 0 ? (
              <div className="md:col-span-2 bg-white text-center py-16 border border-[#d2d2d7] rounded-3xl space-y-3">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400">
                  {lang === 'ar' ? 'لا توجد فروع مضافة تطابق البحث حالياً.' : 'No branches saved matching selection.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded-xl transition"
                >
                  {lang === 'ar' ? 'إنشـاء أول فرع الآن' : 'Create standard branch'}
                </button>
              </div>
            ) : (
              filteredBranches.map(branch => {
                const metrics = getBranchMetrics(branch);
                const isSelected = selectedBranchId === branch.id;
                
                return (
                  <div
                    key={branch.id}
                    onClick={() => setSelectedBranchId(branch.id)}
                    className={`bg-white border transition-all rounded-2xl p-5 cursor-pointer relative flex flex-col justify-between space-y-4 ${
                      isSelected 
                        ? 'border-[#0071e3] ring-2 ring-[#0071e3]/10 shadow-md' 
                        : 'border-[#d2d2d7] hover:border-gray-400 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Name and indicators */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-gray-900">{branch.name}</h4>
                          <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {branch.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>{branch.city} {branch.address ? `• ${branch.address}` : ''}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                        {branch.isHeadquarters && (
                          <span className="bg-purple-50 text-purple-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            {lang === 'ar' ? 'المقر الرئيسي الرئيسي' : 'Headquarters'}
                          </span>
                        )}
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          branch.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {branch.status === 'active' ? (lang === 'ar' ? 'نشط تشغيل' : 'Active') : (lang === 'ar' ? 'مغلق مؤقتاً' : 'Inactive')}
                        </span>
                      </div>
                    </div>

                    {/* Associated components info badges */}
                    <div className="grid grid-cols-2 gap-2 bg-[#f5f5f7]/60 p-2.5 rounded-xl text-[10px] text-gray-600">
                      <div className="flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          {safes.find(s => s.id === branch.associatedSafeId)?.name || (lang === 'ar' ? 'لا خزينة صندوق' : 'No Safe')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                          {warehouses.find(w => w.id === branch.associatedWarehouseId)?.name || (lang === 'ar' ? 'لا مستودع مرتبط' : 'No Warehouse')}
                        </span>
                      </div>
                    </div>

                    {/* Target performance bar */}
                    {branch.targetSalesMonth && branch.targetSalesMonth > 0 ? (
                      <div className="space-y-1 pt-1 border-t border-gray-100">
                        <div className="flex justify-between text-[9px] font-medium text-gray-400">
                          <span className="flex items-center gap-1 font-bold">
                            <Target className="w-2.5 h-2.5 text-indigo-500" />
                            {lang === 'ar' ? 'هدف مبيعات الشهر:' : 'Monthly Target:'}
                          </span>
                          <span className="font-mono text-gray-700 font-bold">
                            {metrics.salesTargetStatusPct}% ({metrics.totalSalesValue.toLocaleString()} / {branch.targetSalesMonth.toLocaleString()})
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${metrics.salesTargetStatusPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[9px] text-[#6e6e73] font-medium italic pt-1 border-t border-gray-100 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-gray-400" />
                        <span>{lang === 'ar' ? 'لم يتم تحديد مستهدف مبيعات لتتبع أدائه المالي' : 'No dynamic sales target is configured for tracking'}</span>
                      </div>
                    )}

                    {/* Bottom Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <div className="text-[10px] text-gray-500 font-bold">
                        {lang === 'ar' ? 'إجمالي المبيعات:' : 'Total Sales:'}{' '}
                        <span className="font-black font-mono text-emerald-600">{metrics.totalSalesValue.toLocaleString()} {currency}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(branch);
                          }}
                          className="p-1.5 hover:bg-gray-100 text-[#0071e3] hover:text-[#0b66c2] rounded-lg transition"
                          title={lang === 'ar' ? 'تعديل الإعدادات' : 'Edit Branch'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!branch.isHeadquarters && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف هذا الفرع نهائياً من الشبكة؟' : 'Confirm branch deletion?')) {
                                onDeleteBranch(branch.id);
                                addToast(lang === 'ar' ? 'تم حذف الفرع من السجلات' : 'Branch removed successfully', 'info');
                                if (selectedBranchId === branch.id) setSelectedBranchId(null);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition"
                            title={lang === 'ar' ? 'حذف الفرع' : 'Delete Branch'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED BRANCH DETAILS & AUDITS OR SETTINGS ACTIONS */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 shadow-xs space-y-5">
            {selectedBranch ? (
              <>
                {/* Header detail */}
                <div className="border-b border-gray-100 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 rounded-md font-extrabold px-2 py-0.5 uppercase">
                      {lang === 'ar' ? 'تحقيق وبطاقة الأداء' : 'BRANCH BALANCES CARD'}
                    </span>
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">{selectedBranch.name}</h3>
                    <p className="text-[10px] text-gray-400">
                      {lang === 'ar' ? `رمز النظام: ${selectedBranch.code} • مدير الفرع: ${selectedBranch.manager || 'غير معين'}` : `Code: ${selectedBranch.code} • Manager: ${selectedBranch.manager || 'N/A'}`}
                    </p>
                  </div>
                </div>

                {/* Performance stats column */}
                <div className="space-y-4">
                  
                  {/* Ledger metric 1: Sales count */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-[10px] text-gray-500 block font-medium">{lang === 'ar' ? 'مبيعات الكاشير بالفرع' : 'Branch Total Sales'}</span>
                        <span className="text-[9px] text-gray-400 block">{selectedBranchMetrics?.countSales} {lang === 'ar' ? 'عمليات بيع ناجحة' : 'total items counter'}</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-black text-gray-900">
                      {selectedBranchMetrics?.totalSalesValue.toLocaleString()} <span className="text-[10px] font-sans">{currency}</span>
                    </span>
                  </div>

                  {/* Ledger metric 2: Expenses linked */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <div>
                        <span className="text-[10px] text-gray-500 block font-medium">{lang === 'ar' ? 'مصروفات ونثريات الفرع' : 'Branch Operating Expenses'}</span>
                        <span className="text-[9px] text-gray-400 block">{lang === 'ar' ? 'مرتبات وعقود تشغيل للفرع' : 'Linked safe spendings'}</span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-black text-red-600">
                      {selectedBranchMetrics?.totalExpensesValue.toLocaleString()} <span className="text-[10px] font-sans">{currency}</span>
                    </span>
                  </div>

                  {/* Ledger metric 3: Cash balance in till */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-500" />
                      <div>
                        <span className="text-[10px] text-gray-500 block font-medium">{lang === 'ar' ? 'السيولة المتوفرة بالخزينة' : 'Immediate Cash Register'}</span>
                        <span className="text-[9px] text-[#6e6e73] block truncate max-w-[130px]">
                          {safes.find(s => s.id === selectedBranch.associatedSafeId)?.name || (lang === 'ar' ? 'غير مرتبطة بصندوق صرافة' : 'No Safe')}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-black text-purple-600">
                      {selectedBranchMetrics?.currentLiquidity.toLocaleString()} <span className="text-[10px] font-sans">{currency}</span>
                    </span>
                  </div>

                  {/* Stock tracking indicator */}
                  <div className="flex items-center gap-2 p-3 border border-dashed border-[#d2d2d7] rounded-xl text-[11px] text-[#6e6e73]">
                    <Package className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-extrabold text-gray-800 block text-[10px]">{lang === 'ar' ? 'المستودع المعتمد بالفرع:' : 'Primary Storehouse Link:'}</span>
                      <span className="text-[9px]">
                        {warehouses.find(w => w.id === selectedBranch.associatedWarehouseId)?.name || (lang === 'ar' ? 'لا يوجد صلة تلقائية بمستودع التنازل والتحويل' : 'Manual stock control')}
                      </span>
                    </div>
                  </div>

                  {/* Notes panel if exists */}
                  {selectedBranch.notes && (
                    <div className="bg-amber-50/40 p-3 rounded-xl text-[10px] text-gray-600 space-y-1">
                      <span className="font-extrabold text-amber-800 block">{lang === 'ar' ? 'ملاحظات وتنبيهات الإدارة بالفرع:' : 'Management Notes:'}</span>
                      <p className="leading-relaxed">{selectedBranch.notes}</p>
                    </div>
                  )}

                  {/* Regional Performance Score */}
                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase block">{lang === 'ar' ? 'مستوى الكفاءة التشغيلية' : 'Branch Health Grade'}</span>
                    <div className="flex items-center gap-2">
                      <div className="font-black text-2xl text-indigo-600 font-mono">
                        {selectedBranchMetrics?.salesTargetStatusPct !== null 
                          ? `${selectedBranchMetrics.salesTargetStatusPct}%` 
                          : '100%'}
                      </div>
                      <p className="text-[9px] text-gray-500 leading-snug">
                        {lang === 'ar'
                          ? 'نسبة جباية ومبيعات الفرع إلى الكلي المستهدف خلال الـ 30 يوماً الماضية.'
                          : 'Target collection rate achieved versus projected operations goal.'}
                      </p>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[#6e6e73] space-y-3">
                <Building2 className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="text-xs font-bold">{lang === 'ar' ? 'معاينة تتبع وتحليلات الفروع' : 'Branch Analytics Inspection'}</h4>
                <p className="text-[10px] px-4">
                  {lang === 'ar' ? 'اضغط على أي فرع من القائمة الجانبية المجاورة لاستعراض ميزانيته وأدائه وصناديق النقد والجرود التفصيلية والنسب المحققة.' : 'Select any branch from left card directory to view live budgets, tied stock balances and performance score card.'}
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. MODAL DRAWER FORM: ADD / EDIT BRANCH */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Form head */}
              <div className="px-6 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900">
                    {editingBranch 
                      ? (lang === 'ar' ? `تعديل معلومات الفرع (${editingBranch.name})` : `Edit Branch Info (${editingBranch.name})`) 
                      : (lang === 'ar' ? 'إضافة فرع جديد للشبكة' : 'Attach New Node Branch')
                    }
                  </h3>
                  <p className="text-[10px] text-[#6e6e73]">
                    {lang === 'ar' ? 'يرجى تهيئة الصناديق والمستودع المعين لفرع البيع لضمان تدقيق التقرير' : 'Associate relevant parameters to establish proper auditing streams'}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="p-1.5 hover:bg-gray-200 text-gray-500 rounded-full transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Form body container with scroll */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Branch Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'اسم الفرع *' : 'Branch Name *'}</label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ar' ? 'مثال: فرع أمدرمان، فرع بورتسودان' : 'e.g. Omdurman Branch'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                    />
                  </div>

                  {/* Branch Code */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'رمز الفرع والنظام *' : 'Unique Code *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BR-OMD"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'المدينة / المنطقة' : 'City / Region'}</label>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'مثال: الخرطوم، بورتسودان' : 'e.g. Port Sudan'}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'رقم الهاتف وقنوات الاتصال' : 'Phone / Contact'}</label>
                    <input
                      type="text"
                      placeholder="e.g. 0912123456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Manager responsibility */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'المدير المسؤول عن الفرع' : 'Branch General Manager'}</label>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'اسم مدير مبيعات الفرع' : 'Director name'}
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'العنوان الجغرافي بالتفصيل' : 'Street Address'}</label>
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'الشارع، الموقع' : 'Details'}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Linking attributes */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                  {/* Safe Connection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-700 block gap-1 flex items-center">
                      <Wallet className="w-3 h-3 text-indigo-500" />
                      <span>{lang === 'ar' ? 'ربط خزينة النقد المعتمدة لدى الفرع' : 'Tied Till Safe Cash'}</span>
                    </label>
                    <select
                      value={associatedSafeId}
                      onChange={(e) => setAssociatedSafeId(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    >
                      <option value="">{lang === 'ar' ? '-- اختر خزينة الصرافة المخصصة للفرع --' : '-- Choose Cash safe --'}</option>
                      {safes.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.balance.toLocaleString()} {currency})</option>
                      ))}
                    </select>
                  </div>

                  {/* Warehouse Connection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-700 block gap-1 flex items-center">
                      <Package className="w-3 h-3 text-amber-500" />
                      <span>{lang === 'ar' ? 'ربط مستودع الجرد والقطع' : 'Connected Warehouse Stock'}</span>
                    </label>
                    <select
                      value={associatedWarehouseId}
                      onChange={(e) => setAssociatedWarehouseId(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono"
                    >
                      <option value="">{lang === 'ar' ? '-- اختر المستودع المرتبط بالفرع --' : '-- Choose Warehouse --'}</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name} {w.location ? `(${w.location})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                  {/* Sales target */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-600 block gap-1 flex items-center">
                      <Target className="w-3 h-3 text-indigo-500" />
                      <span>{lang === 'ar' ? 'المستهدف الشهري للمبيعات' : 'Sales Monthly Target'}</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000000"
                      value={targetSalesMonth || ''}
                      onChange={(e) => setTargetSalesMonth(e.target.value ? Number(e.target.value) : 0)}
                      className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none font-mono font-bold"
                    />
                  </div>

                  {/* Status checkbox and Headquarters radio toggling */}
                  <div className="grid grid-cols-1 gap-1 pt-1.5 pl-1.5">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isHeadquarters}
                        onChange={(e) => setIsHeadquarters(e.target.checked)}
                        className="rounded border-gray-300 text-[#0071e3] focus:ring-[#0071e3] w-3.5 h-3.5"
                      />
                      <span className="font-bold text-purple-700 text-[11px]">{lang === 'ar' ? 'تعيين كمقر رئيسي للعمل' : 'Mark as Headquarters'}</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-xs text-gray-700 select-none cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={status === 'active'}
                        onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="font-bold text-emerald-700 text-[11px]">{lang === 'ar' ? 'الفرع قيد التفعيل والتشغيل' : 'Active and fully operative'}</span>
                    </label>
                  </div>
                </div>

                {/* Notes and general comments */}
                <div className="space-y-1 border-t border-gray-100 pt-3">
                  <label className="text-[10px] font-bold text-gray-500 block">{lang === 'ar' ? 'ملاحظات إدارية وتفاصيل حول الفرع' : 'Operational Notes & Comments'}</label>
                  <textarea
                    rows={2}
                    placeholder={lang === 'ar' ? 'اكتب أي ملاحظات إدارية، ساعات العمل، توجيهات...' : 'Operating hours, regional constraints, etc.'}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] resize-none"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 bg-[#f5f5f7] hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    {lang === 'ar' ? 'إلغـاء' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {editingBranch 
                      ? (lang === 'ar' ? 'حفظ التحديثات' : 'Save Changes') 
                      : (lang === 'ar' ? 'إضافة الفرع الآن' : 'Add Branch Now')
                    }
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

// Simple internal interface to bypass standard compiler checks
interface XCircleProps extends React.SVGProps<SVGSVGElement> {}
const XCircle: React.FC<XCircleProps> = (props) => (
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
