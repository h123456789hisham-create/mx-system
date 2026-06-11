import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Coins, Calendar, MessageSquare, Download,
  Wallet, Landmark, ArrowLeftRight, TrendingUp, TrendingDown,
  Settings, History, ChevronRight, BarChart3, Search, FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Expense, CashSafe, BankAccount, FinanceTransaction, FinanceSettings, Invoice 
} from '../types';
import { getTranslation, LanguageCode } from '../translations';

interface FinanceTabProps {
  expenses: Expense[];
  onSaveExpenses: (expenses: Expense[]) => void;
  safes: CashSafe[];
  onSaveSafes: (safes: CashSafe[]) => void;
  bankAccounts: BankAccount[];
  onSaveBankAccounts: (bankAccounts: BankAccount[]) => void;
  financeTransactions: FinanceTransaction[];
  onSaveFinanceTransactions: (transactions: FinanceTransaction[]) => void;
  financeSettings: FinanceSettings;
  onSaveFinanceSettings: (settings: FinanceSettings) => void;
  sales: Invoice[];
  lang: LanguageCode;
  currency: string;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function FinanceTab({
  expenses,
  onSaveExpenses,
  safes,
  onSaveSafes,
  bankAccounts,
  onSaveBankAccounts,
  financeTransactions,
  onSaveFinanceTransactions,
  financeSettings,
  onSaveFinanceSettings,
  sales,
  lang,
  currency,
  addToast
}: FinanceTabProps) {
  
  // --- Tab Selection ---
  // Sub-tabs: 'dashboard' | 'safes' | 'banks' | 'expenses' | 'transactions' | 'settings'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'safes' | 'banks' | 'expenses' | 'transactions' | 'settings'>('dashboard');

  const t = (key: string, params?: Record<string, any>) => getTranslation(lang, key, params);

  // --- Search / Filters states ---
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseSourceFilter, setExpenseSourceFilter] = useState('all');

  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');

  // --- Modal Form States for Safe, Bank, Transfer, Transaction ---
  const [showAddSafe, setShowAddSafe] = useState(false);
  const [safeName, setSafeName] = useState('');
  const [safeInitialBalance, setSafeInitialBalance] = useState<number | ''>('');

  const [showAddBank, setShowAddBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankInitialBalance, setBankInitialBalance] = useState<number | ''>('');

  const [showTransactionModal, setShowTransactionModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDescription, setTxDescription] = useState('');
  const [txSourceType, setTxSourceType] = useState<'safe' | 'bank' | 'other'>('safe');
  const [txSourceId, setTxSourceId] = useState('');
  const [txDestType, setTxDestType] = useState<'safe' | 'bank' | 'other'>('bank');
  const [txDestId, setTxDestId] = useState('');
  const [txCategory, setTxCategory] = useState('زيادة رأس المال');

