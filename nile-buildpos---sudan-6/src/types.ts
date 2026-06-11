export interface Product {
  id: string;
  barcode: string;
  name_ar: string;
  name_en: string;
  category: string;
  
  // Carton properties
  numCartons: number;         // عدد الكراتين
  piecesPerCarton: number;    // عدد الحبات في الكرتونة
  cartonPurchasePrice: number; // سعر شراء الكرتون
  cartonSellingPrice: number;  // سعر بيع الكرتون
  
  // Single Piece properties
  purchasePricePiece: number; // سعر شراء الحبة (يمكن حسابه أو إدخاله)
  price: number;              // سعر بيع الحبة

  // Stock Tracking
  initialQuantity: number;    // الكمية الأولية الكلية كقطع (عدد الكراتين × القطع بالكرتونة عند التأسيس)
  quantity: number;           // الكمية المتبقية الحالية بالقطع
  unit: string;               // وحدة القياس (كرتون / قطعة إلخ)
  warehouseStocks?: ProductWarehouseStock[]; // توزيع المخزون على المستودعات
  createdAt: number;
}

export interface InvoiceItem {
  productId: string;
  name_ar: string;
  name_en: string;
  price: number;              // سعر البيع (للحبة أو للكرتون إلخ حسب التعديل)
  qty: number;                // الكمية المشتراة
  subtotal: number;
  unit: string;
  saleUnit?: string;
}

export interface InstallmentPayment {
  id: string;
  index: number;                    // رقم الدفعة (مثال: الدفعة الأولى، الثانية...)
  dueDate: string;                  // تاريخ استحقاق الدفعة
  amount: number;                   // مبلغ الدفعة المطلوب
  amountPaid: number;               // المبلغ المدفوع من هذه الدفعة
  status: 'paid' | 'unpaid' | 'partial'; // حالة الدفعة
  paidDate?: string;                // تاريخ وتوقيت السداد الفعلي
  paymentMethod?: 'cash' | 'transfer' | 'check'; // طريقة الدفع المسدد بها
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  discountType: 'fixed' | 'percent';
  discountValue: number;
  discountAmount: number;
  taxEnabled: boolean;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'check'; // شيك بدلاً عن البطاقة
  amountReceived: number;
  amountChange: number;
  createdAt: number;
  
  // Transaction detail
  transactionNumber?: string;       // رقم العملية
  printTransactionNumber?: boolean;  // هل يطبع رقم العملية؟
  customerName?: string;            // اسم العميل
  notes?: string;                   // ملاحظات الإضافية

  // Installments Details (أقساط)
  isInstallment?: boolean;          // هل مبيعة بالتقسيط؟
  installmentDate?: string;         // تاريخ استحقاق القسط القادم
  amountPaid?: number;              // الكمية المدفوعة حالياً من القسط
  amountRemaining?: number;         // المبلغ المتبقي للقسط
  installmentCount?: number;        // إجمالي عدد الدفعات/الأقساط المخطط لها
  installmentsList?: InstallmentPayment[]; // تفاصيل وجدول الدفعات كاملة
  branchId?: string;                // الفرع المنسوب له الفاتورة
  sessionId?: string;               // معرف جلسة الوردية المرتبطة بالفاتورة
  cashierName?: string;             // اسم الكاشير (الموظف) الذي صدر الفاتورة
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: number;
  comment: string;
  category?: string; // e.g., 'عام', 'إيجار', 'رواتب', 'فاتورة كهرباء كرتنة'
  sourceType?: 'safe' | 'bank' | 'other';
  sourceId?: string; // safeId or bankId
}

export interface CashSafe {
  id: string;
  name: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface FinanceTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  sourceType: 'safe' | 'bank' | 'other';
  sourceId?: string; // safeId or bankId
  destinationType?: 'safe' | 'bank' | 'other';
  destinationId?: string; // safeId or bankId
  amount: number;
  date: number;
  description: string;
  category?: string; // e.g., 'Capital Increase', 'Transfer', 'Sale Income', 'Expense', etc.
}

export interface FinanceSettings {
  expenseCategories: string[];
  defaultSourceType?: 'safe' | 'bank' | 'other';
  defaultSourceId?: string;
}

export interface ChinaTransfer {
  id: string;
  amountUSD: number;
  amountSDG: number;
  exchangeRate: number;
  createdAt: number;
  notes: string;
}

export interface StoreSettings {
  storeName: string;
  currency: string;
  taxRate: number;
  isTaxEnabled: boolean;
  lowStockThreshold: number;
  storeTagline?: string;
  logoUrl?: string;
  logoShape?: 'square' | 'circle' | 'rounded';
  logoWidth?: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  password?: string;
  isLocked?: boolean;
  subscriptionStatus?: 'active' | 'expired' | 'inactive';
  subscriptionPlan?: 'monthly' | 'annual' | 'none';
  subscriptionExpiry?: number;
  isTemporaryPassword?: boolean;
  tenantId?: string;
  phone?: string;
  notes?: string;
}

export interface SaasSettings {
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  whatsAppNumber: string;
  featuresList: string[];
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  category: 'regular' | 'vip' | 'retailer' | 'wholesale'; // فئة العميل
  creditLimit: number; // حد الائتمان بالجنيه السوداني
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  manager?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: number;
}

export interface StockTransfer {
  id: string;
  productId: string;
  productNameAr: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  qtyCartons: number;
  qtyPieces: number;
  notes?: string;
  createdAt: number;
}

