export const translations = {
  ar: {
    appName: "نظام المبيعات الذكي",
    tagline: "أدر مبيعاتك ومخازنك بكل سهولة",
    pos: "نقطة البيع (الكاشير)",
    inventory: "إدارة المخزون",
    reports: "التقارير والإحصائيات",
    settings: "إعدادات النظام",
    currentLang: "English",
    
    // Inventory
    searchPlaceholder: "البحث الفوري بالاسم...",
    addProduct: "إضافة صنف جديد",
    editProduct: "تعديل الصنف",
    deleteProduct: "حذف صنف",
    barcode: "رقم الباركود (اختياري)",
    nameAr: "الاسم (بالعربية)",
    nameEn: "الاسم (بالإنجليزية)",
    category: "الفئة",
    price: "السعر",
    quantity: "الكمية المتاحة قطع",
    unit: "وحدة القياس",
    status: "حالة المخزون",
    actions: "الإجراءات",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    statusNormal: "كافٍ",
    statusLow: "منخفض",
    statusEmpty: "نفد",
    allCategories: "كل الفئات",
    itemsCount: "صنف",
    
    // Categories
    catRebar: "حديد تسليح وتصنيع",
    catCement: "أسمنت ومواد جافة",
    catBricks: "طوب وبلوك وحصى",
    catPlumbing: "سباكة وأدوات صحية",
    catElectrical: "كهربائيات وإنارة",
    catPaints: "بوهيات ومواد طلاء",
    catTools: "عدد وأدوات يدوية",
    catOthers: "أخرى",

    // Units
    unitPiece: "قطعة",
    unitCarton: "كرتون",
    unitKg: "كيلو",
    unitLitre: "لتر",
    unitMeter: "متر",

    // Delete confirmation
    deleteConfirmTitle: "هل أنت متأكد من حذف المنتج؟",
    deleteConfirmContent: "سيتم إزالة المنتج '{name}' نهائياً من قاعدة البيانات والعملية غير قابلة للتراجع.",
    deleteConfirmBtn: "نعم، احذف المنتج",
    deleteSuccess: "تم حذف المنتج بنجاح",

    // Excel Import
    importExcel: "استيراد من إكسل",
    exportTemplate: "تحميل قالب النموذج",
    selectFile: "اختر ملف Excel (.xlsx, .csv)",
    dragDrop: "أو اسحب وأفلت الملف هنا",
    excelPreview: "معاينة البيانات قبل الاستيراد",
    confirmImport: "تأكيد واستيراد الكل",
    importSummary: "تم استيراد {success} منتج بنجاح، وتخطي {skipped} صفوف تحتوي أخطاء.",
    invalidExcel: "ملف إكسل غير صالح أو تالف.",
    importHeaderWarning: "يرجى التأكد من أن الأعمدة مطابقة للترتيب المطلوب.",

    // POS / Cashier
    scanOrSearchProduct: "ابحث بالاسم للإضافة الفورية...",
    addToCart: "إضافة للسلة",
    cartEmpty: "سلة المبيعات فارغة حالياً.",
    invoiceSummary: "ملخص الفاتورة",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    taxRate: "الضريبة",
    total: "الإجمالي",
    paymentMethod: "طريقة الدفع",
    payCash: "نقدي",
    payCard: "شيك مصرفي",
    payTransfer: "تحويل بنكي (بنكك)",
    checkout: "إتمام عملية البيع",
    clearCart: "تفريغ السلة",
    discountTypeFixed: "جنيه SDG",
    discountTypePercent: "نسبة مئوية %",
    applyDiscount: "تطبيق الخصم",
    discountValue: "قيمة الخصم",
    
    // Checkout payment Modal
    completePayment: "تأكيد الدفع وإصدار الفاتورة",
    amountReceived: "المبلغ المستلم بعد الحساب",
    amountChange: "المبلغ المرتجع (الباقي)",
    confirmAndPrint: "تأكيد وطباعة الفاتورة",
    paymentSuccess: "تمت العملية بنجاح وتحديث كميات المخزون.",
    amountErr: "عذراً، المبلغ المستلم أقل من قيمة الفاتورة الإجمالية.",

    // POS Print Invoice
    invoiceNumber: "رقم الفاتورة",
    date: "التاريخ",
    storeCopy: "فاتورة مبيعات مبسطة",
    thankYou: "نشكركم لزيارتكم وتعاملكم معنا!",
    printedOn: "طبع في:",
    developedBy: "برمجة متقدمة - تفاصيل ذكية",
    invoiceSign: "توقيع الكاشير:",

    // Reports
    dailySummary: "ملخص مبيعات اليوم",
    totalSales: "إجمالي قيمة المبيعات",
    invoicesCount: "عدد الفواتير المصدرة",
    topProducts: "المنتجات الأكثر مبيعاً",
    lowStockAlerts: "تنبيهات تدني كميات المخزون",
    salesHistory: "سجل حركات الفواتير والمبيعات",
    excelSalesExport: "تصدير تقرير المبيعات إكسل",
    noSalesToday: "لا توجد مبيعات مسجلة في التاريخ المحدد.",
    startDate: "من تاريخ",
    endDate: "إلى تاريخ",
    allPaymentMethods: "كل طرق الدفع",
    filterSales: "تصفية الفواتير",
    topSellingQty: "الكمية المباعة: {qty}",

    // Settings
    settingsTitle: "تخصيص النظام وإدارته",
    storeName: "اسم المتجر / الشركة",
    currency: "عملة التداول الافتراضية",
    taxEnabled: "تفعيل احتساب الضريبة تلقائياً",
    cautionArea: "منطقة خطرة",
    clearAllData: "حذف وتصفير كافة البيانات",
    clearAllDataConfirm: "تحذير: هذا سيؤدي إلى حذف جميع البيانات المخزنة محلياً ولن تتمكن من استعادتها أبداً! لتأكيد الرغبة اكتب 'أوافق' بالأسفل ثم اضغط حذف.",
    typeAgree: "اكتب كلمة 'أوافق' للمتابعة",
    clearAllSuccess: "تم تصفير وإعادة تعيين النظام بالكامل بنجاح.",
    currencySDG: "جنيه سوداني (SDG)",
    alertStockLevel: "حد التنبيه للمخزون المنخفض",
    saveSettings: "حفظ الإعدادات",
    settingsSaved: "تم حفظ الإعدادات بنجاح.",

    // New translation additions
    unitLabel: "وحدة القياس / التعبئة",
    purchasingPrice: "سعر الشراء",
    sellingPrice: "سعر البيع",
    totalInitial: "الكمية الكلية",
    totalSold: "الكمية المباعة",
    totalRemaining: "الكمية المتبقية",
    marginPercent: "الربح %",
    profitText: "الأرباح",
    
    // Carton items
    cartonLabel: "عدد الكراتين",
    piecesPerCartonLabel: "عدد الحبات في الكرتونة",
    cartonPurchasePriceLabel: "سعر شراء الكرتون",
    cartonSellingPriceLabel: "سعر بيع الكرتون",
    piecePurchasePriceLabel: "سعر شراء الحبة والقطعة",
    pieceSellingPriceLabel: "سعر بيع الحبة والقطعة",
    
    // Cashier
    qtyInput: "الكمية",
    installments: "الدفع بالأقساط",
    installmentSwitch: "بيع بالتقسيط",
    installmentDate: "تاريخ استحقاق القسط القادم",
    amountPaid: "المبلغ المدفوع كدفعة أولى",
    amountRemaining: "المبلغ المتبقي للقسط",
    transactionNumber: "رقم العملية",
    printTransactionNumber: "تضمين رقم العملية بالفاتورة",
    editSellingPrice: "تعديل سعر البيع للحبة",
    
    // Expenses
    expensesTab: "إدارة المنصرفات",
    addExpense: "إضافة منصرف جديد",
    expenseTitle: "بند المنصرف",
    expenseAmount: "مبلغ المنصرف",
    expenseComment: "التعليق / الملاحظات",
    comment: "الملاحظات",
    noExpenses: "لا توجد منصرفات مسجلة للمقاييس المعينة.",
    totalExpenses: "إجمالي المنصرفات",
    
    // China transfers
    chinaTab: "إدارة المشتريات والامداد",
    addTransfer: "تسجيل تحويل جديد للصين",
    amountUSD: "المبلغ بالدولار ($)",
    amountSDG: "المبلغ بالجنيه السوداني (SDG)",
    exchangeRate: "سعر دولار التحويل (SDG/$)",
    notes: "ملاحظات وتفاصيل",
    noTransfers: "لا توجد تحويلات مسجلة للصين حالياً.",
    totalChinaTransfers: "إجمالي تحويلات الصين",
    currencyCNY: "اليوان الصيني (¥ CNY)",
  },
  en: {
    appName: "My Smart POS",
    tagline: "Manage your sales and inventory with ease",
    pos: "Cashier (POS)",
    inventory: "Inventory",
    reports: "Reports & Stats",
    settings: "Settings",
    currentLang: "العربية",

    // Inventory
    searchPlaceholder: "Instant search by name...",
    addProduct: "Add New Product",
    editProduct: "Edit Product",
    deleteProduct: "Delete Product",
    barcode: "Barcode Scanner (Optional)",
    nameAr: "Name (Arabic)",
    nameEn: "Name (English)",
    category: "Category",
    price: "Price",
    quantity: "Available Qty (Pieces)",
    unit: "Unit",
    status: "Stock Status",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    statusNormal: "Normal",
    statusLow: "Low Stock",
    statusEmpty: "Out of Stock",
    allCategories: "All Categories",
    itemsCount: "products",

    // Categories
    catRebar: "Rebars & Metal Fabrications",
    catCement: "Cement & Dry Adhesives",
    catBricks: "Bricks, Blocks & Aggregates",
    catPlumbing: "Plumbing & Sanitary",
    catElectrical: "Electrical & Lighting",
    catPaints: "Paints & Wall Finishes",
    catTools: "Hardware & Tools",
    catOthers: "Others",

    // Units
    unitPiece: "Piece",
    unitCarton: "Carton",
    unitKg: "Kg",
    unitLitre: "Litre",
    unitMeter: "Meter",

    // Delete confirmation
    deleteConfirmTitle: "Are you sure you want to delete this product?",
    deleteConfirmContent: "The product '{name}' will be completely removed from your system. This operation cannot be undone.",
    deleteConfirmBtn: "Yes, delete product",
    deleteSuccess: "Product deleted successfully",

    // Excel Import
    importExcel: "Import from Excel",
    exportTemplate: "Download Template",
    selectFile: "Choose Excel file (.xlsx, .csv)",
    dragDrop: "or drag & drop file here",
    excelPreview: "Data Preview before importing",
    confirmImport: "Confirm and Import All",
    importSummary: "Successfully imported {success} products and skipped {skipped} empty rows.",
    invalidExcel: "Invalid or corrupted Excel file.",
    importHeaderWarning: "Please make sure your Excel headers match the specified template column ordering.",

    // POS / Cashier
    scanOrSearchProduct: "Search product name to add instantly...",
    addToCart: "Add to Cart",
    cartEmpty: "No items inside the shopping cart.",
    invoiceSummary: "Invoice Summary",
    subtotal: "Subtotal",
    discount: "Discount",
    taxRate: "Tax",
    total: "Total",
    paymentMethod: "Payment Method",
    payCash: "Cash",
    payCard: "Bank Check",
    payTransfer: "Bank Transfer (Bankak)",
    checkout: "Complete Checkout",
    clearCart: "Empty Cart",
    discountTypeFixed: "SDG (Fixed)",
    discountTypePercent: "% (Percent)",
    applyDiscount: "Apply Discount",
    discountValue: "Discount Value",

    // Checkout payment Modal
    completePayment: "Confirm Payment & Invoice",
    amountReceived: "Amount Received",
    amountChange: "Change Due",
    confirmAndPrint: "Confirm and Print Receipt",
    paymentSuccess: "Transaction completed and stock updated successfully.",
    amountErr: "Error: Received amount is less than the total invoice value.",

    // POS Print Invoice
    invoiceNumber: "Invoice No",
    date: "Date",
    storeCopy: "Simplified Sales Invoice",
    thankYou: "Thank you for shopping with us!",
    printedOn: "Printed at:",
    developedBy: "Developed by Smart Tech Systems",
    invoiceSign: "Cashier signature:",

    // Reports
    dailySummary: "Today's Sales Summary",
    totalSales: "Total Revenue Value",
    invoicesCount: "Invoices Issued",
    topProducts: "Best Selling Products",
    lowStockAlerts: "Low Stock Inventory Alerts",
    salesHistory: "Invoices Ledger",
    excelSalesExport: "Export Transactions Ledger",
    noSalesToday: "No transactions recorded for selected date filter.",
    startDate: "Start Date",
    endDate: "End Date",
    allPaymentMethods: "All Payment Methods",
    filterSales: "Filter Ledger",
    topSellingQty: "Quantity Sold: {qty}",

    // Settings
    settingsTitle: "System Settings & Configuration",
    storeName: "Store Name",
    currency: "Standard Shop Currency",
    taxEnabled: "Activate Automatic Tax calculation",
    cautionArea: "Caution Area",
    clearAllData: "Re-initialize & Erase system database",
    clearAllDataConfirm: "Warning: This action completely wipes all local products and sales history. This is completely irreversible. Type 'I AGREE' in English or 'أوافق' in Arabic inside the field and click the button to verify deletion.",
    typeAgree: "Type 'I AGREE' to confirm",
    clearAllSuccess: "Database completely erased and set to clean default state.",
    currencySDG: "Sudanese Pound (SDG)",
    alertStockLevel: "Low Stock Trigger Notification Level",
    saveSettings: "Save Settings",
    settingsSaved: "Store settings saved successfully.",

    // New translation additions
    unitLabel: "Measurement / Packaging Unit",
    purchasingPrice: "Purchase Price",
    sellingPrice: "Selling Price",
    totalInitial: "Initial Stock",
    totalSold: "Sold Quantity",
    totalRemaining: "Current Stock",
    marginPercent: "Profit %",
    profitText: "Profit",
    
    // Carton items
    cartonLabel: "Number of Cartons",
    piecesPerCartonLabel: "Pieces per Carton",
    cartonPurchasePriceLabel: "Carton Purchase Price",
    cartonSellingPriceLabel: "Carton Selling Price",
    piecePurchasePriceLabel: "Piece Purchase Price",
    pieceSellingPriceLabel: "Piece Selling Price",

    // Cashier
    qtyInput: "Quantity",
    installments: "Installment terms",
    installmentSwitch: "Sale in Installments",
    installmentDate: "Installment Due Date",
    amountPaid: "Amount Paid (Downpayment)",
    amountRemaining: "Remaining Installment Amount",
    transactionNumber: "Transaction Number",
    printTransactionNumber: "Optional: Print trans number",
    editSellingPrice: "Edit Unit Selling Price",

    // Expenses
    expensesTab: "Expenses Tracker",
    addExpense: "Log New Expense",
    expenseTitle: "Expense Category/Title",
    expenseAmount: "Spent Amount",
    expenseComment: "Details / Remarks",
    comment: "Notes",
    noExpenses: "No expenses recorded yet.",
    totalExpenses: "Total Expenses",

    // China transfers
    chinaTab: "Purchases & Supply Chain",
    addTransfer: "Register New Transfer to China",
    amountUSD: "Amount in USD ($)",
    amountSDG: "Amount in SDG (Sudanese)",
    exchangeRate: "Dollar Rate Applied (SDG/$)",
    notes: "Notes & Reference code",
    noTransfers: "No China Transfers logged.",
    totalChinaTransfers: "Total Transferred",
    currencyCNY: "Chinese Yuan (¥ CNY)"
  }
};

export type LanguageCode = 'ar' | 'en';
export const getTranslation = (lang: LanguageCode, key: string, params?: Record<string, any>) => {
  const trans = translations[lang] as Record<string, string>;
  let text = trans[key] || translations['en'][key] || key;
  if (params) {
    Object.keys(params).forEach(p => {
      text = text.replace(`{${p}}`, String(params[p]));
    });
  }
  return text;
};