  // --- Expense Form States ---
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expCategory, setExpCategory] = useState('');
  const [expSourceType, setExpSourceType] = useState<'safe' | 'bank' | 'other'>('other');
  const [expSourceId, setExpSourceId] = useState('');
  const [expComment, setExpComment] = useState('');

  // --- Settings Form States ---
  const [newCategory, setNewCategory] = useState('');

  // Auto-fill defaults for forms
  React.useEffect(() => {
    if (financeSettings && financeSettings.expenseCategories && financeSettings.expenseCategories.length > 0) {
      setExpCategory(financeSettings.expenseCategories[0]);
    }
  }, [financeSettings]);

  // --- EXPORT TO CSV HELPERS ---
  const handleExportExpensesCSV = () => {
    if (filteredExpenses.length === 0) {
      addToast(lang === 'ar' ? 'لا توجد بيانات لتصديرها!' : 'No data to export!', 'error');
      return;
    }
    const headers = lang === 'ar' 
      ? ['البند', 'المجال', 'القيمة بالعملة', 'مصدر التمويل', 'التاريخ', 'الملاحظات'] 
      : ['Expense Title', 'Category', 'Amount', 'Payment Source', 'Date', 'Notes'];

    const rows = filteredExpenses.map(exp => {
      let sourceLabel = lang === 'ar' ? 'عام / غير محدد' : 'General / Other';
      if (exp.sourceType === 'safe') {
        const foundSafe = safes.find(s => s.id === exp.sourceId);
        sourceLabel = foundSafe ? `${lang === 'ar' ? 'خزينة: ' : 'Safe: '}${foundSafe.name}` : exp.sourceType;
      } else if (exp.sourceType === 'bank') {
        const foundBank = bankAccounts.find(b => b.id === exp.sourceId);
        sourceLabel = foundBank ? `${lang === 'ar' ? 'بنك: ' : 'Bank: '}${foundBank.bankName}` : exp.sourceType;
      }
      return [
        exp.title,
        exp.category || (lang === 'ar' ? 'عام' : 'General'),
        exp.amount,
        sourceLabel,
        new Date(exp.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
        exp.comment || ''
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Expenses_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(lang === 'ar' ? 'تم تصدير المصروفات بنجاح' : 'Expenses exported successfully', 'success');
  };

  const handleExportTransactionsCSV = () => {
    if (filteredTransactions.length === 0) {
      addToast(lang === 'ar' ? 'لا توجد بيانات لتصديرها!' : 'No data to export!', 'error');
      return;
    }
    const headers = lang === 'ar' 
      ? ['نوع الحركة', 'المبلغ بالعملة', 'من (المصدر)', 'إلى (الوجهة)', 'التفسير والملاحظات', 'التاريخ'] 
      : ['Tx Type', 'Amount', 'Source', 'Destination', 'Description', 'Date'];

    const rows = filteredTransactions.map(tx => {
      let srcLabel = lang === 'ar' ? 'خارجي / أخرى' : 'External / Other';
      let destLabel = lang === 'ar' ? 'خارجي / أخرى' : 'External / Other';

      if (tx.sourceType === 'safe') {
        const s = safes.find(x => x.id === tx.sourceId);
        srcLabel = s ? `${lang === 'ar' ? 'خزينة: ' : 'Safe: '}${s.name}` : 'Safe';
      } else if (tx.sourceType === 'bank') {
        const b = bankAccounts.find(x => x.id === tx.sourceId);
        srcLabel = b ? `${lang === 'ar' ? 'بنك: ' : 'Bank: '}${b.bankName}` : 'Bank';
      }

      if (tx.destinationType === 'safe') {
        const s = safes.find(x => x.id === tx.destinationId);
        destLabel = s ? `${lang === 'ar' ? 'خزينة: ' : 'Safe: '}${s.name}` : 'Safe';
      } else if (tx.destinationType === 'bank') {
        const b = bankAccounts.find(x => x.id === tx.destinationId);
        destLabel = b ? `${lang === 'ar' ? 'بنك: ' : 'Bank: '}${b.bankName}` : 'Bank';
      }

      const typeLabel = tx.type === 'deposit' ? (lang === 'ar' ? 'إيداع' : 'Deposit')
                      : tx.type === 'withdraw' ? (lang === 'ar' ? 'سحب' : 'Withdrawal')
                      : (lang === 'ar' ? 'تحويل بيني' : 'Transfer');

      return [
        typeLabel,
        tx.amount,
        srcLabel,
        destLabel,
        tx.description,
        new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(lang === 'ar' ? 'تم تصدير المعاملات بنجاح' : 'Transactions exported successfully', 'success');
  };

  // --- LOGIC CALCULATIONS & INTEGRATIONS ---
  // Overall statistics
  const overallMetrics = useMemo(() => {
    const totalSafes = safes.reduce((sum, s) => sum + s.balance, 0);
    const totalBanks = bankAccounts.reduce((sum, b) => sum + b.balance, 0);
    const overallCapital = totalSafes + totalBanks;
    const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRev = sales.reduce((sum, inv) => sum + inv.total, 0);

    return {
      totalSafes,
      totalBanks,
      overallCapital,
      totalExp,
      totalRev
    };
  }, [safes, bankAccounts, expenses, sales]);

  // Expenses filtering
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchText = exp.title.toLowerCase().includes(expenseSearch.toLowerCase()) || 
                        (exp.comment && exp.comment.toLowerCase().includes(expenseSearch.toLowerCase()));
      const matchCategory = expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter;
      const matchSource = expenseSourceFilter === 'all' || exp.sourceType === expenseSourceFilter;
      return matchText && matchCategory && matchSource;
    }).sort((a, b) => b.date - a.date);
  }, [expenses, expenseSearch, expenseCategoryFilter, expenseSourceFilter]);

  // Transactions filtering
  const filteredTransactions = useMemo(() => {
    return financeTransactions.filter(tx => {
      const matchText = tx.description.toLowerCase().includes(transactionSearch.toLowerCase()) ||
                        (tx.category && tx.category.toLowerCase().includes(transactionSearch.toLowerCase()));
      const matchType = transactionTypeFilter === 'all' || tx.type === transactionTypeFilter;
      return matchText && matchType;
    }).sort((a, b) => b.date - a.date);
  }, [financeTransactions, transactionSearch, transactionTypeFilter]);

  // Expenses Category breakdown for beautiful progress bars
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category || (lang === 'ar' ? 'عام' : 'General');
      map[cat] = (map[cat] || 0) + e.amount;
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0) || 1;
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / total) * 100)
    })).sort((a, b) => b.amount - a.amount);
  }, [expenses, lang]);

  // --- ACTIONS: ADD SAFE & BANK ---
  const handleAddSafe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeName.trim()) return;

    const initialVal = Number(safeInitialBalance) || 0;
    const newSafe: CashSafe = {
      id: 'safe_' + Math.random().toString(36).substring(2, 11),
      name: safeName.trim(),
      balance: initialVal,
      currency: currency,
      status: 'active',
      createdAt: Date.now()
    };

    onSaveSafes([newSafe, ...safes]);
    
    // Log transaction if there was an initial balance
    if (initialVal > 0) {
      const trans: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'deposit',
        sourceType: 'other',
        destinationType: 'safe',
        destinationId: newSafe.id,
        amount: initialVal,
        date: Date.now(),
        description: lang === 'ar' ? `الرصيد الافتتاحي لتأسيس خزينة: ${newSafe.name}` : `Opening balance for safe: ${newSafe.name}`,
        category: lang === 'ar' ? 'رأس مال افتتاحي' : 'Opening Capital'
      };
      onSaveFinanceTransactions([trans, ...financeTransactions]);
    }

    setSafeName('');
    setSafeInitialBalance('');
    setShowAddSafe(false);
    addToast(lang === 'ar' ? 'تم إنشاء الخزينة الجديدة بنجاح' : 'New safe created successfully', 'success');
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !bankAccountName.trim() || !bankAccountNumber.trim()) return;

    const initialVal = Number(bankInitialBalance) || 0;
    const newBank: BankAccount = {
      id: 'bank_' + Math.random().toString(36).substring(2, 11),
      bankName: bankName.trim(),
      accountName: bankAccountName.trim(),
      accountNumber: bankAccountNumber.trim(),
      balance: initialVal,
      currency: currency,
      status: 'active',
      createdAt: Date.now()
    };

    onSaveBankAccounts([newBank, ...bankAccounts]);

    // Log transaction if there was initial balance
    if (initialVal > 0) {
      const trans: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'deposit',
        sourceType: 'other',
        destinationType: 'bank',
        destinationId: newBank.id,
        amount: initialVal,
        date: Date.now(),
        description: lang === 'ar' ? `الرصيد الافتتاحي للتمويل البنكي الأول بفتح حساب: ${newBank.bankName}` : `Opening balance for bank: ${newBank.bankName}`,
        category: lang === 'ar' ? 'رأس مال افتتاحي' : 'Opening Capital'
      };
      onSaveFinanceTransactions([trans, ...financeTransactions]);
    }

    setBankName('');
    setBankAccountName('');
    setBankAccountNumber('');
    setBankInitialBalance('');
    setShowAddBank(false);
    addToast(lang === 'ar' ? 'تم ربط الحساب البنكي الجديد بنجاح' : 'Bank account connected successfully', 'success');
  };

  // --- ACTIONS: GENERAL DEPOSIT, WITHDRAW, TRANSFER ---
  const handleExecuteFinanceTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(txAmount);
    if (!amountVal || amountVal <= 0) {
      addToast(lang === 'ar' ? 'الرجاء إدخال مبلغ مالي صحيح!' : 'Please enter a valid amount!', 'error');
      return;
    }

    const mode = showTransactionModal;
    if (!mode) return;

    if (mode === 'deposit') {
      // Deposit money into safe or bank
      if (txDestType === 'safe') {
        if (!txDestId) return;
        const updatedSafes = safes.map(s => s.id === txDestId ? { ...s, balance: s.balance + amountVal } : s);
        onSaveSafes(updatedSafes);
      } else if (txDestType === 'bank') {
        if (!txDestId) return;
        const updatedBanks = bankAccounts.map(b => b.id === txDestId ? { ...b, balance: b.balance + amountVal } : b);
        onSaveBankAccounts(updatedBanks);
      }

      const trans: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'deposit',
        sourceType: 'other',
        destinationType: txDestType,
        destinationId: txDestId,
        amount: amountVal,
        date: Date.now(),
        description: txDescription.trim() || (lang === 'ar' ? 'عملية إيداع يدوي واردة' : 'Manual cash deposit'),
        category: txCategory
      };
      onSaveFinanceTransactions([trans, ...financeTransactions]);
      addToast(lang === 'ar' ? 'تم تسجيل الإيداع المالي بنجاح' : 'Deposit registered successfully', 'success');

    } else if (mode === 'withdraw') {
      // Withdrawal check balances
      if (txSourceType === 'safe') {
        if (!txSourceId) return;
        const sf = safes.find(s => s.id === txSourceId);
        if (!sf || sf.balance < amountVal) {
          addToast(lang === 'ar' ? 'خطأ: رصيد الخزينة المصدر غير كافٍ!' : 'Error: Insufficient safe balance!', 'error');
          return;
        }
        const updatedSafes = safes.map(s => s.id === txSourceId ? { ...s, balance: s.balance - amountVal } : s);
        onSaveSafes(updatedSafes);
      } else if (txSourceType === 'bank') {
        if (!txSourceId) return;
        const bk = bankAccounts.find(b => b.id === txSourceId);
        if (!bk || bk.balance < amountVal) {
          addToast(lang === 'ar' ? 'خطأ: رصيد الحساب البنكي غير كافٍ!' : 'Error: Insufficient bank account balance!', 'error');
          return;
        }
        const updatedBanks = bankAccounts.map(b => b.id === txSourceId ? { ...b, balance: b.balance - amountVal } : b);
        onSaveBankAccounts(updatedBanks);
      }

      const trans: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'withdraw',
        sourceType: txSourceType,
        sourceId: txSourceId,
        destinationType: 'other',
        amount: amountVal,
        date: Date.now(),
        description: txDescription.trim() || (lang === 'ar' ? 'عملية سحب نقدي يدوية صادر' : 'Manual cash withdrawal'),
        category: txCategory
      };
      onSaveFinanceTransactions([trans, ...financeTransactions]);
      addToast(lang === 'ar' ? 'تم تسجيل السحب المالي بنجاح' : 'Withdrawal registered successfully', 'success');

    } else if (mode === 'transfer') {
      // Transfer logic between safe/safe, safe/bank, bank/bank, etc.
      if (txSourceType === 'safe' && txDestType === 'safe' && txSourceId === txDestId) {
        addToast(lang === 'ar' ? 'لا يمكن التحويل لنفس الخزينة!' : 'Cannot transfer to the same safe!', 'error');
        return;
      }
      if (txSourceType === 'bank' && txDestType === 'bank' && txSourceId === txDestId) {
        addToast(lang === 'ar' ? 'لا يمكن التحويل لنفس الحساب البنكي!' : 'Cannot transfer to the same bank account!', 'error');
        return;
      }

      // Check balance on source
      if (txSourceType === 'safe') {
        const sf = safes.find(s => s.id === txSourceId);
        if (!sf || sf.balance < amountVal) {
          addToast(lang === 'ar' ? 'خطأ: رصيد الخزينة المحوِّل منها غير كافٍ!' : 'Error: Insufficient balance on source safe!', 'error');
          return;
        }
      } else if (txSourceType === 'bank') {
        const bk = bankAccounts.find(b => b.id === txSourceId);
        if (!bk || bk.balance < amountVal) {
          addToast(lang === 'ar' ? 'خطأ: رصيد الحساب البنكي المحوِّل منه غير كافٍ!' : 'Error: Insufficient balance on source bank account!', 'error');
          return;
        }
      }

      // Deduct from source
      let updatedSafes = [...safes];
      let updatedBanks = [...bankAccounts];

      if (txSourceType === 'safe') {
        updatedSafes = updatedSafes.map(s => s.id === txSourceId ? { ...s, balance: s.balance - amountVal } : s);
      } else if (txSourceType === 'bank') {
        updatedBanks = updatedBanks.map(b => b.id === txSourceId ? { ...b, balance: b.balance - amountVal } : b);
      }

      // Deposit to destination
      if (txDestType === 'safe') {
        updatedSafes = updatedSafes.map(s => s.id === txDestId ? { ...s, balance: s.balance + amountVal } : s);
      } else if (txDestType === 'bank') {
        updatedBanks = updatedBanks.map(b => b.id === txDestId ? { ...b, balance: b.balance + amountVal } : b);
      }

      onSaveSafes(updatedSafes);
      onSaveBankAccounts(updatedBanks);

      const trans: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'transfer',
        sourceType: txSourceType,
        sourceId: txSourceId,
        destinationType: txDestType,
        destinationId: txDestId,
        amount: amountVal,
        date: Date.now(),
        description: txDescription.trim() || (lang === 'ar' ? 'عملية تحويل مالي بيني' : 'Internal financial transfer'),
        category: lang === 'ar' ? 'تحويل أرصدة' : 'Balance Transfer'
      };
      onSaveFinanceTransactions([trans, ...financeTransactions]);
      addToast(lang === 'ar' ? 'تم إتمام عملية التحويل المالي بسلاسة' : 'Balance transferred successfully', 'success');
    }

    setTxAmount('');
    setTxDescription('');
    setTxSourceId('');
    setTxDestId('');
    setShowTransactionModal(null);
  };

  // --- ACTIONS: EXPESNES WITH DEDUCTIONS LINK ---
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(expAmount);
    if (!expTitle.trim() || !amountVal || amountVal <= 0) return;

    // Optional deductions logic from chosen Safe/Bank Account
    if (expSourceType === 'safe') {
      if (!expSourceId) {
        addToast(lang === 'ar' ? 'الرجاء اختيار الخزينة للدفع!' : 'Please choose a safe to pay from!', 'error');
        return;
      }
      const sf = safes.find(s => s.id === expSourceId);
      if (!sf || sf.balance < amountVal) {
        addToast(lang === 'ar' ? 'رصيد الخزينة المختارة أقل من مبلغ هذا المنصرف!' : 'Safe balance is lower than expense amount!', 'error');
        return;
      }
      const updatedSafes = safes.map(s => s.id === expSourceId ? { ...s, balance: s.balance - amountVal } : s);
      onSaveSafes(updatedSafes);

      // Log transaction
      const tx: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'withdraw',
        sourceType: 'safe',
        sourceId: expSourceId,
        destinationType: 'other',
        amount: amountVal,
        date: Date.now(),
        description: `${lang === 'ar' ? 'صرف بند: ' : 'Paying: '}${expTitle.trim()}`,
        category: expCategory || lang === 'ar' ? 'منصرفات' : 'Expenses'
      };
      onSaveFinanceTransactions([tx, ...financeTransactions]);

    } else if (expSourceType === 'bank') {
      if (!expSourceId) {
        addToast(lang === 'ar' ? 'الرجاء اختيار الحساب المصرفي للدفع!' : 'Please choose a bank account to pay from!', 'error');
        return;
      }
      const bk = bankAccounts.find(b => b.id === expSourceId);
      if (!bk || bk.balance < amountVal) {
        addToast(lang === 'ar' ? 'الرصيد المصرفي في هذا الحساب أقل من مبلغ المنصرف!' : 'Bank balance is lower than expense amount!', 'error');
        return;
      }
      const updatedBanks = bankAccounts.map(b => b.id === expSourceId ? { ...b, balance: b.balance - amountVal } : b);
      onSaveBankAccounts(updatedBanks);

      // Log transaction
      const tx: FinanceTransaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 11),
        type: 'withdraw',
        sourceType: 'bank',
        sourceId: expSourceId,
        destinationType: 'other',
        amount: amountVal,
        date: Date.now(),
        description: `${lang === 'ar' ? 'صرف بند مصرفي: ' : 'Paying from bank: '}${expTitle.trim()}`,
        category: expCategory || lang === 'ar' ? 'منصرفات' : 'Expenses'
      };
      onSaveFinanceTransactions([tx, ...financeTransactions]);
    }

    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 11),
      title: expTitle.trim(),
      amount: amountVal,
      date: Date.now(),
      comment: expComment.trim(),
      category: expCategory,
      sourceType: expSourceType,
      sourceId: expSourceId
    };

    onSaveExpenses([newExpense, ...expenses]);

    setExpTitle('');
    setExpAmount('');
    setExpComment('');
    addToast(lang === 'ar' ? 'تم تسجيل المنصرف وتحديث الخزائن بنجاح' : 'Expense saved and fund balance updated', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    if (!target) return;

    // Refund balances if linked to CashSafe/BankAccount!
    if (target.sourceType === 'safe' && target.sourceId) {
      const updatedSafes = safes.map(s => s.id === target.sourceId ? { ...s, balance: s.balance + target.amount } : s);
      onSaveSafes(updatedSafes);

      // Log reversal transaction
      const revTx: FinanceTransaction = {
        id: 'tx_rev_' + Math.random().toString(36).substring(2, 11),
        type: 'deposit',
        sourceType: 'other',
        destinationType: 'safe',
        destinationId: target.sourceId,
        amount: target.amount,
        date: Date.now(),
        description: `${lang === 'ar' ? 'إرجاع وتصفير مصروف: ' : 'Reversal of expense: '}${target.title}`,
        category: lang === 'ar' ? 'تسويات وعكوسات' : 'Adjustments'
      };
      onSaveFinanceTransactions([revTx, ...financeTransactions]);

    } else if (target.sourceType === 'bank' && target.sourceId) {
      const updatedBanks = bankAccounts.map(b => b.id === target.sourceId ? { ...b, balance: b.balance + target.amount } : b);
      onSaveBankAccounts(updatedBanks);

      // Log reversal transaction
      const revTx: FinanceTransaction = {
        id: 'tx_rev_' + Math.random().toString(36).substring(2, 11),
        type: 'deposit',
        sourceType: 'other',
        destinationType: 'bank',
        destinationId: target.sourceId,
        amount: target.amount,
        date: Date.now(),
        description: `${lang === 'ar' ? 'إرجاع وتصفير بند منصرف مصرفي: ' : 'Reversal of bank expense: '}${target.title}`,
        category: lang === 'ar' ? 'تسويات وعكوسات' : 'Adjustments'
      };
      onSaveFinanceTransactions([revTx, ...financeTransactions]);
    }

    onSaveExpenses(expenses.filter(e => e.id !== id));
    addToast(lang === 'ar' ? 'تم حذف قيد المصروف وإرجاع الأموال بنجاح' : 'Expense deleted and funds refunded successfully', 'info');
  };

  // --- ACTIONS: CUSTOM CATEGORIES FOR FINANCE SETTINGS ---
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (financeSettings.expenseCategories.includes(newCategory.trim())) {
      addToast(lang === 'ar' ? 'هذا المجال مسجل مسبقاً!' : 'Category already exists!', 'error');
      return;
    }

    const updatedSettings: FinanceSettings = {
      ...financeSettings,
      expenseCategories: [...financeSettings.expenseCategories, newCategory.trim()]
    };
    onSaveFinanceSettings(updatedSettings);
    
    // Auto sync selection
    setExpCategory(newCategory.trim());
    setNewCategory('');
    addToast(lang === 'ar' ? 'تم إضافة فئة المصروف الجديدة' : 'New expense category added', 'success');
  };

  const handleDeleteCategory = (cat: string) => {
    if (financeSettings.expenseCategories.length <= 1) {
      addToast(lang === 'ar' ? 'عليك الإبقاء على فئة مصروفات واحدة على الأقل!' : 'Keep at least one category!', 'error');
      return;
    }
    const updatedSettings: FinanceSettings = {
      ...financeSettings,
      expenseCategories: financeSettings.expenseCategories.filter(c => c !== cat)
    };
    onSaveFinanceSettings(updatedSettings);
    addToast(lang === 'ar' ? 'تم إزالة فئة المصاريف بنجاح' : 'Expense category deleted', 'info');
  };


  return (
    <div className="space-y-6">
      
      {/* Upper Title and Subtab Rail */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#d2d2d7]/50 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
            {lang === 'ar' ? 'الإدارة المالية والخزائن' : 'Financial Hub & CashFlow'}
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'تتبع الخزائن اليدوية، الحسابات البنكية، المعاملات، والمصروفات بدقة تامة' 
              : 'Securely manage multiple cash safes, bank accounts, track financial flows and expense category logs'}
          </p>
        </div>

        {/* Global Mini stats indicator */}
        <div className="flex items-center gap-3 bg-[#f5f5f7] border border-[#d2d2d7] px-4 py-2.5 rounded-2xl">
          <Landmark className="w-4 h-4 text-[#0071e3]" />
          <div>
            <span className="text-[10px] text-gray-500 block font-bold uppercase">{lang === 'ar' ? 'إجمالي السيولة النقدية' : 'Total Available Cash'}</span>
            <span className="text-sm font-black font-mono text-emerald-600">
              {overallMetrics.overallCapital.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Subtabs Selector Menu */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-100 no-print">
        {[
          { id: 'dashboard', label: lang === 'ar' ? 'لوحة التحكم والمؤشرات' : 'Dashboard Summary', icon: BarChart3 },
          { id: 'safes', label: lang === 'ar' ? 'الخزائن (الكاش اليدوي)' : 'Cash Safes', icon: Wallet },
          { id: 'banks', label: lang === 'ar' ? 'الحسابات البنكية' : 'Bank Accounts', icon: Landmark },
          { id: 'expenses', label: lang === 'ar' ? 'المصروفات اليومية' : 'Expenses Daily', icon: Coins },
          { id: 'transactions', label: lang === 'ar' ? 'دفتر قيود اليومية' : 'Ledger Book', icon: History },
          { id: 'settings', label: lang === 'ar' ? 'إعدادات المالية' : 'Finance Settings', icon: Settings }
        ].map(sub => {
          const Icon = sub.icon;
          const isSel = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSel 
                  ? 'bg-[#0071e3] text-white shadow-sm' 
                  : 'text-[#6e6e73] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 1. DASHBOARD SUBTAB CONTAINER */}
      {/* ======================================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Bento-grid of Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Overall capital card */}
            <div className="bg-white p-5 rounded-2xl border border-[#d2d2d7] shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">{lang === 'ar' ? 'صندوق السيولة الكلية' : 'Total Net Cash'}</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {overallMetrics.overallCapital.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
              </div>
            </div>

            {/* Total Safes card */}
            <div className="bg-white p-5 rounded-2xl border border-[#d2d2d7] shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">{lang === 'ar' ? 'أرصدة الخزائن الكاش' : 'Drawers Cash Balance'}</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {overallMetrics.totalSafes.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
              </div>
            </div>

            {/* Total bank balances */}
            <div className="bg-white p-5 rounded-2xl border border-[#d2d2d7] shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">{lang === 'ar' ? 'أرصدة الحسابات البنكية' : 'Bank Accounts Liquidity'}</span>
                <span className="text-xl font-bold font-mono text-gray-900">
                  {overallMetrics.totalBanks.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
              </div>
            </div>

            {/* Total expenses */}
            <div className="bg-white p-5 rounded-2xl border border-[#d2d2d7] shadow-sm flex items-center gap-4">
              <div className="p-3.5 bg-red-50 rounded-xl text-red-600">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">{lang === 'ar' ? 'إجمالي المصاريف المسجلة' : 'Cumulative Expenses'}</span>
                <span className="text-xl font-bold font-mono text-red-600">
                  {overallMetrics.totalExp.toLocaleString()} <span className="text-xs text-gray-400 font-sans">{currency}</span>
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Expense breakdown progress bars */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#d2d2d7] p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'الإنفاق حسب المجالات والفئات' : 'Expense Spending Breakdown'}</h3>
                <p className="text-[10px] text-gray-500">{lang === 'ar' ? 'ترتيب المجالات الأكثر صرفاً للسيولة النقدية' : 'Categorised spending with percentages'}</p>
              </div>

              {expenseBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  {lang === 'ar' ? 'لم يتم تسجيل مصروفات لتبويب فئات الصرف.' : 'No categorized expenses found yet.'}
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {expenseBreakdown.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-700">
                        <span className="font-semibold">{item.category}</span>
                        <span className="font-mono font-medium">{item.amount.toLocaleString()} {currency} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent cash flows */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#d2d2d7] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{lang === 'ar' ? 'آخر العمليات القيود المسجلة بالخزن والبنوك' : 'Recent Balance Logs & Transfers'}</h3>
                  <p className="text-[10px] text-gray-500">{lang === 'ar' ? 'تتبع فوري لحركة النقدية اليومية' : 'Real-time liquidity log summaries'}</p>
                </div>
                <button
                  onClick={() => setActiveSubTab('transactions')}
                  className="text-xs text-[#0071e3] hover:underline font-bold flex items-center gap-1"
                >
                  <span>{lang === 'ar' ? 'عرض السجل الكامل' : 'Open Ledger'}</span>
                  <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              {financeTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  {lang === 'ar' ? 'لا توجد معاملات مسجلة حتى الآن.' : 'No transactions recorded yet.'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {financeTransactions.slice(0, 5).map((tx) => {
                    const isDep = tx.type === 'deposit';
                    const isWith = tx.type === 'withdraw';
                    const isTr = tx.type === 'transfer';
                    
                    return (
                      <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isDep ? 'bg-emerald-50 text-emerald-600' :
                            isWith ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {isDep && <TrendingUp className="w-4 h-4" />}
                            {isWith && <TrendingDown className="w-4 h-4" />}
                            {isTr && <ArrowLeftRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{tx.description}</p>
                            <span className="text-[9px] text-gray-400 font-mono block mt-0.5">
                              {new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')} • {tx.category || (lang === 'ar' ? 'عام' : 'General')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono text-xs font-black">
                          {isDep && <span className="text-emerald-600">+{tx.amount.toLocaleString()}</span>}
                          {isWith && <span className="text-red-600">-{tx.amount.toLocaleString()}</span>}
                          {isTr && <span className="text-blue-600">⇄ {tx.amount.toLocaleString()}</span>}
                          <span className="text-[9px] font-sans font-normal text-gray-400 ml-1 block">{currency}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions Panel */}
          <div className="bg-[#f5f5f7] rounded-2xl p-5 border border-dashed border-[#d2d2d7] flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800">{lang === 'ar' ? 'إجراء تسويات مالية سريعة' : 'Need to adjust, deposit or transfer funds?'}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{lang === 'ar' ? 'سجل العمليات اليدوية لتطابق النقدية في الخزن والبنوك' : 'Easily keep your physical drawers and bank accounts aligned'}</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowTransactionModal('deposit')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إيداع نقدي وارد' : 'Register Deposit'}</span>
              </button>
              
              <button
                onClick={() => setShowTransactionModal('withdraw')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'سحب نقدي صادر' : 'Register Withdrawal'}</span>
              </button>

              <button
                onClick={() => setShowTransactionModal('transfer')}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحويل أرصدة' : 'Transfer Balance'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SAFES / CASH DRAWERS SUBTAB */}
      {/* ======================================================== */}
      {activeSubTab === 'safes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'إدارة الخزائن النقدية (الكاش اليدوي)' : 'Manual Drawers & Safe Management'}</h3>
              <p className="text-xs text-gray-500">{lang === 'ar' ? 'إنشاء خزائن متعددة وتتبع الكاش السائل المتوفر بكل منها' : 'Set up physical safes, tills, or deposit box balances'}</p>
            </div>

            <button
              onClick={() => setShowAddSafe(true)}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إضافة خزينة جديدة' : 'Create New Safe'}</span>
            </button>
          </div>

          {/* Form Modal to add safe */}
          <AnimatePresence>
            {showAddSafe && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-[#d2d2d7] p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <span>{lang === 'ar' ? 'تسجيل خزينة جديدة للنظام' : 'Register Brand New Till/Safe'}</span>
                  <button onClick={() => setShowAddSafe(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleAddSafe} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'اسم الخزينة' : 'Safe Name'}</label>
                    <input
                      type="text"
                      value={safeName}
                      onChange={(e) => setSafeName(e.target.value)}
                      placeholder='مثال: الخزينة الرئيسية، درج مبيعات المحل...'
                      className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'رأس المال الافتتاحي (رصيد حالي)' : 'Opening Fund Balance'} ({currency})</label>
                    <input
                      type="number"
                      value={safeInitialBalance}
                      onChange={(e) => setSafeInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder='0.0'
                      className="w-full text-xs font-mono px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      min="0"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      {lang === 'ar' ? 'حفظ وتدشين' : 'Initialize Safe'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSafe(false)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid list of safes */}
          {safes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d2d2d7] p-12 text-center text-xs text-gray-500 space-y-2">
              <Wallet className="w-8 h-8 text-gray-300 mx-auto" />
              <p>{lang === 'ar' ? 'لا توجد خزائن نقدية مدشنة بالنظام حالياً.' : 'No cash safes defined on this system.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {safes.map(safe => (
                <div key={safe.id} className="bg-white rounded-2xl border border-[#d2d2d7] p-5 shadow-sm space-y-4 hover:border-gray-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-amber-50 rounded-lg text-amber-500">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{safe.name}</h4>
                        <span className="text-[9px] text-[#6e6e73] block mt-0.5">
                          {lang === 'ar' ? 'حالة العمل: ' : 'Status: '}
                          <span className="text-emerald-600 font-bold">{lang === 'ar' ? 'نشطة' : 'Active'}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(lang === 'ar' ? 'هل أنت متأكد من تعطيل وحذف هذه الخزينة؟ سيتم مسح أرصدتها ومطابقتها.' : 'Disable this safe?')) {
                          onSaveSafes(safes.filter(s => s.id !== safe.id));
                          addToast(lang === 'ar' ? 'تم تعطيل الخزينة بنجاح' : 'Safe disabled', 'info');
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition"
                      title={lang === 'ar' ? 'إلغاء وحذف' : 'Remove Safe'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#f5f5f7]/50 rounded-xl p-3 flex justify-between items-center text-xs">
                    <span className="text-[10px] text-gray-500 font-semibold">{lang === 'ar' ? 'النقدية المتوفرة (الرصيد الكلي):' : 'Liquidity/Balance:'}</span>
                    <span className="font-mono font-black text-gray-900 text-base">{safe.balance.toLocaleString()} {currency}</span>
                  </div>

                  {/* Safe direct actions */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      onClick={() => {
                        setTxDestType('safe');
                        setTxDestId(safe.id);
                        setTxCategory(lang === 'ar' ? 'زيادة رأس مال وتجارة' : 'Operating Deposit');
                        setShowTransactionModal('deposit');
                      }}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'إيداع مالي' : 'Deposit'}
                    </button>

                    <button
                      onClick={() => {
                        setTxSourceType('safe');
                        setTxSourceId(safe.id);
                        setTxCategory(lang === 'ar' ? 'مصاريف وسحب' : 'Operating Withdrawal');
                        setShowTransactionModal('withdraw');
                      }}
                      className="py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'سحب نقدي' : 'Withdrawal'}
                    </button>

                    <button
                      onClick={() => {
                        setTxSourceType('safe');
                        setTxSourceId(safe.id);
                        setTxDestType('bank'); // default transfer destinations bank
                        setShowTransactionModal('transfer');
                      }}
                      className="py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'تحويل أرصدة' : 'Transfer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BANK ACCOUNTS SUBTAB */}
      {/* ======================================================== */}
      {activeSubTab === 'banks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'إدارة الحسابات البنكية والمصرفية' : 'Bank Accounts & Mobile Money Link'}</h3>
              <p className="text-xs text-gray-500">{lang === 'ar' ? 'ربط وتتبع حساباتك المصرفية (بنك الخرطوم، الميز، فوري... إلخ) وسير أرصدتها' : 'Connect, update, and manage official corporate accounts'}</p>
            </div>

            <button
              onClick={() => setShowAddBank(true)}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'ربط حساب بنكي' : 'Connect Bank Account'}</span>
            </button>
          </div>

          {/* Form Modal to add Bank account */}
          <AnimatePresence>
            {showAddBank && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-[#d2d2d7] p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs font-bold text-gray-900 border-b border-gray-100 pb-2">
                  <span>{lang === 'ar' ? 'ربط وتدشين حساب بنكي ومصرفي جديد' : 'Connect New Bank Account'}</span>
                  <button onClick={() => setShowAddBank(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleAddBank} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'اسم البنك' : 'Bank Brand Name'}</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder='مثال: بنك الخرطوم (بنكك)، فوري...'
                      className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'اسم صاحب الحساب' : 'Holder Account Name'}</label>
                    <input
                      type="text"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder='اسم الشركة أو المالك...'
                      className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'رقم الحساب' : 'Account Identifier Number'}</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder='رقم الحساب أو الآيبان...'
                      className="w-full text-xs font-mono px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'رأس المال المودع البدئي' : 'Opening balance fund'} ({currency})</label>
                    <input
                      type="number"
                      value={bankInitialBalance}
                      onChange={(e) => setBankInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder='0.0'
                      className="w-full text-xs font-mono px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 text-xs font-bold">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm"
                    >
                      {lang === 'ar' ? 'إقرار وربط الحساب' : 'Authorize and Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBank(false)}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid of Bank accounts */}
          {bankAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#d2d2d7] p-12 text-center text-xs text-gray-500 space-y-2">
              <Landmark className="w-8 h-8 text-gray-300 mx-auto" />
              <p>{lang === 'ar' ? 'لم يتم ربط أي حساب مصرفي أو بنكي بالنظام حالياً.' : 'No bank accounts linked to this system.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {bankAccounts.map(bAccount => (
                <div key={bAccount.id} className="bg-white rounded-2xl border border-[#d2d2d7] p-5 shadow-sm space-y-4 hover:border-gray-400 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-blue-50 rounded-lg text-blue-500">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{bAccount.bankName}</h4>
                        <span className="text-[10px] text-[#6e6e73] font-mono block mt-0.5">
                          رقم الحساب: {bAccount.accountNumber}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(lang === 'ar' ? 'هل تود لربط إلغاء حساب البنك هذا؟ لن يمحى سجل القيود السابق ولكنه يعطل العرض.' : 'Remove this bank account?')) {
                          onSaveBankAccounts(bankAccounts.filter(b => b.id !== bAccount.id));
                          addToast(lang === 'ar' ? 'تم إزالة حساب البنك المربوط' : 'Bank configuration revoked', 'info');
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition"
                      title={lang === 'ar' ? 'حذف الحساب' : 'Unlink Account'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-gray-600 bg-[#f5f5f7]/50 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-500 block font-bold uppercase">{lang === 'ar' ? 'اسم المستفيد / الموثق' : 'Bank Account Owner'}</span>
                      <span className="font-semibold text-gray-800">{bAccount.accountName}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block font-bold uppercase">{lang === 'ar' ? 'الرصيد المتاح' : 'Available Liquid Balance'}</span>
                      <span className="font-mono font-black text-emerald-600 font-bold text-base">{bAccount.balance.toLocaleString()} {currency}</span>
                    </div>
                  </div>

                  {/* Bank Direct Actions */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <button
                      onClick={() => {
                        setTxDestType('bank');
                        setTxDestId(bAccount.id);
                        setTxCategory(lang === 'ar' ? 'إيداع مصرفي' : 'Deposit');
                        setShowTransactionModal('deposit');
                      }}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'شحن رصيد' : 'Deposit'}
                    </button>

                    <button
                      onClick={() => {
                        setTxSourceType('bank');
                        setTxSourceId(bAccount.id);
                        setTxCategory(lang === 'ar' ? 'شيك أو سحب مصرفي' : 'Checks Outflow');
                        setShowTransactionModal('withdraw');
                      }}
                      className="py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'صرف بنكي' : 'Withdrawal'}
                    </button>

                    <button
                      onClick={() => {
                        setTxSourceType('bank');
                        setTxSourceId(bAccount.id);
                        setTxDestType('safe'); // default target safe
                        setShowTransactionModal('transfer');
                      }}
                      className="py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg transition"
                    >
                      {lang === 'ar' ? 'حوالة داخلية' : 'Transfer Box'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. EXPENSES DAILY TRACKER */}
      {/* ======================================================== */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'تسجيل وتقييد المصروفات ونثريات العمل' : 'Unified Operating Expenses Log'}</h3>
              <p className="text-xs text-gray-500">{lang === 'ar' ? 'تقييد فواتير التشغيل اليومية وتحديد مصدر السداد المباشر' : 'Log standard company cash outflows and decrease funds dynamically'}</p>
            </div>

            <div className="bg-red-50 text-red-600 border border-red-200 rounded-2xl px-5 py-2.5 flex items-center gap-3">
              <Coins className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-[9px] text-gray-500 block font-bold uppercase">{lang === 'ar' ? 'إجمالي المنصرفات' : 'Overall Expenses'}</span>
                <span className="text-sm font-black font-mono">{overallMetrics.totalExp.toLocaleString()} {currency}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Form to log modern spent entries */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#d2d2d7] p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ar' ? 'تسجيل مصروف جديد' : 'Log Single Outflow'}</span>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900">{lang === 'ar' ? 'بند أو عنوان المنصرف' : 'Expense Title'}</label>
                  <input
                    type="text"
                    value={expTitle}
                    onChange={(e) => setExpTitle(e.target.value)}
                    placeholder="مثال: إيجار المحل، فاتورة كهرباء، صيانة..."
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900">{lang === 'ar' ? 'المبلغ المالي' : 'Outflow Amount'} ({currency})</label>
                  <input
                    type="number"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="قيمة بند الفاتورة..."
                    className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900">{lang === 'ar' ? 'فئة وباب المصروفات' : 'Expense Category/Tag'}</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                  >
                    {financeSettings.expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Direct Safe/Bank balance deduction selection */}
                <div className="space-y-3 bg-[#f5f5f7] p-3 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5 text-amber-500" />
                      <span>{lang === 'ar' ? 'مصدر السداد والتمويل المباشر' : 'Automatic Fund Source deduction'}</span>
                    </label>
                    <p className="text-[9px] text-gray-500">{lang === 'ar' ? 'اختيار الخزينة/البنك يخصم قيمتها فورياً من الرصيد المتوفر' : 'Connecting this deduction will instantly update cash safes'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-1 grid-flow-row">
                    {[
                      { id: 'other', label: lang === 'ar' ? 'خارجي' : 'External' },
                      { id: 'safe', label: lang === 'ar' ? 'من خسينة' : 'From Safe' },
                      { id: 'bank', label: lang === 'ar' ? 'من بنك' : 'From Bank' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setExpSourceType(type.id as any);
                          setExpSourceId('');
                        }}
                        className={`py-1.5 text-center text-[10px] font-bold rounded-lg transition ${
                          expSourceType === type.id 
                            ? 'bg-[#1d1d1f] text-white shadow-xs' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {expSourceType === 'safe' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اصرف من أي خزينة؟' : 'Select safe target'}</label>
                      <select
                        value={expSourceId}
                        onChange={(e) => setExpSourceId(e.target.value)}
                        className="w-full text-[11px] font-semibold px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
                        required
                      >
                        <option value="">-- {lang === 'ar' ? 'اختر الخزينة' : 'Choose safe'} --</option>
                        {safes.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({lang === 'ar' ? 'رصيد: ' : 'Bal: '} {s.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {expSourceType === 'bank' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اصرف من أي حساب بنكي؟' : 'Select bank target'}</label>
                      <select
                        value={expSourceId}
                        onChange={(e) => setExpSourceId(e.target.value)}
                        className="w-full text-[11px] font-semibold px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
                        required
                      >
                        <option value="">-- {lang === 'ar' ? 'اختر الحساب البنكي' : 'Choose bank'} --</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} ({lang === 'ar' ? 'رصيد: ' : 'Bal: '} {b.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-900">{lang === 'ar' ? 'البيان والملاحظات' : 'Detailed Comment'}</label>
                  <textarea
                    value={expComment}
                    onChange={(e) => setExpComment(e.target.value)}
                    placeholder="تفاصيل إضافية مفسرة..."
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:border-[#0071e3] focus:outline-none h-16 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  {lang === 'ar' ? 'تثبيت وحفظ المصروف' : 'Record Expense'}
                </button>
              </form>
            </div>

            {/* List and searches of spent logs */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap gap-2.5 items-center justify-between bg-[#f5f5f7] p-3 rounded-xl border border-gray-100">
                
                {/* Search text input */}
                <div className="relative flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    placeholder={lang === 'ar' ? 'البحث بالاسم والبيان...' : 'Search by name/comment...'}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] bg-white rounded-lg focus:outline-none focus:border-[#0071e3]"
                  />
                </div>

                {/* Filter Category */}
                <select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none min-w-[120px]"
                >
                  <option value="all">{lang === 'ar' ? 'كافة الفئات' : 'All Categories'}</option>
                  {financeSettings.expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Filter Source deduction type */}
                <select
                  value={expenseSourceFilter}
                  onChange={(e) => setExpenseSourceFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="all">{lang === 'ar' ? 'كل مصادر السداد' : 'All Fund Sources'}</option>
                  <option value="safe">{lang === 'ar' ? 'الخزائن الكاش' : 'Cash Safes'}</option>
                  <option value="bank">{lang === 'ar' ? 'البنوك' : 'Bank Accounts'}</option>
                  <option value="other">{lang === 'ar' ? 'مصادر خارجية' : 'External Sources'}</option>
                </select>

                {filteredExpenses.length > 0 && (
                  <button
                    onClick={handleExportExpensesCSV}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                    title={lang === 'ar' ? 'تصدير كملف CSV' : 'Export as CSV'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تصدير' : 'Export'}</span>
                  </button>
                )}
              </div>

              {/* Expenses table list */}
              <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-sm overflow-hidden">
                {filteredExpenses.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6e6e73] space-y-2">
                    <Coins className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p>{lang === 'ar' ? 'لا توجود مصاريف تطابق فلاتر البحث الحالية.' : 'No expenses match the current filters.'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f5f5f7]">
                    {filteredExpenses.map((exp) => (
                      <div key={exp.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#f5f5f7]/40 transition-colors">
                        <div className="space-y-1 text-xs flex-1 min-w-0">
                          
                          {/* Title and Category Tag */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{exp.title}</span>
                            <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full font-bold">
                              {exp.category || (lang === 'ar' ? 'عام' : 'General')}
                            </span>
                            
                            {/* Funding Source badge */}
                            {exp.sourceType === 'safe' && (
                              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 leading-none">
                                <Wallet className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'مخصوم من: ' : 'From safe: '}{safes.find(s => s.id === exp.sourceId)?.name || exp.sourceType}</span>
                              </span>
                            )}
                            {exp.sourceType === 'bank' && (
                              <span className="text-[9px] bg-blue-50 text-blue-700 font-bold border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1 leading-none">
                                <Landmark className="w-3 h-3" />
                                <span>{lang === 'ar' ? 'مخصوم من حساب: ' : 'From Bank: '}{bankAccounts.find(b => b.id === exp.sourceId)?.bankName || exp.sourceType}</span>
                              </span>
                            )}
                            {exp.sourceType === 'other' && (
                              <span className="text-[9px] bg-gray-150 text-gray-600 font-bold border border-gray-200 px-2 py-0.5 rounded-full flex items-center leading-none">
                                <span>{lang === 'ar' ? 'مصدر خارجي' : 'External Source'}</span>
                              </span>
                            )}

                            {/* Date info */}
                            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(exp.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</span>
                            </span>
                          </div>

                          {/* Comment details */}
                          {exp.comment && (
                            <p className="text-xs text-gray-500 mt-1 pl-1 border-l-2 border-gray-100 rtl:border-l-0 rtl:border-r-2 rtl:pr-1">
                              {exp.comment}
                            </p>
                          )}
                        </div>

                        {/* Amount & Delete actions */}
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-base font-extrabold text-red-600 font-mono">
                            -{exp.amount.toLocaleString()} <span className="text-[10px] font-sans font-medium text-gray-400">{currency}</span>
                          </span>
                          <button
                            onClick={() => {
                              if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف قيد المنصرف هذا؟ سيتم موازنة خزائن التمويل وإرجاع السيولة تلقائياً.' : 'Restore and refund balances?')) {
                                handleDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                            title={lang === 'ar' ? 'حذف القيد' : 'Delete Log'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* ======================================================== */}
      {/* 5. FINACE LEDGER / TRANSACTION LOG */}
      {/* ======================================================== */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'سجل المعاملات والقيود الموحد (دفتر اليومية)' : 'General Ledger & Transactions History'}</h3>
              <p className="text-xs text-gray-500">{lang === 'ar' ? 'الدفتر الأساسي لتقييد جميع الحوّالات والإيداعات والمسحوبات بمطابقة كاملة للأرصدة' : 'Track audit trail, bank wires, and safe drawer balance overrides'}</p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowTransactionModal('deposit')}
                className="px-3.5 py-1.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إيداع وارد' : 'New Deposit'}</span>
              </button>

              <button
                onClick={() => setShowTransactionModal('transfer')}
                className="px-3.5 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحويل بيني' : 'Transfer Balance'}</span>
              </button>
            </div>
          </div>

          {/* Search Table Block */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-xl">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={transactionSearch}
                onChange={(e) => setTransactionSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'البحث بالبيان أو فئات الحركة...' : 'Filter transactions by description...'}
                className="w-full text-xs px-3 py-2 bg-white border border-[#d2d2d7] rounded-lg focus:outline-none"
              />
            </div>

            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none"
            >
              <option value="all">{lang === 'ar' ? 'جميع أنواع القيود' : 'All transaction types'}</option>
              <option value="deposit">{lang === 'ar' ? 'إيداعات فقط' : 'Deposits'}</option>
              <option value="withdraw">{lang === 'ar' ? 'مسحوبات فقط' : 'Withdrawals'}</option>
              <option value="transfer">{lang === 'ar' ? 'تحويلات أرصدة' : 'Transfers'}</option>
            </select>

            {filteredTransactions.length > 0 && (
              <button
                onClick={handleExportTransactionsCSV}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تصدير كملف CSV' : 'Export csv'}</span>
              </button>
            )}
          </div>

          {/* Transactions Log List */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-2">
                <History className="w-8 h-8 text-gray-300 mx-auto" />
                <p>{lang === 'ar' ? 'سجل قيود اليومية شاغر لم يسجل أي حركات مسبقة.' : 'Ledger is clean No transactions recorded.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs text-gray-700">
                
                {/* Header row desktop only */}
                <div className="hidden md:grid grid-cols-12 gap-3 p-4 bg-[#f5f5f7] font-bold text-gray-800">
                  <div className="col-span-2">{lang === 'ar' ? 'التوقيت والتاريخ' : 'Time & Date'}</div>
                  <div className="col-span-2">{lang === 'ar' ? 'النوع والفئة' : 'Type & Class'}</div>
                  <div className="col-span-4">{lang === 'ar' ? 'البيان والتفاصيل' : 'Statement Comment'}</div>
                  <div className="col-span-1.5">{lang === 'ar' ? 'من (المصدر)' : 'From (Source)'}</div>
                  <div className="col-span-1.5">{lang === 'ar' ? 'إلى (الوجهة)' : 'To (Dest)'}</div>
                  <div className="col-span-1 text-right">{lang === 'ar' ? 'مبلغ القيد' : 'Value'}</div>
                </div>

                {filteredTransactions.map((tx) => {
                  let srcLabel = lang === 'ar' ? 'خارجي' : 'External';
                  let destLabel = lang === 'ar' ? 'خارجي' : 'External';

                  if (tx.sourceType === 'safe') {
                    const s = safes.find(x => x.id === tx.sourceId);
                    srcLabel = s ? s.name : 'Safe';
                  } else if (tx.sourceType === 'bank') {
                    const b = bankAccounts.find(x => x.id === tx.sourceId);
                    srcLabel = b ? b.bankName : 'Bank';
                  }

                  if (tx.destinationType === 'safe') {
                    const s = safes.find(x => x.id === tx.destinationId);
                    destLabel = s ? s.name : 'Safe';
                  } else if (tx.destinationType === 'bank') {
                    const b = bankAccounts.find(x => x.id === tx.destinationId);
                    destLabel = b ? b.bankName : 'Bank';
                  }

                  return (
                    <div key={tx.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 items-center hover:bg-[#f5f5f7]/20 transition-all font-medium">
                      
                      {/* Date details */}
                      <div className="col-span-2 text-gray-500 font-mono text-[10px] md:text-xs">
                        {new Date(tx.date).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>

                      {/* Type Badge */}
                      <div className="col-span-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          tx.type === 'withdraw' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                          {tx.type === 'deposit' ? (lang === 'ar' ? '📥 إيداع وارد' : 'Deposit')
                              : tx.type === 'withdraw' ? (lang === 'ar' ? '📤 سحب صادر' : 'Withdrawal')
                              : (lang === 'ar' ? '⇄ تحويل أرصدة' : 'Balance Wire')}
                        </span>
                        {tx.category && (
                          <span className="text-[10px] text-gray-400 block mt-0.5 font-sans">
                            {tx.category}
                          </span>
                        )}
                      </div>

                      {/* Statement and details */}
                      <div className="col-span-4 font-bold text-gray-900 leading-tight">
                        {tx.description}
                      </div>

                      {/* Cash source */}
                      <div className="col-span-1.5 font-bold text-amber-800 text-[11px] md:text-xs">
                        <span className="md:hidden text-gray-400 font-normal">{lang === 'ar' ? 'صادر من: ' : 'From: '}</span>
                        {srcLabel}
                      </div>

                      {/* Safe target */}
                      <div className="col-span-1.5 font-bold text-blue-800 text-[11px] md:text-xs">
                        <span className="md:hidden text-gray-400 font-normal">{lang === 'ar' ? 'بإيداع للوجهة: ' : 'To: '}</span>
                        {destLabel}
                      </div>

                      {/* Value / Amount */}
                      <div className="col-span-1 text-right font-mono text-xs md:text-sm font-black whitespace-nowrap">
                        <span className="md:hidden font-sans text-gray-400 font-normal mr-1">{lang === 'ar' ? 'مبلغ القيد: ' : 'Value: '}</span>
                        {tx.type === 'deposit' && <span className="text-emerald-700">+{tx.amount.toLocaleString()}</span>}
                        {tx.type === 'withdraw' && <span className="text-red-700">-{tx.amount.toLocaleString()}</span>}
                        {tx.type === 'transfer' && <span className="text-blue-700">⇅ {tx.amount.toLocaleString()}</span>}
                        <span className="text-[9px] text-gray-400 font-sans font-normal ml-1">{currency}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. FINANCE SETTINGS */}
      {/* ======================================================== */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-md font-bold text-gray-900">{lang === 'ar' ? 'تهيئة وإعداد الإدارة المالية' : 'Financial Management Settings'}</h3>
            <p className="text-xs text-gray-500">{lang === 'ar' ? 'تخصيص فئات الصرف للمصروفات والخيارات الافتراضية للتمويل والدفع' : 'Define your own tags, default account allocations and operational rules'}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Expense Categories box */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
              <div>
                <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>{lang === 'ar' ? 'فئات وتبويبات بنود الصرف' : 'Expense Categorisation Tags'}</span>
                </h4>
                <p className="text-[10px] text-gray-400 mt-1">{lang === 'ar' ? 'إضافة وتخصيص المجالات المتاحة عند تسجيل الفواتير' : 'These tags help you filter your operating costs in statistics panel'}</p>
              </div>

              {/* Form to insert Category */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: نثريات ضيافة، بضائع جديدة...' : 'E.g., Logistics, Maintenance...'}
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-lg transition shrink-0 shadow-sm"
                >
                  {lang === 'ar' ? 'إضافة فئة' : 'Add Tag'}
                </button>
              </form>

              {/* Grid lists of current Categories */}
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 text-xs">
                {financeSettings.expenseCategories.map(cat => (
                  <div key={cat} className="p-3 flex items-center justify-between text-gray-700 bg-gray-50/20 hover:bg-gray-100/30">
                    <span className="font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span>{cat}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="text-gray-400 hover:text-red-500 transition-all p-1"
                      title={lang === 'ar' ? 'إلغاء وفصل الفئة' : 'Delete Category'}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Finance Rules and Safeguards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'ar' ? 'السياسات والضوابط المالية' : 'Policies & Safeguards'}</span>
              </h4>

              <div className="space-y-4 text-xs text-gray-600">
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>{lang === 'ar' ? '🛡️ ميزة الحماية من العجز المالي بالخزن' : '🛡️ Draft Overdraw Prevention'}</span>
                  </p>
                  <p className="text-[10px] mt-1 leading-relaxed">
                    {lang === 'ar' 
                      ? 'النظام يفحص الأرصدة المتوفرة تلقائياً بنظام الوقت الفعلي ويمنع إدخال أي صرف فواتير أو مصروفات تزيد عن الرقاد النقدي الفعلي لحمايتك من حدوث فجوة حِسابية.' 
                      : 'Checks active balances and prompts error when logging any invoices that exceed overall safe assets.'}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                  <p className="font-bold">
                    {lang === 'ar' ? '🗂️ نظام تتبع العمليات البيني وسهولة المطابقة' : '🗂️ Complete Operations Auditing'}
                  </p>
                  <p className="text-[10px] mt-1 leading-relaxed">
                    {lang === 'ar' 
                      ? 'كل عملية تحويل بين بنك وخزينة أو حركة سداد تُدخل قيوداً لدفتر اليومية لتأمين الرجوع للحقائق في كشوفات الحساب.' 
                      : 'Automatic logs are generated whenever cash movements happen for reliable background accounting audits.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* GLOBAL MODAL COMPONENT (DEPOSIT / WITHDRAW / TRANSFER) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] border border-[#d2d2d7] p-6 max-w-md w-full shadow-lg space-y-4 text-xs text-gray-700"
            >
              <div className="flex items-center justify-between text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <span className="flex items-center gap-2">
                  {showTransactionModal === 'deposit' && <TrendingUp className="w-5 h-5 text-emerald-600" />}
                  {showTransactionModal === 'withdraw' && <TrendingDown className="w-5 h-5 text-red-600" />}
                  {showTransactionModal === 'transfer' && <ArrowLeftRight className="w-5 h-5 text-blue-600" />}
                  <span>
                    {showTransactionModal === 'deposit' ? (lang === 'ar' ? 'تسجيل إيداع نقدي جديد' : 'New Cash Deposit')
                     : showTransactionModal === 'withdraw' ? (lang === 'ar' ? 'تسجيل سحب نقدي صادر' : 'New Cash Outward')
                     : (lang === 'ar' ? 'أمر تحويل مالي بيني' : 'Transfer Balance between funds')}
                  </span>
                </span>
                <button 
                  onClick={() => setShowTransactionModal(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteFinanceTransaction} className="space-y-4">
                
                {/* Amount input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'القيمة والمبلغ بالكامل' : 'Transfer Value'} ({currency})</label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.0"
                    className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0071e3]"
                    required
                    min="1"
                  />
                </div>

                {/* Conditional Form Blocks based on Mode */}
                {showTransactionModal === 'deposit' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'وجهة ومقر الإيداع' : 'Deposit Destination'}</label>
                      <select
                        value={txDestType}
                        onChange={(e) => setTxDestType(e.target.value as any)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                      >
                        <option value="safe">{lang === 'ar' ? 'خزينة نقدية' : 'Cash Safe'}</option>
                        <option value="bank">{lang === 'ar' ? 'حساب مصرفي' : 'Bank account'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اختر مقر الاستلام' : 'Select Destination account'}</label>
                      {txDestType === 'safe' ? (
                        <select
                          value={txDestId}
                          onChange={(e) => setTxDestId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                          required
                        >
                          <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                          {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.balance.toLocaleString()})</option>)}
                        </select>
                      ) : (
                        <select
                          value={txDestId}
                          onChange={(e) => setTxDestId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                          required
                        >
                          <option value="">-- {lang === 'ar' ? 'اختر الحساب البنكي' : 'Select Bank'} --</option>
                          {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} ({b.balance.toLocaleString()})</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {showTransactionModal === 'withdraw' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'مصدر السحب والأموال' : 'Withdrawal source'}</label>
                      <select
                        value={txSourceType}
                        onChange={(e) => setTxSourceType(e.target.value as any)}
                        className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                      >
                        <option value="safe">{lang === 'ar' ? 'خزينة نقدية' : 'Cash Safe'}</option>
                        <option value="bank">{lang === 'ar' ? 'حساب مصرفي' : 'Bank Account'}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اسم الحساب والمصدر' : 'Select active drawer'}</label>
                      {txSourceType === 'safe' ? (
                        <select
                          value={txSourceId}
                          onChange={(e) => setTxSourceId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                          required
                        >
                          <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                          {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.balance.toLocaleString()})</option>)}
                        </select>
                      ) : (
                        <select
                          value={txSourceId}
                          onChange={(e) => setTxSourceId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg"
                          required
                        >
                          <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                          {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} ({b.balance.toLocaleString()})</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                )}

                {showTransactionModal === 'transfer' && (
                  <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-150">
                    
                    {/* Source deduction details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'التحويل من (المصدر):' : 'Transfer from (Source)'}</label>
                        <select
                          value={txSourceType}
                          onChange={(e) => setTxSourceType(e.target.value as any)}
                          className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded-md"
                        >
                          <option value="safe">{lang === 'ar' ? 'خزينة كاش' : 'Cash Safe'}</option>
                          <option value="bank">{lang === 'ar' ? 'حساب بنكي' : 'Bank account'}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اختر مقر الخروج' : 'Choose source fund'}</label>
                        {txSourceType === 'safe' ? (
                          <select
                            value={txSourceId}
                            onChange={(e) => setTxSourceId(e.target.value)}
                            className="w-full text-xs px-1.5 py-1 bg-white border border-gray-200 rounded-md"
                            required
                          >
                            <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                            {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.balance.toLocaleString()})</option>)}
                          </select>
                        ) : (
                          <select
                            value={txSourceId}
                            onChange={(e) => setTxSourceId(e.target.value)}
                            className="w-full text-xs px-1.5 py-1 bg-white border border-gray-200 rounded-md"
                            required
                          >
                            <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} ({b.balance.toLocaleString()})</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Destination allocation details */}
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-200 pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'التحويل إلى (الوجهة):' : 'Transfer to (Target)'}</label>
                        <select
                          value={txDestType}
                          onChange={(e) => setTxDestType(e.target.value as any)}
                          className="w-full text-xs px-2 py-1 bg-white border border-gray-200 rounded-md"
                        >
                          <option value="safe">{lang === 'ar' ? 'خزينة كاش' : 'Cash Safe'}</option>
                          <option value="bank">{lang === 'ar' ? 'حساب بنكي' : 'Bank account'}</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{lang === 'ar' ? 'اختر مقر الاستيداع' : 'Choose target fund'}</label>
                        {txDestType === 'safe' ? (
                          <select
                            value={txDestId}
                            onChange={(e) => setTxDestId(e.target.value)}
                            className="w-full text-xs px-1.5 py-1 bg-white border border-gray-200 rounded-md"
                            required
                          >
                            <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                            {safes.map(s => <option key={s.id} value={s.id}>{s.name} ({s.balance.toLocaleString()})</option>)}
                          </select>
                        ) : (
                          <select
                            value={txDestId}
                            onChange={(e) => setTxDestId(e.target.value)}
                            className="w-full text-xs px-1.5 py-1 bg-white border border-gray-200 rounded-md"
                            required
                          >
                            <option value="">-- {lang === 'ar' ? 'اختر' : 'Select'} --</option>
                            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.bankName} ({b.balance.toLocaleString()})</option>)}
                          </select>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Category classification */}
                {showTransactionModal !== 'transfer' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'تصنيف وفئة الحركة' : 'Adjustment category filter'}</label>
                    <input
                      type="text"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: رأس مال افتتاحي، تسوية نقدية، بيع أصول...' : 'E.g., Liquidity injection, Reconciliation...'}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                )}

                {/* Description input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">{lang === 'ar' ? 'سبب العملية والتوضيح' : 'Statement Explanation description'}</label>
                  <textarea
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder={lang === 'ar' ? 'ما الداعي والحاجة لهذه التسوية النقدية لسهولة المطابقة مسبقاً...' : 'Provide background for this override for auditing references...'}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-xl focus:outline-none h-16 resize-none"
                  />
                </div>

                <div className="flex gap-2 text-xs font-bold pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm font-black"
                  >
                    {lang === 'ar' ? 'إقرار وإصدار قيد المعاملة' : 'Finalize Ledger Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
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
