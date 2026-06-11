import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, LayoutGrid, Plus, Save, Edit3, Trash2, X, Search,
  ArrowRightLeft, FileSpreadsheet, Download, RefreshCw, BarChart2,
  Lock, Percent, Settings, Database, Store, User, MapPin, Phone,
  ChevronRight, Calendar, Info, Check, ShieldAlert
} from 'lucide-react';
import { Product, Warehouse, StockTransfer, PriceList, StoreSettings } from '../types';

interface InventoryManagerProps {
  lang: 'ar' | 'en';
  inventory: Product[];
  onSaveInventory: (updated: Product[]) => void;
  warehouses: Warehouse[];
  onSaveWarehouses: (updated: Warehouse[]) => void;
  stockTransfers: StockTransfer[];
  onSaveStockTransfers: (updated: StockTransfer[]) => void;
  priceLists: PriceList[];
  onSavePriceLists: (updated: PriceList[]) => void;
  settings: StoreSettings;
  onSaveSettings: (updated: StoreSettings) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function InventoryManager({
  lang,
  inventory,
  onSaveInventory,
  warehouses,
  onSaveWarehouses,
  stockTransfers,
  onSaveStockTransfers,
  priceLists,
  onSavePriceLists,
  settings,
  onSaveSettings,
  addToast
}: InventoryManagerProps) {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'warehouses' | 'transfers' | 'price_lists' | 'distribution' | 'settings'>('warehouses');

  // Search local states
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [transferSearch, setTransferSearch] = useState('');
  const [priceListSearch, setPriceListSearch] = useState('');

  // Warehouse Modal / Form State
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [whName, setWhName] = useState('');
  const [whLocation, setWhLocation] = useState('');
  const [whManager, setWhManager] = useState('');
  const [whPhone, setWhPhone] = useState('');
  const [whStatus, setWhStatus] = useState<'active' | 'inactive'>('active');

  // Stock Transfer Modal / Form State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [tProductId, setTProductId] = useState('');
  const [tFromWhId, setTFromWhId] = useState('');
  const [tToWhId, setTToWhId] = useState('');
  const [tQtyCartons, setTQtyCartons] = useState<number | ''>('');
  const [tQtyPieces, setTQtyPieces] = useState<number | ''>('');
  const [tNotes, setTNotes] = useState('');

  // Price List Modal / Form State
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [plName, setPlName] = useState('');
  const [plDescription, setPlDescription] = useState('');
  const [plType, setPlType] = useState<'markup' | 'markdown' | 'fixed'>('markup');
  const [plValue, setPlValue] = useState<number | ''>('');
  const [plProductPrices, setPlProductPrices] = useState<{ [productId: string]: { cartonPrice?: number; piecePrice?: number } }>({});
  const [plIsActive, setPlIsActive] = useState(true);

  // Global low stock threshold setting input
  const [settingsLowStock, setSettingsLowStock] = useState<number>(settings.lowStockThreshold || 5);

  // Open Warehouse UI Creator
  const handleOpenWarehouseModal = (wh?: Warehouse) => {
    if (wh) {
      setEditingWarehouse(wh);
      setWhName(wh.name);
      setWhLocation(wh.location || '');
      setWhManager(wh.manager || '');
      setWhPhone(wh.phone || '');
      setWhStatus(wh.status);
    } else {
      setEditingWarehouse(null);
      setWhName('');
      setWhLocation('');
      setWhManager('');
      setWhPhone('');
      setWhStatus('active');
    }
    setIsWarehouseModalOpen(true);
  };

  // Save Warehouse details
  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName.trim()) {
      addToast(lang === 'ar' ? 'الرجاء إدخال اسم المستودع!' : 'Warehouse name required!', 'error');
      return;
    }

    let updatedList: Warehouse[];
    if (editingWarehouse) {
      updatedList = warehouses.map(w => w.id === editingWarehouse.id ? {
        ...w,
        name: whName.trim(),
        location: whLocation.trim() || undefined,
        manager: whManager.trim() || undefined,
        phone: whPhone.trim() || undefined,
        status: whStatus
      } : w);
      addToast(lang === 'ar' ? 'تم تحديث بيانات المستودع بنجاح' : 'Warehouse updated successfully', 'success');
    } else {
      const exists = warehouses.find(w => w.name.trim().toLowerCase() === whName.trim().toLowerCase());
      if (exists) {
        addToast(lang === 'ar' ? 'اسم المستودع هذا مكرر بالفعل!' : 'Warehouse name must be unique!', 'error');
        return;
      }
      const newWh: Warehouse = {
        id: 'wh_' + Math.random().toString(36).substring(2, 9),
        name: whName.trim(),
        location: whLocation.trim() || undefined,
        manager: whManager.trim() || undefined,
        phone: whPhone.trim() || undefined,
        status: whStatus,
        createdAt: Date.now()
      };
      updatedList = [...warehouses, newWh];
      addToast(lang === 'ar' ? 'تم تسجيل المستودع الجديد بنجاح' : 'Warehouse registered successfully', 'success');
    }

