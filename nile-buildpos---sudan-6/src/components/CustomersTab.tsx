import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Phone, MapPin, Mail, Search, Filter, 
  TrendingUp, Coins, Calendar, ShieldAlert, CheckCircle, 
  FileText, Edit3, Trash2, X, Plus, UserCheck, CreditCard, 
  AlertCircle, PhoneCall, FileSpreadsheet
} from 'lucide-react';
import { Customer, Invoice } from '../types';

interface CustomersTabProps {
  lang: 'ar' | 'en';
  customers: Customer[];
  sales: Invoice[];
  onSaveCustomers: (updated: Customer[]) => void;
  onSelectInvoiceForPrint: (invoice: Invoice) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CustomersTab({ 
  lang, 
  customers, 
  sales, 
  onSaveCustomers, 
  onSelectInvoiceForPrint,
  addToast 
}: CustomersTabProps) {
  const [subTab, setSubTab] = useState<'dashboard' | 'directory' | 'contact_list'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'regular' | 'vip' | 'retailer' | 'wholesale'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterBalanceStatus, setFilterBalanceStatus] = useState<'all' | 'debtor' | 'no_debt' | 'limit_exceeded'>('all');
  
  // Detail Customer Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Export Customers to Excel Helper
  const exportCustomersToExcel = () => {
    if (customers.length === 0) {
      addToast(lang === 'ar' ? 'لا توجد بيانات لعملاء لتصديرها!' : 'No customer data to export!', 'error');
      return;
    }

    import('xlsx').then((XLSX) => {
      const rows = customers.map(c => {
        const customerSales = sales.filter(s => s.customerName === c.name);
        const totalPurchases = customerSales.reduce((acc, s) => acc + s.total, 0);
        const paid = customerSales.reduce((acc, s) => acc + (s.amountReceived || 0), 0);
        const remainingDebt = Math.max(0, totalPurchases - paid);

        return {
          'اسم العميل': c.name,
          'رقم الهاتف': c.phone,
          'العنوان': c.address || '—',
          'البريد الإلكتروني': c.email || '—',
          'الفئة': c.category === 'vip' ? 'VIP مميز' : 
                   c.category === 'retailer' ? 'موزع قطاعي' : 
                   c.category === 'wholesale' ? 'تاجر جملة' : 'عادي',
          'الحد الائتماني': c.creditLimit || 'غير محدد',
          'إجمالي المشتريات (SDG)': totalPurchases,
          'الديون المتبقية (SDG)': remainingDebt,
          'الحالة': c.status === 'active' ? 'نشط' : 'غير نشط',
          'ملاحظات': c.notes || '—'
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'العملاء');
      XLSX.writeFile(wb, `سجل_العملاء_${Date.now()}.xlsx`);
      addToast(lang === 'ar' ? 'تم تصدير العملاء كملف إكسل بنجاح' : 'Customers exported to Excel successfully', 'success');
    }).catch(err => {
      console.error(err);
      addToast('Error exporting data', 'error');
    });
  };

  // Form Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState<'regular' | 'vip' | 'retailer' | 'wholesale'>('regular');
  const [formCreditLimit, setFormCreditLimit] = useState<number | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Open Create Form
  const openCreateForm = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormEmail('');
    setFormCategory('regular');
    setFormCreditLimit('');
    setFormNotes('');
    setFormStatus('active');
    setIsFormOpen(true);
  };

  // Open Edit Form
  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone);
    setFormAddress(customer.address || '');
    setFormEmail(customer.email || '');
    setFormCategory(customer.category);
    setFormCreditLimit(customer.creditLimit);
    setFormNotes(customer.notes || '');
    setFormStatus(customer.status);
    setIsFormOpen(true);
  };

  // Handle Save (Create / Update)
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      addToast(lang === 'ar' ? 'الرجاء إدخال اسم العميل' : 'Please enter customer name', 'error');
      return;
    }
    if (!formPhone.trim()) {
      addToast(lang === 'ar' ? 'الرجاء إدخال رقم الهاتف' : 'Please enter phone number', 'error');
      return;
    }

    const cLimit = Number(formCreditLimit) || 0;

    let updatedList: Customer[];

    if (editingCustomer) {
      // Edit mode
      updatedList = customers.map(c => {
        if (c.id === editingCustomer.id) {
          return {
            ...c,
            name: formName.trim(),
            phone: formPhone.trim(),
            address: formAddress.trim() || undefined,
            email: formEmail.trim() || undefined,
            category: formCategory,
            creditLimit: cLimit,
            notes: formNotes.trim() || undefined,
            status: formStatus
          };
        }
        return c;
      });
      addToast(lang === 'ar' ? 'تم تحديث بيانات العميل بنجاح' : 'Customer updated successfully', 'success');
    } else {
      // Check duplicate name
      const duplicate = customers.find(c => c.name.trim().toLowerCase() === formName.trim().toLowerCase());
      if (duplicate) {
        addToast(lang === 'ar' ? 'هذا الاسم مسجل مسبقاً لعميل آخر!' : 'Customer name already exists!', 'error');
        return;
      }

      // Create mode
      const newCustomer: Customer = {
        id: 'cust_' + Math.random().toString(36).substring(2, 9),
        name: formName.trim(),
        phone: formPhone.trim(),
        address: formAddress.trim() || undefined,
        email: formEmail.trim() || undefined,
        category: formCategory,
        creditLimit: cLimit,
        notes: formNotes.trim() || undefined,
        status: formStatus,
        createdAt: Date.now()
      };
      updatedList = [newCustomer, ...customers];
      addToast(lang === 'ar' ? 'تمت إضافة العميل الجديد بنجاح' : 'Customer added successfully', 'success');
    }

    onSaveCustomers(updatedList);
    setIsFormOpen(false);
  };

  // Handle Delete Customer
  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    // Check if customer has outstanding debt
    const customerDebts = sales.filter(inv => 
      inv.customerName?.trim().toLowerCase() === customerName.trim().toLowerCase() && 
      inv.isInstallment && 
      (inv.amountRemaining || 0) > 0
    );

    if (customerDebts.length > 0) {
      addToast(
        lang === 'ar' 
          ? 'لا يمكن حذف العميل لأنه يمتلك مديونيات وأقساط مستحقة للتحصيل!' 
          : 'Cannot delete customer because they have outstanding dues!', 
        'error'
      );
      return;
    }

    const confirmMsg = lang === 'ar' 
      ? `هل أنت متأكد من حذف العميل "${customerName}"؟`
      : `Are you sure you want to delete customer "${customerName}"?`;

    if (!window.confirm(confirmMsg)) return;

    const updated = customers.filter(c => c.id !== customerId);
    onSaveCustomers(updated);
    addToast(lang === 'ar' ? 'تم حذف العميل بنجاح' : 'Customer deleted successfully', 'success');
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(null);
    }
  };

  // Compile Dynamic Customer Metrics linking them dynamically with actual Sales/Invoices
  const computedCustomers = useMemo(() => {
    return customers.map(customer => {
      // Exact or case-insensitive matching
      const customerInvoices = sales.filter(inv => 
        inv.customerName?.trim().toLowerCase() === customer.name.trim().toLowerCase()
      );

      const totalPurchases = customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalRemainingDebt = customerInvoices.reduce((sum, inv) => sum + (inv.amountRemaining || 0), 0);
      const totalPaidAmount = customerInvoices.reduce((sum, inv) => {
        if (inv.isInstallment) {
          return sum + (inv.amountPaid || 0);
        }
        return sum + inv.total;
      }, 0);

      const invoicesCount = customerInvoices.length;
      const isLimitExceeded = totalRemainingDebt > customer.creditLimit;

      return {
        ...customer,
        totalPurchases,
        totalRemainingDebt,
        totalPaidAmount,
        invoicesCount,
        isLimitExceeded,
        invoices: customerInvoices
      };
    });
  }, [customers, sales]);

  // General Filtered List
  const filteredList = useMemo(() => {
    return computedCustomers.filter(c => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesPhone = c.phone.includes(query);
        const matchesAddress = c.address?.toLowerCase().includes(query) || false;
        const matchesNotes = c.notes?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesPhone && !matchesAddress && !matchesNotes) return false;
      }

      // 2. Category Filter
      if (filterCategory !== 'all' && c.category !== filterCategory) return false;

      // 3. Status Filter
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;

      // 4. Balance Filter
      if (filterBalanceStatus === 'debtor' && c.totalRemainingDebt <= 0) return false;
      if (filterBalanceStatus === 'no_debt' && c.totalRemainingDebt > 0) return false;
      if (filterBalanceStatus === 'limit_exceeded' && !c.isLimitExceeded) return false;

      return true;
    });
  }, [computedCustomers, searchQuery, filterCategory, filterStatus, filterBalanceStatus]);

  // Selected Customer Details Object
  const activeCustomerDetails = useMemo(() => {
    if (!selectedCustomerId) return null;
    return computedCustomers.find(c => c.id === selectedCustomerId) || null;
  }, [computedCustomers, selectedCustomerId]);

  // Overview metrics for Top-level Dashboard Cards
  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.status === 'active').length;
    const totalOutstandingDebt = computedCustomers.reduce((sum, c) => sum + c.totalRemainingDebt, 0);
    const debtorsCount = computedCustomers.filter(c => c.totalRemainingDebt > 0).length;
    const totalPurchasesGlobal = computedCustomers.reduce((sum, c) => sum + c.totalPurchases, 0);
    const limitBreachedCount = computedCustomers.filter(c => c.isLimitExceeded).length;

    return {
      totalCount,
      activeCount,
      totalOutstandingDebt,
      debtorsCount,
      totalPurchasesGlobal,
      limitBreachedCount
    };
  }, [computedCustomers, customers]);

  return (
    <div className="space-y-6">
      {/* Tab Header with visual indicators */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
            {lang === 'ar' ? 'سجل دائرة حسابات العملاء' : 'Customer Account Directorate'}
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'إدارة حسابات الديون، تصنيفات الائتمان وسجل الحركات المالية المترابطة' 
              : 'Debt tracking, credit categories & associated financial operations ledger'}
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          {/* Sub-Tabs Switch Navigation */}
          <div className="flex bg-[#f5f5f7] p-1 rounded-2xl border border-[#d2d2d7] text-xs font-bold font-sans">
            <button
              onClick={() => setSubTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                subTab === 'dashboard' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {lang === 'ar' ? 'لوحة المراقبة التفاعلية' : 'Observation Center'}
            </button>
            <button
              onClick={() => setSubTab('directory')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                subTab === 'directory' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {lang === 'ar' ? 'دليل وبطاقات العملاء' : 'Customer Directory'}
            </button>
            <button
              onClick={() => setSubTab('contact_list')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                subTab === 'contact_list' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {lang === 'ar' ? 'سجل دليل الاتصال' : 'Contact Ledger'}
            </button>
          </div>

          <button
            onClick={exportCustomersToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#34a853] hover:bg-[#34a853]/90 text-white font-extrabold text-xs rounded-xl transition shadow-xs leading-none"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير إكسل' : 'Export Excel'}</span>
          </button>

          <button
            onClick={openCreateForm}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-extrabold text-xs rounded-xl transition shadow-xs leading-none"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة عميل جديد' : 'New Customer'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: ADVANCED CUSTOMER ANALYTICS DASHBOARD */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Cust Card */}
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">{lang === 'ar' ? 'إجمالي العملاء المسجلين' : 'Registered Customers'}</span>
                <div className="w-6.5 h-6.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0071e3]">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-[#1d1d1f]">
                {metrics.totalCount} <span className="text-xs font-sans font-normal text-gray-500">{lang === 'ar' ? 'أفراد وجهات' : 'Contacts'}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                {lang === 'ar' ? `المشتركون النشطون: ${metrics.activeCount} عملاء` : `Active: ${metrics.activeCount}`}
              </p>
            </div>

            {/* Total Debtors Card */}
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">{lang === 'ar' ? 'العملاء المدينين بالنظام' : 'Active Debtors'}</span>
                <div className="w-6.5 h-6.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-amber-600">
                {metrics.debtorsCount} <span className="text-xs font-sans font-normal text-gray-500">{lang === 'ar' ? 'عملاء' : 'Clients'}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                {lang === 'ar' 
                  ? `نسبتهم: ${metrics.totalCount > 0 ? Math.round((metrics.debtorsCount / metrics.totalCount) * 100) : 0}% من العملاء` 
                  : `Proportion: ${metrics.totalCount > 0 ? Math.round((metrics.debtorsCount / metrics.totalCount) * 100) : 0}%`}
              </p>
            </div>

            {/* Outstanding System Balance Card */}
            <div className="bg-white border border-[#d2d2d7] rounded-3xl p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">{lang === 'ar' ? 'إجمالي المبالغ والديون المستحقة' : 'Outstanding Receivables'}</span>
                <div className="w-6.5 h-6.5 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center text-red-600">
                  <Coins className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-black font-mono text-charcoal leading-none text-red-600">
                {metrics.totalOutstandingDebt.toLocaleString()} <span className="text-xs font-sans font-normal">SDG</span>
              </div>
              <p className="text-[10px] text-gray-400">
                {lang === 'ar' ? 'موزعة كأقساط ائتمانية مؤجلة السداد' : 'Represents outstanding customer ledger sheets'}
              </p>
            </div>

            {/* Credit Limit Breached */}
            <div className={`border rounded-3xl p-5 space-y-3 shadow-xs ${
              metrics.limitBreachedCount > 0 
                ? 'bg-red-50/20 border-red-200' 
                : 'bg-white border-[#d2d2d7]'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold">{lang === 'ar' ? 'تجاوز حد الأمان الائتماني' : 'Credit Limit Breached'}</span>
                <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center ${
                  metrics.limitBreachedCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-150 text-gray-600'
                }`}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-black font-mono ${metrics.limitBreachedCount > 0 ? 'text-red-600' : 'text-[#1d1d1f]'}`}>
                {metrics.limitBreachedCount} <span className="text-xs font-sans font-normal text-gray-500">{lang === 'ar' ? 'حساب' : 'Accounts'}</span>
              </div>
              <p className="text-[10px] text-gray-400">
                {lang === 'ar' ? 'يحتاجون لمراجعة سريعة وإيقاف البيع الآجل' : 'Dues exceed mapped credit limit agreements'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Debtors List (كبار العملاء المستحق عليهم ديون) */}
            <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-[#1d1d1f]">
                  {lang === 'ar' ? 'كبار المديونين بالنظام (قيد المتابعة)' : 'Top Debtors Trace'}
                </h3>
                <span className="text-[9px] text-[#6e6e73] font-mono font-bold">بترتيب المديونية التنازلي</span>
              </div>

              {computedCustomers.filter(c => c.totalRemainingDebt > 0).length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs text-medium">
                  {lang === 'ar' ? 'لا توجد ديون معلقة بالنظام حالياً!' : 'No outstanding client balances detected!'}
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {computedCustomers
                    .filter(c => c.totalRemainingDebt > 0)
                    .sort((a, b) => b.totalRemainingDebt - a.totalRemainingDebt)
                    .slice(0, 5)
                    .map((customer, index) => {
                      const limitUsagePct = customer.creditLimit > 0 
                        ? Math.min(100, Math.round((customer.totalRemainingDebt / customer.creditLimit) * 100)) 
                        : 0;
                      return (
                        <div key={customer.id} className="p-3 border border-[#f5f5f7] rounded-xl flex justify-between items-center gap-3 hover:bg-[#f5f5f7]/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-mono flex items-center justify-center font-black">
                                #{index + 1}
                              </span>
                              <strong className="text-xs text-[#1d1d1f]">{customer.name}</strong>
                              
                              {customer.isLimitExceeded && (
                                <span className="inline-block bg-red-50 text-red-800 text-[8px] font-black px-1.5 py-0.5 rounded-md">
                                  {lang === 'ar' ? 'تجاوز الحد!' : 'Exceeded limit'}
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              <span className="font-mono">{customer.phone}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1 shrink-0">
                            <span className="block text-xs font-black text-red-600 font-mono">
                              {customer.totalRemainingDebt.toLocaleString()} SDG
                            </span>
                            <span className="block text-[9px] text-[#6e6e73]">
                              {lang === 'ar' ? `استهلاك حد الائتمان: ${limitUsagePct}%` : `Credit usage: ${limitUsagePct}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Lifetime Valued Top Customers (الأكثر سحباً ومبيعات) */}
            <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-[#1d1d1f]">
                  {lang === 'ar' ? 'كبار الشركاء والعملاء بالأكثر سحباً لقيمة المبيعات الكلية' : 'Top Customer Lifetime Purchase Volume'}
                </h3>
                <span className="text-[9px] text-[#0071e3] font-mono font-bold">بمجموع المشتريات التراكمي</span>
              </div>

              {computedCustomers.filter(c => c.totalPurchases > 0).length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  {lang === 'ar' ? 'لا توجد حركة مشتريات للعملاء حتى الآن.' : 'No customer purchases history registered.'}
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {computedCustomers
                    .filter(c => c.totalPurchases > 0)
                    .sort((a, b) => b.totalPurchases - a.totalPurchases)
                    .slice(0, 5)
                    .map((customer, index) => {
                      return (
                        <div key={customer.id} className="p-3 border border-[#f5f5f7] rounded-xl flex justify-between items-center gap-3 hover:bg-[#f5f5f7]/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-mono flex items-center justify-center font-black">
                                #{index + 1}
                              </span>
                              <strong className="text-xs text-[#1d1d1f]">{customer.name}</strong>
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                                {customer.category === 'regular' ? 'عادي' : customer.category === 'vip' ? 'VIP' : customer.category === 'retailer' ? 'تاجر تجزئة' : 'تاجر جملة'}
                              </span>
                            </div>
                            <div className="text-[9px] text-gray-400 flex items-center gap-2.5 font-sans">
                              <span>قوام الفواتير: <strong className="font-mono text-[#0071e3]">{customer.invoicesCount}</strong> فواتير</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1 shrink-0">
                            <span className="block text-xs font-black text-[#1d1d1f] font-mono">
                              {customer.totalPurchases.toLocaleString()} SDG
                            </span>
                            <span className="block text-[9px] text-[#6e6e73] font-bold text-emerald-600">
                              {lang === 'ar' ? 'مسدد مباشر:' : 'Paid:'} {customer.totalPaidAmount.toLocaleString()} SDG
                            </span>
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

      {/* VIEW 2: CLIENT CARDS DIRECTORY & MANAGEMENT BLOCK */}
      {subTab === 'directory' && (
        <div className="space-y-6">
          {/* Advanced Directory Filtering Segment */}
          <div className="bg-[#f5f5f7] border border-[#d2d2d7] rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 block mb-1">ابحث باسم العميل أو الهاتف</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم، الملاحظة، الهاتف..."
                  className="w-full text-xs px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3] pr-8"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 block mb-1">فئة العميل</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:outline-none"
              >
                <option value="all">جميع الفئات</option>
                <option value="regular">عميل عادي</option>
                <option value="vip">فئة خاصة VIP</option>
                <option value="retailer">تاجر قطاعي/تجزئة</option>
                <option value="wholesale">تاجر جملة</option>
              </select>
            </div>

            {/* Status selection */}
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 block mb-1">الحالة الإدارية</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:outline-none"
              >
                <option value="all">الكل</option>
                <option value="active">نشط بالتعامل</option>
                <option value="inactive">موقوف إدارياً</option>
              </select>
            </div>

            {/* Balance Status selection */}
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 block mb-1">الوضع الائتماني المالي</label>
              <select
                value={filterBalanceStatus}
                onChange={(e) => setFilterBalanceStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:outline-none"
              >
                <option value="all">كل الأوضاع</option>
                <option value="debtor">المطالب بديون معلقة (مدين)</option>
                <option value="no_debt">سجل حساب مصفى (بلا ديون)</option>
                <option value="limit_exceeded">تجاوز مديونيات حد الائتمان المقر</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle Column: Cards list of filtered customers */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-[#6e6e73] font-bold">
                  {lang === 'ar' 
                    ? `مجموع البحث المصفى: ${filteredList.length} عميل` 
                    : `Filtered count: ${filteredList.length} customers`}
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-400">انقر لعرض سجل حركات الحساب</span>
              </div>

              {filteredList.length === 0 ? (
                <div className="bg-white border border-[#d2d2d7] rounded-[24px] py-16 text-center text-gray-400 text-xs text-medium">
                  {lang === 'ar' ? 'لا يوجد عملاء يطابقون تصفيتك الحالية.' : 'No customer records matching this configuration.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredList.map((customer) => {
                    const isSelected = selectedCustomerId === customer.id;
                    return (
                      <motion.div
                        layoutId={`card-${customer.id}`}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        key={customer.id}
                        className={`p-5 rounded-[22px] border text-right cursor-pointer select-none transition-all flex flex-col justify-between h-48 ${
                          isSelected 
                            ? 'border-[#0071e3] bg-blue-50/10 shadow-md ring-1 ring-[#0071e3]/30' 
                            : 'border-[#d2d2d7] bg-white hover:border-gray-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-1">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                                customer.category === 'vip' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : customer.category === 'wholesale' 
                                    ? 'bg-blue-100 text-blue-750' 
                                    : customer.category === 'retailer' 
                                      ? 'bg-indigo-100 text-indigo-700' 
                                      : 'bg-gray-100 text-gray-700'
                              }`}>
                                {customer.category === 'regular' ? 'عادي' : customer.category === 'vip' ? 'VIP' : customer.category === 'retailer' ? 'مفرق' : 'جملة'}
                              </span>
                              
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                customer.status === 'active' ? 'bg-emerald-150 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {customer.status === 'active' ? 'نشط' : 'موقف'}
                              </span>
                            </div>

                            <div className="text-left shrink-0">
                              <span className="text-[10px] text-gray-400 font-mono">ID: {customer.id.replace('cust_', '')}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-extrabold text-[#1d1d1f] line-clamp-1">{customer.name}</h4>
                            <div className="flex items-center gap-1.5 text-[9px] text-[#6e6e73]">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="font-mono">{customer.phone}</span>
                            </div>
                            {customer.address && (
                              <div className="flex items-center gap-1.5 text-[9px] text-[#6e6e73] line-clamp-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{customer.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Financial outstanding summary in footer of the Card */}
                        <div className="pt-2 border-t border-[#f5f5f7] flex justify-between items-end text-xs">
                          <div>
                            <span className="text-[8px] text-gray-400 block font-normal">{lang === 'ar' ? 'سحوبات مبيعات' : 'Purchases'}</span>
                            <span className="font-mono font-bold text-[#1d1d1f] text-[10px]">
                              {customer.totalPurchases.toLocaleString()} SDG
                            </span>
                          </div>

                          <div className="text-left">
                            <span className="text-[8px] text-red-500 block font-bold">
                              {lang === 'ar' ? 'مبالغ آجلة معلقة' : 'Outstanding'}
                            </span>
                            <span className={`font-mono text-[10.5px] font-black ${customer.totalRemainingDebt > 0 ? 'text-red-650 font-black' : 'text-gray-400'}`}>
                              {customer.totalRemainingDebt > 0 ? `${customer.totalRemainingDebt.toLocaleString()} SDG` : '0 SDG'}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Customer Details Ledger Card (كشف حساب العميل) */}
            <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-5 space-y-5 leading-normal">
              {!activeCustomerDetails ? (
                <div className="py-24 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs text-[#6e6e73] font-bold">اختر أي عميل من الدليل لمطالعة كشف حساب تفصيلي وحركة الفواتير</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Detailed Customer Card Header */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] text-gray-400 font-bold block">{lang === 'ar' ? 'بطاقة كشف حساب متكاملة' : 'Customer Account Core'}</span>
                      <strong className="text-sm font-extrabold text-[#1d1d1f] block leading-snug">{activeCustomerDetails.name}</strong>
                      <span className="inline-block bg-[#f5f5f7] text-[#6e6e73] px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                        {activeCustomerDetails.category === 'regular' ? 'عادي' : activeCustomerDetails.category === 'vip' ? 'عضو كبار شخصيات VIP' : activeCustomerDetails.category === 'retailer' ? 'تاجر تجزئة' : 'موزع جملة'}
                      </span>
                    </div>

                    {/* Actions on this customer card */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditForm(activeCustomerDetails)}
                        className="p-1.5 bg-[#f5f5f7] hover:bg-gray-200 text-gray-700 rounded-lg transition"
                        title="تعديل بيانات العميل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(activeCustomerDetails.id, activeCustomerDetails.name)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition"
                        title="مسح وتصفير العميل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Customer Information detail checklist */}
                  <div className="text-xs space-y-2 block text-right">
                    <div className="flex justify-between">
                      <span className="text-gray-400">رقم الهاتف:</span>
                      <strong className="font-mono text-gray-900 select-all">{activeCustomerDetails.phone}</strong>
                    </div>
                    {activeCustomerDetails.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">البريد الإلكتروني:</span>
                        <strong className="text-gray-900">{activeCustomerDetails.email}</strong>
                      </div>
                    )}
                    {activeCustomerDetails.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">العنوان المسجل:</span>
                        <strong className="text-gray-900">{activeCustomerDetails.address}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">تاريخ التسجيل بالسيستم:</span>
                      <strong className="font-mono text-gray-900">{new Date(activeCustomerDetails.createdAt).toISOString().split('T')[0]}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">مستوى الأمان الائتماني (الحد):</span>
                      <strong className="font-mono text-gray-900">{activeCustomerDetails.creditLimit.toLocaleString()} SDG</strong>
                    </div>

                    {activeCustomerDetails.notes && (
                      <div className="bg-[#f5f5f7] p-2.5 rounded-xl text-[10px] text-[#6e6e73] select-text">
                        <span className="font-extrabold text-[#1d1d1f] block mb-0.5">ملاحظات داخلية:</span>
                        {activeCustomerDetails.notes}
                      </div>
                    )}
                  </div>

                  {/* Financial metrics linked to sales */}
                  <div className="bg-[#f5f5f7]/60 border border-[#f5f5f7] rounded-2xl p-4.5 space-y-3">
                    <h5 className="text-[10px] font-black text-[#1d1d1f] uppercase tracking-wider">ملخص الموقف المالي</h5>
                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div>
                        <span className="text-[9px] text-gray-400 block">إجمالي مشتريات</span>
                        <strong className="text-xs font-mono text-gray-900">{activeCustomerDetails.totalPurchases.toLocaleString()} SDG</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-400 block">المبلغ المالي المسدد</span>
                        <strong className="text-xs font-mono text-emerald-600">{activeCustomerDetails.totalPaidAmount.toLocaleString()} SDG</strong>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-gray-200">
                        <span className="text-[9px] text-red-600 font-bold block">إجمالي الديون معلقة (باسم العميل)</span>
                        <strong className={`text-md font-mono ${activeCustomerDetails.totalRemainingDebt > 0 ? 'text-red-650 font-black' : 'text-gray-500'}`}>
                          {activeCustomerDetails.totalRemainingDebt.toLocaleString()} SDG
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Customer Purchase History (قائمة الفواتير الخاصة بالعميل) */}
                  <div className="space-y-2 text-right">
                    <h5 className="text-xs font-extrabold text-[#1d1d1f]">تفاصيل فواتير العميل المعتمدة</h5>
                    {activeCustomerDetails.invoices.length === 0 ? (
                      <p className="text-[10px] text-gray-400 py-3 text-center">لا توجد حركات شراء مدونة بالنظام لهذا العميل.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {activeCustomerDetails.invoices.map((inv) => (
                          <div key={inv.id} className="p-2.5 border border-[#e5e5ea] rounded-xl flex justify-between items-center bg-gray-50/40">
                            <div>
                              <span className="font-bold text-[10px] text-[#1d1d1f] block">رقم الفاتورة: F-{inv.invoiceNumber}</span>
                              <span className="text-[8px] text-gray-400 font-mono block">{new Date(inv.createdAt).toISOString().split('T')[0]}</span>
                            </div>
                            <div className="text-left space-y-1">
                              <span className="text-[10px] text-charcoal font-black font-mono block">{inv.total.toLocaleString()} SDG</span>
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => onSelectInvoiceForPrint(inv)}
                                  className="text-[8px] bg-white border border-[#d2d2d7] hover:bg-gray-150 px-1.5 py-0.5 rounded font-bold"
                                >
                                  معاينة وطبع
                                </button>
                                {inv.isInstallment && (inv.amountRemaining || 0) > 0 && (
                                  <span className="inline-block text-[8px] bg-amber-50 text-amber-800 px-1 py-0.5 rounded font-bold shrink-0">
                                    غير مسدد كاملاً
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SYSTEM CUSTOMER QUICK MOBILE CONTACTS LIST */}
      {subTab === 'contact_list' && (
        <div className="bg-white border border-[#d2d2d7] rounded-[24px] overflow-hidden leading-normal shadow-xs text-right">
          <div className="px-5 py-4 bg-[#f5f5f7] border-b border-[#d2d2d7] flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-[#1d1d1f]">تفاصيل الاتصال وقائمة التواصل السريع بالعملاء</h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">
              {customers.length} جهة اتصال
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right bg-white select-none">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100 text-[10px]">
                  <th className="py-3 px-4 text-right">اسم العميل</th>
                  <th className="py-3 px-4 text-center">أرقم الهاتف</th>
                  <th className="py-3 px-4">الفئة / التصنيف</th>
                  <th className="py-3 px-4">محل الإقامة / العنوان</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4 text-center">اختصارات التواصل السريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      لا يوجد عملاء مسجلون بدليل الاتصال في الوقت الحالي.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f5f5f7]/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-xs">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center text-gray-700 font-bold">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                          c.category === 'vip' 
                            ? 'bg-purple-100 text-purple-700' 
                            : c.category === 'wholesale' 
                              ? 'bg-blue-100 text-blue-850' 
                              : c.category === 'retailer' 
                                ? 'bg-indigo-100 text-indigo-700' 
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                          {c.category === 'regular' ? 'عادي' : c.category === 'vip' ? 'عضو VIP' : c.category === 'retailer' ? 'تاجر قطاعي' : 'تاجر جملة'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {c.address || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        {c.email || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={`tel:${c.phone}`}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>اتصال مباشر</span>
                          </a>
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

      {/* DIALOG MODAL: ADD / EDIT CUSTOMER */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-2xl flex flex-col p-6 space-y-4 text-right"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#f5f5f7] pb-3">
                <h3 className="text-sm font-extrabold text-[#1d1d1f]">
                  {editingCustomer ? 'تعديل وتصحيح بيانات العميل' : 'إضافة وتهيئة عميل جديد بالبرنامج'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)} 
                  className="text-gray-450 p-1 hover:bg-gray-150 rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveCustomer} className="space-y-4 leading-normal">
                {/* Name & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1d1d1f] block">اسم العميل بالكامل *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="أدخل الاسم التجاري أو الفردي"
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1d1d1f] block">رقم الاتصال (الهاتف) *</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="مثال: 0912345678"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white text-right"
                      required
                    />
                  </div>
                </div>

                {/* Email & Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1d1d1f] block">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="info@customer.com"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1d1d1f] block">العنوان الجغرافي / المقر</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="مثال: الخرطوم، حي الرياض، عمارة 9"
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white font-sans"
                    />
                  </div>
                </div>

                {/* Categories & Credit Limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1d1d1f] block">فئة العميل والتصنيف</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white"
                    >
                      <option value="regular">عادي (مبيعات سريعة بقرار مفرد)</option>
                      <option value="vip">عضو مستحق ومميز VIP</option>
                      <option value="retailer">تاجر تجزئة قطاعي</option>
                      <option value="wholesale">تاجر وموزع جملة (دفعات ضخمة)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-700 block">حد الأمان الائتماني (SDG)</label>
                    <input
                      type="number"
                      value={formCreditLimit}
                      onChange={(e) => setFormCreditLimit(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="الحد الأقصى للديون المسموحة"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#e30000] focus:outline-none bg-white text-right"
                      min="0"
                    />
                  </div>
                </div>

                {/* Notes & Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1d1d1f] block">تأكيد حالة المتابعة</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        checked={formStatus === 'active'}
                        onChange={() => setFormStatus('active')}
                        className="accent-[#0071e3]"
                      />
                      <span>نشط ومصرح بفتح فواتير نقدياً وآجلاً</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        checked={formStatus === 'inactive'}
                        onChange={() => setFormStatus('inactive')}
                        className="accent-red-650"
                      />
                      <span className="text-red-700 font-bold">موقوف إدارياً (حظر البيع الآجل)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1d1d1f] block">ملاحظات داخلية وهيكل التقارير</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="ملاحظات حول الالتزام بالدفع، السمعة المالية، إلخ..."
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none bg-white min-h-[70px] font-sans"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-3 border-t border-[#f5f5f7]">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-extrabold text-xs rounded-xl transition shadow-xs"
                  >
                    {editingCustomer ? 'تحديث كارت العميل' : 'تسجيل وحفظ العميل الجديد'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-3 bg-[#f5f5f7] border border-[#d2d2d7] text-[#1d1d1f] font-bold text-xs rounded-xl hover:bg-gray-150 transition"
                  >
                    إلغاء الأمر
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
