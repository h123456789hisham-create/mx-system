import React, { useState, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Coins, Calendar, FileSpreadsheet, 
  Printer, ArrowLeftRight, Users, Package, DollarSign, Wallet, Landmark, 
  AlertCircle, ChevronRight, Search, FileText, ArrowRight, ArrowDownRight, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Invoice, Product, Expense, CashSafe, BankAccount, FinanceTransaction, 
  Customer, Supplier, PurchaseInvoice, PurchaseReturn, SupplierPayment, InventoryAudit,
  ChinaTransfer
} from '../types';
import * as XLSX from 'xlsx';

interface ReportsTabProps {
  sales: Invoice[];
  inventory: Product[];
  expenses: Expense[];
  chinaTransfers: ChinaTransfer[];
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  purchaseReturns: PurchaseReturn[];
  supplierPayments: SupplierPayment[];
  customers: Customer[];
  safes: CashSafe[];
  bankAccounts: BankAccount[];
  financeTransactions: FinanceTransaction[];
  lang: 'ar' | 'en';
  currency: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setSelectedInvoice: (inv: Invoice) => void;
  setIsPrintModalOpen: (open: boolean) => void;
}

type ActiveReportSubTab = 'sales' | 'purchases' | 'finance' | 'customers' | 'inventory';