    onSaveWarehouses(updatedList);
    setIsWarehouseModalOpen(false);
  };

  const handleDeleteWarehouse = (whId: string, whName: string) => {
    // Check if any product has allocated stocks in this warehouse
    const hasStock = inventory.some(p => {
      const allocation = p.warehouseStocks?.find(ws => ws.warehouseId === whId);
      return allocation && (allocation.numCartons > 0 || allocation.quantity > 0);
    });

    if (hasStock) {
      addToast(
        lang === 'ar' 
          ? `لا يمكن حذف مستودع "${whName}" لأنه يحتوي على مخزون نشط لبعض المنتجات!` 
          : `Warehouse "${whName}" contains live stock allocations and cannot be deleted!`, 
        'error'
      );
      return;
    }

    if (!window.confirm(lang === 'ar' ? `هل أنت متأكد من حذف مستودع "${whName}"؟` : `Delete warehouse "${whName}"?`)) return;

    const updated = warehouses.filter(w => w.id !== whId);
    onSaveWarehouses(updated);
    addToast(lang === 'ar' ? 'تم حذف المستودع بنجاح' : 'Warehouse deleted successfully', 'success');
  };

  // Manage Stock Transfers
  const handleOpenTransferModal = () => {
    if (inventory.length === 0) {
      addToast(lang === 'ar' ? 'الرجاء إضافة منتجات أولاً قبل التمكين من عملية النقل!' : 'Please add products first!', 'error');
      return;
    }
    if (warehouses.length < 2) {
      addToast(lang === 'ar' ? 'يجب تسجيل مستودعين على الأقل بالسيستم لتمكين النقل البيني!' : 'Add at least 2 warehouses to enable transfers!', 'error');
      return;
    }
    setTProductId(inventory[0].id);
    setTFromWhId(warehouses[0].id);
    setTToWhId(warehouses[1].id);
    setTQtyCartons('');
    setTQtyPieces('');
    setTNotes('');
    setIsTransferModalOpen(true);
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (tFromWhId === tToWhId) {
      addToast(lang === 'ar' ? 'خطأ: لا يمكن النقل لنفس المستودع المصدر!' : 'Cannot transfer to the same warehouse!', 'error');
      return;
    }

    const product = inventory.find(p => p.id === tProductId);
    if (!product) return;

    const cartonsToTransfer = Number(tQtyCartons) || 0;
    const piecesToTransfer = Number(tQtyPieces) || 0;

    if (cartonsToTransfer <= 0 && piecesToTransfer <= 0) {
      addToast(lang === 'ar' ? 'الرجاء إدخال كمية صحيحة للنقل!' : 'Enter a valid transfer quantity!', 'error');
      return;
    }

    const totalPcsToTransfer = (cartonsToTransfer * product.piecesPerCarton) + piecesToTransfer;

    // Check if source warehouse has enough stock
    // If product has no explicitly declared warehouse allocations yet, we assume the bulk is in default or overall warehouse pool
    const sourceAlloc = product.warehouseStocks?.find(ws => ws.warehouseId === tFromWhId);
    const availablePieces = sourceAlloc ? sourceAlloc.quantity : product.quantity;

    if (availablePieces < totalPcsToTransfer) {
      addToast(
        lang === 'ar' 
          ? `عذراً، الرصيد المتاح بالمستودع المحدد للتحويل لا يكفي! المتاح قطع: ${availablePieces}` 
          : `Insufficient stock in source warehouse! Available: ${availablePieces} pcs`, 
        'error'
      );
      return;
    }

    // Apply Stock Dedication adjustments
    const updatedInventory = inventory.map(p => {
      if (p.id === tProductId) {
        let currentStocks = p.warehouseStocks ? [...p.warehouseStocks] : [];

        // Ensure both source and destination allocations have mapped warehouse stock lists
        let srcIdx = currentStocks.findIndex(ws => ws.warehouseId === tFromWhId);
        let destIdx = currentStocks.findIndex(ws => ws.warehouseId === tToWhId);

        // If source was not registered, fallback with original volume
        if (srcIdx === -1) {
          currentStocks.push({
            warehouseId: tFromWhId,
            numCartons: p.numCartons,
            quantity: p.quantity
          });
          srcIdx = currentStocks.length - 1;
        }

        if (destIdx === -1) {
          currentStocks.push({
            warehouseId: tToWhId,
            numCartons: 0,
            quantity: 0
          });
          destIdx = currentStocks.length - 1;
        }

        // Deduct from source allocation
        const srcAlloc = currentStocks[srcIdx];
        const newSrcTotalPcs = srcAlloc.quantity - totalPcsToTransfer;
        const newSrcCartons = p.piecesPerCarton > 0 ? Math.floor(newSrcTotalPcs / p.piecesPerCarton) : srcAlloc.numCartons - cartonsToTransfer;
        currentStocks[srcIdx] = {
          ...srcAlloc,
          numCartons: Math.max(0, newSrcCartons),
          quantity: Math.max(0, newSrcTotalPcs)
        };

        // Add to destination destination allocation
        const destAlloc = currentStocks[destIdx];
        const newDestTotalPcs = destAlloc.quantity + totalPcsToTransfer;
        const newDestCartons = p.piecesPerCarton > 0 ? Math.floor(newDestTotalPcs / p.piecesPerCarton) : destAlloc.numCartons + cartonsToTransfer;
        currentStocks[destIdx] = {
          ...destAlloc,
          numCartons: newDestCartons,
          quantity: newDestTotalPcs
        };

        // Note: Global sum aggregate of product remains the same! It is just relocated.
        return {
          ...p,
          warehouseStocks: currentStocks
        };
      }
      return p;
    });

    // Save Stock Transfer log
    const newLog: StockTransfer = {
      id: 'trsf_' + Math.random().toString(36).substring(2, 9),
      productId: tProductId,
      productNameAr: product.name_ar,
      fromWarehouseId: tFromWhId,
      toWarehouseId: tToWhId,
      qtyCartons: cartonsToTransfer,
      qtyPieces: piecesToTransfer,
      notes: tNotes.trim() || undefined,
      createdAt: Date.now()
    };

    onSaveInventory(updatedInventory);
    onSaveStockTransfers([newLog, ...stockTransfers]);
    setIsTransferModalOpen(false);
    addToast(lang === 'ar' ? 'تم نقل وتحويل كميات المخزون بنجاح' : 'Stock transferred successfully', 'success');
  };

  // Manage Price Lists (قوائم الأسعار)
  const handleOpenPriceListModal = (pl?: PriceList) => {
    if (pl) {
      setEditingPriceList(pl);
      setPlName(pl.name);
      setPlDescription(pl.description || '');
      setPlType(pl.discountType);
      setPlValue(pl.value);
      setPlProductPrices(pl.productPrices || {});
      setPlIsActive(pl.isActive);
    } else {
      setEditingPriceList(null);
      setPlName('');
      setPlDescription('');
      setPlType('markup');
      setPlValue('');
      setPlProductPrices({});
      setPlIsActive(true);
    }
    setIsPriceListModalOpen(true);
  };

  const handleSavePriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plName.trim()) {
      addToast(lang === 'ar' ? 'الرجاء إدخال اسم قائمة الأسعار!' : 'Price list name required!', 'error');
      return;
    }

    const rateValue = Number(plValue) || 0;
    let updatedList: PriceList[];

    if (editingPriceList) {
      updatedList = priceLists.map(pl => pl.id === editingPriceList.id ? {
        ...pl,
        name: plName.trim(),
        description: plDescription.trim() || undefined,
        discountType: plType,
        value: rateValue,
        productPrices: plProductPrices,
        isActive: plIsActive
      } : pl);
      addToast(lang === 'ar' ? 'تم تحديث قائمة الأسعار بنجاح' : 'Price list updated successfully', 'success');
    } else {
      const newPl: PriceList = {
        id: 'pl_' + Math.random().toString(36).substring(2, 9),
        name: plName.trim(),
        description: plDescription.trim() || undefined,
        discountType: plType,
        value: rateValue,
        productPrices: plProductPrices,
        isActive: plIsActive,
        createdAt: Date.now()
      };
      updatedList = [...priceLists, newPl];
      addToast(lang === 'ar' ? 'تم إنشاء قائمة الأسعار بنجاح' : 'Price list created successfully', 'success');
    }

    onSavePriceLists(updatedList);
    setIsPriceListModalOpen(false);
  };

  const handleDeletePriceList = (plId: string, plName: string) => {
    if (!window.confirm(lang === 'ar' ? `هل تفضل بالتأكيد حذف قائمة أسعار "${plName}"؟` : `Delete price list "${plName}"?`)) return;
    const updated = priceLists.filter(pl => pl.id !== plId);
    onSavePriceLists(updated);
    addToast(lang === 'ar' ? 'تم حذف قائمة الأسعار بنجاح' : 'Price list deleted successfully', 'success');
  };

  // Toggle Price List Active status
  const handleTogglePriceListActive = (plId: string) => {
    const updated = priceLists.map(pl => {
      if (pl.id === plId) {
        return { ...pl, isActive: !pl.isActive };
      }
      // If we want only one active at a time, we could toggle off other ones. Let's let multiple lists be active,
      // and let the checkout select which one to load.
      return pl;
    });
    onSavePriceLists(updated);
    addToast(lang === 'ar' ? 'تم تحديث وضع التنشيط بنجاح' : 'Status toggled successfully', 'success');
  };

  // Set explicit customized price inside current price list creation context
  const handleSetProductOverridePrice = (productId: string, unitType: 'carton' | 'piece', val: string) => {
    const numericVal = Number(val) || undefined;
    setPlProductPrices(prev => {
      const nested = prev[productId] ? { ...prev[productId] } : {};
      if (unitType === 'carton') {
        nested.cartonPrice = numericVal;
      } else {
        nested.piecePrice = numericVal;
      }

      // If empty both, omit key unit
      if (nested.cartonPrice === undefined && nested.piecePrice === undefined) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      return {
        ...prev,
        [productId]: nested
      };
    });
  };

  // Save Settings SubTab trigger
  const handleSaveInventorySettings = () => {
    const updated: StoreSettings = {
      ...settings,
      lowStockThreshold: settingsLowStock
    };
    onSaveSettings(updated);
    addToast(lang === 'ar' ? 'تم حفظ إعدادات المخزون بنجاح' : 'Inventory settings saved', 'success');
  };

  // Computed distributions metrics
  const distributedProductsList = useMemo(() => {
    return inventory.map(product => {
      const currentAllocations = product.warehouseStocks || [];
      const whStockMap = warehouses.map(wh => {
        const found = currentAllocations.find(ws => ws.warehouseId === wh.id);
        return {
          warehouse: wh,
          numCartons: found ? found.numCartons : 0,
          quantity: found ? found.quantity : 0
        };
      });

      // Total quantity left unaccounted or allocated
      const sumDeclaredPieces = currentAllocations.reduce((acc, c) => acc + c.quantity, 0);
      const leftoverPieces = Math.max(0, product.quantity - sumDeclaredPieces);

      return {
        ...product,
        allocations: whStockMap,
        unallocatedPieces: leftoverPieces,
        unallocatedCartons: product.piecesPerCarton > 0 ? Math.floor(leftoverPieces / product.piecesPerCarton) : 0
      };
    });
  }, [inventory, warehouses]);

  return (
    <div className="bg-white border border-[#d2d2d7] rounded-[24px] p-6 space-y-6 leading-relaxed relative text-right">
      {/* Top Directorate Navigation Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#f5f5f7] gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#0071e3] tracking-widest block mb-1">
            {lang === 'ar' ? 'بوابة التخزين اللوجستية المتطورة' : 'Advanced Storage Directorate Portal'}
          </span>
          <h3 className="text-lg font-black text-slate-800 tracking-tight">
            {lang === 'ar' ? 'إدارة المستودعات، قوائم الأسعار والربط التكاملي المتقدم للمخزون' : 'Core Supply Warehousing & Flexible Pricing Module'}
          </h3>
        </div>

        {/* Action button controls according to selected context */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'warehouses' && (
            <button
              onClick={() => handleOpenWarehouseModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-600/95 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة مستودع جديد' : 'New Warehouse'}</span>
            </button>
          )}

          {activeTab === 'transfers' && (
            <button
              onClick={handleOpenTransferModal}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0071e3]/90 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تحويل كمية بينية جديد' : 'New Inter-Warehouse Route'}</span>
            </button>
          )}

          {activeTab === 'price_lists' && (
            <button
              onClick={() => handleOpenPriceListModal()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-850 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تأسيس قائمة أسعار مرنة' : 'Create Flexible Price List'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Navigation Section Tabs */}
      <div className="flex border-b border-gray-150 text-xs font-bold font-sans overflow-x-auto gap-2 no-print">
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`pb-3 px-3 transition-colors shrink-0 ${
            activeTab === 'warehouses' ? 'text-emerald-700 border-b-2 border-emerald-600 font-extrabold' : 'text-gray-400 hover:text-gray-950'
          }`}
        >
          {lang === 'ar' ? '🏢 المستودعات وفروع التخزين' : '🏢 Warehouses'}
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 px-3 transition-colors shrink-0 ${
            activeTab === 'transfers' ? 'text-[#0071e3] border-b-2 border-[#0071e3] font-extrabold' : 'text-gray-400 hover:text-gray-950'
          }`}
        >
          {lang === 'ar' ? '🔄 حركات النقل والتحويل اللوجستي' : '🔄 Transit Logistics'}
        </button>

        <button
          onClick={() => setActiveTab('price_lists')}
          className={`pb-3 px-3 transition-colors shrink-0 ${
            activeTab === 'price_lists' ? 'text-purple-700 border-b-2 border-purple-700 font-extrabold' : 'text-gray-400 hover:text-gray-950'
          }`}
        >
          {lang === 'ar' ? '🏷️ قوائم الأسعار الترويجية والمرنة' : '🏷️ Pricing Strategies'}
        </button>

        <button
          onClick={() => setActiveTab('distribution')}
          className={`pb-3 px-3 transition-colors shrink-0 ${
            activeTab === 'distribution' ? 'text-amber-700 border-b-2 border-amber-700 font-extrabold' : 'text-gray-400 hover:text-gray-950'
          }`}
        >
          {lang === 'ar' ? '📊 خارطة المخزون وتوزيعه الموضعي' : '📊 Inventory Location Spreads'}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 transition-colors shrink-0 ${
            activeTab === 'settings' ? 'text-gray-800 border-b-2 border-gray-800 font-extrabold' : 'text-gray-400 hover:text-gray-950'
          }`}
        >
          {lang === 'ar' ? '⚙️ تفضيلات المخزون الإدارية' : '⚙️ Inventory Rules'}
        </button>
      </div>

      {/* ==================== SUB-VIEW 1: WAREHOUSES DIRECTORIES ==================== */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={warehouseSearch}
              onChange={(e) => setWarehouseSearch(e.target.value)}
              placeholder="البحث باسم المستودع، المسئول، أو العنوان الجغرافي..."
              className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none pr-8 bg-[#f5f5f7]/50"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {warehouses.length === 0 ? (
              <div className="col-span-full border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-xs">
                {lang === 'ar' ? 'لا يوجد أي مستودعات مدونة للنشاط التجاري حالياً تصفح التأسيس السريع بالزر للمزيد!' : 'No custom warehouses created yet. The core defaults are aggregated sequentially.'}
              </div>
            ) : (
              warehouses
                .filter(w => 
                  w.name.toLowerCase().includes(warehouseSearch.toLowerCase()) || 
                  w.manager?.toLowerCase().includes(warehouseSearch.toLowerCase()) || 
                  w.location?.toLowerCase().includes(warehouseSearch.toLowerCase())
                )
                .map(wh => {
                  // Calculate dynamic counts of products that have assigned stocks here
                  const allocatedItems = inventory.filter(p => {
                    const alloc = p.warehouseStocks?.find(ws => ws.warehouseId === wh.id);
                    return alloc && (alloc.quantity > 0);
                  });

                  // Calculate total volumes
                  const totalAllocatedPcs = allocatedItems.reduce((acc, p) => {
                    const alloc = p.warehouseStocks?.find(ws => ws.warehouseId === wh.id);
                    return acc + (alloc ? alloc.quantity : 0);
                  }, 0);

                  return (
                    <div 
                      key={wh.id} 
                      className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-56 space-y-3 shadow-xs hover:shadow-md transition-all ${
                        wh.status === 'inactive' ? 'border-red-100 bg-red-50/5' : 'border-[#d2d2d7]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className={`inline-block text-[8px] font-black px-1.5 py-0.5 rounded ${
                            wh.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 animate-pulse'
                          }`}>
                            {wh.status === 'active' ? 'نشط لوجستياً' : 'موقوف مؤقتاً'}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 font-bold">ID: {wh.id.toUpperCase()}</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 leading-none">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                            {wh.name}
                          </h4>
                          {wh.location && (
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-start leading-tight">
                              <MapPin className="w-3 h-3 text-gray-400 inline shrink-0" />
                              <span>{wh.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#f5f5f7] p-2.5 rounded-xl space-y-1.5 text-[9.5px]">
                        {wh.manager && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center gap-1">
                              <User className="w-2.5 h-2.5 text-gray-400" /> أمين المخزن:
                            </span>
                            <span className="font-bold text-gray-800">{wh.manager}</span>
                          </div>
                        )}
                        {wh.phone && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-gray-400" /> هاتف الاتصال:
                            </span>
                            <span className="font-mono text-gray-700">{wh.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                          <span className="text-gray-500 font-bold">الأصناف الحالية المودعة:</span>
                          <span className="font-bold text-[#0071e3] font-mono text-xs">{allocatedItems.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold">إجمالي كميات القطع المخزنة:</span>
                          <span className="font-bold text-slate-800 font-mono text-xs">{totalAllocatedPcs.toLocaleString()} حبات</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f5f5f7] flex justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenWarehouseModal(wh)}
                          className="p-1 px-2.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-extrabold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                          className="p-1 px-2 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors font-extrabold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 2: TRANSIT LOGISTICS & TRANSFERS ==================== */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={transferSearch}
              onChange={(e) => setTransferSearch(e.target.value)}
              placeholder="البحث باسم المنتج المنقول للتحقق من السجلات وحركات الاستلام..."
              className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none pr-8 bg-[#f5f5f7]/50"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
          </div>

          <div className="overflow-x-auto bg-white border border-[#d2d2d7] rounded-2xl">
            <table className="w-full text-[11px] text-right">
              <thead className="bg-[#f5f5f7] border-b border-gray-200 text-gray-900 font-bold">
                <tr>
                  <th className="py-3 px-4">رقم الحركة اللوجستية</th>
                  <th className="py-3 px-4">اسم الصنف المنقول</th>
                  <th className="py-3 px-4 text-center">مكان الشحن المصدر</th>
                  <th className="py-3 px-4 text-center">أمين التفريغ المستقبل</th>
                  <th className="py-3 px-4 text-left">كمية الكراتين</th>
                  <th className="py-3 px-4 text-left">كمية القطع المفردة</th>
                  <th className="py-3 px-4">مستندات التحميل / الملاحظة</th>
                  <th className="py-3 px-4 text-center">تاريخ النقل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {stockTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      لا يوجد أي مستندات نقل أو عمليات تحويل مسجلة بالنظام حتى تاريخ اليوم.
                    </td>
                  </tr>
                ) : (
                  stockTransfers
                    .filter(t => t.productNameAr.toLowerCase().includes(transferSearch.toLowerCase()))
                    .map(trn => {
                      const fromWh = warehouses.find(w => w.id === trn.fromWarehouseId)?.name || 'غير معروف';
                      const toWh = warehouses.find(w => w.id === trn.toWarehouseId)?.name || 'غير معروف';
                      return (
                        <tr key={trn.id} className="hover:bg-[#f5f5f7]/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-gray-400">#{trn.id.toUpperCase().replace('TRSF_', '')}</td>
                          <td className="py-3 px-4 font-bold text-gray-900">{trn.productNameAr}</td>
                          <td className="py-3 px-4 text-center"><span className="bg-red-50 text-red-850 px-2 py-0.5 rounded font-bold text-[9px]">{fromWh}</span></td>
                          <td className="py-3 px-4 text-center"><span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[9px]">{toWh}</span></td>
                          <td className="py-3 px-4 text-left font-mono font-bold">{trn.qtyCartons.toLocaleString()} كرتون</td>
                          <td className="py-3 px-4 text-left font-mono">{trn.qtyPieces.toLocaleString()} حبة</td>
                          <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate" title={trn.notes}>{trn.notes || '-'}</td>
                          <td className="py-3 px-4 text-center text-gray-400 font-mono">{new Date(trn.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 3: PRICE LISTS (🏷️) ==================== */}
      {activeTab === 'price_lists' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={priceListSearch}
              onChange={(e) => setPriceListSearch(e.target.value)}
              placeholder="البحث باسم قائمة الأسعار المخصصة..."
              className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none pr-8 bg-[#f5f5f7]/50"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {priceLists.length === 0 ? (
              <div className="col-span-full border border-dashed border-purple-200 rounded-3xl p-12 text-center text-gray-400 text-xs">
                {lang === 'ar' ? 'لا توجد قوائم أسعار مرنة مخصصة حتى اللحظة بالسيستم.' : 'No custom pricing sheets available. Create markup or discount schedules.'}
              </div>
            ) : (
              priceLists
                .filter(pl => pl.name.toLowerCase().includes(priceListSearch.toLowerCase()))
                .map(pl => {
                  const overridesCount = Object.keys(pl.productPrices || {}).length;
                  return (
                    <div 
                      key={pl.id} 
                      className={`p-5 rounded-[22px] border bg-white flex flex-col justify-between h-56 space-y-3 shadow-xs hover:shadow-md transition-all ${
                        pl.isActive ? 'border-purple-200' : 'border-gray-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <button
                            onClick={() => handleTogglePriceListActive(pl.id)}
                            className={`px-2 py-0.5 text-[8.5px] font-black rounded transition-all ${
                              pl.isActive ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {pl.isActive ? 'مفعلة بالبيع الآجل والـ POS' : 'معطلة إدارياً'}
                          </button>
                          <span className="text-[9px] font-mono text-gray-400">ID: {pl.id.replace('pl_', '')}</span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-gray-900 leading-snug">{pl.name}</h4>
                          {pl.description && <p className="text-[9.5px] text-gray-400 line-clamp-1">{pl.description}</p>}
                        </div>
                      </div>

                      <div className="bg-[#f5f5f7] p-3 rounded-2xl text-[10px] space-y-1.5 font-normal">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">النوع الإستراتيجي للقائمة:</span>
                          <span className="font-bold text-gray-800">
                            {pl.discountType === 'markup' ? '🏷️ زيادة بنسبة مئوية (Markup)' : pl.discountType === 'markdown' ? '📉 خصم تفضيلي مئوي (Markdown)' : '🔧 قائمة أسعار مخصصة بالكامل'}
                          </span>
                        </div>
                        {pl.discountType !== 'fixed' && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">القيمة المئوية للضريبة / التعديل:</span>
                            <span className="font-mono font-bold text-purple-700">%{pl.value}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
                          <span className="text-gray-500 font-bold">أصناف بأسعار مخصصة بديلة:</span>
                          <span className="font-mono text-[#0071e3] font-bold text-xs">{overridesCount} صنف مخصص</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#f5f5f7] flex justify-end gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenPriceListModal(pl)}
                          className="p-1 px-3 text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition font-extrabold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>تعديل التفاصيل</span>
                        </button>
                        <button
                          onClick={() => handleDeletePriceList(pl.id, pl.name)}
                          className="p-1 px-2.5 text-[10px] bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition font-extrabold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 4: DISTRIBUTION SPREADSHEETS (📊) ==================== */}
      {activeTab === 'distribution' && (
        <div className="space-y-4">
          <div className="bg-[#f5f5f7] p-4.5 rounded-2xl block text-xs border border-[#d2d2d7]">
            <h4 className="font-extrabold text-[#1d1d1f] flex items-center gap-1 mb-1 before:content-[''] before:inline-block before:w-1.5 before:h-3 before:bg-blue-650">مستند التوزيع ومواقع تمركز البضائع</h4>
            <p className="text-gray-400 text-[10.5px]">يعرض هذا المستند توزيع الكميات الفعلية المخزنة لكل منتج بدقة داخل كل مستودع، بالإضافة للكميات الحرة المعلقة غير الموجهة للمستودعات بشكل صريح.</p>
          </div>

          <div className="overflow-x-auto bg-white border border-[#d2d2d7] rounded-3xl">
            <table className="w-full text-[11px] text-right">
              <thead className="bg-[#f5f5f7] border-b border-gray-200 text-gray-900 font-bold">
                <tr>
                  <th className="py-3 px-4 text-right">اسم صنف البضاعة</th>
                  <th className="py-3 px-4">الفئة الملحقة</th>
                  <th className="py-3 px-4 text-center">الرصيد الإجمالي الكلي</th>
                  {warehouses.map(w => (
                    <th key={w.id} className="py-3 px-4 text-center bg-blue-50/10 border-l border-gray-150">
                      {w.name}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center text-orange-650">باقي غير موجه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f7]">
                {distributedProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={4 + warehouses.length} className="py-12 text-center text-gray-400">
                      لا يوجد بضائع أو كميات مدونة حالياً بالمخزن لتوزيعها. t
                    </td>
                  </tr>
                ) : (
                  distributedProductsList.map(prd => {
                    return (
                      <tr key={prd.id} className="hover:bg-[#f5f5f7]/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">{prd.name_ar}</td>
                        <td className="py-3 px-4 text-gray-400">{prd.category}</td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className="font-mono text-xs">{prd.quantity}</span> حبة / <span className="font-mono font-black text-blue-700">{prd.numCartons}</span> كرتونة
                        </td>

                        {prd.allocations.map(alloc => (
                          <td key={alloc.warehouse.id} className="py-3 px-4 text-center border-l border-[#f5f5f7] font-sans">
                            {alloc.quantity > 0 ? (
                              <span className="inline-block bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-[10px] font-bold">
                                <strong className="font-mono">{alloc.numCartons}</strong> كرتون / <strong className="font-mono">{alloc.quantity}</strong> حبة
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ))}

                        <td className="py-3 px-3 text-center text-orange-850 font-bold font-sans">
                          {prd.unallocatedPieces > 0 ? (
                            <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px]">
                              {prd.unallocatedCartons} كرتون / {prd.unallocatedPieces} حبة
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SUB-VIEW 5: SETTINGS PREFERENCES (⚙️) ==================== */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6 text-right leading-normal">
          <div className="bg-[#f5f5f7] p-5 rounded-2xl block border border-[#d2d2d7] space-y-4">
            <h4 className="text-xs font-extrabold text-[#1d1d1f] flex items-center gap-1 mb-1 before:content-[''] before:inline-block before:w-1.5 before:h-3 before:bg-slate-700">أولويات وتفضيلات لوظائف المخزون المتقدمة</h4>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 block">حد تنبيه انخفاض المخزون (بالكرتون / الحبة):</label>
                <input
                  type="number"
                  value={settingsLowStock}
                  onChange={(e) => setSettingsLowStock(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-white font-bold"
                  min="1"
                />
                <p className="text-[9.5px] text-gray-400">سيقوم البرنامج بإرسال تنبيهات تحذيرية حمراء على واجهة البيع مباشرة لأي صنف يقل متبقيه بالمخزن عن هذا الحد.</p>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveInventorySettings}
                  className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>تثبيت التفضيلات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DIALOG MODAL: CREATE / EDIT WAREHOUSE ==================== */}
      <AnimatePresence>
        {isWarehouseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-[#d2d2d7] overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 text-right"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h4 className="text-xs font-extrabold text-[#1d1d1f]">
                  {editingWarehouse ? 'تعديل وتحديث مستند المستودع بالبرنامج' : 'تسجيل مستودع أو فرع تخزين جديد'}
                </h4>
                <button 
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="p-1 hover:bg-[#f5f5f7] rounded-all transition text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveWarehouse} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">اسم المستودع (موجز ومميز) *</label>
                  <input
                    type="text"
                    required
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    placeholder="مثل: المستودع الرئيسي، مخزن السجانة..."
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">الموقع الجغرافي / العنوان</label>
                  <input
                    type="text"
                    value={whLocation}
                    onChange={(e) => setWhLocation(e.target.value)}
                    placeholder="العاصمة، المنطقة الصناعية، إلخ..."
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">اسم أمين المخزن</label>
                    <input
                      type="text"
                      value={whManager}
                      onChange={(e) => setWhManager(e.target.value)}
                      placeholder="اسم الموظف المسئول"
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">رقم هاتف المسئول</label>
                    <input
                      type="text"
                      value={whPhone}
                      onChange={(e) => setWhPhone(e.target.value)}
                      placeholder="للاتصال به"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">الحالة التشغيلية الجارية</label>
                  <select
                    value={whStatus}
                    onChange={(e) => setWhStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                  >
                    <option value="active">نشط ويتلقى الشحنات</option>
                    <option value="inactive">موقف مؤقتاً (مخزن مغلق)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWarehouseModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-150 text-gray-600 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء التأسيس
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-650 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ البيانات</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOG MODAL: NEW INTER-WAREHOUSE STOCK TRANSFER ==================== */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-[#d2d2d7] overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 text-right"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h4 className="text-xs font-extrabold text-[#1d1d1f] flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-blue-700" />
                  <span>تحرير معاملة تحويل مخزني بيني (أمر شحن)</span>
                </h4>
                <button 
                  onClick={() => setIsTransferModalOpen(false)}
                  className="p-1 hover:bg-[#f5f5f7] rounded-all transition text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">اختر صنف البضاعة المراد نقل رصيدها *</label>
                  <select
                    value={tProductId}
                    onChange={(e) => setTProductId(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-white font-bold"
                  >
                    {inventory.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name_ar} (متوفر بالدفتري الإجمالي: {p.quantity} قطعة)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-650 block">المستودع المصدر (الشحن) *</label>
                    <select
                      value={tFromWhId}
                      onChange={(e) => setTFromWhId(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-white font-bold text-red-850"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-800 block">المستودع المستقبل (التفريغ) *</label>
                    <select
                      value={tToWhId}
                      onChange={(e) => setTToWhId(e.target.value)}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-white font-bold text-emerald-900"
                    >
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Show currently selected product source warehouse stock status dynamically */}
                {(() => {
                  const prd = inventory.find(p => p.id === tProductId);
                  if (!prd) return null;
                  const alloc = prd.warehouseStocks?.find(ws => ws.warehouseId === tFromWhId);
                  const availablePcs = alloc ? alloc.quantity : prd.quantity;
                  const availableCtn = alloc ? alloc.numCartons : prd.numCartons;
                  return (
                    <div className="p-3 bg-red-50/40 rounded-xl text-[10px] border border-red-100 italic space-y-1 text-slate-700">
                      <span>• الرصيد المسجل حالياً للصنف داخل المستودع المصدر:</span>
                      <strong className="block font-mono text-red-850">
                        {availableCtn} كرتونة (تساوي {availablePcs} حبة مفردة)
                      </strong>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">كمية الشحن (بالكرتون)</label>
                    <input
                      type="number"
                      value={tQtyCartons}
                      onChange={(e) => setTQtyCartons(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      min="0"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">كمية الشحن (قطع مفردة إضافية)</label>
                    <input
                      type="number"
                      value={tQtyPieces}
                      onChange={(e) => setTQtyPieces(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      min="0"
                      className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">ملاحظات التحويل وسند النقل</label>
                  <textarea
                    value={tNotes}
                    onChange={(e) => setTNotes(e.target.value)}
                    placeholder="رقم لوحة الشاحنة، اسم السائق، مستند النقل الخ..."
                    rows={2}
                    className="w-full text-xs px-3 py-2 border border-[#d2d2d7] rounded-xl focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-150 text-gray-600 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>تحويل المخزون الآن</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DIALOG MODAL: SETUP PRICE LIST (🏷️) ==================== */}
      <AnimatePresence>
        {isPriceListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#d2d2d7] overflow-hidden shadow-2xl p-6 flex flex-col space-y-4 text-right max-h-[85vh]"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h4 className="text-xs font-extrabold text-[#1d1d1f]">
                  {editingPriceList ? 'تعديل تفاصيل وأسعار القائمة السعرية' : 'تأسيس قائمة أسعار مرنة بأسعار بديلة'}
                </h4>
                <button 
                  onClick={() => setIsPriceListModalOpen(false)}
                  className="p-1 hover:bg-[#f5f5f7] rounded-all transition text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePriceList} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">اسم قائمة الأسعار المميز *</label>
                    <input
                      type="text"
                      required
                      value={plName}
                      onChange={(e) => setPlName(e.target.value)}
                      placeholder="مثل: أسعار تجار الجملة، قائمة رمضان..."
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">الوضع الاستراتيجي للتسعير *</label>
                    <select
                      value={plType}
                      onChange={(e) => setPlType(e.target.value as any)}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-white font-bold"
                    >
                      <option value="markup">زيادة مئوية على المخزون الأساسي (Markup %)</option>
                      <option value="markdown">تخفيض مئوي شامل للترويج (Markdown %)</option>
                      <option value="fixed">أسعار مخصصة يدوياً لكل صنف (Custom Override)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {plType !== 'fixed' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-purple-700 block">القيمة المئوية الافتراضية للزيادة / الخفض (%) *</label>
                      <input
                        type="number"
                        required
                        step="any"
                        value={plValue}
                        onChange={(e) => setPlValue(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0.00"
                        className="w-full text-xs font-mono px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none bg-purple-50/20 font-bold"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 block">تفعيل القائمة الآن؟</label>
                    <select
                      value={plIsActive ? 'yes' : 'no'}
                      onChange={(e) => setPlIsActive(e.target.value === 'yes')}
                      className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                    >
                      <option value="yes">نعم، تفعيل وجعلها متاحة</option>
                      <option value="no">لا، تعطيل مؤقت</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 block">ملاحظات أو وصف القائمة</label>
                  <input
                    type="text"
                    value={plDescription}
                    onChange={(e) => setPlDescription(e.target.value)}
                    placeholder="وصف مختصر للشركاء..."
                    className="w-full text-xs px-3 py-2.5 border border-[#d2d2d7] rounded-xl focus:outline-none"
                  />
                </div>

                {/* Overrides pricing sections */}
                <div className="space-y-2 pt-2 border-t border-gray-150">
                  <h5 className="text-xs font-extrabold text-[#1d1d1f] flex items-center gap-1 mb-1 leading-none">
                    <span>أسعار الدحر البديلة (إدخال يدوي مخصص للمنتجات):</span>
                    {plType !== 'fixed' && <span className="text-[9px] text-[#6e6e73] font-normal font-sans">(اختياري - لتجاوز النسبة الافتراضية لمنتج معين)</span>}
                  </h5>

                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {inventory.map(prd => {
                      const overrides = plProductPrices[prd.id] || {};
                      return (
                        <div key={prd.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between gap-3 bg-gray-50/50">
                          <div className="space-y-0.5 max-w-[170px] truncate">
                            <strong className="text-[11.5px] text-[#1d1d1f] block leading-snug">{prd.name_ar}</strong>
                            <span className="text-[9px] text-gray-400 block font-normal leading-none font-sans">
                              الأساسي: حبة <span className="font-mono text-gray-600 font-bold">{prd.price} SDG</span> / كرتون <span className="font-mono text-gray-650 font-bold">{prd.cartonSellingPrice} SDG</span>
                            </span>
                          </div>

                          <div className="flex gap-2.5 shrink-0 items-center">
                            <div className="space-y-0.5">
                              <span className="text-[8.5px] text-gray-400 block">بديل سعر الحبة:</span>
                              <input
                                type="number"
                                step="any"
                                value={overrides.piecePrice !== undefined ? overrides.piecePrice : ''}
                                onChange={(e) => handleSetProductOverridePrice(prd.id, 'piece', e.target.value)}
                                placeholder="دفتري: 0"
                                className="w-24 text-[11px] font-mono px-2 py-1.5 border border-[#d2d2d7] rounded-lg focus:outline-none text-left bg-white"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8.5px] text-gray-400 block">بديل سعر الكرتون:</span>
                              <input
                                type="number"
                                step="any"
                                value={overrides.cartonPrice !== undefined ? overrides.cartonPrice : ''}
                                onChange={(e) => handleSetProductOverridePrice(prd.id, 'carton', e.target.value)}
                                placeholder="دفتري: 0"
                                className="w-24 text-[11px] font-mono px-2 py-1.5 border border-[#d2d2d7] rounded-lg focus:outline-none text-left bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-150 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPriceListModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-150 text-gray-600 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-855 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ التسعير</span>
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
