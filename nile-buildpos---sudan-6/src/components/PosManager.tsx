import React, { useState, useMemo } from 'react';
import { 
  Laptop, History, PlusSquare, BarChart3, ArrowRight, ShieldCheck, 
  Play, StopCircle, UserCheck, CreditCard, ChevronRight, Calculator, 
  Users, DollarSign, Store, Clock, Plus, Trash2, Calendar, FileText, 
  AlertTriangle, Receipt, Search, CheckCircle2, TrendingUp, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { POSTerminal, POSSession, Branch, Invoice, SystemUser } from '../types';

interface PosManagerProps {
  lang: 'ar' | 'en';
  terminals: POSTerminal[];
  sessions: POSSession[];
  currentSessionId: string | null;
  posSubTab: 'checkout' | 'sessions' | 'terminals' | 'reports';
  setPosSubTab: (tab: 'checkout' | 'sessions' | 'terminals' | 'reports') => void;
  branches: Branch[];
  settings: any;
  saveTerminalsToStorage: (updated: POSTerminal[]) => void;
  saveSessionsToStorage: (updated: POSSession[]) => void;
  saveCurrentSessionIdToStorage: (id: string | null) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  sales: Invoice[];
  currentUser?: any;
  systemUsers?: SystemUser[];
}

export default function PosManager({
  lang,
  terminals,
  sessions,
  currentSessionId,
  posSubTab,
  setPosSubTab,
  branches,
  settings,
  saveTerminalsToStorage,
  saveSessionsToStorage,
  saveCurrentSessionIdToStorage,
  addToast,
  sales,
  currentUser,
  systemUsers = []
}: PosManagerProps) {

  // Opening form states
  const [sessionCashierName, setSessionCashierName] = useState('');
  const [isCustomCashier, setIsCustomCashier] = useState(false);
  const [selectedTerminalId, setSelectedTerminalId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [sessionNotes, setSessionNotes] = useState('');

  // Closing form states
  const [actualClosingBalance, setActualClosingBalance] = useState('0');
  const [closingNotes, setClosingNotes] = useState('');

  // Modal display states
  const [isOpeningSessionModalOpen, setIsOpeningSessionModalOpen] = useState(false);
  const [isClosingSessionModalOpen, setIsClosingSessionModalOpen] = useState(false);

  // New Terminal Form states
  const [newTerminalName, setNewTerminalName] = useState('');
  const [newTerminalCode, setNewTerminalCode] = useState('');
  const [associatedBranchId, setAssociatedBranchId] = useState('');

  // Search parameters for registers
  const [terminalSearch, setTerminalSearch] = useState('');

  // Selected historic session detail for visual inspection
  const [activeDetailSession, setActiveDetailSession] = useState<POSSession | null>(null);

  // Filter system users to find registered cashiers of this store's tenant
  const tenantCashiers = useMemo(() => {
    const currentTenantId = (currentUser?.tenantId || '').trim().toLowerCase();
    return systemUsers.filter(u => 
      (u.tenantId || '').trim().toLowerCase() === currentTenantId &&
      (u.role === 'cashier' || u.role === 'admin')
    );
  }, [systemUsers, currentUser]);

  // Active open session helper
  const activeSession = useMemo(() => {
    // If the logged in user is a sales cashier, they might not have the session ID on their browser's localstorage.
    // Try to auto-connect them to any active session matching their name or email!
    if (currentUser?.role === 'cashier' && currentUser?.name) {
      const found = sessions.find(s => 
        s.status === 'open' &&
        (s.cashierName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
         s.cashierName.trim().toLowerCase() === currentUser.email.trim().toLowerCase())
      );
      if (found) return found;
    }
    // Also check if admin is looking at POS and has an active session currently assigned
    return sessions.find(s => s.id === currentSessionId && s.status === 'open') || null;
  }, [sessions, currentSessionId, currentUser]);

  // Handle cashier-specific session filters
  const filteredSessions = useMemo(() => {
    if (currentUser?.role === 'cashier' && currentUser?.name) {
      return sessions.filter(sess => sess.cashierName.trim() === currentUser.name.trim());
    }
    return sessions;
  }, [sessions, currentUser]);

  // Handle Opening Session
  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCashierName.trim()) {
      addToast(lang === 'ar' ? 'يرجى إدخال اسم الكاشير' : 'Please enter cashier name', 'error');
      return;
    }
    if (!selectedTerminalId) {
      addToast(lang === 'ar' ? 'يرجى اختيار نقطة بيع معتمدة' : 'Please select terminal', 'error');
      return;
    }

    const startBalance = parseFloat(openingBalance) || 0;
    const terminal = terminals.find(t => t.id === selectedTerminalId);
    if (!terminal) return;

    // Check if terminal is already in an open session
    const isTerminalBusy = sessions.some(s => s.terminalId === selectedTerminalId && s.status === 'open');
    if (isTerminalBusy) {
      addToast(
        lang === 'ar' 
          ? 'نقطة البيع هذه مستخدمة بالفعل في وردية مفتوحة أخرى!' 
          : 'This terminal is already assigned to another open session!', 
        'error'
      );
      return;
    }

    const newSessionId = 'SESS-' + Date.now().toString().slice(-6);
    const newSession: POSSession = {
      id: newSessionId,
      terminalId: selectedTerminalId,
      cashierName: sessionCashierName,
      openedAt: Date.now(),
      openingBalance: startBalance,
      status: 'open',
      salesTotal: 0,
      cashSalesTotal: 0,
      transferSalesTotal: 0,
      checkSalesTotal: 0,
      invoicesCount: 0,
      notes: sessionNotes.trim() || undefined
    };

    // Update terminal current session tracking
    const updatedTerminals = terminals.map(t => {
      if (t.id === selectedTerminalId) {
        return { ...t, currentSessionId: newSessionId };
      }
      return t;
    });

    saveTerminalsToStorage(updatedTerminals);
    saveSessionsToStorage([newSession, ...sessions]);
    saveCurrentSessionIdToStorage(newSessionId);

    addToast(
      lang === 'ar' 
        ? `تم بدء وردية البيع بنجاح للكاشير الكاشير: ${sessionCashierName}` 
        : `POS shift started successfully for ${sessionCashierName}`, 
      'success'
    );

    // Reset fields
    setSessionCashierName('');
    setOpeningBalance('0');
    setSessionNotes('');
    setPosSubTab('checkout'); // Switch to cashier screen automatically!
  };

  // Handle Closing Session
  const handleCloseSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const actualClose = parseFloat(actualClosingBalance) || 0;
    const salesCashTotal = activeSession.cashSalesTotal || 0;
    const expectedClosing = activeSession.openingBalance + salesCashTotal;
    const discrepancyVal = actualClose - expectedClosing;

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          status: 'closed' as const,
          closedAt: Date.now(),
          expectedClosingBalance: expectedClosing,
          actualClosingBalance: actualClose,
          discrepancy: discrepancyVal,
          notes: (s.notes ? s.notes + '\n' : '') + `[إغلاق]: ${closingNotes}`.trim()
        };
      }
      return s;
    });

    // Update terminal status reference
    const updatedTerminals = terminals.map(t => {
      if (t.id === activeSession.terminalId) {
        return { ...t, currentSessionId: null };
      }
      return t;
    });

    saveTerminalsToStorage(updatedTerminals);
    saveSessionsToStorage(updatedSessions);
    saveCurrentSessionIdToStorage(null);

    addToast(
      lang === 'ar' 
        ? `تم إقفال الوردية وتسوية الكاش الفعلي للمطابقة المالية اليومية.` 
        : `POS shift closed & settled successfully.`, 
      'success'
    );

    // Reset fields
    setActualClosingBalance('0');
    setClosingNotes('');
  };

  // Handle Adding Terminal
  const handleAddTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerminalName.trim()) {
      addToast(lang === 'ar' ? 'يرجى كتابة اسم تعريفي لنقطة البيع' : 'Please write terminal name', 'error');
      return;
    }
    const finalCode = (newTerminalCode.trim() || 'POS-' + Math.floor(100 + Math.random() * 900)).toUpperCase();

    // Check uniqueness
    if (terminals.some(t => t.code === finalCode)) {
      addToast(lang === 'ar' ? 'شفرة/رمز نقطة البيع مستخدم مسبقاً!' : 'POS terminal code is already busy!', 'error');
      return;
    }

    const newTerm: POSTerminal = {
      id: 'term_' + Math.random().toString(36).substring(2, 9),
      name: newTerminalName.trim(),
      code: finalCode,
      branchId: associatedBranchId,
      status: 'active',
      createdAt: Date.now()
    };

    saveTerminalsToStorage([...terminals, newTerm]);
    addToast(lang === 'ar' ? 'تمت إضافة الرمز التعريفي ونقطة بيع بنجاح!' : 'POS Terminal added successfully!', 'success');

    // Reset
    setNewTerminalName('');
    setNewTerminalCode('');
    setAssociatedBranchId('');
  };

  // Delete terminal
  const handleDeleteTerminal = (id: string) => {
    const isSessionLinked = sessions.some(s => s.terminalId === id && s.status === 'open');
    if (isSessionLinked) {
      addToast(lang === 'ar' ? 'لا يمكن حذف نقطة البيع في الوقت الحالي لارتباطها بوردية غير مقفلة!' : 'Cannot delete terminal connected to active sessions!', 'error');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من رغبتك في حذف نقطة البيع هذه نهائياً؟' : 'Are you sure you want to delete this POS Terminal?')) {
      saveTerminalsToStorage(terminals.filter(t => t.id !== id));
      addToast(lang === 'ar' ? 'تم إلغاء وحذف نقطة البيع.' : 'POS Terminal deleted.', 'info');
    }
  };

  // Toggle Terminal Status (Active/Inactive)
  const toggleTerminalStatus = (id: string) => {
    const updated = terminals.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'active' ? 'inactive' as const : 'active' as const };
      }
      return t;
    });
    saveTerminalsToStorage(updated);
    addToast(lang === 'ar' ? 'تم تحديث حالة تفعيل نقطة البيع.' : 'Terminal status modified.', 'success');
  };

  // --- Reports calculations ---
  const posReportsData = useMemo(() => {
    const totalPosSales = sessions.reduce((sum, s) => sum + s.salesTotal, 0);
    const totalCashSales = sessions.reduce((sum, s) => sum + s.cashSalesTotal, 0);
    const totalTransferSales = sessions.reduce((sum, s) => sum + s.transferSalesTotal, 0);
    const totalCheckSales = sessions.reduce((sum, s) => sum + s.checkSalesTotal, 0);
    const totalInvoices = sessions.reduce((sum, s) => sum + s.invoicesCount, 0);

    // Grouping by Terminal
    const salesByTerminal: Record<string, { name: string; code: string; total: number; count: number }> = {};
    terminals.forEach(t => {
      salesByTerminal[t.id] = { name: t.name, code: t.code, total: 0, count: 0 };
    });
    sessions.forEach(s => {
      if (salesByTerminal[s.terminalId]) {
        salesByTerminal[s.terminalId].total += s.salesTotal;
        salesByTerminal[s.terminalId].count += s.invoicesCount;
      } else {
        // Fallback for custom or deleted terminals
        salesByTerminal[s.terminalId] = { name: 'نقطة بيع غير مدرجة', code: 'POS-DEL', total: s.salesTotal, count: s.invoicesCount };
      }
    });

    // Grouping by Cashier Performance
    const salesByCashier: Record<string, { total: number; count: number }> = {};
    sessions.forEach(s => {
      const name = s.cashierName.trim();
      if (!salesByCashier[name]) {
        salesByCashier[name] = { total: 0, count: 0 };
      }
      salesByCashier[name].total += s.salesTotal;
      salesByCashier[name].count += s.invoicesCount;
    });

    return {
      totalPosSales,
      totalCashSales,
      totalTransferSales,
      totalCheckSales,
      totalInvoices,
      terminalLeaderboard: Object.values(salesByTerminal).sort((a, b) => b.total - a.total),
      cashierLeaderboard: Object.entries(salesByCashier).map(([name, stat]) => ({ name, ...stat })).sort((a, b) => b.total - a.total)
    };
  }, [sessions, terminals]);

  const filteredTerminals = useMemo(() => {
    return terminals.filter(t => {
      const s = terminalSearch.toLowerCase().trim();
      return !s || t.name.toLowerCase().includes(s) || t.code.toLowerCase().includes(s);
    });
  }, [terminals, terminalSearch]);

  return (
    <div className="space-y-6">

      {/* TABS CONTAINER FOR POINT OF SALE AND SHIFT CONTROL */}
      {posSubTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CURRENT ALIVE/ACTIVE POS SESSION CARD */}
          <div className="lg:col-span-8 space-y-6">
            {activeSession ? (
              <div className="bg-gradient-to-br from-[#1d1d1f] to-[#2d2d2f] text-white p-6 rounded-2xl shadow-xl border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-emerald-500 text-[#1d1d1f] px-3.5 py-1 text-[10px] font-black uppercase rounded-br-2xl tracking-widest animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900 duration-500 animate-ping" />
                  <span>الوردية نشطة (ACTIVE)</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{lang === 'ar' ? 'الجلسة الرقمية الحالية' : 'Current active session token'}</p>
                    <h3 className="text-xl font-extrabold flex items-center gap-2">
                      <span className="font-mono bg-white/10 text-white rounded-lg px-2.5 py-0.5 text-xs font-black">{activeSession.id}</span>
                      <span>كاشير {activeSession.cashierName}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>منذ: {new Date(activeSession.openedAt).toLocaleTimeString('ar-EG')}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Laptop className="w-3.5 h-3.5 text-gray-400" />
                        <span>الجهاز: {terminals.find(t => t.id === activeSession.terminalId)?.name || 'غير معلوم'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPosSubTab('checkout')}
                      className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      🚀 شاشة الكاشير
                    </button>
                    <button
                      onClick={() => {
                        setActualClosingBalance(String(activeSession.openingBalance + activeSession.cashSalesTotal));
                        setIsClosingSessionModalOpen(true);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                    >
                      <StopCircle className="w-4 h-4" />
                      <span>تقفيل الوردية</span>
                    </button>
                  </div>
                </div>

                {/* Live Totals Bar of Active Session */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-400 block font-bold leading-none">رصيد الصندوق الافتتاحي</span>
                    <span className="text-sm font-black font-mono block mt-1.5">{activeSession.openingBalance.toLocaleString()} <span className="text-[10px]">SDG</span></span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-emerald-400 block font-bold leading-none">مبيعات نقدية (كاش)</span>
                    <span className="text-sm font-black font-mono block mt-1.5 text-emerald-300">{(activeSession.cashSalesTotal || 0).toLocaleString()} <span className="text-[10px]">SDG</span></span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-blue-400 block font-bold leading-none">مبيعات تحويل (بنكك)</span>
                    <span className="text-sm font-black font-mono block mt-1.5 text-blue-300">{(activeSession.transferSalesTotal || 0).toLocaleString()} <span className="text-[10px]">SDG</span></span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-yellow-400 block font-bold leading-none">الفواتير المستندة</span>
                    <span className="text-sm font-black font-mono block mt-1.5 text-yellow-300">{activeSession.invoicesCount || 0} فاتورة</span>
                  </div>
                </div>

                <div className="mt-4 bg-[#0071e3]/10 border border-[#0071e3]/20 text-[11px] text-[#0071e3] p-3 rounded-lg flex items-start gap-1.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-bold">
                    سيتم ترحيل الفواتير المكتملة تلقائياً وإضافتها إلى إجمالي هذا الملحق لتقرير تسوية صندوق الكاشير وورديات العمل عند إغلاقه اليوم.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-amber-100/80 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">حالة الوردية: متوقفة مؤقتاً</h3>
                  <p className="text-xs text-amber-700 leading-relaxed max-w-sm mx-auto mt-1">
                    لم نكتشف أي جلسة بيع للمستند المالي الجاري لكاشير في الوقت الحالي. يرجى ملء النموذج الجانبي لبدء التحصيل وإصدار الفواتير فوراً.
                  </p>
                </div>
              </div>
            )}

            {/* PREVIOUS SESSIONS ARCHIVE HISTORY */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">سجل أرشيف ومطابقات الورديات السابقة</h3>
                  <p className="text-[10px] text-gray-500">مراجعة الفوارق ونسب العجز أو الزيادة في كاش الصناديق</p>
                </div>
                <div className="bg-[#f5f5f7] px-2.5 py-1 rounded-lg text-xs font-black font-mono">
                  {filteredSessions.length} ورديات
                </div>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="text-gray-300 font-bold block">📭 لا توجد ورديات مسجلة سابقاً</div>
                  <p className="text-[10px] text-gray-400">ابدأ أول وردية بيع اليوم لتأسيس الأرشيف الرقمي للمحاسبة.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                        <th className="p-3">رقم الجلسة</th>
                        <th className="p-3">الكاشير</th>
                        <th className="p-3">نقطة الكاشير</th>
                        <th className="p-3">تاريخ ووقت البدء</th>
                        <th className="p-3 text-center">الفواتير</th>
                        <th className="p-3 text-left">إجمالي المبيعات</th>
                        <th className="p-3 text-left">التسوية (عجز/زيادة)</th>
                        <th className="p-3 text-center">أمن الوردية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {filteredSessions.map((sess) => {
                        const term = terminals.find(t => t.id === sess.terminalId);
                        const isSessOpen = sess.status === 'open';
                        const startStr = new Date(sess.openedAt).toLocaleDateString('ar-EG') + ' ' + new Date(sess.openedAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

                        return (
                          <tr key={sess.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => setActiveDetailSession(sess)}>
                            <td className="p-3 font-mono font-bold text-gray-900">{sess.id}</td>
                            <td className="p-3 font-semibold">{sess.cashierName}</td>
                            <td className="p-3">{term ? term.name : 'محذوفة'}</td>
                            <td className="p-3 text-gray-500 font-mono text-[10px]">{startStr}</td>
                            <td className="p-3 text-center font-mono font-semibold">{sess.invoicesCount}</td>
                            <td className="p-3 text-left font-mono font-black text-gray-900">{(sess.salesTotal).toLocaleString()}</td>
                            <td className="p-3 text-left font-mono">
                              {isSessOpen ? (
                                <span className="text-blue-600 font-bold">مفتوحة للتدقيق</span>
                              ) : (
                                <span className={`font-semibold shrink-0 px-2 py-0.5 rounded-full text-[9px] ${
                                  (sess.discrepancy || 0) < 0 
                                    ? 'bg-red-50 text-red-600' 
                                    : (sess.discrepancy || 0) > 0 
                                      ? 'bg-emerald-50 text-emerald-600' 
                                      : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {(sess.discrepancy || 0) === 0 ? 'متطابق' : (sess.discrepancy || 0).toLocaleString()}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                isSessOpen 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {isSessOpen ? 'نشط' : 'مغلق ومسدد'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR FORM FOR OPENING OR ADJUSTMENT */}
          <div className="lg:col-span-4 space-y-6">
            {currentUser?.role === 'cashier' ? (
              <div className="bg-[#f5f5f7] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-right" dir="rtl">
                <div className="border-b pb-3 border-gray-200">
                  <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5 justify-start">
                    <ShieldCheck className="w-4 h-4 text-[#0071e3]" />
                    <span>بوابة الموظف ومراقبة الوردية</span>
                  </h3>
                  <p className="text-[10px] text-gray-500">تفاصيل وسجلات النشاط الجاري الخاصة بحسابك الشخصي</p>
                </div>

                <div className="space-y-3.5 text-xs text-gray-700">
                  <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                      <span className="text-gray-400">الاسم والوظيفة:</span>
                      <span className="font-bold text-gray-900">{currentUser?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                      <span className="text-gray-400">البريد الإلكتروني للولوج:</span>
                      <span className="font-mono text-[11px] text-gray-600">{currentUser?.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-gray-400">صلاحية النظام:</span>
                      <span className="bg-green-55 text-green-700 font-bold px-1.5 py-0.5 rounded">كاشير مبيعات ونقاط البيع</span>
                    </div>
                  </div>

                  {activeSession ? (
                    <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-150 text-emerald-950 space-y-2.5">
                      <div className="flex items-center gap-1.5 border-b border-emerald-100 pb-1.5 text-xs font-black">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span>الوردية الجارية: نشطة ومفتوحة 🟢</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-emerald-700">رقم ورديتك الحالي:</span>
                          <span className="font-mono font-bold">{activeSession.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">تاريخ البدء:</span>
                          <span className="font-mono">{new Date(activeSession.openedAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-100/50">
                          <span className="text-emerald-700">عهدة الصباح الافتتاحية:</span>
                          <span className="font-mono font-bold text-gray-900">{activeSession.openingBalance.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-700">التحصيل الحالي الصافي:</span>
                          <span className="font-mono font-bold text-[#0071e3]">{activeSession.salesTotal.toLocaleString()} SDG</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-750">الفواتير التي أجريتها:</span>
                          <span className="font-mono font-black">{activeSession.invoicesCount} فاتورة</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPosSubTab('checkout')}
                        className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        ⚡ تابع البيع وإصدار الفواتير
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                      <div className="font-bold flex items-center gap-1 text-xs justify-start">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>⚠️ لا توجد وردية مفتوحة</span>
                      </div>
                      <p className="text-[10.5px] text-amber-700 leading-relaxed text-right" dir="rtl">
                        عذراً، لا تمتلك أي جلسة active على محطة البيع حالياً. لا يمكنك بدء البيع حتى يقوم مدير النظام بالإدارة بفتح جلسة وردية جديدة باسمك.
                      </p>
                    </div>
                  )}

                  <div className="bg-orange-50/40 p-3.5 rounded-xl border border-orange-200/50 text-[10.5px] text-orange-850 leading-relaxed text-right" dir="rtl">
                    ℹ️ <strong>ملاحظة أمنية:</strong> لا يُسمح لموظف الكاشير بتعديل، حذف، أو إجراء أي تسوية للجلسات يدوياً. جميع التسويات الختامية والمطابقة النقدية والخصومات تتم عبر حساب المدير بالإدارة.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!activeSession ? (
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="border-b pb-3">
                      <h3 className="text-sm font-bold text-gray-950 flex items-center gap-1.5">
                        <Play className="w-4 h-4 text-[#0071e3]" />
                        <span>خطوة الافتتاح: بدء البيع كاشير</span>
                      </h3>
                      <p className="text-[10.5px] text-[#222] font-semibold">ابدأ وردية جديدة لربط الفواتير باسم المحصل والصندوق المالي</p>
                    </div>

                    <form onSubmit={handleOpenSession} className="space-y-4 text-xs font-medium">
                      <div className="space-y-1.5">
                        <label className="text-gray-650 font-bold block">اسم الكاشير المحصّل / الموظف:</label>
                        {tenantCashiers.length > 0 && !isCustomCashier ? (
                          <div className="space-y-2">
                            <select
                              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 focus:border-[#0071e3] text-xs font-semibold rounded-xl outline-none"
                              value={sessionCashierName}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setIsCustomCashier(true);
                                  setSessionCashierName('');
                                } else {
                                  setSessionCashierName(e.target.value);
                                }
                              }}
                              required
                            >
                              <option value="">-- اختر أحد الموظفين المسجلين --</option>
                              {tenantCashiers.map(u => (
                                <option key={u.id} value={u.name}>
                                  👤 {u.name} ({u.role === 'admin' ? 'مدير الإدارة' : 'كاشير مبيعات'}) - {u.email}
                                </option>
                              ))}
                              <option value="__custom__">➕ كتابة اسم كاشير مخصص/يدوي</option>
                            </select>
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full bg-[#f5f5f7] border border-[#d2d2d7] pl-3 pr-32 py-2.5 focus:border-[#0071e3] text-xs font-medium rounded-xl outline-none"
                              placeholder="اكتب اسم المندوب الكاشير..."
                              value={sessionCashierName}
                              onChange={(e) => setSessionCashierName(e.target.value)}
                              required
                            />
                            {tenantCashiers.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCustomCashier(false);
                                  setSessionCashierName('');
                                }}
                                className="absolute left-2 top-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-[9.5px] font-bold text-gray-700 transition"
                              >
                                {lang === 'ar' ? '↩ اختيار من الموظفين' : '↩ Select from Employees'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-650 font-bold block">اختر محطة/نقطة بيع مرتبطة:</label>
                        <select
                          className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 focus:border-[#0071e3] text-xs font-semibold rounded-xl outline-none"
                          value={selectedTerminalId}
                          onChange={(e) => setSelectedTerminalId(e.target.value)}
                          required
                        >
                          <option value="">-- اختر الرمز التعريفي لنقطة البيع --</option>
                          {terminals
                            .filter(t => t.status === 'active')
                            .map(t => (
                              <option key={t.id} value={t.id}>
                                🖥️ {t.name} ({t.code})
                              </option>
                            ))
                          }
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-655 font-bold block">رأس مال الصندوق / عهدة الصباح الافتتاحية:</label>
                        <div className="relative">
                          <input
                            type="number"
                            className="w-full bg-[#f5f5f7] border border-[#d2d2d7] pr-3 pl-12 py-2.5 focus:border-[#0071e3] text-xs font-black font-mono rounded-xl outline-none"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            placeholder="0"
                          />
                          <span className="absolute left-3 top-3 text-[10px] font-black text-gray-400">SDG</span>
                        </div>
                        <p className="text-[10px] text-gray-400">الكاش المعد عهدة فكة لبداية الحساب مع الزوار.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-650 font-bold block">ملاحظات افتتاح الوردية (اختياري):</label>
                        <textarea
                          className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 focus:border-[#0071e3] text-xs font-medium rounded-xl outline-none"
                          rows={2}
                          placeholder="أي ملاحظات تخص عينات الصندوق أو الوردية المبرمة..."
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black tracking-wide shadow-md transition"
                      >
                        🚀 فتح جلسة جديدة في النظام وبدء التحصيل
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-250/60 shadow-sm text-center space-y-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
                      <UserCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">أنت الآن تعمل كالمحصّل المعتمد</h3>
                      <p className="text-[11px] text-emerald-850 max-w-xs mx-auto mt-1 leading-relaxed">
                        النظام مقيد بإيرادات هادفة مع كاشير <strong>{activeSession.cashierName}</strong>. يمكنك العمل كالمعتاد وإصدار الإيصالات والفواتير بمرونة.
                      </p>
                    </div>
                    <button
                      onClick={() => setPosSubTab('checkout')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition inline-block w-full"
                    >
                      ⚡ الذهاب إلى شاشة البيع الآن
                    </button>
                  </div>
                )}

                {/* QUICK TERMS AND EDUCATION CARD */}
                <div className="bg-gray-50 border border-gray-250 p-4 rounded-xl space-y-1.5">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>دليل وقوانين تسوية الورديات:</span>
                  </span>
                  <ul className="text-[10px] text-gray-650 leading-relaxed list-disc list-inside space-y-1 pr-1 font-medium">
                    <li>عند تقفيل الكاشير للوردية، يلزم حصر الكاش في الدرج يدوياً.</li>
                    <li>يتم حساب الرصيد المتوقع بناءً على: الافتتاحي + المبيعات نقدية (SDG).</li>
                    <li>تراقب لوحة التقارير فروقات العجز (Discrepancy) لضبط الموازنة.</li>
                    <li>ينصح بالإبقاء على الجلسات مقفلة دائماً بنهاية فترات العمل.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* TERMINALS LIST TAB */}
      {posSubTab === 'terminals' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">سجل وتراخيص أجهزة/نقاط البيع في النظام</h3>
                <p className="text-[10px] text-gray-500">إضافة وتفعيل نقاط بيع فرعية لتفويض الصلاحيات لعدة أجهزة</p>
              </div>

              {/* Terminal search box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث برمز أو اسم النقطة..."
                  className="bg-[#f5f5f7] border border-[#d2d2d7] text-[11px] font-bold px-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-[#0071e3] transition w-[200px]"
                  value={terminalSearch}
                  onChange={(e) => setTerminalSearch(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute top-2 right-2.5" />
              </div>
            </div>

            {filteredTerminals.length === 0 ? (
              <div className="py-14 text-center space-y-2">
                <div className="text-gray-300 font-bold block">🖥️ لم يتم العثور على نقاط بيع مطابقة</div>
                <p className="text-[10px] text-gray-400">يرجى تعديل مصطلح البحث أو إضافة ترخيص نقطة جديدة مستقلاً.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold">
                      <th className="p-3">شفرة نقطة البيع</th>
                      <th className="p-3">الاسم التعريفي للنقطة</th>
                      <th className="p-3">الفرع المربوط</th>
                      <th className="p-3">تاريخ التأسيس</th>
                      <th className="p-3 text-center">الوردية النشطة</th>
                      <th className="p-3 text-center">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                    {filteredTerminals.map((term) => {
                      const associatedBranch = branches.find(b => b.id === term.branchId);
                      const isLinkedToActiveSession = sessions.find(s => s.terminalId === term.id && s.status === 'open');

                      return (
                        <tr key={term.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 font-mono font-black text-gray-950">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 text-[10px] border border-gray-200">
                              {term.code}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-900">{term.name}</td>
                          <td className="p-3 text-gray-600">
                            {associatedBranch ? (
                              <span className="flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-gray-400" />
                                <span>{associatedBranch.name}</span>
                              </span>
                            ) : (
                              <span className="text-gray-400">كافة الفروع</span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[10px] text-gray-500">
                            {new Date(term.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                          <td className="p-3 text-center">
                            {isLinkedToActiveSession ? (
                              <span className="inline-flex items-center gap-1 text-emerald-605 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-extrabold border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>نشطة ({isLinkedToActiveSession.cashierName})</span>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px]">مستعد / شاغر</span>
                            )}
                          </td>
                          <td className="p-3 text-center flex justify-center gap-2">
                            <button
                              onClick={() => toggleTerminalStatus(term.id)}
                              className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                term.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {term.status === 'active' ? 'نشط' : 'معطّل'}
                            </button>
                            <button
                              onClick={() => handleDeleteTerminal(term.id)}
                              className="p-1 px-2 border border-red-200 bg-red-50 text-red-650 rounded hover:bg-red-100 transition"
                              title="إلغاء الترخيص"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form to add a new Terminal */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-[#0071e3]" />
                <span>إضافة وترخيص جهاز / نقطة بيع جديدة</span>
              </h3>
              <p className="text-[10px] text-gray-500">قم بتوسيع نقاط البيع لتأجير كوشك أو تدريب كاشيرات جديدة</p>
            </div>

            <form onSubmit={handleAddTerminal} className="space-y-4 text-xs font-medium">
              <div className="space-y-1.5">
                <label className="text-gray-600 block font-bold">اسم نقطة البيع التعريفي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كاشير فرع أمدرمان رقم 2"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 focus:border-[#0071e3] text-xs font-medium rounded-xl outline-none"
                  value={newTerminalName}
                  onChange={(e) => setNewTerminalName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-600 block font-bold">رمز نقطة البيع (Uniqueness Code - اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: POS-HQ-02"
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 focus:border-[#0071e3] text-xs font-semibold rounded-xl outline-none"
                  value={newTerminalCode}
                  onChange={(e) => setNewTerminalCode(e.target.value)}
                />
                <p className="text-[9.5px] text-gray-400">سيتم التوليد عشوائياً إذا تركت هذا الحقل فارغاً.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-600 block font-bold">الفرع التابع له نقطة البيع:</label>
                <select
                  className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2.5 focus:border-[#0071e3] text-xs font-semibold rounded-xl outline-none"
                  value={associatedBranchId}
                  onChange={(e) => setAssociatedBranchId(e.target.value)}
                >
                  <option value="">-- متوفر لكافة الفروع --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.city})
                    </option>
                  ))}
                </select>
                <p className="text-[9.5px] text-gray-400">تساعدك في فلترة وعزل تقارير المبيعات جغرافياً ودورياً.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1d1d1f] hover:bg-black text-white rounded-xl text-xs font-black shadow transition"
              >
                💾 حفظ وترخيص وحدة البيع النشطة
              </button>
            </form>
          </div>
        </div>
      )}


      {/* POS REPORTS AND ANALYTICS TAB */}
      {posSubTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">إجمالي مبيعات نقاط البيع</span>
                <span className="text-xl font-black font-mono text-gray-950">{(posReportsData.totalPosSales).toLocaleString()} <span className="text-xs font-black">SDG</span></span>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">إجمالي الكاش (نقدي)</span>
                <span className="text-xl font-black font-mono text-gray-950">{(posReportsData.totalCashSales).toLocaleString()} <span className="text-xs font-black">SDG</span></span>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <DollarSign className="w-5 h-5 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">التحويل المالي كاشير</span>
                <span className="text-xl font-black font-mono text-gray-950">{(posReportsData.totalTransferSales).toLocaleString()} <span className="text-xs font-black">SDG</span></span>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                <CreditCard className="w-5 h-5 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-500 font-bold block">إجمالي الفواتير المحررة</span>
                <span className="text-xl font-black font-mono text-gray-950">{posReportsData.totalInvoices} <span className="text-xs font-black">مستند</span></span>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
                <Receipt className="w-5 h-5 flex-shrink-0" />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TERMINALS PRODUCTION SALES */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-950">توزيع المبيعات حسب نقاط البيع (Terminals Breakdown)</h3>
                <p className="text-[10px] text-gray-500">ترتيب حجم المبيعات الإجمالي لكل محطة دفع مستقلة</p>
              </div>

              <div className="space-y-3 pt-2">
                {posReportsData.terminalLeaderboard.map((item, idx) => {
                  const maxVal = Math.max(...posReportsData.terminalLeaderboard.map(l => l.total)) || 1;
                  const ratio = Math.max(5, (item.total / maxVal) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs text-gray-700 font-bold">
                        <span className="flex items-center gap-1.5">
                          <span className="font-mono bg-gray-100 text-gray-650 px-1.5 py-0.5 rounded text-[10px]">#{idx + 1}</span>
                          <span>{item.name}</span>
                        </span>
                        <span className="font-mono text-gray-950">{item.total.toLocaleString()} SDG</span>
                      </div>
                      <div className="w-full bg-[#f5f5f7] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-sky-500 h-full rounded-full transition-all duration-700" 
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                        <span>الترميز المالي: {item.code}</span>
                        <span>{item.count} فواتير مسددة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CASHIER PERFORMANCE LEADERBOARD */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-950">تقرير أداء وإنتاجية الكاشيرات (Cashier Leaderboard)</h3>
                <p className="text-[10px] text-gray-500">حصر نسب التحصيل والمبيعات حسب اسم المحصّل المفوّض للوردية</p>
              </div>

              {posReportsData.cashierLeaderboard.length === 0 ? (
                <div className="py-14 text-center text-gray-400 text-xs">
                  لا يوجد كاشيرات مسجلين في الوردية بعد!
                </div>
              ) : (
                <div className="space-y-3.5 pt-2">
                  {posReportsData.cashierLeaderboard.map((cashier, idx) => {
                    const maxCashierVal = Math.max(...posReportsData.cashierLeaderboard.map(c => c.total)) || 1;
                    const cRatio = Math.max(5, (cashier.total / maxCashierVal) * 100);

                    return (
                      <div key={idx} className="space-y-1 shadow-xs border border-gray-100/70 p-3 rounded-xl hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-mono text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span>كاشير / {cashier.name}</span>
                          </span>
                          <span className="font-mono text-gray-950">{cashier.total.toLocaleString()} SDG</span>
                        </div>
                        <div className="w-full bg-[#f5f5f7] h-1.5 rounded-full overflow-hidden mt-1 text-right">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-700" 
                            style={{ width: `${cRatio}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium pt-1">
                          <span>إجمالي الورديات المدارة: {sessions.filter(s => s.cashierName.trim() === cashier.name.trim()).length} ورديات</span>
                          <span>متوسط الفاتورة: {Math.round(cashier.total / (cashier.count || 1)).toLocaleString()} SDG</span>
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

      {/* DETAILED HISTORIC SESSION DETAIL MODAL DIALOG */}
      <AnimatePresence>
        {activeDetailSession && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full max-w-lg shadow-2xl"
            >
              <div className="p-5 border-b border-gray-150 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] bg-white/15 text-white/90 font-mono font-bold px-2 py-0.5 rounded text-xs leading-none">تفاصيل الجلسة {activeDetailSession.id}</span>
                  <h3 className="text-sm font-black mt-1">مطابقة وردية: {activeDetailSession.cashierName}</h3>
                </div>
                <button onClick={() => setActiveDetailSession(null)} className="text-white hover:text-gray-300 font-black text-xs">
                  ✕ إغلاق
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs font-semibold text-gray-700">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pb-3 border-b border-gray-100">
                  <div>حالة الجلسة:</div>
                  <div className="text-left font-bold text-gray-950">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${activeDetailSession.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-800'}`}>
                      {activeDetailSession.status === 'open' ? 'مفتوحة للتدقيق' : 'مغلقة ومؤمنة'}
                    </span>
                  </div>

                  <div>تاريخ بدء الوردية:</div>
                  <div className="text-left font-mono">{new Date(activeDetailSession.openedAt).toLocaleString('ar-EG')}</div>

                  {activeDetailSession.closedAt && (
                    <>
                      <div>تاريخ إقفال الوردية:</div>
                      <div className="text-left font-mono">{new Date(activeDetailSession.closedAt).toLocaleString('ar-EG')}</div>
                    </>
                  )}

                  <div>نقطة البيع التابعة:</div>
                  <div className="text-left text-gray-900">{terminals.find(t => t.id === activeDetailSession.terminalId)?.name || 'غير مدرجة'}</div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-gray-500 block">ملخص التقرير المالي للوردية:</span>
                  <div className="space-y-1.5 font-mono bg-gray-50 p-3 rounded-lg border border-gray-200 text-right">
                    <div className="flex justify-between">
                      <span>العهد الافتتاحية:</span>
                      <span>{activeDetailSession.openingBalance.toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>(+) إجمالي الدفع النقدي (كاش):</span>
                      <span>{(activeDetailSession.cashSalesTotal || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span>(+) إجمالي الدفع تحويل (بنكك):</span>
                      <span>{(activeDetailSession.transferSalesTotal || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between text-yellow-700">
                      <span>(+) إجمالي الإيصالات بالتذاكر (شيك):</span>
                      <span>{(activeDetailSession.checkSalesTotal || 0).toLocaleString()} SDG</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-black text-gray-950 text-xs">
                      <span>(=) إجمالي المبيعات الإجمالية المحققة:</span>
                      <span>{activeDetailSession.salesTotal.toLocaleString()} SDG</span>
                    </div>
                  </div>
                </div>

                {!isOpeningSessionModalOpen && activeDetailSession.status === 'closed' && (
                  <div className="space-y-2">
                    <span className="font-bold text-gray-500 block">تقرير تسوية صندوق الكاش والكاشير الفعلي:</span>
                    <div className="space-y-1.5 font-mono p-3 rounded-lg border text-right bg-rose-50/20 border-rose-150">
                      <div className="flex justify-between text-gray-700">
                        <span>إجمالي رصيد الصندوق المتوقع:</span>
                        <span>{((activeDetailSession.expectedClosingBalance || (activeDetailSession.openingBalance + activeDetailSession.cashSalesTotal))).toLocaleString()} SDG</span>
                      </div>
                      <div className="flex justify-between text-gray-950 font-black">
                        <span>رصيد الصندوق الفعلي المسحوب:</span>
                        <span>{((activeDetailSession.actualClosingBalance || 0)).toLocaleString()} SDG</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed pt-2 font-black text-xs">
                        <span>الفارق المالي (العجز / الزيادة):</span>
                        <span className={(activeDetailSession.discrepancy || 0) < 0 ? 'text-red-700 font-extrabold' : 'text-emerald-700 font-extrabold'}>
                          {(activeDetailSession.discrepancy || 0) > 0 ? '+' : ''}{(activeDetailSession.discrepancy || 0).toLocaleString()} SDG
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailSession.notes && (
                  <div className="space-y-1">
                    <span className="font-bold text-gray-500 block">ملاحظات تسليم الوردية:</span>
                    <p className="bg-gray-50 border p-2.5 rounded-lg text-[11px] text-gray-650 leading-relaxed font-mono whitespace-pre-line">
                      {activeDetailSession.notes}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => setActiveDetailSession(null)}
                    className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs rounded-xl font-black transition"
                  >
                    حسناً، فهمت
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLOSING SESSION MODAL DIALOG POPUP */}
      <AnimatePresence>
        {isClosingSessionModalOpen && activeSession && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full max-w-md shadow-2xl"
            >
              <div className="p-5 border-b border-gray-150 bg-rose-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black">غلق وتسوية وردية الكاشير الحرة</h3>
                  <p className="text-[10px] text-rose-100">الجلسة الرقمية الجارية: {activeSession.id}</p>
                </div>
                <button onClick={() => setIsClosingSessionModalOpen(false)} className="text-white hover:text-gray-200">
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => {
                handleCloseSession(e);
                setIsClosingSessionModalOpen(false);
              }} className="p-5 space-y-4 text-xs font-semibold text-gray-700">
                <div className="bg-slate-50 border p-3.5 rounded-xl space-y-1.5 border-slate-200/60 font-mono text-right">
                  <div className="flex justify-between text-gray-600 text-[11px]">
                    <span>عهدة الصندوق الافتتاحية:</span>
                    <span>{activeSession.openingBalance.toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 text-[11px] font-bold">
                    <span>(+) مبيعات نقداً بالصندوق:</span>
                    <span>{activeSession.cashSalesTotal.toLocaleString()} SDG</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/80 pt-2 font-black text-gray-950 text-xs">
                    <span>(=) الرصيد النقدي المتوقع بالدرج:</span>
                    <span>{(activeSession.openingBalance + activeSession.cashSalesTotal).toLocaleString()} SDG</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-900 block font-black">رصيد الكاشير والدرج الفعلي (العد اليدوي):</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      className="w-full bg-rose-50/20 border border-rose-200 focus:border-rose-500 pr-3 pl-12 py-3 text-sm font-black font-mono text-rose-950 rounded-xl outline-none"
                      value={actualClosingBalance}
                      onChange={(e) => setActualClosingBalance(e.target.value)}
                    />
                    <span className="absolute left-3 top-3 text-[10px] font-black text-rose-600">SDG</span>
                  </div>
                  <p className="text-[10px] text-gray-400">أي فارق بالناقص أو بالزائد عن المتوقع سيسجل كعجز أو زيادة فورية.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-600 block font-bold">ملاحظات وتقرير التقفيل النهائي:</label>
                  <textarea
                    className="w-full bg-[#f5f5f7] border border-[#d2d2d7] px-3 py-2 focus:border-[#0071e3] text-xs font-medium rounded-xl outline-none"
                    rows={2}
                    placeholder="اكتب ملاحظات بخصوص نقص كاشير، عملات ورقية غير مقبولة، أو تسليم العهدة..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-black shadow-md transition"
                  >
                    🔒 تأكيد الغلق والتسوية والمطابقة
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsClosingSessionModalOpen(false)}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-xl font-bold transition"
                  >
                    إلغاء
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
