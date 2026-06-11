import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, Edit2, Users, FileText, CheckCircle, TrendingUp, Coins, 
  Settings, Download, Search, ArrowLeftRight, Calendar, DollarSign, 
  AlertCircle, Filter, Percent, Check, RotateCcw, HelpCircle, Eye
} from 'lucide-react';
import { 
  Product, ChinaTransfer, Supplier, PurchaseRequest, PurchaseRFQ,
  PurchaseOrder, PurchaseInvoice, PurchaseReturn, DebitNote, SupplierPayment, PurchaseSettings
} from '../types';
import { getTranslation, LanguageCode } from '../translations';

interface PurchasesTabProps {
  lang: LanguageCode;
  currency: string;
  inventory: Product[];
  onSaveInventory: (updated: Product[]) => void;
  chinaTransfers: ChinaTransfer[];
  onAddTransfer: (transfer: ChinaTransfer) => void;
  onDeleteTransfer: (id: string) => void;
  
  // Suppliers
  suppliers: Supplier[];
  onSaveSuppliers: (data: Supplier[]) => void;

  // Requests
  purchaseRequests: PurchaseRequest[];
  onSavePurchaseRequests: (data: PurchaseRequest[]) => void;

  // RFQs
  rfqs: PurchaseRFQ[];
  onSaveRfqs: (data: PurchaseRFQ[]) => void;

  // Orders
  purchaseOrders: PurchaseOrder[];
  onSavePurchaseOrders: (data: PurchaseOrder[]) => void;

  // Invoices
  purchaseInvoices: PurchaseInvoice[];
  onSavePurchaseInvoices: (data: PurchaseInvoice[]) => void;

  // Returns
  purchaseReturns: PurchaseReturn[];
  onSavePurchaseReturns: (data: PurchaseReturn[]) => void;

  // Debit Notes
  debitNotes: DebitNote[];
  onSaveDebitNotes: (data: DebitNote[]) => void;

  // Payments
  supplierPayments: SupplierPayment[];
  onSaveSupplierPayments: (data: SupplierPayment[]) => void;