export interface PriceList {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  discountType: 'markup' | 'markdown' | 'fixed'; // markup = زيادة على السعر، markdown = خفض، fixed = أسعار مخصصة
  value: number; // النسبة أو القيمة المئوية الافتراضية للتطبيق
  productPrices: { [productId: string]: { cartonPrice?: number; piecePrice?: number } };
  createdAt: number;
}

export interface ProductWarehouseStock {
  warehouseId: string;
  numCartons: number;
  quantity: number; // عدد الحبات الفردية بالمستودع المحدد
}


export interface InventoryAudit {
  id: string;
  productId: string;
  productNameAr: string;
  productNameEn: string;
  numCartonsBefore: number;      // عدد الكراتين قبل
  piecesBefore: number;          // القطع الإضافية قبل
  totalPiecesBefore: number;     // إجمالي القطع بالسيستم قبل
  
  numCartonsAfter: number;       // عدد الكراتين الفعلية بالجرد
  piecesAfter: number;           // القطع الإضافية الفعلية بالجرد
  totalPiecesAfter: number;      // إجمالي القطع الفعلية بالجرد
  
  discrepancyPcs: number;        // الفارق بالقطع (فعلي - دفتري)
  discrepancyValueSDG: number;   // قيمة الفارق المالي بسعر الشراء
  notes: string;                 // ملاحظات الجرد والتسوية
  createdAt: number;             // تاريخ التسوية
}

// --- Purchases & Supplier Management Types ---

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  taxNumber?: string;
  currentBalance: number; // Positive means we owe them, Negative means they owe us / credit
  notes?: string;
  createdAt: number;
}

export interface PurchaseRequestItem {
  productId: string;
  name_ar: string;
  name_en: string;
  qty: number;
  unit: 'piece' | 'carton';
}

export interface PurchaseRequest {
  id: string;
  code: string;
  items: PurchaseRequestItem[];
  requestedBy: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: number;
}

export interface PurchaseRFQ {
  id: string;
  code: string;
  supplierId?: string;
  items: PurchaseRequestItem[];
  status: 'draft' | 'sent' | 'received' | 'accepted' | 'cancelled';
  notes?: string;
  createdAt: number;
}

export interface PurchaseOrderItem {
  productId: string;
  name_ar: string;
  name_en: string;
  qty: number;
  unit: 'piece' | 'carton';
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  total: number;
  status: 'draft' | 'approved' | 'fulfilled' | 'cancelled';
  notes?: string;
  createdAt: number;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  poCode?: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  total: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  isStockUpdated: boolean;
  createdAt: number;
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  invoiceNumber?: string;
  supplierId: string;
  items: PurchaseOrderItem[];
  total: number;
  isStockDecreased: boolean;
  createdAt: number;
  notes?: string;
}

export interface DebitNote {
  id: string;
  noteNumber: string;
  supplierId: string;
  referenceInvoice?: string;
  amount: number;
  notes: string;
  createdAt: number;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'check';
  referenceNumber?: string;
  date: number;
  notes?: string;
}

export interface PurchaseSettings {
  defaultTaxRate: number;
  isTaxEnabled: boolean;
  paymentTerms: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address?: string;
  phone?: string;
  manager?: string;
  status: 'active' | 'inactive';
  isHeadquarters: boolean;
  associatedWarehouseId?: string; // المستودع الملحق بالفرع
  associatedSafeId?: string;      // خزينة الصندوق الملحقة بالفرع
  targetSalesMonth?: number;       // المستهدف المالي الشهري للمبيعات بالجنيه
  notes?: string;
  createdAt: number;
}

export interface InvoiceTemplateConfig {
  id: string; // e.g., 'primary_template'
  layout: 'thermal-80mm' | 'a4-modern' | 'a4-classic' | 'a4-minimalist' | 'a4-professional';
  companyName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string; // الرقم الضريبي للمؤسسة
  commercialRegister?: string; // السجل التجاري
  headerNotes?: string; // ترويسة علوية
  footerNotes?: string; // عبارة ترحيبية أسفل الفاتورة
  primaryColor: string; // كود اللون الرئيسي للثيم مثلاً كحلي، أخضر، رمادي داكن
  showLogo: boolean;
  showQrCode: boolean;
  showBranchInfo: boolean;
  termsAndConditions?: string; // شروط الاسترجاع والاستبدال المطبوعة
  authorizedSignatureName?: string; // اسم الشخص المخول بالتوقيع والإصدار
  sealImageUrl?: string; // ختم المؤسسة
  watermarkText?: string; // نص الخلفية المائي للفاتورة
}

export interface CustomDocument {
  id: string;
  title: string;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'image' | 'preset_invoice' | 'rules';
  notes?: string;
  fileSize?: string;
  url?: string;
  createdAt: number;
}

// --- POS Terminals & Sessions types ---
export interface POSTerminal {
  id: string;
  name: string;
  code: string;
  branchId: string;
  status: 'active' | 'inactive';
  currentSessionId?: string | null;
  createdAt: number;
}

export interface POSSession {
  id: string;
  terminalId: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number | null;
  openingBalance: number;
  expectedClosingBalance?: number;
  actualClosingBalance?: number;
  discrepancy?: number; // actual - expected
  status: 'open' | 'closed';
  notes?: string;
  salesTotal: number;
  cashSalesTotal: number;
  transferSalesTotal: number;
  checkSalesTotal: number;
  invoicesCount: number;
}