export default function ReportsTab({
  sales,
  inventory,
  expenses,
  chinaTransfers,
  suppliers,
  purchaseInvoices,
  purchaseReturns,
  supplierPayments,
  customers,
  safes,
  bankAccounts,
  financeTransactions,
  lang,
  currency,
  addToast,
  setSelectedInvoice,
  setIsPrintModalOpen
}: ReportsTabProps) {

  const [activeSubTab, setActiveSubTab] = useState<ActiveReportSubTab>('sales');

  // Today's date helper
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getMonthStartStr = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  };
  const getYearStartStr = () => {
    const d = new Date();
    return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
  };

  // Date selectors
  const [reportStartDate, setReportStartDate] = useState<string>(getMonthStartStr());
  const [reportEndDate, setReportEndDate] = useState<string>(getTodayStr());

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Apply Quick Date Range Filter
  const setQuickRange = (range: 'today' | 'week' | 'month' | 'year' | 'all') => {
    const today = new Date();
    const endStr = today.toISOString().split('T')[0];
    let startStr = endStr;

    if (range === 'today') {
      startStr = endStr;
    } else if (range === 'week') {
      const prevWeek = new Date(today);
      prevWeek.setDate(today.getDate() - 7);
      startStr = prevWeek.toISOString().split('T')[0];
    } else if (range === 'month') {
      startStr = getMonthStartStr();
    } else if (range === 'year') {
      startStr = getYearStartStr();
    } else if (range === 'all') {
      startStr = '2020-01-01';
    }

    setReportStartDate(startStr);
    setReportEndDate(endStr);
    addToast(
      lang === 'ar' 
        ? `تم تحديث التواريخ للفترة المطلوبة` 
        : `Report active range updated`, 
      'info'
    );
  };

  // ==========================================
  // SHARED FILTERED DATASET & METRIC CALCULATIONS
  // ==========================================

  // Filter Sales inside range
  const filteredSales = useMemo(() => {
    return sales.filter(inv => {
      const dateStr = new Date(inv.createdAt).toISOString().split('T')[0];
      return dateStr >= reportStartDate && dateStr <= reportEndDate;
    });
  }, [sales, reportStartDate, reportEndDate]);

  // Filter Purchase Invoices in range
  const filteredPurchaseInvoices = useMemo(() => {
    return purchaseInvoices.filter(pinv => {
      const dateStr = new Date(pinv.createdAt).toISOString().split('T')[0];
      return dateStr >= reportStartDate && dateStr <= reportEndDate;
    });
  }, [purchaseInvoices, reportStartDate, reportEndDate]);

  // Filter Purchase Returns in range
  const filteredPurchaseReturns = useMemo(() => {
    return purchaseReturns.filter(ret => {
      const dateStr = new Date(ret.createdAt).toISOString().split('T')[0];
      return dateStr >= reportStartDate && dateStr <= reportEndDate;
    });
  }, [purchaseReturns, reportStartDate, reportEndDate]);

  // Filter Expenses in range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const dateStr = new Date(exp.date).toISOString().split('T')[0];
      return dateStr >= reportStartDate && dateStr <= reportEndDate;
    });
  }, [expenses, reportStartDate, reportEndDate]);

  // Filter Financial Transactions in range
  const filteredFinanceTransactions = useMemo(() => {
    return financeTransactions.filter(tx => {
      const dateStr = new Date(tx.date).toISOString().split('T')[0];
      return dateStr >= reportStartDate && dateStr <= reportEndDate;
    });
  }, [financeTransactions, reportStartDate, reportEndDate]);


  // ==========================================
  // 1. SALES REPORT CALCULATIONS
  // ==========================================
  const salesMetrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, inv) => sum + inv.total, 0);
    const invoicesCount = filteredSales.length;
    const avgInvoiceValue = invoicesCount > 0 ? (totalRevenue / invoicesCount) : 0;
    
    let cashSalesSum = 0;
    let transferSalesSum = 0;
    let checkSalesSum = 0;

    filteredSales.forEach(inv => {
      if (inv.paymentMethod === 'cash') cashSalesSum += inv.total;
      else if (inv.paymentMethod === 'transfer') transferSalesSum += inv.total;
      else if (inv.paymentMethod === 'check') checkSalesSum += inv.total;
    });

    // Top selling items in selected range
    const itemQtyMap: Record<string, { name_ar: string; name_en: string; qty: number; total: number }> = {};
    filteredSales.forEach(inv => {
      inv.items.forEach(item => {
        if (!itemQtyMap[item.productId]) {
          itemQtyMap[item.productId] = {
            name_ar: item.name_ar,
            name_en: item.name_en,
            qty: 0,
            total: 0
          };
        }
        itemQtyMap[item.productId].qty += item.qty;
        itemQtyMap[item.productId].total += item.subtotal;
      });
    });

    const topSellingProducts = Object.values(itemQtyMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Sales by day (for Mini chart)
    const salesByDateMap: Record<string, number> = {};
    filteredSales.forEach(inv => {
      const d = new Date(inv.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      salesByDateMap[d] = (salesByDateMap[d] || 0) + inv.total;
    });

    const salesTrend = Object.entries(salesByDateMap).map(([day, total]) => ({
      day,
      total
    })).slice(-10); // Show last 10 dates for visualization

    return {
      totalRevenue,
      invoicesCount,
      avgInvoiceValue,
      cashSalesSum,
      transferSalesSum,
      checkSalesSum,
      topSellingProducts,
      salesTrend
    };
  }, [filteredSales]);


  // ==========================================
  // 2. PURCHASES REPORT CALCULATIONS
  // ==========================================
  const purchaseMetrics = useMemo(() => {
    const totalPurchasesRaw = filteredPurchaseInvoices.reduce((sum, pinv) => sum + pinv.grandTotal, 0);
    const amountPaidPurchases = filteredPurchaseInvoices.reduce((sum, pinv) => sum + pinv.amountPaid, 0);
    const totalRemainingPurchasesDebt = totalPurchasesRaw - amountPaidPurchases;
    
    const countPurchaseInvoices = filteredPurchaseInvoices.length;

    const totalReturnsRaw = filteredPurchaseReturns.reduce((sum, ret) => sum + ret.total, 0);
    const netPurchases = Math.max(0, totalPurchasesRaw - totalReturnsRaw);

    // Top Purchased items in range
    const purItemQtyMap: Record<string, { name_ar: string; name_en: string; qty: number; total: number }> = {};
    filteredPurchaseInvoices.forEach(pinv => {
      pinv.items.forEach(item => {
        if (!purItemQtyMap[item.productId]) {
          purItemQtyMap[item.productId] = {
            name_ar: item.name_ar,
            name_en: item.name_en,
            qty: 0,
            total: 0
          };
        }
        purItemQtyMap[item.productId].qty += item.qty;
        purItemQtyMap[item.productId].total += item.total;
      });
    });

    const topPurchasedProducts = Object.values(purItemQtyMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Total Supplier Debts currently owed
    const totalSupplierOwed = suppliers.reduce((sum, s) => sum + (s.currentBalance > 0 ? s.currentBalance : 0), 0);

    return {
      totalPurchasesRaw,
      amountPaidPurchases,
      totalRemainingPurchasesDebt,
      countPurchaseInvoices,
      totalReturnsRaw,
      netPurchases,
      topPurchasedProducts,
      totalSupplierOwed
    };
  }, [filteredPurchaseInvoices, filteredPurchaseReturns, suppliers]);


  // ==========================================
  // 3. FINANCIALS & PNL CALCULATIONS
  // ==========================================
  const financeMetrics = useMemo(() => {
    // 1. Calculate Revenue
    const revenue = filteredSales.reduce((sum, inv) => sum + inv.total, 0);

    // 2. Compute cost of goods sold (COGS) dynamically!
    // Using matching purchase cost for each unit sold
    let totalCOGS = 0;
    filteredSales.forEach(inv => {
      inv.items.forEach(item => {
        const prod = inventory.find(p => p.id === item.productId);
        const costPerPiece = prod ? (prod.purchasePricePiece || 0) : 0;
        totalCOGS += (costPerPiece * item.qty);
      });
    });

    // 3. Gross Profit
    const grossProfit = Math.max(0, revenue - totalCOGS);

    // 4. Expenses Total
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 5. Net Profit (True Net Profit)
    const netProfit = grossProfit - totalExpenses;

    // Accounts liqudiity share
    const safeCapital = safes.reduce((sum, s) => sum + s.balance, 0);
    const bankCapital = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
    const overallCapital = safeCapital + bankCapital;

    // Expenses breakdown per category
    const expCategoryMap: Record<string, number> = {};
    filteredExpenses.forEach(exp => {
      const cat = exp.category || (lang === 'ar' ? 'عام' : 'General');
      expCategoryMap[cat] = (expCategoryMap[cat] || 0) + exp.amount;
    });

    const expenseCategoryBreakdown = Object.entries(expCategoryMap)
      .map(([cat, amount]) => ({
        category: cat,
        amount
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      revenue,
      totalCOGS,
      grossProfit,
      totalExpenses,
      netProfit,
      safeCapital,
      bankCapital,
      overallCapital,
      expenseCategoryBreakdown
    };
  }, [filteredSales, filteredExpenses, inventory, safes, bankAccounts, lang]);


  // ==========================================
  // 4. CUSTOMERS & AR REPORT CALCULATIONS
  // ==========================================
  const customerMetrics = useMemo(() => {
    // Total receivables from Installment invoices
    // We only take invoices where `isInstallment` is true and calculate `amountRemaining`
    const ongoingInstallmentSales = sales.filter(inv => inv.isInstallment && (inv.amountRemaining || 0) > 0);
    const totalReceivableDebts = ongoingInstallmentSales.reduce((sum, inv) => sum + (inv.amountRemaining || 0), 0);

    // Generate Customer Debt Ledger
    // For each customer, summarize total purchased and outstanding installment debts
    const customerSummaryMap: Record<string, { 
      customerId: string; 
      name: string; 
      phone: string;
      category: string;
      totalPurchases: number; 
      unpaidInstallmentsCount: number;
      remainingDebt: number;
    }> = {};

    // Initialise with known customers
    customers.forEach(cust => {
      customerSummaryMap[cust.name] = {
        customerId: cust.id,
        name: cust.name,
        phone: cust.phone,
        category: cust.category,
        totalPurchases: 0,
        unpaidInstallmentsCount: 0,
        remainingDebt: 0
      };
    });

    // Parse all sales to capture purchases and outstanding installment gaps by customer Name
    sales.forEach(inv => {
      if (inv.customerName) {
        if (!customerSummaryMap[inv.customerName]) {
          customerSummaryMap[inv.customerName] = {
            customerId: 'unknown',
            name: inv.customerName,
            phone: '',
            category: 'regular',
            totalPurchases: 0,
            unpaidInstallmentsCount: 0,
            remainingDebt: 0
          };
        }
        customerSummaryMap[inv.customerName].totalPurchases += inv.total;
        if (inv.isInstallment && (inv.amountRemaining || 0) > 0) {
          customerSummaryMap[inv.customerName].remainingDebt += (inv.amountRemaining || 0);
          customerSummaryMap[inv.customerName].unpaidInstallmentsCount += 1;
        }
      }
    });

    const debtorCustomers = Object.values(customerSummaryMap)
      .filter(item => item.remainingDebt > 0)
      .sort((a, b) => b.remainingDebt - a.remainingDebt);

    const topContributingCustomers = Object.values(customerSummaryMap)
      .filter(item => item.totalPurchases > 0)
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, 10);

    return {
      totalReceivableDebts,
      debtorCustomers,
      topContributingCustomers,
      ongoingInstallmentsCount: ongoingInstallmentSales.length,
      customerBaseCount: customers.length
    };
  }, [sales, customers]);


  // ==========================================
  // 5. INVENTORY & STOCK VALUATION CALCULATIONS
  // ==========================================
  const inventoryMetrics = useMemo(() => {
    // Total unique items
    const uniqueItemsCount = inventory.length;

    // Raw pieces totals
    const totalAvailablePieces = inventory.reduce((sum, p) => sum + p.quantity, 0);

    // Stock valuation at Purchase Price
    const totalValuationPurchasePrice = inventory.reduce((sum, p) => {
      const priceUnit = p.purchasePricePiece || 0;
      return sum + (priceUnit * p.quantity);
    }, 0);

    // Stock valuation at Selling Price
    const totalValuationSellingPrice = inventory.reduce((sum, p) => {
      const priceUnit = p.price || 0;
      return sum + (priceUnit * p.quantity);
    }, 0);

    // Projected Stock profit margin
    const projectedStockMarginValue = Math.max(0, totalValuationSellingPrice - totalValuationPurchasePrice);

    // Low stock alerts
    const lowStockItems = inventory.filter(p => p.quantity <= 10).sort((a, b) => a.quantity - b.quantity);

    // Non-moving items (Dead Stock):
    // Standard logic is item with quantity in stock, but has zero sales in all invoice list
    const soldProductIds = new Set<string>();
    sales.forEach(inv => inv.items.forEach(it => soldProductIds.add(it.productId)));

    const nonMovingStock = inventory
      .filter(p => p.quantity > 0 && !soldProductIds.has(p.id))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      uniqueItemsCount,
      totalAvailablePieces,
      totalValuationPurchasePrice,
      totalValuationSellingPrice,
      projectedStockMarginValue,
      lowStockItems,
      nonMovingStock
    };
  }, [inventory, sales]);


  // ==========================================
  // EXPORT TO EXCEL UTILITY
  // ==========================================
  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Tab 1: Sales
      const salesRows = filteredSales.map(inv => ({
        'رقم الفاتورة': inv.invoiceNumber,
        'اسم العميل': inv.customerName || 'عام',
        'التاريخ': new Date(inv.createdAt).toLocaleString(),
        'طريقة الدفع': inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'transfer' ? 'بنكك/تحويل' : 'شيك',
        'قيمة القسط المتبقي': inv.isInstallment ? (inv.amountRemaining || 0) : 0,
        'الإجمالي بالجنيه': inv.total,
        'المستلم': inv.amountReceived,
        'المتبقي': inv.amountChange
      }));
      const wsSales = XLSX.utils.json_to_sheet(salesRows);
      XLSX.utils.book_append_sheet(wb, wsSales, lang === 'ar' ? 'تقرير المبيعات' : 'Sales Report');

      // Tab 2: Purchases
      const purchaseRows = filteredPurchaseInvoices.map(p => ({
        'رقم الفاتورة': p.invoiceNumber,
        'اسم المورد': suppliers.find(s => s.id === p.supplierId)?.name || 'غير محدد',
        'إجمالي المشتريات': p.grandTotal,
        'المبلغ المدفوع': p.amountPaid,
        'المتبقي الآجل': p.grandTotal - p.amountPaid,
        'حالة الدفع': p.paymentStatus,
        'تاريخ الفاتورة': new Date(p.createdAt).toLocaleDateString()
      }));
      const wsPurchases = XLSX.utils.json_to_sheet(purchaseRows);
      XLSX.utils.book_append_sheet(wb, wsPurchases, lang === 'ar' ? 'المشتريات' : 'Purchases');

      // Tab 3: Profit Loss
      const pnlRows = [
        { 'البند المالي': 'إجمالي إيراد المبيعات', 'المبلغ بالعملة': financeMetrics.revenue },
        { 'البند المالي': 'تكلفة البضاعة المباعة (COGS)', 'المبلغ بالعملة': financeMetrics.totalCOGS },
        { 'البند المالي': 'إجمالي الربح التجاري (Gross Profit)', 'المبلغ بالعملة': financeMetrics.grossProfit },
        { 'البند المالي': 'إجمالي المصروفات والنثريات', 'المبلغ بالعملة': financeMetrics.totalExpenses },
        { 'البند المالي': 'صافي الأرباح الفعلية (Net Profit)', 'المبلغ بالعملة': financeMetrics.netProfit }
      ];
      const wsPnl = XLSX.utils.json_to_sheet(pnlRows);
      XLSX.utils.book_append_sheet(wb, wsPnl, lang === 'ar' ? 'الحسابات وقائمة الدخل' : 'Profit & Loss');

      // Tab 4: Customer Debts
      const debtRows = customerMetrics.debtorCustomers.map(d => ({
        'اسم العميل': d.name,
        'رقم الهاتف': d.phone,
        'الفئة': d.category,
        'إجمالي المشتريات': d.totalPurchases,
        'عدد الأقساط المتبقية': d.unpaidInstallmentsCount,
        'الديون المستحقة': d.remainingDebt
      }));
      const wsDebts = XLSX.utils.json_to_sheet(debtRows);
      XLSX.utils.book_append_sheet(wb, wsDebts, lang === 'ar' ? 'ديون العملاء' : 'Customer Debts');

      // Tab 5: Inventory Valuation
      const valRows = inventory.map(p => ({
        'اسم الصنف عربي': p.name_ar,
        'الباركود': p.barcode,
        'الكمية المتوفرة قطع': p.quantity,
        'سعر الشراء للحبة': p.purchasePricePiece,
        'سعر البيع للحبة': p.price,
        'قيمة المخزون بسعر الشراء': p.purchasePricePiece * p.quantity,
        'القيمة المتوقعة بسعر البيع': p.price * p.quantity
      }));
      const wsInventory = XLSX.utils.json_to_sheet(valRows);
      XLSX.utils.book_append_sheet(wb, wsInventory, lang === 'ar' ? 'تقييم كشف المخزون' : 'Stock Valuation');

      XLSX.writeFile(wb, `Business_Reports_${reportStartDate}_to_${reportEndDate}.xlsx`);
      addToast(
        lang === 'ar' 
          ? 'تم تصدير الحزمة الكاملة للتقارير كملف إكسل مجمع!' 
          : 'Complete report packet exported successfully in Excel book format!', 
        'success'
      );
    } catch {
      addToast(lang === 'ar' ? 'حدث خطأ أثناء التصدير' : 'Export failed', 'error');
    }
  };

  // PRINTING CURRENT VIEW
  const handlePrintView = () => {
    window.print();
  };


  return (
    <div className="space-y-6">
      
      {/* 1. Header of the entire report system */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-5 no-print">
        <div>
          <h2 className="text-xl font-black text-[#1d1d1f] tracking-tight">
            {lang === 'ar' ? 'مركز التقارير والتدقيق المحاسبي المطور' : 'Enterprise Intelligence & Reports Hub'}
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'مؤشرات ذكاء الأعمال، كشوفات الذمم المدينة والائتمان، الميزانيات وتحليل الهوامش الفعلي' 
              : 'Audit ledgers, accounts balances, margins analytics and accounts receivables performance indicators'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Export and Print Buttons */}
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-[#34c759] hover:bg-[#2fb550] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'ar' ? 'تصدير الدفتر الشامل (إكسل)' : 'Export Full Ledger (Excel)'}</span>
          </button>

          <button
            onClick={handlePrintView}
            className="px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة التقرير الحالي' : 'Print Current View'}</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Date controls panel & Quick filters */}
      <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 space-y-4 shadow-xs no-print select-none">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0071e3]" />
            <span className="text-xs font-extrabold text-gray-800">{lang === 'ar' ? 'النطاق الزمني للتقارير الحالية:' : 'Report Billing Range:'}</span>
          </div>
          
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'today', label: lang === 'ar' ? 'اليوم' : 'Today' },
              { id: 'week', label: lang === 'ar' ? 'آخر 7 أيام' : '7 Days' },
              { id: 'month', label: lang === 'ar' ? 'هذا الشهر' : 'This Month' },
              { id: 'year', label: lang === 'ar' ? 'هذه السنة' : 'This Year' },
              { id: 'all', label: lang === 'ar' ? 'الكل/عرض ممتد' : 'Extended / All' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setQuickRange(range.id as any)}
                className="px-3 py-1 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-gray-700 text-[10px] font-bold rounded-lg transition"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block">{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label>
            <input
              type="date"
              value={reportStartDate}
              onChange={(e) => setReportStartDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7]/80 rounded-xl focus:outline-none focus:border-[#0071e3]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block">{lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</label>
            <input
              type="date"
              value={reportEndDate}
              onChange={(e) => setReportEndDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7]/80 rounded-xl focus:outline-none focus:border-[#0071e3]"
            />
          </div>

          <div className="lg:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-gray-400 block">{lang === 'ar' ? 'البحث السريع (للبنود في الجداول)' : 'Quick Row Filter Search'}</label>
            <div className="relative">
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'ابحث برقم فاتورة، اسم عميل، أو صنف...' : 'Search records...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pr-10 pl-3 py-2 bg-[#f5f5f7] border border-[#d2d2d7]/80 rounded-xl focus:outline-none focus:border-[#0071e3]"
              />
            </div>
          </div>
        </div>

        <div className="text-[10px] text-[#6e6e73] flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-amber-500" />
          <span>
            {lang === 'ar' 
              ? `التقارير مصنفة حالياً للمؤشرات في الفترة بين ${reportStartDate} و ${reportEndDate}` 
              : `Showing indices generated over range of ${reportStartDate} to ${reportEndDate}`}
          </span>
        </div>
      </div>

      {/* 3. SUBTABS MENU BAR */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-100 no-print">
        {[
          { id: 'sales', label: lang === 'ar' ? 'تقارير المبيعات' : 'Sales Reports', icon: TrendingUp },
          { id: 'purchases', label: lang === 'ar' ? 'تقارير المشتريات' : 'Purchasing Reports', icon: Package },
          { id: 'finance', label: lang === 'ar' ? 'الحسابات العامة والدخل' : 'GL Financials & profits', icon: Coins },
          { id: 'customers', label: lang === 'ar' ? 'ديون وحسابات العملاء' : 'Customers Outstanding', icon: Users },
          { id: 'inventory', label: lang === 'ar' ? 'المخزون والتقييم' : 'Stock Valuation Hub', icon: Package }
        ].map(tb => {
          const Icon = tb.icon;
          const isSelected = activeSubTab === tb.id;
          return (
            <button
              key={tb.id}
              onClick={() => {
                setActiveSubTab(tb.id as ActiveReportSubTab);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected 
                  ? 'bg-[#0071e3] text-white shadow-xs' 
                  : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN REPORTS TAB CONTENT ROUTER */}
      <div className="space-y-6 pt-2">

        {/* ======================================================= */}
        {/* A. SALES REPORTS */}
        {/* ======================================================= */}
        {activeSubTab === 'sales' && (
          <div className="space-y-6">
            
            {/* Sales metrics grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'إجمالي إيراد المبيعات' : 'Total Sales Gross'}</span>
                <span className="text-xl font-mono font-black text-[#0071e3] block mt-1">
                  {salesMetrics.totalRevenue.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{salesMetrics.invoicesCount} {lang === 'ar' ? 'فواتير مصدرة' : 'Invoices total'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'المبيعات النقدية بالدرج' : 'Cash Sales Till'}</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">
                  {salesMetrics.cashSalesSum.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'نقود سائلة مستلمة' : 'Immediate cash hand'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'مبيعات التحويلات البنكية' : 'Bank Transfers (بنكك)'}</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {salesMetrics.transferSalesSum.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'بصندوق الحساب المصرفي' : 'Direct bank accounts'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'متوسط السلة الشرائية' : 'Average Cart Ticket'}</span>
                <span className="text-xl font-mono font-black text-gray-900 block mt-1">
                  {Math.round(salesMetrics.avgInvoiceValue).toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'معدل الإنفاق لكل فاتورة' : 'Mean spending rate'}</span>
              </div>
            </div>

            {/* Visual breakdown and Top selling products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Sales trend bar chart visual */}
              <div className="lg:col-span-7 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'منحنى تراكم المبيعات اليومي' : 'Daily Sales Trajectory'}</h3>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'إجمالي المبيعات مقسمة لكل يوم لتحديد ساعات وأيام الذروة' : 'Cumulative daily billing indices'}</p>
                </div>

                {salesMetrics.salesTrend.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-300">
                    {lang === 'ar' ? 'لا توجد بيانات مخطط كافية للجدول الزمني.' : 'No chart data available for the window.'}
                  </div>
                ) : (
                  <div className="pt-4 space-y-3">
                    <div className="flex items-end justify-between h-40 gap-2 border-b border-gray-100 pb-1">
                      {salesMetrics.salesTrend.map((pt, i) => {
                        const maxVal = Math.max(...salesMetrics.salesTrend.map(x => x.total)) || 1;
                        const heightPct = Math.min(100, Math.max(10, (pt.total / maxVal) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full mb-1 bg-gray-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                              {pt.total.toLocaleString()} {currency}
                            </div>
                            <div 
                              className="w-full bg-[#0071e3] rounded-t-md hover:bg-[#0077ed] transition-all cursor-pointer" 
                              style={{ height: `${heightPct}%` }}
                            />
                            <span className="text-[8px] text-gray-400 truncate max-w-full font-mono">{pt.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Selling Products */}
              <div className="lg:col-span-5 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'الأصناف الأكثر مبيعاً ورواجاً' : 'Stars & High Velocity Items'}</h3>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'المنتجات والحلول الأكثر طلباً وفق وحدات الصرف' : 'Product contribution ranking by units'}</p>
                </div>

                {salesMetrics.topSellingProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-300">
                    {lang === 'ar' ? 'لم يتم تسجيل حركة بيع للمنتجات.' : 'No items sold during this period.'}
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {salesMetrics.topSellingProducts.map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{lang === 'ar' ? prod.name_ar : prod.name_en}</p>
                          <span className="text-[9px] text-gray-400 block mt-0.5">{prod.qty} {lang === 'ar' ? 'وحـدة صرف ومبيعات' : 'units sold'}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-gray-900">
                            {prod.total.toLocaleString()}
                          </span>
                          <span className="text-[9px] block text-gray-400 font-sans">{currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Invoices detail log with filters search */}
            <div className="bg-white border border-[#d2d2d7] rounded-3xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7] flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-[#1d1d1f]">{lang === 'ar' ? 'مسرد الفواتير وتدقيق المبيعات' : 'Sales Billing Log & Audits'}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right bg-white leading-normal">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                      <th className="py-3 px-4 text-center">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                      <th className="py-3 px-4">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                      <th className="py-3 px-4">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                      <th className="py-3 px-4">{lang === 'ar' ? 'طريقة السداد' : 'Payment Method'}</th>
                      <th className="py-3 px-4 text-center">{lang === 'ar' ? 'حالة الائتمان' : 'Installment Status'}</th>
                      <th className="py-3 px-4 text-left">{lang === 'ar' ? 'مبلغ المبيعات' : 'Invoice Total'}</th>
                      <th className="py-3 px-4 text-center">{lang === 'ar' ? 'خيارات' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSales.filter(inv => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return inv.invoiceNumber.toLowerCase().includes(q) || 
                             (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
                             inv.paymentMethod.toLowerCase().includes(q);
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          {lang === 'ar' ? 'لا توجد تطابقات لمدخلات البحث.' : 'No matched invoices found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredSales.filter(inv => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return inv.invoiceNumber.toLowerCase().includes(q) || 
                               (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
                               inv.paymentMethod.toLowerCase().includes(q);
                      }).map(inv => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-3 px-4 font-bold text-center font-mono text-[#0071e3]">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4 text-gray-800 font-medium">{inv.customerName || (lang === 'ar' ? 'عام' : 'Cash Counter')}</td>
                          <td className="py-3 px-4 text-gray-400 font-mono">{new Date(inv.createdAt).toLocaleString()}</td>
                          <td className="py-3 px-4 font-bold">
                            {inv.paymentMethod === 'cash' ? (lang === 'ar' ? 'نقدي کـاش' : 'Cash') :
                             inv.paymentMethod === 'transfer' ? (lang === 'ar' ? 'بنكك / تحويل' : 'Transfer') : (lang === 'ar' ? 'شيك مصرفي' : 'Check')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {inv.isInstallment ? (
                              <span className="inline-block bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full text-[9px] font-extrabold">
                                {lang === 'ar' ? 'آجل / قسط متبقي: ' : 'Installment: '}{inv.amountRemaining?.toLocaleString()} {currency}
                              </span>
                            ) : (
                              <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                {lang === 'ar' ? 'مسدد بالكامل' : 'Paid In Full'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-left font-black text-gray-900 font-mono">{inv.total.toLocaleString()} {currency}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsPrintModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition"
                            >
                              {lang === 'ar' ? 'معاينة / طبع' : 'Inspect'}
                            </button>
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

        {/* ======================================================= */}
        {/* B. PURCHASING & SUPPLIER REPORTS */}
        {/* ======================================================= */}
        {activeSubTab === 'purchases' && (
          <div className="space-y-6">
            
            {/* Purchase statistics key grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'إجمالي المشتريات والتموين' : 'Total Supply Procurement'}</span>
                <span className="text-xl font-mono font-black text-amber-600 block mt-1">
                  {purchaseMetrics.totalPurchasesRaw.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{purchaseMetrics.countPurchaseInvoices} {lang === 'ar' ? 'فواتير تموين' : 'Purchase invoices'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'المبلغ المدفوع كاش ومصرفي' : 'Procurements Paid Up'}</span>
                <span className="text-xl font-mono font-black text-emerald-600 block mt-1">
                  {purchaseMetrics.amountPaidPurchases.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'مبالغ مدفوعة للموردين' : 'Supplier payouts'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'إجمالي ذمم الموردين المدينة (ديون)' : 'Owed Supplier Balances'}</span>
                <span className="text-xl font-mono font-black text-red-600 block mt-1">
                  {purchaseMetrics.totalSupplierOwed.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-red-600 font-medium mt-0.5 block">{lang === 'ar' ? 'مطلوب تصفيتها مستقبلاً' : 'Outstanding payables'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'مرتجع المشتريات الصادرة' : 'Purchasing Returns'}</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {purchaseMetrics.totalReturnsRaw.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'بضائع مسحوبة ومصونة' : 'Credits from returns'}</span>
              </div>
            </div>

            {/* Purchases breakdown & Suppliers credit status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Suppliers list outstanding payables */}
              <div className="lg:col-span-7 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'تقارير أرصدة الموردين المستحقة' : 'Outstanding Supplier Ledger Owed'}</h3>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'متابعة من لهم استحقاقات مالية في ذمة العمل التجاري' : 'Balances we owe our product suppliers (SDG/CNY)'}</p>
                </div>

                {suppliers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-300">
                    {lang === 'ar' ? 'لا يوجد موردون مسجلون بالنظام.' : 'No suppliers added.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {suppliers.map(sup => (
                      <div key={sup.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{sup.name}</p>
                          <span className="text-[9px] text-gray-400 block">{sup.company || (lang === 'ar' ? 'شركة عامة' : 'General company')} • {sup.phone}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black font-mono ${sup.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {sup.currentBalance.toLocaleString()} {currency}
                          </span>
                          <span className="text-[8px] block text-gray-400">
                            {sup.currentBalance > 0 ? (lang === 'ar' ? 'ديون مستحقة له' : 'رصيد دائن لنا') : (lang === 'ar' ? 'مسدد' : 'Prepaid')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Items we procurement purchase map */}
              <div className="lg:col-span-5 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'الأصناف الأكثر تمويناً وشراءً' : 'Procured Inventory Demands'}</h3>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'المنتجات الأعلى كلفة وشراءً من موردي السلسلة' : 'Top purchased lines ordered in this range'}</p>
                </div>

                {purchaseMetrics.topPurchasedProducts.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-300">
                    {lang === 'ar' ? 'لا توجد مشتريات خلال هذه التواريخ.' : 'No procurements logged.'}
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {purchaseMetrics.topPurchasedProducts.map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{lang === 'ar' ? prod.name_ar : prod.name_en}</p>
                          <span className="text-[9px] text-gray-400 block mt-0.5">{prod.qty} {lang === 'ar' ? 'كرتون ومجموع قطع' : 'units bought'}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold font-mono text-gray-900">
                            {prod.total.toLocaleString()}
                          </span>
                          <span className="text-[9px] block text-gray-400 font-sans">{currency}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ======================================================= */}
        {/* C. FINANCIALS & PROFITS (PROFIT AND LOSS) */}
        {/* ======================================================= */}
        {activeSubTab === 'finance' && (
          <div className="space-y-6">
            
            {/* Income statement dynamic layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Income statement (قائمة الدخل ومجمل الأرباح والخسائر) */}
              <div className="lg:col-span-6 bg-white border border-[#d2d2d7] rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'بيان الربح والخسارة وقائمة الدخل' : 'Financial Statement & Income Statement'}</h3>
                  <p className="text-xs text-gray-400">{lang === 'ar' ? 'حسابات تدفقات الإيراد مطروح منها تكاليف المقتنيات والمصاريف' : 'Bilingual Income Ledger calculation for profitability status'}</p>
                </div>

                <div className="space-y-3.5 pt-2">
                  
                  {/* Revenue (+) */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{lang === 'ar' ? 'إجمالي إيراد المبيعات (+)' : 'Gross Revenue (+)'}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#1d1d1f]">{financeMetrics.revenue.toLocaleString()} {currency}</span>
                  </div>

                  {/* COGS (-) */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{lang === 'ar' ? 'تكلفة المواد المشتراة والمباعة (-)' : 'Cost of Goods Sold (COGS) (-)'}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-amber-700">-{financeMetrics.totalCOGS.toLocaleString()} {currency}</span>
                  </div>

                  {/* Gross Profit (=) */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100 bg-[#f5f5f7]/40 px-3 py-1.5 rounded-xl">
                    <span className="text-xs font-extrabold text-gray-900">{lang === 'ar' ? 'إجمالي الأرباح التجارية (=)' : 'Gross Margin Profit (=)'}</span>
                    <span className="text-xs font-mono font-extrabold text-[#0071e3]">{financeMetrics.grossProfit.toLocaleString()} {currency}</span>
                  </div>

                  {/* Operational Expenses (-) */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">{lang === 'ar' ? 'المصاريف العامة والتشغيلية (-)' : 'General Expenses (-)'}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-red-600">-{financeMetrics.totalExpenses.toLocaleString()} {currency}</span>
                  </div>

                  {/* Ultimate Net Profit (=) */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    financeMetrics.netProfit >= 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div>
                      <span className="text-xs font-black block">{lang === 'ar' ? 'صافي أرباح العمل والعمليات (=)' : 'Net Operating Profit (=)'}</span>
                      <span className="text-[9px] block opacity-80">{lang === 'ar' ? 'الأرباح الحقيقية المحققة بعد اقتطاع التكاليف' : 'Profit remaining after all deductions'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black font-mono block">
                        {financeMetrics.netProfit.toLocaleString()} {currency}
                      </span>
                      {financeMetrics.netProfit >= 0 ? (
                        <span className="bg-emerald-600 text-white rounded text-[8px] px-1.5 py-0.5 font-bold uppercase inline-block mt-0.5">{lang === 'ar' ? 'أرباح تشغيلية ممتاز' : 'PROFITABLE'}</span>
                      ) : (
                        <span className="bg-red-600 text-white rounded text-[8px] px-1.5 py-0.5 font-bold uppercase inline-block mt-0.5">{lang === 'ar' ? 'خسائر تشغيلية' : 'LOSS'}</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Cash Safe/Bank account balance distribution & Expenses breakdown */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Safe & bank capital distribution */}
                <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'إجمالي السيولة النقدية الموزعة' : 'Cash Liquidity Allocation'}</h3>
                    <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'نسب توزيع الكاش السائل في الخزائن والحسابات البنكية' : 'Available cash holdings representation'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f5f5f7] p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">{lang === 'ar' ? 'رصيد الخزائن' : 'Safes Till'}</span>
                        <span className="text-xs font-mono font-extrabold text-gray-800">{financeMetrics.safeCapital.toLocaleString()} SDG</span>
                      </div>
                      <Wallet className="w-5 h-5 text-amber-500" />
                    </div>

                    <div className="bg-[#f5f5f7] p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block">{lang === 'ar' ? 'الحسابات المصرفية' : 'Banks Balance'}</span>
                        <span className="text-xs font-mono font-extrabold text-gray-800">{financeMetrics.bankCapital.toLocaleString()} SDG</span>
                      </div>
                      <Landmark className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>

                  {/* Percentage bar shares */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                      <span>{lang === 'ar' ? 'كاش يدوي' : 'Hand cash'}: {financeMetrics.overallCapital > 0 ? Math.round((financeMetrics.safeCapital / financeMetrics.overallCapital) * 100) : 0}%</span>
                      <span>{lang === 'ar' ? 'كاش مصرفي' : 'Bank cash'}: {financeMetrics.overallCapital > 0 ? Math.round((financeMetrics.bankCapital / financeMetrics.overallCapital) * 100) : 0}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-indigo-200 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-amber-500 rounded-l-full" 
                        style={{ width: `${financeMetrics.overallCapital > 0 ? (financeMetrics.safeCapital / financeMetrics.overallCapital) * 100 : 50}%` }}
                      />
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${financeMetrics.overallCapital > 0 ? (financeMetrics.bankCapital / financeMetrics.overallCapital) * 100 : 50}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expenses breakdown by category */}
                <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'تبويب وتوزيع المصروفات التشغيلية' : 'Expense Category Shares'}</h3>
                    <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'مجالات تفريغ المداخيل ومجالات الصرف الأكثر هدراً' : 'Category spending analytics in range'}</p>
                  </div>

                  {financeMetrics.expenseCategoryBreakdown.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-300">
                      {lang === 'ar' ? 'لا يوجد مصروفات عامة مسجلة في هذا الإطار.' : 'No filtered expenses compiled.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {financeMetrics.expenseCategoryBreakdown.map((item, id) => (
                        <div key={id} className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-700 font-bold">
                            <span>{item.category}</span>
                            <span className="font-mono">{item.amount.toLocaleString()} {currency}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-400" 
                              style={{ width: `${financeMetrics.totalExpenses > 0 ? (item.amount / financeMetrics.totalExpenses) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================= */}
        {/* D. CUSTOMERS & AR DEBTS REPORT */}
        {/* ======================================================= */}
        {activeSubTab === 'customers' && (
          <div className="space-y-6">
            
            {/* Customer metrics count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'إجمالي الديون الآجلة للعملاء' : 'Accounts Receivables (AR)'}</span>
                <span className="text-xl font-mono font-black text-rose-600 block mt-1">
                  {customerMetrics.totalReceivableDebts.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-red-600 font-medium mt-0.5 block">{lang === 'ar' ? 'مبالغ معلقة بانتظار تحصيل الأقساط' : 'Cumulative installment debts'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'عدد العملاء المدينين' : 'Active Owed Debtors'}</span>
                <span className="text-xl font-mono font-black text-gray-900 block mt-1">
                  {customerMetrics.debtorCustomers.length} <span className="text-xs text-gray-400 font-sans">{lang === 'ar' ? 'عميل مدين' : 'clients'}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'عليهم متبقيات مستحقة' : 'Outstanding installments'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'قاعدة البيانات الكلية للعملاء' : 'Customer Account Base'}</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {customerMetrics.customerBaseCount} <span className="text-xs text-gray-400 font-sans">{lang === 'ar' ? 'عميل مسجل' : 'accounts'}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'مؤسسات وأفراد' : 'System records'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'فواتير الأقساط المعلقة' : 'Active installment plans'}</span>
                <span className="text-xl font-mono font-black text-amber-600 block mt-1">
                  {customerMetrics.ongoingInstallmentsCount} <span className="text-xs text-gray-400 font-sans">{lang === 'ar' ? 'فاتورة معلقة' : 'receivables'}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'مخططات سداد فعالة' : 'Installment invoice lines'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Detailed Debtor Customers Table */}
              <div className="lg:col-span-12 bg-white border border-[#d2d2d7] rounded-3xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7]">
                  <h3 className="text-xs font-extrabold text-[#1d1d1f]">{lang === 'ar' ? 'جرد وكشف ديون العملاء التفصيلي (الذمم المدينة)' : 'Detailed Receivables Status & Debtor Ledger'}</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right bg-white leading-normal">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                        <th className="py-3 px-4">{lang === 'ar' ? 'اسم العميل' : 'Customer Name'}</th>
                        <th className="py-3 px-4">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                        <th className="py-3 px-4">{lang === 'ar' ? 'فئة المعاملة' : 'Class'}</th>
                        <th className="py-3 px-4 text-left">{lang === 'ar' ? 'إجمالي مسحوباته الكلية' : 'Total Purchased'}</th>
                        <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الأقساط المتبقية' : 'Active Installments'}</th>
                        <th className="py-3 px-4 text-left text-red-600 font-bold">{lang === 'ar' ? 'الديون المتبقية والذمم' : 'Outstanding Remaining Debt'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customerMetrics.debtorCustomers.filter(item => {
                        if (!searchQuery) return true;
                        return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               item.phone.includes(searchQuery);
                      }).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-400">
                            {lang === 'ar' ? 'لا يوجد استحقاقات أو قروض ديون حالية للعملاء المطابقين.' : 'No debtor customers matched.'}
                          </td>
                        </tr>
                      ) : (
                        customerMetrics.debtorCustomers.filter(item => {
                          if (!searchQuery) return true;
                          return item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 item.phone.includes(searchQuery);
                        }).map((debtor, id) => (
                          <tr key={id} className="hover:bg-gray-50/50 transition">
                            <td className="py-3 px-4 font-bold text-gray-900">{debtor.name}</td>
                            <td className="py-3 px-4 text-gray-500 font-mono">{debtor.phone || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="inline-block bg-gray-50 text-gray-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                {debtor.category === 'vip' ? 'VIP' :
                                 debtor.category === 'wholesale' ? (lang === 'ar' ? 'جملة' : 'Wholesale') : 
                                 debtor.category === 'retailer' ? (lang === 'ar' ? 'موزع' : 'Retailer') : (lang === 'ar' ? 'تجزئة' : 'Regular')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-left font-mono text-gray-700">{debtor.totalPurchases.toLocaleString()} {currency}</td>
                            <td className="py-3 px-4 text-center font-bold text-indigo-600">{debtor.unpaidInstallmentsCount}</td>
                            <td className="py-3 px-4 text-left font-black text-rose-600 font-mono text-sm">{debtor.remainingDebt.toLocaleString()} {currency}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================= */}
        {/* E. INVENTORY AUDIT & STOCK STATUS */}
        {/* ======================================================= */}
        {activeSubTab === 'inventory' && (
          <div className="space-y-6">
            
            {/* Inventory valuation key cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'تقييم المخزون بسعر الشراء' : 'Inventory Value (at Cost)'}</span>
                <span className="text-xl font-mono font-black text-emerald-700 block mt-1">
                  {inventoryMetrics.totalValuationPurchasePrice.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'قيمة رأس المال المخزن' : 'Procured asset values stored'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'التقييم المتوقع بسعر البيع' : 'Projected Value (at Retail)'}</span>
                <span className="text-xl font-mono font-black text-[#0071e3] block mt-1">
                  {inventoryMetrics.totalValuationSellingPrice.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{lang === 'ar' ? 'أصل القيمة السوقية للمقتنيات' : 'Projected retail market cashout'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'هامش الأرباح التقديري المخزن' : 'Projected Unrealized Profit'}</span>
                <span className="text-xl font-mono font-black text-indigo-600 block mt-1">
                  {inventoryMetrics.projectedStockMarginValue.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
                <span className="text-[9px] text-indigo-600 font-medium mt-0.5 block">{lang === 'ar' ? 'الفارق الربحي الكلي المخزن' : 'Margin value if 100% sold'}</span>
              </div>

              <div className="bg-white p-5 border border-[#d2d2d7] rounded-3xl shadow-xs">
                <span className="text-[10px] text-gray-400 font-extrabold block">{lang === 'ar' ? 'أصناف متميزة ومسجلة' : 'Unique Lines Tracked'}</span>
                <span className="text-xl font-mono font-black text-gray-900 block mt-1">
                  {inventoryMetrics.uniqueItemsCount} <span className="text-xs text-gray-400 font-sans">{lang === 'ar' ? 'كود صنف' : 'lines'}</span>
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5 block">{inventoryMetrics.totalAvailablePieces.toLocaleString()} {lang === 'ar' ? 'قطعة مفردة بالمستودعات' : 'single individual pieces'}</span>
              </div>
            </div>

            {/* Crucial alerts: Low stocks & Non-moving inventory */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Critical Stock Alerts Warnings */}
              <div className="lg:col-span-6 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'أصناف منخفضة وقاربت على النفاد (شراء فوري)' : 'Critical Reorder Alerts'}</h3>
                    <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'منتجات رصيدها أقل من حد الأمان لطلب المشتريات' : 'Items warning to reorder now (Quantity <= 10 Pcs)'}</p>
                  </div>
                  <span className="bg-rose-50 text-rose-700 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold">{inventoryMetrics.lowStockItems.length} {lang === 'ar' ? 'تحذير' : 'alerts'}</span>
                </div>

                {inventoryMetrics.lowStockItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-emerald-600">
                    ✕ {lang === 'ar' ? 'جميع مستويات المخزون كافية وممتازة حالياً.' : 'All stock lines are healthy.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {inventoryMetrics.lowStockItems.map((prod, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{lang === 'ar' ? prod.name_ar : prod.name_en}</p>
                          <span className="text-[9px] text-gray-400 block">{prod.category || (lang === 'ar' ? 'قسم عام' : 'Uncategorized')} • {prod.barcode || 'لا يوجد كود'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black font-mono text-rose-600">
                            {prod.quantity} {prod.unit || (lang === 'ar' ? 'قطعة' : 'pcs')}
                          </span>
                          <span className="text-[8px] block text-gray-400">{lang === 'ar' ? 'رصيد حرج منخفض' : 'Low alert'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Non-moving Stock (الأصناف الراكدة) */}
              <div className="lg:col-span-6 bg-white p-5 border border-[#d2d2d7] rounded-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'تقرير الأصناف الراكدة (تكدس البضائع)' : 'Dead Stock & Non-Moving Inventory'}</h3>
                  <p className="text-[10px] text-gray-400">{lang === 'ar' ? 'أصناف موجودة في المستودعات ولكن ليس لها حركة بيع نهائياً' : 'Items loaded in warehouse but never transacted in sales'}</p>
                </div>

                {inventoryMetrics.nonMovingStock.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    ✕ {lang === 'ar' ? 'لا يوجد بضائع راكدة، معدلات الدوران نشطة لعموم الأقسام!' : 'All items are transacted or rotated.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {inventoryMetrics.nonMovingStock.map((prod, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-gray-800">{lang === 'ar' ? prod.name_ar : prod.name_en}</p>
                          <span className="text-[9px] text-gray-400 block">{prod.category || (lang === 'ar' ? 'قسم عام' : 'General')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold font-mono text-amber-600">
                            {prod.quantity} {prod.unit || (lang === 'ar' ? 'حبة' : 'pcs')}
                          </span>
                          <span className="text-[8px] text-gray-400 block">{lang === 'ar' ? 'راكدة بالمخازن' : 'In stock (Zero Sales)'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