  // Settings
  purchaseSettings: PurchaseSettings;
  onSavePurchaseSettings: (data: PurchaseSettings) => void;

  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type SubTab = 
  | 'suppliers' 
  | 'requests' 
  | 'rfqs' 
  | 'orders' 
  | 'invoices' 
  | 'returns' 
  | 'debit_notes' 
  | 'payments' 
  | 'china_transfers' 
  | 'settings';

export default function PurchasesTab({
  lang,
  currency,
  inventory,
  onSaveInventory,
  chinaTransfers,
  onAddTransfer,
  onDeleteTransfer,
  suppliers,
  onSaveSuppliers,
  purchaseRequests,
  onSavePurchaseRequests,
  rfqs,
  onSaveRfqs,
  purchaseOrders,
  onSavePurchaseOrders,
  purchaseInvoices,
  onSavePurchaseInvoices,
  purchaseReturns,
  onSavePurchaseReturns,
  debitNotes,
  onSaveDebitNotes,
  supplierPayments,
  onSaveSupplierPayments,
  purchaseSettings,
  onSavePurchaseSettings,
  addToast
}: PurchasesTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('suppliers');
  const [searchQuery, setSearchQuery] = useState('');

  const t = (key: string, params?: Record<string, any>) => getTranslation(lang, key, params);

  // Export Purchases Subtab data to Excel Book
  const exportPurchasesSubTabToExcel = () => {
    import('xlsx').then((XLSX) => {
      let rows: any[] = [];
      let filename = 'سجل_قسم_المشتريات';

      if (activeSubTab === 'suppliers') {
        rows = suppliers.map(s => ({
          'اسم المورد': s.name,
          'الشركة الممثلة': s.company,
          'رقم الاتصال': s.phone,
          'البريد الإلكتروني': s.email,
          'الرقم الضريبي': s.taxNumber || '—',
          'الرصيد الحالي المستحق (SDG)': s.currentBalance,
          'ملاحظات المورد': s.notes || '—'
        }));
        filename = `سجل_الموردين_${Date.now()}`;
      } else if (activeSubTab === 'requests') {
        rows = purchaseRequests.map(r => ({
          'رقم الطلب': r.code,
          'اسم مقدم الطلب': r.requestedBy,
          'حالة الطلب': r.status === 'approved' ? 'موافق عليه' : r.status === 'rejected' ? 'مرفوض' : r.status === 'pending' ? 'قيد الانتظار' : 'مسودة',
          'التاريخ': new Date(r.createdAt).toLocaleDateString('ar-EG'),
          'الملاحظات': r.notes || '—'
        }));
        filename = `طلبات_الشراء_${Date.now()}`;
      } else if (activeSubTab === 'invoices') {
        rows = purchaseInvoices.map(inv => {
          const supplier = suppliers.find(s => s.id === inv.supplierId);
          return {
            'رقم الفاتورة': inv.invoiceNumber,
            'المورد': supplier ? supplier.name : 'مورد غير معروف',
            'التاريخ': new Date(inv.createdAt).toLocaleDateString('ar-EG'),
            'إجمالي الفاتورة (SDG)': inv.grandTotal,
            'المبلغ المسدد (SDG)': inv.amountPaid,
            'الحالة': inv.paymentStatus === 'paid' ? 'مسددة بالكامل' : inv.paymentStatus === 'partial' ? 'مسددة جزئياً' : 'مستحقة الفائدة الآجلة',
            'ملاحظات': inv.notes || '—'
          };
        });
        filename = `فواتير_المشتريات_${Date.now()}`;
      } else if (activeSubTab === 'china_transfers') {
        rows = chinaTransfers.map(t => ({
          'المبلغ بالدولار ($ USD)': t.amountUSD,
          'سعر الصرف (SDG)': t.exchangeRate,
          'المكافئ بالعملة المحلية (SDG)': t.amountSDG,
          'تاريخ الحوالة': new Date(t.createdAt).toLocaleDateString('ar-EG'),
          'ملاحظات الحوالة': t.notes || '—'
        }));
        filename = `حوالات_الصين_${Date.now()}`;
      } else {
        // Fallback or generic export message
        addToast(lang === 'ar' ? 'التصدير متاح حالياً للموردين، الطلبات، الفواتير، وحوالات الصين!' : 'Export currently supported for Suppliers, Requests, Invoices, and China Transfers!', 'info');
        return;
      }

      if (rows.length === 0) {
        addToast(lang === 'ar' ? 'لا توجد سجلات لتصديرها!' : 'No records found to export!', 'error');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'سجلات المشتريات');
      XLSX.writeFile(wb, `${filename}.xlsx`);
      addToast(lang === 'ar' ? 'تم تصدير البيانات بنجاح كملف إكسل' : 'Data exported successfully in Excel format', 'success');
    }).catch(err => {
      console.error(err);
      addToast('Export failed', 'error');
    });
  };

  // --- Multi-Form States ---
  // Supplier form
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierCompany, setSupplierCompany] = useState('');
  const [supplierTax, setSupplierTax] = useState('');
  const [supplierBalance, setSupplierBalance] = useState<number | ''>('');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);

  // Purchase Request form
  const [reqBy, setReqBy] = useState('');
  const [reqNotes, setReqNotes] = useState('');
  const [reqItems, setReqItems] = useState<Array<{ productId: string; qty: number; unit: 'piece' | 'carton' }>>([]);

  // RFQ form
  const [rfqSupplierId, rfqSetSupplierId] = useState('');
  const [rfqNotes, setRfqNotes] = useState('');
  const [rfqItems, setRfqItems] = useState<Array<{ productId: string; qty: number; unit: 'piece' | 'carton' }>>([]);

  // Order form
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{ productId: string; qty: number; unit: 'piece' | 'carton'; unitPrice: number }>>([]);

  // Invoice form
  const [invNumber, setInvNumber] = useState('');
  const [invSupplierId, setInvSupplierId] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [invPoCode, setInvPoCode] = useState('');
  const [invTaxPercentage, setInvTaxPercentage] = useState<number>(0);
  const [invAmountPaid, setInvAmountPaid] = useState<number>(0);
  const [invAutoUpdateStock, setInvAutoUpdateStock] = useState<boolean>(true);
  const [invItems, setInvItems] = useState<Array<{ productId: string; qty: number; unit: 'piece' | 'carton'; unitPrice: number }>>([]);

  // Return form
  const [retNumber, setRetNumber] = useState('');
  const [retSupplierId, setRetSupplierId] = useState('');
  const [retInvNumber, setRetInvNumber] = useState('');
  const [retNotes, setRetNotes] = useState('');
  const [retAutoReduceStock, setRetAutoReduceStock] = useState<boolean>(true);
  const [retItems, setRetItems] = useState<Array<{ productId: string; qty: number; unit: 'piece' | 'carton'; unitPrice: number }>>([]);

  // Debit Note form
  const [dnNumber, setDnNumber] = useState('');
  const [dnSupplierId, setDnSupplierId] = useState('');
  const [dnInvoiceRef, setDnInvoiceRef] = useState('');
  const [dnAmount, setDnAmount] = useState<number | ''>('');
  const [dnNotes, setDnNotes] = useState('');

  // Supplier Payment form
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'check'>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Settings
  const [setTaxRate, setSetTaxRate] = useState<number>(purchaseSettings?.defaultTaxRate || 0);
  const [setTaxEnabled, setSetTaxEnabled] = useState<boolean>(purchaseSettings?.isTaxEnabled || false);
  const [setTerms, setSetTerms] = useState<string>(purchaseSettings?.paymentTerms || 'Cash On Delivery');

  // China transfer form
  const [chinaUSD, setChinaUSD] = useState<number | ''>('');
  const [chinaRate, setChinaRate] = useState<number | ''>('');
  const [chinaSDG, setChinaSDG] = useState<number | ''>('');
  const [chinaNotes, setChinaNotes] = useState('');

  // --- ADD/EDIT HANDLERS ---
  
  // Suppliers
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    if (editingSupplierId) {
      const updated = suppliers.map(s => 
        s.id === editingSupplierId 
          ? { 
              ...s, 
              name: supplierName.trim(), 
              phone: supplierPhone.trim(),
              email: supplierEmail.trim() || undefined,
              company: supplierCompany.trim() || undefined,
              taxNumber: supplierTax.trim() || undefined,
              notes: supplierNotes.trim() || undefined
            } 
          : s
      );
      onSaveSuppliers(updated);
      addToast(lang === 'ar' ? 'تم تعديل بيانات المورد بنجاح' : 'Supplier updated successfully', 'success');
      setEditingSupplierId(null);
    } else {
      const newSup: Supplier = {
        id: Math.random().toString(36).substring(2, 11),
        name: supplierName.trim(),
        phone: supplierPhone.trim(),
        email: supplierEmail.trim() || undefined,
        company: supplierCompany.trim() || undefined,
        taxNumber: supplierTax.trim() || undefined,
        currentBalance: Number(supplierBalance) || 0,
        notes: supplierNotes.trim() || undefined,
        createdAt: Date.now()
      };
      onSaveSuppliers([...suppliers, newSup]);
      addToast(lang === 'ar' ? 'تم إضافة المورد الجديد بنجاح' : 'Supplier added successfully', 'success');
    }

    // Reset Form
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierCompany('');
    setSupplierTax('');
    setSupplierBalance('');
    setSupplierNotes('');
  };

  const handleEditSupplier = (sup: Supplier) => {
    setEditingSupplierId(sup.id);
    setSupplierName(sup.name);
    setSupplierPhone(sup.phone);
    setSupplierEmail(sup.email || '');
    setSupplierCompany(sup.company || '');
    setSupplierTax(sup.taxNumber || '');
    setSupplierBalance(sup.currentBalance);
    setSupplierNotes(sup.notes || '');
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا المورد؟' : 'Are you sure you want to delete this supplier?')) {
      const filtered = suppliers.filter(s => s.id !== id);
      onSaveSuppliers(filtered);
      addToast(lang === 'ar' ? 'تم حذف المورد بنجاح' : 'Supplier deleted successfully', 'error');
    }
  };

  // Purchase Requests
  const handleAddRequestItem = (productId: string) => {
    if (!productId) return;
    const exists = reqItems.find(i => i.productId === productId);
    if (exists) {
      setReqItems(reqItems.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setReqItems([...reqItems, { productId, qty: 1, unit: 'piece' }]);
    }
  };

  const handleSaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqItems.length === 0) {
      addToast(lang === 'ar' ? 'يرجى إضافة بند واحد على الأقل للطلب!' : 'Please add at least one item!', 'error');
      return;
    }

    const newReq: PurchaseRequest = {
      id: Math.random().toString(36).substring(2, 11),
      code: 'PR-' + Math.floor(1000 + Math.random() * 9000),
      items: reqItems.map(item => {
        const prod = inventory.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name_ar: prod ? prod.name_ar : 'منتج غير معروف',
          name_en: prod ? prod.name_en : 'Unknown Product',
          qty: item.qty,
          unit: item.unit
        };
      }),
      requestedBy: reqBy.trim() || (lang === 'ar' ? 'مدير المشتريات' : 'Purchasing Manager'),
      status: 'pending',
      notes: reqNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onSavePurchaseRequests([...purchaseRequests, newReq]);
    addToast(lang === 'ar' ? 'تم تقديم طلب الشراء الجديد ونقله للمراجعة' : 'Purchase Request submitted successfully', 'success');
    setReqItems([]);
    setReqBy('');
    setReqNotes('');
  };

  // RFQ
  const handleAddRFQItem = (productId: string) => {
    if (!productId) return;
    const exists = rfqItems.find(i => i.productId === productId);
    if (exists) {
      setRfqItems(rfqItems.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setRfqItems([...rfqItems, { productId, qty: 1, unit: 'piece' }]);
    }
  };

  const handleSaveRFQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfqItems.length === 0) {
      addToast(lang === 'ar' ? 'يرجى إضافة مواد لعرض السعر!' : 'Please add items for RFQ!', 'error');
      return;
    }

    const newRFQ: PurchaseRFQ = {
      id: Math.random().toString(36).substring(2, 11),
      code: 'RFQ-' + Math.floor(1000 + Math.random() * 9000),
      supplierId: rfqSupplierId || undefined,
      items: rfqItems.map(item => {
        const prod = inventory.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name_ar: prod ? prod.name_ar : 'منتج',
          name_en: prod ? prod.name_en : 'Product',
          qty: item.qty,
          unit: item.unit
        };
      }),
      status: 'sent',
      notes: rfqNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onSaveRfqs([...rfqs, newRFQ]);
    addToast(lang === 'ar' ? 'تم إنشاء طلب عرض السعر بنجاح وإرساله للمورد' : 'RFQ created and sent successfully', 'success');
    setRfqItems([]);
    rfqSetSupplierId('');
    setRfqNotes('');
  };

  // Purchase Order
  const handleAddPOItem = (productId: string) => {
    if (!productId) return;
    const exists = poItems.find(i => i.productId === productId);
    if (exists) {
      setPoItems(poItems.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      const prod = inventory.find(p => p.id === productId);
      const buyPrice = prod ? prod.purchasePricePiece : 0;
      setPoItems([...poItems, { productId, qty: 1, unit: 'piece', unitPrice: buyPrice }]);
    }
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId) {
      addToast(lang === 'ar' ? 'الرجاء اختيار المورد أولاً' : 'Please select a supplier', 'error');
      return;
    }
    if (poItems.length === 0) {
      addToast(lang === 'ar' ? 'يرجى إضافة مواد لأمر الشراء!' : 'Please add items to purchase order!', 'error');
      return;
    }

    const itemsCalculated = poItems.map(item => {
      const prod = inventory.find(p => p.id === item.productId);
      const uPrice = item.unitPrice || 0;
      return {
        productId: item.productId,
        name_ar: prod ? prod.name_ar : 'منتج',
        name_en: prod ? prod.name_en : 'Product',
        qty: item.qty,
        unit: item.unit,
        unitPrice: uPrice,
        total: item.qty * uPrice
      };
    });

    const sumTotal = itemsCalculated.reduce((sum, item) => sum + item.total, 0);

    const newPO: PurchaseOrder = {
      id: Math.random().toString(36).substring(2, 11),
      code: 'PO-' + Math.floor(1000 + Math.random() * 9000),
      supplierId: poSupplierId,
      items: itemsCalculated,
      total: sumTotal,
      status: 'approved',
      notes: poNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onSavePurchaseOrders([...purchaseOrders, newPO]);
    addToast(lang === 'ar' ? 'تم المصادقة على أمر الشراء بنجاح' : 'Purchase Order approved successfully', 'success');
    setPoItems([]);
    setPoSupplierId('');
    setPoNotes('');
  };

  // Purchase Invoices (Crucial: Auto Update Stock option)
  const handleAddInvItem = (productId: string) => {
    if (!productId) return;
    const exists = invItems.find(i => i.productId === productId);
    if (exists) {
      setInvItems(invItems.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      const prod = inventory.find(p => p.id === productId);
      const buyPrice = prod ? prod.purchasePricePiece : 0;
      setInvItems([...invItems, { productId, qty: 1, unit: 'piece', unitPrice: buyPrice }]);
    }
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNumber.trim() || !invSupplierId) {
      addToast(lang === 'ar' ? 'يرجى تعبئة رقم الفاتورة واختيار المورد' : 'Please fill invoice number and select supplier', 'error');
      return;
    }
    if (invItems.length === 0) {
      addToast(lang === 'ar' ? 'يرجى إضافة مواد للفاتورة' : 'Please add items', 'error');
      return;
    }

    const itemsCalculated = invItems.map(item => {
      const prod = inventory.find(p => p.id === item.productId);
      const uPrice = item.unitPrice || 0;
      return {
        productId: item.productId,
        name_ar: prod ? prod.name_ar : 'منتج',
        name_en: prod ? prod.name_en : 'Product',
        qty: item.qty,
        unit: item.unit,
        unitPrice: uPrice,
        total: item.qty * uPrice
      };
    });

    const subTotal = itemsCalculated.reduce((sum, item) => sum + item.total, 0);
    const calculatedTax = subTotal * (invTaxPercentage / 100);
    const grand = subTotal + calculatedTax;

    const newInvoice: PurchaseInvoice = {
      id: Math.random().toString(36).substring(2, 11),
      invoiceNumber: invNumber.trim(),
      poCode: invPoCode.trim() || undefined,
      supplierId: invSupplierId,
      items: itemsCalculated,
      total: subTotal,
      taxRate: invTaxPercentage,
      taxAmount: calculatedTax,
      grandTotal: grand,
      amountPaid: invAmountPaid,
      paymentStatus: invAmountPaid >= grand ? 'paid' : invAmountPaid > 0 ? 'partial' : 'unpaid',
      isStockUpdated: invAutoUpdateStock,
      createdAt: Date.now(),
      notes: invNotes.trim() || undefined
    };

    // 1. Update Supplier Balance
    const remainingToPay = grand - invAmountPaid;
    if (remainingToPay > 0) {
      const updatedSuppliers = suppliers.map(s => 
        s.id === invSupplierId 
          ? { ...s, currentBalance: s.currentBalance + remainingToPay } 
          : s
      );
      onSaveSuppliers(updatedSuppliers);
    }

    // 2. Auto-Update Stock of Products in Inventory!
    if (invAutoUpdateStock) {
      const updatedInventory = inventory.map(item => {
        const addedItem = itemsCalculated.find(i => i.productId === item.id);
        if (addedItem) {
          // Calculate pieces to add
          const addPcs = addedItem.unit === 'carton' 
            ? addedItem.qty * (item.piecesPerCarton || 1)
            : addedItem.qty;
          
          return {
            ...item,
            quantity: item.quantity + addPcs,
            // also update purchase rate averages if necessary
            purchasePricePiece: addedItem.unit === 'piece' ? addedItem.unitPrice : item.purchasePricePiece,
            cartonPurchasePrice: addedItem.unit === 'carton' ? addedItem.unitPrice : item.cartonPurchasePrice
          };
        }
        return item;
      });
      onSaveInventory(updatedInventory);
    }

    onSavePurchaseInvoices([...purchaseInvoices, newInvoice]);
    addToast(lang === 'ar' ? 'تم تسجيل فاتورة الشراء وتحديث الحسابات والمخزون' : 'Purchase Invoice registered and inventory synced!', 'success');
    
    // reset
    setInvNumber('');
    setInvPoCode('');
    setInvSupplierId('');
    setInvNotes('');
    setInvTaxPercentage(0);
    setInvAmountPaid(0);
    setInvItems([]);
  };

  // Return Purchases
  const handleAddReturnItem = (productId: string) => {
    if (!productId) return;
    const exists = retItems.find(i => i.productId === productId);
    if (exists) {
      setRetItems(retItems.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      const prod = inventory.find(p => p.id === productId);
      const buyPrice = prod ? prod.purchasePricePiece : 0;
      setRetItems([...retItems, { productId, qty: 1, unit: 'piece', unitPrice: buyPrice }]);
    }
  };

  const handleSaveReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retNumber.trim() || !retSupplierId) {
      addToast(lang === 'ar' ? 'يرجى ملء رقم المرتجع واختيار المورد' : 'Please fill all fields', 'error');
      return;
    }
    if (retItems.length === 0) {
      addToast(lang === 'ar' ? 'يرجى إضافة بنود للمرتجع' : 'No items selected', 'error');
      return;
    }

    const itemsCalculated = retItems.map(item => {
      const prod = inventory.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name_ar: prod ? prod.name_ar : 'منتج',
        name_en: prod ? prod.name_en : 'Product',
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.qty * item.unitPrice
      };
    });

    const sumTotal = itemsCalculated.reduce((sum, item) => sum + item.total, 0);

    const newReturn: PurchaseReturn = {
      id: Math.random().toString(36).substring(2, 11),
      returnNumber: retNumber.trim(),
      invoiceNumber: retInvNumber.trim() || undefined,
      supplierId: retSupplierId,
      items: itemsCalculated,
      total: sumTotal,
      isStockDecreased: retAutoReduceStock,
      createdAt: Date.now(),
      notes: retNotes.trim() || undefined
    };

    // Reduce Supplier balance
    const updatedSuppliers = suppliers.map(s => 
      s.id === retSupplierId 
        ? { ...s, currentBalance: Math.max(0, s.currentBalance - sumTotal) } 
        : s
    );
    onSaveSuppliers(updatedSuppliers);

    // Reduce inventory quantity
    if (retAutoReduceStock) {
      const updatedInventory = inventory.map(item => {
        const removedItem = itemsCalculated.find(i => i.productId === item.id);
        if (removedItem) {
          const removedPcs = removedItem.unit === 'carton' 
            ? removedItem.qty * (item.piecesPerCarton || 1)
            : removedItem.qty;
          return {
            ...item,
            quantity: Math.max(0, item.quantity - removedPcs)
          };
        }
        return item;
      });
      onSaveInventory(updatedInventory);
    }

    onSavePurchaseReturns([...purchaseReturns, newReturn]);
    addToast(lang === 'ar' ? 'تم تسجيل مرتجع مشتريات وتحديث الأرصدة والمخزون المالي' : 'Purchase Return stored successfully!', 'success');
    
    setRetNumber('');
    setRetInvNumber('');
    setRetSupplierId('');
    setRetNotes('');
    setRetItems([]);
  };

  // Debit Note
  const handleSaveDebitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnNumber.trim() || !dnSupplierId || !dnAmount) {
      addToast(lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    const newNote: DebitNote = {
      id: Math.random().toString(36).substring(2, 11),
      noteNumber: dnNumber.trim(),
      supplierId: dnSupplierId,
      referenceInvoice: dnInvoiceRef.trim() || undefined,
      amount: Number(dnAmount),
      notes: dnNotes.trim(),
      createdAt: Date.now()
    };

    // Deduct amount from Supplier's Balance
    const updatedSuppliers = suppliers.map(s => 
      s.id === dnSupplierId 
        ? { ...s, currentBalance: s.currentBalance - Number(dnAmount) } 
        : s
    );
    onSaveSuppliers(updatedSuppliers);

    onSaveDebitNotes([...debitNotes, newNote]);
    addToast(lang === 'ar' ? 'تم تسجيل الإشعار المدين وتعديل رصيد المورد بنجاح' : 'Debit Note registered and supplier balance decreased successfully!', 'success');
    
    setDnNumber('');
    setDnInvoiceRef('');
    setDnSupplierId('');
    setDnAmount('');
    setDnNotes('');
  };

  // Supplier Payments
  const handleSaveSupplierPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierId || !payAmount || Number(payAmount) <= 0) {
      addToast(lang === 'ar' ? 'الرجاء اختيار مورد ومبلغ صحيح' : 'Please choose a supplier and amount', 'error');
      return;
    }

    const valueAmount = Number(payAmount);

    const newPayment: SupplierPayment = {
      id: Math.random().toString(36).substring(2, 11),
      supplierId: paySupplierId,
      amount: valueAmount,
      paymentMethod: payMethod,
      referenceNumber: payRef.trim() || undefined,
      date: Date.now(),
      notes: payNotes.trim() || undefined
    };

    // Adjust supplier balance (decrease ledger of money we owe them)
    const updatedSuppliers = suppliers.map(s => 
      s.id === paySupplierId 
        ? { ...s, currentBalance: s.currentBalance - valueAmount } 
        : s
    );
    onSaveSuppliers(updatedSuppliers);

    onSaveSupplierPayments([...supplierPayments, newPayment]);
    addToast(lang === 'ar' ? 'تم تسجيل السند وصرف الدفعة المورد بنجاح' : 'Supplier payment recorded successfully!', 'success');

    setPaySupplierId('');
    setPayAmount('');
    setPayRef('');
    setPayNotes('');
  };

  // Save Settings
  const handleSaveSettingsObj = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePurchaseSettings({
      defaultTaxRate: Number(setTaxRate),
      isTaxEnabled: setTaxEnabled,
      paymentTerms: setTerms
    });
    addToast(lang === 'ar' ? 'تم تحديث تفاصيل إعدادات المشتريات والافتراضيات' : 'Default purchasing settings updated!', 'success');
  };

  // China Transfer Submit (Maintain previous functionality)
  const handleAddChinaTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinaUSD || chinaUSD <= 0 || !chinaRate || chinaRate <= 0) return;

    const calcSDG = chinaUSD * chinaRate;
    onAddTransfer({
      id: Math.random().toString(36).substring(2, 11),
      amountUSD: Number(chinaUSD),
      exchangeRate: Number(chinaRate),
      amountSDG: chinaSDG ? Number(chinaSDG) : calcSDG,
      notes: chinaNotes.trim(),
      createdAt: Date.now()
    });

    addToast(lang === 'ar' ? 'تم تسجيل حوالة الصين بنجاح' : 'Transfer to China registered', 'success');

    setChinaUSD('');
    setChinaRate('');
    setChinaSDG('');
    setChinaNotes('');
  };

  // Auto conversion SDG = USD * Rate in state
  const handleUSDChange = (val: number | '') => {
    setChinaUSD(val);
    if (val && chinaRate) {
      setChinaSDG(Number((val * chinaRate).toFixed(2)));
    } else {
      setChinaSDG('');
    }
  };

  const handleRateChange = (val: number | '') => {
    setChinaRate(val);
    if (chinaUSD && val) {
      setChinaSDG(Number((chinaUSD * val).toFixed(2)));
    } else {
      setChinaSDG('');
    }
  };

  // --- RENDERING VIEWS ---

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery)) ||
      (s.company && s.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [suppliers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header and top state */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#d2d2d7] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1d1d1f] tracking-tight">
            {lang === 'ar' ? '📦 إدارة قسم المشتريات والامداد بالكامل' : '📦 Purchasing & Supply Chain Management'}
          </h2>
          <p className="text-xs text-[#6e6e73]">
            {lang === 'ar' 
              ? 'تتبع طلبات الشراء، عروض الأسعار، إدارة الموردين، مدفوعات المستحقات، فواتير الشراء والمرتجعات' 
              : 'Supply cycle, supplier details, orders, return invoices, ledger sheets'}
          </p>
        </div>
      </div>

      {/* Horizontal Nav Bar - Purchases Subtabs */}
      <div className="flex border-b border-[#d2d2d7] pb-px overflow-x-auto whitespace-nowrap scrollbar-thin">
        {[
          { key: 'suppliers', label: lang === 'ar' ? '👥 الموردين والشركات' : 'Suppliers', count: suppliers.length },
          { key: 'requests', label: lang === 'ar' ? '📝 طلبات الشراء' : 'Requests', count: purchaseRequests.length },
          { key: 'rfqs', label: lang === 'ar' ? '🏷️ طلبات العروض (RFQ)' : 'RFQs', count: rfqs.length },
          { key: 'orders', label: lang === 'ar' ? '🛒 أوامر الشراء (PO)' : 'Purchase Orders', count: purchaseOrders.length },
          { key: 'invoices', label: lang === 'ar' ? '🧾 فواتير المشتريات' : 'Invoices', count: purchaseInvoices.length },
          { key: 'returns', label: lang === 'ar' ? '🔄 المرتجعات' : 'Returns', count: purchaseReturns.length },
          { key: 'debit_notes', label: lang === 'ar' ? '📉 إشعارات مدينة' : 'Debit Notes', count: debitNotes.length },
          { key: 'payments', label: lang === 'ar' ? '💸 السندات والمدفوعات' : 'Payments', count: supplierPayments.length },
          { key: 'china_transfers', label: lang === 'ar' ? '🇨🇳 حوالات الصين السابقة' : 'China Transfers', count: chinaTransfers.length },
          { key: 'settings', label: lang === 'ar' ? '⚙️ إعدادات المشتريات' : 'Settings', count: 0 }
        ].map(sub => (
          <button
            key={sub.key}
            onClick={() => {
              setActiveSubTab(sub.key as SubTab);
              setSearchQuery('');
            }}
            className={`px-4 py-2.5 text-xs font-extrabold transition-all border-b-2 relative shrink-0 flex items-center gap-1.5 ${
              activeSubTab === sub.key 
                ? 'text-purple-700 border-purple-700 bg-purple-50/50 rounded-t-lg' 
                : 'text-[#6e6e73] border-transparent hover:text-[#1d1d1f]'
            }`}
          >
            <span>{sub.label}</span>
            {sub.count > 0 && (
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                {sub.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global query search bar and Export button for subtabs that need search */}
      {['suppliers', 'requests', 'rfqs', 'orders', 'invoices', 'returns', 'debit_notes', 'payments', 'china_transfers'].includes(activeSubTab) && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'ابحث في السجلات...' : 'Search records...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pr-10 pl-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl focus:border-purple-600 focus:outline-none"
            />
          </div>
          {['suppliers', 'requests', 'invoices', 'china_transfers'].includes(activeSubTab) && (
            <button
              onClick={exportPurchasesSubTabToExcel}
              className="px-4 py-2.5 bg-[#34a853] hover:bg-[#34a853]/90 text-white font-extrabold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تصدير القسم الحالي كإكسل' : 'Export Tab to Excel'}</span>
            </button>
          )}
        </div>
      )}

      {/* --- CONTENT RENDER LOGIC --- */}

      {/* 1. SUPPLIERS DIRECTORY */}
      {activeSubTab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Add / Edit Form */}
          <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-900 border-b pb-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{editingSupplierId ? (lang === 'ar' ? 'تعديل بيانات المورد' : 'Edit Supplier') : (lang === 'ar' ? 'تسجيل مورد جديد' : 'New Supplier')}</span>
            </h3>
            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-right">
              <div>
                <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">اسم المورد أو الشركة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الخليج للحديد ومواد البناء"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="0912xxxxx"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="supplier@mail.com"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">اسم المرجعية/الشركة</label>
                  <input
                    type="text"
                    placeholder="مجموعة النيل"
                    value={supplierCompany}
                    onChange={(e) => setSupplierCompany(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">الرقم الضريبي للمورد</label>
                  <input
                    type="text"
                    placeholder="TAX-xxxx"
                    value={supplierTax}
                    onChange={(e) => setSupplierTax(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
              {!editingSupplierId && (
                <div>
                  <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">الرصيد الافتتاحي له (علينا له بالجنيه سوداني)</label>
                  <input
                    type="number"
                    placeholder="0 SDG (موجب = علينا له، سالب = لنا عنده)"
                    value={supplierBalance}
                    onChange={(e) => setSupplierBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-[#1d1d1f] block mb-1">ملاحظات العنوان وتفاصيل التوريد</label>
                <textarea
                  placeholder="مورد الحديد صنف ممتاز، التوصيل من مستودعات بحري..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:border-purple-600 focus:outline-none h-16 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-lg transition"
                >
                  {editingSupplierId ? (lang === 'ar' ? 'تحديث المورد' : 'Update') : (lang === 'ar' ? 'حفظ المورد الجديد' : 'Register Supplier')}
                </button>
                {editingSupplierId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplierId(null);
                      setSupplierName('');
                      setSupplierPhone('');
                      setSupplierEmail('');
                      setSupplierCompany('');
                      setSupplierTax('');
                      setSupplierBalance('');
                      setSupplierNotes('');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 rounded-lg"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Suppliers List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-[24px] border border-[#d2d2d7] overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#f5f5f7]/60 text-gray-500 font-bold border-b border-[#d2d2d7]">
                    <th className="p-3">{lang === 'ar' ? 'اسم المورد' : 'Name'}</th>
                    <th className="p-3">{lang === 'ar' ? 'الشركة والاتصال' : 'Company & Phone'}</th>
                    <th className="p-3 text-left">{lang === 'ar' ? 'مستحقاته المالية علينا' : 'We Owe (Balance)'}</th>
                    <th className="p-3 text-center">{lang === 'ar' ? 'خيارات' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f5f7]">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-400">
                        {lang === 'ar' ? 'لا يوجد موردين يطابقون البحث.' : 'No suppliers found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-[#f5f5f7]/30 transition-colors">
                        <td className="p-3">
                          <div className="font-extrabold text-purple-900">{sup.name}</div>
                          {sup.taxNumber && <span className="text-[9px] text-gray-400 font-mono block">الرقم الضريبي: {sup.taxNumber}</span>}
                        </td>
                        <td className="p-3">
                          <div className="text-gray-700 font-semibold">{sup.company || 'مورد مستقل'}</div>
                          <div className="text-gray-400 font-mono text-[10px]">{sup.phone || 'بلا هاتف'}</div>
                        </td>
                        <td className="p-3 text-left">
                          <div className={`font-black font-mono text-sm ${sup.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {sup.currentBalance.toLocaleString()} {currency || 'SDG'}
                          </div>
                          <span className="text-[10px] text-gray-500">{sup.currentBalance > 0 ? (lang === 'ar' ? 'مستحق له' : 'Due payment') : (lang === 'ar' ? 'دائن / مدفوع مقدماً' : 'Advance')}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleEditSupplier(sup)}
                              className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition"
                              title={lang === 'ar' ? 'تعديل' : 'Edit'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSupplier(sup.id)}
                              className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition"
                              title={lang === 'ar' ? 'حذف' : 'Delete'}
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
        </div>
      )}

      {/* 2. PURCHASE REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'صياغة طلب شراء داخلي' : 'Raise Purchase Request'}</span>
            </h3>
            <form onSubmit={handleSaveRequest} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold block mb-1">مقدم الطلب (القسم / الموظف) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مسؤول مبيعات المزرعة"
                  value={reqBy}
                  onChange={(e) => setReqBy(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Items in Request */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">إضافة منتجات من دليل المخزون الحالي للطلب:</label>
                <select
                  value=""
                  onChange={(e) => handleAddRequestItem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-md outline-none bg-purple-50 hover:bg-purple-100/60 font-black"
                >
                  <option value="">➕ اختر منتجاً لإدراجه بطلب الشراء...</option>
                  {inventory.map(prod => (
                    <option key={prod.id} value={prod.id}>
                      {prod.name_ar} (متوفر بالمخزن: {prod.quantity} قطعة)
                    </option>
                  ))}
                </select>

                {reqItems.length > 0 && (
                  <div className="mt-2 text-xs border border-[#d2d2d7] rounded-xl overflow-hidden divide-y divide-[#f5f5f7]">
                    <div className="p-2 bg-[#f5f5f7] flex justify-between font-bold text-gray-500">
                      <span>المنتج</span>
                      <span className="w-24 text-center">الكمية</span>
                      <span className="w-24">الوحدة</span>
                    </div>
                    {reqItems.map((ritem, idx) => {
                      const p = inventory.find(prod => prod.id === ritem.productId);
                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-2 bg-white">
                          <span className="truncate font-bold text-purple-900">{p ? p.name_ar : 'منتج'}</span>
                          <input
                            type="number"
                            min="1"
                            value={ritem.qty}
                            onChange={(e) => {
                              const updated = [...reqItems];
                              updated[idx].qty = Number(e.target.value) || 1;
                              setReqItems(updated);
                            }}
                            className="w-20 px-2 py-1 border rounded text-center text-xs font-mono"
                          />
                          <select
                            value={ritem.unit}
                            onChange={(e) => {
                              const updated = [...reqItems];
                              updated[idx].unit = e.target.value as 'piece' | 'carton';
                              setReqItems(updated);
                            }}
                            className="bg-gray-50 border border-gray-200 text-xs p-1 rounded"
                          >
                            <option value="piece">قطعة</option>
                            <option value="carton">كرتونة</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">المبررات / الغرض من التوريد والملاحظات</label>
                <textarea
                  placeholder="لسد عجز النقص في المخزن الفرعي، تلبية لطلب مبيعات شهر يوليو..."
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-16 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
              >
                📝 إرسال طلب الشراء للمراجعة والتصديق
              </button>
            </form>
          </div>

          {/* Requests History List */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-sm">
              <span className="text-xs font-black text-[#1d1d1f] block mb-2">{lang === 'ar' ? 'سجل طلبات الشراء الداخلية المرفوعة' : 'Internal Purchase Requests'}</span>
              <div className="space-y-4">
                {purchaseRequests.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                    {lang === 'ar' ? 'لا يوجد طلبات شراء داخلية حالياً.' : 'No purchase requests raised yet.'}
                  </div>
                ) : (
                  purchaseRequests.map((req) => (
                    <div key={req.id} className="border border-[#d2d2d7] hover:border-purple-300 rounded-2xl p-4 space-y-3 transition bg-[#fcfcfd]/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-purple-700 font-extrabold block text-sm">{req.code}</span>
                          <span className="text-[10px] text-gray-500 font-bold block mt-1">بواسطة: {req.requestedBy}</span>
                        </div>
                        <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-black">
                          ⏳ قيد المراجعة والتدقيق
                        </span>
                      </div>
                      <div className="border-t pt-2 space-y-1">
                        <span className="text-[9px] text-gray-400 block uppercase font-bold">الأصناف المطلوبة:</span>
                        {req.items.map((it, i) => (
                          <div key={i} className="text-xs flex justify-between font-semibold text-gray-700">
                            <span>- {it.name_ar}</span>
                            <span className="font-mono">{it.qty} {it.unit === 'carton' ? 'كرتون' : 'قطعة'}</span>
                          </div>
                        ))}
                      </div>
                      {req.notes && <p className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded-lg italic">ملاحظات: {req.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RFQS */}
      {activeSubTab === 'rfqs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'طلب عرض أسعار من مورد (RFQ)' : 'Create Request For Quotation'}</span>
            </h3>
            <form onSubmit={handleSaveRFQ} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold block mb-1">المورد المستهدف بالطلب (اختياري)</label>
                <select
                  value={rfqSupplierId}
                  onChange={(e) => rfqSetSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">💬 تعميم عام (بلا مورد محدد)</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">إضافة مواد للطلب للتسعير:</label>
                <select
                  value=""
                  onChange={(e) => handleAddRFQItem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-md outline-none bg-purple-50 font-black"
                >
                  <option value="">➕ اختر منتجاً لإدراجه...</option>
                  {inventory.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name_ar}</option>
                  ))}
                </select>

                {rfqItems.length > 0 && (
                  <div className="text-xs border rounded-xl overflow-hidden divide-y divide-[#f5f5f7]">
                    <div className="p-2 bg-[#f5f5f7] flex justify-between font-bold text-gray-500">
                      <span>المنتج</span>
                      <span>الكمية المطلوبة لتسعيرها</span>
                      <span>الوحدة</span>
                    </div>
                    {rfqItems.map((ritem, idx) => {
                      const p = inventory.find(prod => prod.id === ritem.productId);
                      return (
                        <div key={idx} className="p-2 flex items-center justify-between gap-1.5 bg-white">
                          <span className="truncate font-bold text-purple-900">{p ? p.name_ar : 'منتج'}</span>
                          <input
                            type="number"
                            min="1"
                            value={ritem.qty}
                            onChange={(e) => {
                              const updated = [...rfqItems];
                              updated[idx].qty = Number(e.target.value) || 1;
                              setRfqItems(updated);
                            }}
                            className="w-20 px-2 py-1 border rounded text-center text-xs font-mono"
                          />
                          <select
                            value={ritem.unit}
                            onChange={(e) => {
                              const updated = [...rfqItems];
                              updated[idx].unit = e.target.value as 'piece' | 'carton';
                              setRfqItems(updated);
                            }}
                            className="bg-gray-50 border text-xs p-1 rounded"
                          >
                            <option value="piece">قطعة</option>
                            <option value="carton">كرتونة</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setRfqItems(rfqItems.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">ملاحظات خاصة وشروط التوريد المطلوبة</label>
                <textarea
                  placeholder="نرجو تزويدنا بالأسعار شاملة التوصيل وتوضيح نسبة الضريبة..."
                  value={rfqNotes}
                  onChange={(e) => setRfqNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-16 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
              >
                🏷️ إنشاء طلب عروض الأسعار وإرساله
              </button>
            </form>
          </div>

          {/* RFQs List */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'طلبات الأسعار وعروض الموردين المعلقة' : 'RFQs & Supplier Price Offers'}</span>
            <div className="space-y-4">
              {rfqs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا يوجد طلبات أسعار جارية.' : 'No RFQ items generated yet.'}
                </div>
              ) : (
                rfqs.map(rfq => {
                  const sup = suppliers.find(s => s.id === rfq.supplierId);
                  return (
                    <div key={rfq.id} className="border border-[#d2d2d7] rounded-2xl p-4 bg-[#fcfcfd]/20 hover:border-purple-300 transition">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-purple-700 font-extrabold text-sm">{rfq.code}</span>
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full font-black">
                          📨 تم الإرسال بانتظار عروض الأسعار
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold block mb-2">
                        المورد: <span className="text-purple-900">{sup ? sup.name : 'عرض سعر مفتوح للجميع'}</span>
                      </span>
                      <div className="border-t pt-2 space-y-1 text-xs">
                        {rfq.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-semibold text-gray-600">
                            <span>- {it.name_ar}</span>
                            <span className="font-mono">{it.qty} {it.unit === 'carton' ? 'كرتون' : 'قطعة'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. PURCHASE ORDERS */}
      {activeSubTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'اعتماد أمر شراء رسمي (PO)' : 'Create Purchase Order'}</span>
            </h3>
            <form onSubmit={handleSavePO} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold block mb-1">المورد المعتمد للطلب *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">⚠️ اختر المورد المعتمد لهذه الشروة...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Items inside PO */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">إضافة عناصر ومواد الشحنة مع تحديد سعر الشراء التقريبي:</label>
                <select
                  value=""
                  onChange={(e) => handleAddPOItem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-md bg-purple-50 font-black outline-none"
                >
                  <option value="">➕ اختر الصنف لتضمينه في شحنة التوريد...</option>
                  {inventory.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name_ar}</option>
                  ))}
                </select>

                {poItems.length > 0 && (
                  <div className="text-xs border rounded-xl overflow-hidden divide-y divide-[#f5f5f7]">
                    <div className="p-2 bg-[#f5f5f7] flex justify-between font-bold text-gray-500">
                      <span>المنتج</span>
                      <span>الكمية</span>
                      <span>سعر شراء الوحدة</span>
                    </div>
                    {poItems.map((ritem, idx) => {
                      const p = inventory.find(prod => prod.id === ritem.productId);
                      return (
                        <div key={idx} className="p-2.5 space-y-2 bg-white">
                          <div className="flex justify-between items-center">
                            <span className="truncate font-bold text-purple-900">{p ? p.name_ar : 'منتج'}</span>
                            <button
                              type="button"
                              onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1 items-center">
                            <input
                              type="number"
                              min="1"
                              value={ritem.qty}
                              onChange={(e) => {
                                const updated = [...poItems];
                                updated[idx].qty = Number(e.target.value) || 1;
                                setPoItems(updated);
                              }}
                              className="px-2 py-1 border rounded text-center text-xs font-mono"
                              placeholder="الكمية"
                            />
                            <select
                              value={ritem.unit}
                              onChange={(e) => {
                                const updated = [...poItems];
                                updated[idx].unit = e.target.value as 'piece' | 'carton';
                                setPoItems(updated);
                              }}
                              className="bg-gray-50 border text-xs p-1 rounded"
                            >
                              <option value="piece">قطع</option>
                              <option value="carton">كراتين</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              value={ritem.unitPrice}
                              onChange={(e) => {
                                const updated = [...poItems];
                                updated[idx].unitPrice = Number(e.target.value) || 0;
                                setPoItems(updated);
                              }}
                              className="px-2 py-1 border rounded text-center text-xs font-mono"
                              placeholder="السعر"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">تفاصيل الشحن / خطوط التوريد والمواعيد</label>
                <textarea
                  placeholder="الشحن بحري من ميناء بورتسودان، الوصول المتوقع خلال أسبوعين من تاريخ المصادقة..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-16 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
              >
                🛒 اعتماد وإصدار أمر الشراء (Approved PO)
              </button>
            </form>
          </div>

          {/* PO List */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'سجل أوامر الشراء الموقعة' : 'Approved Purchase Orders'}</span>
            <div className="space-y-4">
              {purchaseOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا يوجد أوامر شراء حالياً.' : 'No Purchase Orders created.'}
                </div>
              ) : (
                purchaseOrders.map(po => {
                  const sup = suppliers.find(s => s.id === po.supplierId);
                  return (
                    <div key={po.id} className="border border-[#d2d2d7] rounded-2xl p-4 bg-[#fcfcfd]/20 hover:border-purple-300 transition space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-purple-700 font-extrabold text-sm">{po.code}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black">
                          ✅ معتمد من إدارة الإمداد
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold block">
                        مورد الشحنة: <span className="text-purple-900 font-black">{sup ? sup.name : 'مورد مجهول'}</span>
                      </span>
                      <div className="border-t pt-2 space-y-1 text-xs">
                        {po.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-semibold text-gray-600">
                            <span>- {it.name_ar} ({it.qty} {it.unit === 'carton' ? 'كرتون' : 'قطعة'})</span>
                            <span className="font-mono text-purple-900">{(it.qty * it.unitPrice).toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center text-xs font-bold text-[#1d1d1f]">
                        <span>القيمة التقديرية للشحنة:</span>
                        <span className="font-mono text-purple-800 text-sm font-black">{po.total.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. PURCHASE INVOICES */}
      {activeSubTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'فاتورة مشتريات وتوريد بضاعة للمخزن' : 'Record Purchase Invoice'}</span>
            </h3>
            <form onSubmit={handleSaveInvoice} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold block mb-1">رقم الفاتورة الأصلي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: INV-9908"
                    value={invNumber}
                    onChange={(e) => setInvNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">رمز أمر الشراء (إن وجد)</label>
                  <input
                    type="text"
                    placeholder="PO-xxxx"
                    value={invPoCode}
                    onChange={(e) => setInvPoCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">المورد الفاتورة ومصدر البضاعة *</label>
                <select
                  required
                  value={invSupplierId}
                  onChange={(e) => setInvSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">⚠️ اختر مورد الفاتورة لتسجيل الالتزام المالي...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">إدراج البضائع والكميات مع سعر الشراء التفصيلي:</label>
                <select
                  value=""
                  onChange={(e) => handleAddInvItem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-md bg-purple-50 font-black outline-none"
                >
                  <option value="">➕ اختر المنتج الذي تم استلامه وتوريده...</option>
                  {inventory.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name_ar}</option>
                  ))}
                </select>

                {invItems.length > 0 && (
                  <div className="text-xs border rounded-xl overflow-hidden divide-y divide-[#f5f5f7]">
                    {invItems.map((ritem, idx) => {
                      const p = inventory.find(prod => prod.id === ritem.productId);
                      return (
                        <div key={idx} className="p-2.5 bg-white space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="truncate text-purple-900">{p ? p.name_ar : 'منتج'}</span>
                            <button
                              type="button"
                              onClick={() => setInvItems(invItems.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="الكمية"
                              value={ritem.qty}
                              onChange={(e) => {
                                const updated = [...invItems];
                                updated[idx].qty = Number(e.target.value) || 1;
                                setInvItems(updated);
                              }}
                              className="px-1.5 py-1 border rounded text-center text-xs font-mono"
                            />
                            <select
                              value={ritem.unit}
                              onChange={(e) => {
                                const updated = [...invItems];
                                updated[idx].unit = e.target.value as 'piece' | 'carton';
                                setInvItems(updated);
                              }}
                              className="bg-gray-50 border text-xs p-1 rounded"
                            >
                              <option value="piece">قطعة</option>
                              <option value="carton">كرتونة</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              placeholder="سعر شراء الوحدة"
                              value={ritem.unitPrice}
                              onChange={(e) => {
                                const updated = [...invItems];
                                updated[idx].unitPrice = Number(e.target.value) || 0;
                                setInvItems(updated);
                              }}
                              className="px-1.5 py-1 border rounded text-center text-xs font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tax, Payment and Stock Update Auto Toggles */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold block mb-1">الضريبة المضافة للنسبة (%)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 15"
                    value={invTaxPercentage}
                    onChange={(e) => setInvTaxPercentage(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">المبلغ المدفوع كدفعة عاجلة</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="اتركه صفر للدفع الآجل"
                    value={invAmountPaid}
                    onChange={(e) => setInvAmountPaid(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="bg-purple-50/70 p-3 rounded-xl border border-dashed border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-950 flex items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تحديث مستويات المخزون تلقائياً للمنتج فور الحفظ</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={invAutoUpdateStock}
                    onChange={(e) => setInvAutoUpdateStock(e.target.checked)}
                    className="w-4 h-4 accent-purple-700 cursor-pointer"
                  />
                </div>
                <p className="text-[9px] text-gray-500">ملاحظة: سيتم إضافة البضائع مباشرة إلى مخزون دليل بضائع POS وتحديث متوسطات الأسعار فور التوريد.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">ملاحظات الفاتورة والتخزين</label>
                <textarea
                  placeholder="ملاحظات تخزين البضاعة في المستودع الرئيسي..."
                  value={invNotes}
                  onChange={(e) => setInvNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-14 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
              >
                🧾 حفظ فاتورة الشراء وتحديث الأرصدة والمخزون
              </button>
            </form>
          </div>

          {/* Invoices List */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'سجل وكشوفات فواتير المشتريات المعتمدة' : 'Supplier Purchase Invoices'}</span>
            <div className="space-y-4">
              {purchaseInvoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا يوجد فواتير مشتريات مسجلة حالياً.' : 'No invoices received yet.'}
                </div>
              ) : (
                purchaseInvoices.map(inv => {
                  const sup = suppliers.find(s => s.id === inv.supplierId);
                  return (
                    <div key={inv.id} className="border border-[#d2d2d7] rounded-2xl p-4 bg-[#fcfcfd]/20 hover:border-purple-300 transition space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-purple-700 font-extrabold text-sm">فاتورة رقم: {inv.invoiceNumber}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.paymentStatus === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {inv.paymentStatus === 'paid' ? (lang === 'ar' ? 'مدفوعة بالكامل' : 'Paid') : inv.paymentStatus === 'partial' ? (lang === 'ar' ? 'مدفوعة جزئياً' : 'Partial') : (lang === 'ar' ? 'آجل / غير مدفوع' : 'Unpaid')}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-bold space-y-0.5">
                        <span className="block">المورد: <span className="text-purple-900 font-black">{sup ? sup.name : 'مورد غير معروف'}</span></span>
                        {inv.poCode && <span className="block">تابع لأمر الشراء: {inv.poCode}</span>}
                        <span className="block">تحديث المخزون: <span className={inv.isStockUpdated ? 'text-emerald-600' : 'text-gray-400'}>{inv.isStockUpdated ? (lang === 'ar' ? 'تم مباشرة وحدثت الأرصدة' : 'Yes') : (lang === 'ar' ? 'لم يتم الترحيل' : 'No')}</span></span>
                      </div>
                      <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
                        {inv.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-semibold">
                            <span>- {it.name_ar} (x{it.qty} {it.unit === 'carton' ? 'كرتون' : 'قطعة'})</span>
                            <span className="font-mono">{it.total.toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 text-xs font-bold space-y-1">
                        <div className="flex justify-between text-gray-400 font-normal">
                          <span>الضريبة ({inv.taxRate}%):</span>
                          <span className="font-mono">{inv.taxAmount.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between text-purple-900 text-sm font-black border-dashed border-b pb-1">
                          <span>إجمالي الفاتورة:</span>
                          <span className="font-mono">{inv.grandTotal.toLocaleString()} {currency}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 text-[11px] font-extrabold">
                          <span>المدفوع نقداً:</span>
                          <span className="font-mono">{inv.amountPaid.toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. RETURNS */}
      {activeSubTab === 'returns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-850" />
              <span>{lang === 'ar' ? 'تسجيل مرتجع مشتريات لمورد' : 'Record Purchase Return'}</span>
            </h3>
            <form onSubmit={handleSaveReturn} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold block mb-1">رقم مستند المرتجع *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: RET-101"
                    value={retNumber}
                    onChange={(e) => setRetNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">رقم الفاتورة الأصلية</label>
                  <input
                    type="text"
                    placeholder="INV-xxxx"
                    value={retInvNumber}
                    onChange={(e) => setRetInvNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">المورد المرتجع له *</label>
                <select
                  required
                  value={retSupplierId}
                  onChange={(e) => setRetSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">⚠️ اختر المورد الذي سيعاد المنتجات إليه...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold block">إدراج البضائع المعادة وكمياتها لخصمها:</label>
                <select
                  value=""
                  onChange={(e) => handleAddReturnItem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-md bg-purple-50 font-black outline-none"
                >
                  <option value="">➕ اختر الصنف المعاد التخلص منه...</option>
                  {inventory.map(prod => (
                    <option key={prod.id} value={prod.id}>{prod.name_ar}</option>
                  ))}
                </select>

                {retItems.length > 0 && (
                  <div className="text-xs border rounded-xl overflow-hidden divide-y divide-[#f5f5f7]">
                    {retItems.map((ritem, idx) => {
                      const p = inventory.find(prod => prod.id === ritem.productId);
                      return (
                        <div key={idx} className="p-2 bg-white space-y-1">
                          <div className="flex justify-between items-center font-bold">
                            <span className="truncate text-purple-900">{p ? p.name_ar : 'منتج'}</span>
                            <button
                              type="button"
                              onClick={() => setRetItems(retItems.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="number"
                              min="1"
                              placeholder="الكمية"
                              value={ritem.qty}
                              onChange={(e) => {
                                const updated = [...retItems];
                                updated[idx].qty = Number(e.target.value) || 1;
                                setRetItems(updated);
                              }}
                              className="px-1.5 py-1 border rounded text-center text-xs font-mono"
                            />
                            <select
                              value={ritem.unit}
                              onChange={(e) => {
                                const updated = [...retItems];
                                updated[idx].unit = e.target.value as 'piece' | 'carton';
                                setRetItems(updated);
                              }}
                              className="bg-gray-50 border text-xs p-1 rounded"
                            >
                              <option value="piece">قطعة</option>
                              <option value="carton">كرتونة</option>
                            </select>
                            <input
                              type="number"
                              min="0"
                              placeholder="سعر الوحدة"
                              value={ritem.unitPrice}
                              onChange={(e) => {
                                const updated = [...retItems];
                                updated[idx].unitPrice = Number(e.target.value) || 0;
                                setRetItems(updated);
                              }}
                              className="px-1.5 py-1 border rounded text-center text-xs font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-red-50 p-3 rounded-xl border border-dashed border-red-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-950">تقليص كمية المخزون وسحب المنتجات فوراً</span>
                  <input
                    type="checkbox"
                    checked={retAutoReduceStock}
                    onChange={(e) => setRetAutoReduceStock(e.target.checked)}
                    className="w-4 h-4 accent-red-700 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">سبب المرتجع وتفاصيل الأضرار</label>
                <textarea
                  placeholder="بضاعة تالفة، عدم مطابقة للمواصفات المتفق عليها في الاتفاق المالي..."
                  value={retNotes}
                  onChange={(e) => setRetNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-14 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black transition"
              >
                🔄 تأكيد مرتجع المشتريات وخفض أرصدة المورد
              </button>
            </form>
          </div>

          {/* Table Returns List */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'قوائم مرتجعات المشتريات المستندية' : 'Purchase Return Sheets'}</span>
            <div className="space-y-4">
              {purchaseReturns.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا توجد مرتجعات مسجلة.' : 'No return slips found.'}
                </div>
              ) : (
                purchaseReturns.map(ret => {
                  const sup = suppliers.find(s => s.id === ret.supplierId);
                  return (
                    <div key={ret.id} className="border border-red-200 rounded-2xl p-4 bg-red-50/10 hover:border-red-400 transition space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-mono text-red-700 font-extrabold text-sm">مرتجع: {ret.returnNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-red-100 text-red-700 font-bold">
                          {lang === 'ar' ? 'بضاعة معادة ومخصومة' : 'Returned Slip'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold block">
                        المورد: <span className="text-purple-900 font-black">{sup ? sup.name : 'مورد غير معروف'}</span>
                      </span>
                      <div className="border-t pt-2 space-y-1 text-xs text-gray-600">
                        {ret.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span>- {it.name_ar} (x{it.qty} {it.unit === 'carton' ? 'كرتون' : 'قطعة'})</span>
                            <span className="font-mono text-red-700 font-bold">-{(it.qty * it.unitPrice).toLocaleString()} {currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center text-xs font-bold text-[#1d1d1f]">
                        <span>قيمة الخصم المسترد من المورد:</span>
                        <span className="font-mono text-red-600 text-sm font-black">{ret.total.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. DEBIT NOTES */}
      {activeSubTab === 'debit_notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'أضف إشعار مدين جديد (Debit Note)' : 'Record Debit Note'}</span>
            </h3>
            <form onSubmit={handleSaveDebitNote} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold block mb-1">رقم الإشعار المدين *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: DN-901"
                  value={dnNumber}
                  onChange={(e) => setDnNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">المورد الصادر بحقه الإشعار *</label>
                <select
                  required
                  value={dnSupplierId}
                  onChange={(e) => setDnSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">⚠️ اختر المورد لتقليص ذمته المالية بالخصم...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold block mb-1">الفاتورة المرجعية للمطالبة</label>
                  <input
                    type="text"
                    placeholder="INV-xxxx"
                    value={dnInvoiceRef}
                    onChange={(e) => setDnInvoiceRef(e.target.value)}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">قيمة الخصم المالي الإشعار *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="مثال: 50000"
                    value={dnAmount}
                    onChange={(e) => setDnAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-red-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1">سبب الخصم والتفاصيل القانونية</label>
                <textarea
                  required
                  placeholder="خصم تسوية بسبب عيوب الفرز، عدم دقة مواصفات التوريد..."
                  value={dnNotes}
                  onChange={(e) => setDnNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-20 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-black transition"
              >
                📉 إصدار إشعار مدين قانوني لمورد وتصحيح حسابه
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'الإشعارات المدينة الصادرة لمطابقة الذمم' : 'Debit Note Adjustments'}</span>
            <div className="space-y-3">
              {debitNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا يوجد إشعارات مدينة مسجلة حالياً.' : 'No debit notes written.'}
                </div>
              ) : (
                debitNotes.map(dn => {
                  const s = suppliers.find(sup => sup.id === dn.supplierId);
                  return (
                    <div key={dn.id} className="border border-yellow-250 rounded-xl p-3 bg-yellow-50/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-yellow-800 font-extrabold text-xs">{dn.noteNumber}</span>
                        <span className="text-[10px] text-gray-500 font-mono">📅 {new Date(dn.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">
                        لصالح المورد: <span className="text-purple-900 font-black">{s ? s.name : 'مورد'}</span>
                      </p>
                      <blockquote className="text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1.5 border-r-2 border-yellow-500 max-w-full italic">
                        {dn.notes}
                      </blockquote>
                      <div className="text-right text-xs font-bold text-red-600">
                        مبلغ التعديل: <span className="font-mono">-{dn.amount.toLocaleString()} {currency}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. SUPPLIER PAYMENTS */}
      {activeSubTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right text-xs">
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-black text-purple-950 border-b pb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-800" />
              <span>{lang === 'ar' ? 'سند صرف دفعة مالية لمورد' : 'Record Supplier Payment'}</span>
            </h3>
            <form onSubmit={handleSaveSupplierPayment} className="space-y-4">
              <div>
                <label className="font-bold block mb-1">المورد المستلم للدفعة مالیة *</label>
                <select
                  required
                  value={paySupplierId}
                  onChange={(e) => setPaySupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
                >
                  <option value="">⚠️ اختر مورد لصرف دفعة من مستحقاته المطلوبة...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name} (المستحق له حالياً: {sup.currentBalance.toLocaleString()} {currency})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">المبلغ المالي المصروف *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="مثال: 100000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg font-mono font-bold text-purple-900"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">طريقة الدفع وصرف الدفعة</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cash">💵 دفع نقدي (كاش)</option>
                    <option value="transfer">💳 تحويل بنكي</option>
                    <option value="check">🏦 شيك مصرفي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">رقم عملية التحويل / رقم الشيك</label>
                <input
                  type="text"
                  placeholder="رقم مرجع الحوالة البنكية..."
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">مذكرات وتفاصيل صرف وتوقيع السند</label>
                <textarea
                  placeholder="دفعة مالية من الحساب الجاري، مستلمة بموجب إيصال تصفية..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg h-16 resize-none focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
              >
                💸 صرف وقيد سند دفعة المورد وتصفير الذمة
              </button>
            </form>
          </div>

          {/* Payments list history */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
            <span className="text-xs font-black text-[#1d1d1f] block">{lang === 'ar' ? 'أرشيف المدفوعات والتحويلات المالية الصادرة' : 'Payments & Sent Vouchers History'}</span>
            <div className="space-y-3">
              {supplierPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                  {lang === 'ar' ? 'لا يوجد مدفوعات مسجلة حالياً.' : 'No sent vouchers record.'}
                </div>
              ) : (
                supplierPayments.map(pay => {
                  const s = suppliers.find(sup => sup.id === pay.supplierId);
                  return (
                    <div key={pay.id} className="border border-[#d2d2d7] hover:border-purple-200 rounded-xl p-3 bg-purple-50/5/10 transition flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{s ? s.name : 'مورد غير معروف'}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">
                          طريقة الدفع: {pay.paymentMethod === 'check' ? 'شيك بنكي' : pay.paymentMethod === 'transfer' ? 'تحويل مصرفي' : 'دفعة كاش'}
                          {pay.referenceNumber && ` (مرجع: ${pay.referenceNumber})`}
                        </div>
                        {pay.notes && <p className="text-[10px] text-gray-400 italic mt-1">ملاحظات: {pay.notes}</p>}
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-emerald-600 font-black text-sm block">+{pay.amount.toLocaleString()} {currency}</span>
                        <span className="text-[9px] text-gray-400 block">{new Date(pay.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. CHINA CURRENCY TRANSFERS DECK (MAINTAINING EXISTING) */}
      {activeSubTab === 'china_transfers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#d2d2d7] p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-bold">إجمالي الدولار الجاري</span>
                <span className="text-base font-black font-mono text-emerald-600">
                  ${chinaTransfers.reduce((sum, tr) => sum + tr.amountUSD, 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d2d2d7] p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-700 shrink-0">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-bold">المعادل الكلي بالجنيه</span>
                <span className="text-base font-black font-mono text-purple-700">
                  {chinaTransfers.reduce((sum, tr) => sum + tr.amountSDG, 0).toLocaleString()} SDG
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#d2d2d7] p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block uppercase font-bold">متوسط الصرف التقريبي</span>
                <span className="text-base font-black font-mono text-yellow-600">
                  1$ = {Math.round(
                    chinaTransfers.length > 0 
                      ? (chinaTransfers.reduce((sum, tr) => sum + tr.amountSDG, 0) / chinaTransfers.reduce((sum, tr) => sum + tr.amountUSD, 0)) 
                      : 0
                  ).toLocaleString()} SDG
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-right">
            {/* Input logs */}
            <div className="lg:col-span-4 bg-white rounded-[24px] border border-[#d2d2d7] p-5 space-y-4 shadow-sm">
              <span className="text-xs font-black text-[#1d1d1f] block border-b pb-2">➕ أضف حوالة استيراد الصين السابقة</span>
              <form onSubmit={handleAddChinaTransferSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold block mb-1">المبلغ المالي بالدولار ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={chinaUSD}
                    onChange={(e) => handleUSDChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg font-mono"
                    placeholder="مثال: 5000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">سعر صرف الدولار التقريبي للجنيه ($1 = ... SDG)</label>
                  <input
                    type="number"
                    required
                    value={chinaRate}
                    onChange={(e) => handleRateChange(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg font-mono"
                    placeholder="مثال: 1250"
                  />
                </div>
                <div className="bg-purple-50/50 p-2 border border-dashed rounded-lg space-y-1">
                  <span className="text-[9px] text-[#6e6e73] block">المعادل التلقائي بالعملة المحلية للاستيراد:</span>
                  <span className="text-xs font-black font-mono text-purple-700">
                    {chinaSDG ? `${chinaSDG.toLocaleString()} SDG` : `0 SDG`}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">مذكرات الحوالة وتفاصيل الاستلام والشحن والضمان</label>
                  <textarea
                    value={chinaNotes}
                    onChange={(e) => setChinaNotes(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg h-20 resize-none focus:outline-none"
                    placeholder="اسم البنك الصيني، المستلم، رمز شحن البضائع..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-black transition"
                >
                  حفظ سجل حوالة الصين
                </button>
              </form>
            </div>

            {/* List */}
            <div className="lg:col-span-8 bg-white rounded-[24px] border border-[#d2d2d7] p-5 shadow-sm space-y-4">
              <span className="text-xs font-black text-[#1d1d1f] block border-b pb-2">سجلات تحويلات استيراد الصين</span>
              <div className="divide-y divide-[#f5f5f7]">
                {chinaTransfers.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6e6e73]">
                    لا يوجد جرد لحوالات الصين المسجلة مسبقاً.
                  </div>
                ) : (
                  chinaTransfers.map(tr => (
                    <div key={tr.id} className="py-3 flex items-start justify-between gap-3 text-xs font-semibold">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-emerald-600 font-extrabold text-sm">${tr.amountUSD.toLocaleString()}</span>
                          <span className="text-[9px] text-gray-400 font-mono">1$ = {tr.exchangeRate.toLocaleString()} SDG</span>
                        </div>
                        {tr.notes && <p className="text-gray-500 font-normal text-[11px]">{tr.notes}</p>}
                      </div>
                      <div className="text-left font-mono flex items-center gap-3">
                        <div>
                          <span className="font-black text-[#1d1d1f] block">{tr.amountSDG.toLocaleString()} SDG</span>
                          <span className="text-[9px] text-gray-400 block">{new Date(tr.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          onClick={() => onDeleteTransfer(tr.id)}
                          className="p-1 text-gray-300 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. DEFAULT SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-[24px] border border-[#d2d2d7] p-6 max-w-2xl mx-auto shadow-sm text-right text-xs">
          <h3 className="text-xs font-black text-purple-950 flex items-center gap-1.5 border-b pb-3 mb-4">
            <Settings className="w-4 h-4 text-purple-800" />
            <span>تخصيص افتراضيات إعدادات المشتريات والامداد</span>
          </h3>
          <form onSubmit={handleSaveSettingsObj} className="space-y-4">
            <div className="flex items-center justify-between bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="space-y-0.5">
                <span className="font-extrabold text-[#1d1d1f] block">تفعيل احتساب الضريبة بشكل تلقائي على المشتريات</span>
                <span className="text-[10px] text-gray-500">سيقوم السيستم بتفعيل خيار القيمة المضافة افتراضياً عند إنشاء الفواتير</span>
              </div>
              <input
                type="checkbox"
                checked={setTaxEnabled}
                onChange={(e) => setSetTaxEnabled(e.target.checked)}
                className="w-5 h-5 accent-purple-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">النسبة المئوية لضريبة المشتريات الافتراضية (%)</label>
              <input
                type="number"
                min="0"
                placeholder="15%"
                value={setTaxRate}
                onChange={(e) => setSetTaxRate(Number(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">شروط السداد الافتراضية وقواعد التوريد مع الشركات والموردين</label>
              <input
                type="text"
                placeholder="مثال: Cash On Delivery / Net 30 days"
                value={setTerms}
                onChange={(e) => setSetTerms(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-lg transition"
            >
              💾 حفظ التغييرات واعدادات الاوراد والافتراضيات
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
