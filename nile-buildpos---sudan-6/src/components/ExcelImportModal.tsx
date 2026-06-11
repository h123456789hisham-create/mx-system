import React, { useState, useRef } from 'react';
import { Upload, X, Check, FileSpreadsheet, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { Product } from '../types';
import { getTranslation, LanguageCode } from '../translations';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedProducts: Product[], successCount: number, skippedCount: number) => void;
  lang: LanguageCode;
}

interface ParsedRow {
  name: string;
  numCartons: number;
  piecesPerCarton: number;
  cartonPurchasePrice: number;
  cartonSellingPrice: number;
  pieceSellingPrice: number;
  category: string;
  isValid: boolean;
  reason?: string;
}

export default function ExcelImportModal({ isOpen, onClose, onImportComplete, lang }: ExcelImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorText, setErrorText] = useState('');

  const t = (key: string, params?: Record<string, any>) => getTranslation(lang, key, params);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setErrorText('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (rawRows.length <= 1) {
          setErrorText(t('invalidExcel'));
          return;
        }

        const headers = (rawRows[0] as any[]).map(h => String(h).trim().toLowerCase());
        
        let nameIdx = headers.indexOf('name');
        if (nameIdx === -1) nameIdx = headers.indexOf('الاسم');
        let cartonsIdx = headers.indexOf('num_cartons');
        if (cartonsIdx === -1) cartonsIdx = headers.indexOf('عدد الكراتين');
        let piecesIdx = headers.indexOf('pieces_per_carton');
        if (piecesIdx === -1) piecesIdx = headers.indexOf('حبات الكرتونة');
        let cartPurIdx = headers.indexOf('carton_purchase_price');
        if (cartPurIdx === -1) cartPurIdx = headers.indexOf('سعر شراء الكرتون');
        let cartSelIdx = headers.indexOf('carton_selling_price');
        if (cartSelIdx === -1) cartSelIdx = headers.indexOf('سعر بيع الكرتون');
        let pieceSelIdx = headers.indexOf('piece_selling_price');
        if (pieceSelIdx === -1) pieceSelIdx = headers.indexOf('سعر بيع الحبة');

        // Fallbacks
        if (nameIdx === -1) nameIdx = 0;
        if (cartonsIdx === -1) cartonsIdx = 1;
        if (piecesIdx === -1) piecesIdx = 2;
        if (cartPurIdx === -1) cartPurIdx = 3;
        if (cartSelIdx === -1) cartSelIdx = 4;
        if (pieceSelIdx === -1) pieceSelIdx = 5;

        const processed: ParsedRow[] = [];

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i] as any[];
          if (!row || row.length === 0 || row.join('').trim() === '') continue;

          const nameRaw = row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
          const numCartonsRaw = row[cartonsIdx] !== undefined ? Number(row[cartonsIdx]) : NaN;
          const piecesPerCartonRaw = row[piecesIdx] !== undefined ? Number(row[piecesIdx]) : NaN;
          const cartonPurchasePriceRaw = row[cartPurIdx] !== undefined ? Number(row[cartPurIdx]) : NaN;
          let cartonSellingPriceRaw = row[cartSelIdx] !== undefined ? Number(row[cartSelIdx]) : NaN;
          let pieceSellingPriceRaw = row[pieceSelIdx] !== undefined ? Number(row[pieceSelIdx]) : NaN;

          const finalPiecesPerCarton = isNaN(piecesPerCartonRaw) || piecesPerCartonRaw <= 0 ? 1 : piecesPerCartonRaw;

          // Auto-calculate missing prices if one selling price exists
          if (!isNaN(cartonSellingPriceRaw) && cartonSellingPriceRaw > 0 && (isNaN(pieceSellingPriceRaw) || pieceSellingPriceRaw <= 0)) {
            pieceSellingPriceRaw = Math.round(cartonSellingPriceRaw / finalPiecesPerCarton);
          } else if (!isNaN(pieceSellingPriceRaw) && pieceSellingPriceRaw > 0 && (isNaN(cartonSellingPriceRaw) || cartonSellingPriceRaw <= 0)) {
            cartonSellingPriceRaw = pieceSellingPriceRaw * finalPiecesPerCarton;
          }

          let isValid = true;
          let reason = '';

          if (!nameRaw) {
            isValid = false;
            reason = lang === 'ar' ? 'الاسم مطلوب' : 'Name is required';
          } else if (isNaN(numCartonsRaw) || numCartonsRaw < 0) {
            isValid = false;
            reason = lang === 'ar' ? 'عدد الكراتين خاطئ' : 'Cartons count invalid';
          } else if (isNaN(piecesPerCartonRaw) || piecesPerCartonRaw <= 0) {
            isValid = false;
            reason = lang === 'ar' ? 'عدد الحبات بالكرتونة غير صالح' : 'Pieces/Carton must be > 0';
          } else if (isNaN(cartonPurchasePriceRaw) || cartonPurchasePriceRaw < 0) {
            isValid = false;
            reason = lang === 'ar' ? 'سعر شراء الكرتون غير صحيح' : 'Carton purchase price invalid';
          } else if (isNaN(cartonSellingPriceRaw) || cartonSellingPriceRaw < 0) {
            isValid = false;
            reason = lang === 'ar' ? 'سعر بيع الكرتون غير صحيح' : 'Carton selling price invalid';
          } else if (isNaN(pieceSellingPriceRaw) || pieceSellingPriceRaw < 0) {
            isValid = false;
            reason = lang === 'ar' ? 'سعر بيع الحبة غير صحيح' : 'Piece selling price invalid';
          }

          processed.push({
            name: nameRaw,
            numCartons: isNaN(numCartonsRaw) ? 0 : numCartonsRaw,
            piecesPerCarton: finalPiecesPerCarton,
            cartonPurchasePrice: isNaN(cartonPurchasePriceRaw) ? 0 : cartonPurchasePriceRaw,
            cartonSellingPrice: isNaN(cartonSellingPriceRaw) ? 0 : cartonSellingPriceRaw,
            pieceSellingPrice: isNaN(pieceSellingPriceRaw) ? 0 : pieceSellingPriceRaw,
            category: lang === 'ar' ? 'أخرى' : 'Others',
            isValid,
            reason
          });
        }

        setParsedRows(processed);
      } catch (err) {
        console.error(err);
        setErrorText(t('invalidExcel'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplateFile = () => {
    const csvContent = [
      ['Name', 'Num_Cartons', 'Pieces_Per_Carton', 'Carton_Purchase_Price', 'Carton_Selling_Price', 'Piece_Selling_Price'],
      ['أسمنت عطبرة بورتلاند - كرتون', '50', '20', '35000', '42000', '2100'],
      ['حديد تسليح 12 ملم - كرتون شحنات', '10', '100', '800000', '950000', '10000'],
      ['طوب بلاستيكي ممتاز', '100', '50', '12000', '18000', '400']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(csvContent);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Nile_BuildPOS_Stock_Template.xlsx");
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    const skippedCount = parsedRows.length - validRows.length;

    const newProducts: Product[] = validRows.map(row => {
      const totalPieces = row.numCartons * row.piecesPerCarton;
      const computedPurchasePiece = row.piecesPerCarton > 0 ? (row.cartonPurchasePrice / row.piecesPerCarton) : 0;
      
      return {
        id: Math.random().toString(36).substring(2, 11),
        barcode: '',
        name_ar: row.name,
        name_en: row.name,
        category: 'أخرى',
        numCartons: row.numCartons,
        piecesPerCarton: row.piecesPerCarton,
        cartonPurchasePrice: row.cartonPurchasePrice,
        cartonSellingPrice: row.cartonSellingPrice,
        purchasePricePiece: computedPurchasePiece,
        price: row.pieceSellingPrice,
        initialQuantity: totalPieces,
        quantity: totalPieces,
        unit: 'كرتون',
        createdAt: Date.now()
      };
    });

    onImportComplete(newProducts, newProducts.length, skippedCount);
    onClose();
    setParsedRows([]);
    setFileName('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl border border-[#d2d2d7] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f5f7]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1d1d1f] font-sans">
                  {t('importExcel')}
                </h3>
                <p className="text-xs text-[#6e6e73]">
                  {t('importHeaderWarning')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#f5f5f7] rounded-full transition-colors text-[#86868b]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Template downloader card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#f5f5f7] rounded-2xl gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-white rounded-xl text-[#0071e3] border border-[#d2d2d7]">
                  <Download className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#1d1d1f]">قالب إكسل القياسي المعتمد (الكراتين والقطع)</h4>
                  <p className="text-xs text-[#6e6e73]">لتجنب الأخطاء، قم بتسجيل الأعمدة التالية: الاسم، عدد الكراتين، حبات الكرتونة، سعر شراء الكرتون، سعر بيع الكرتون، سعر بيع الحبة.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadTemplateFile}
                className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-medium rounded-xl transition-all self-stretch sm:self-auto text-center"
              >
                {t('exportTemplate')}
              </button>
            </div>

            {/* Drag and Drop Zone */}
            {parsedRows.length === 0 ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#0071e3] bg-blue-50/20'
                    : 'border-[#d2d2d7] hover:border-[#86868b] bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="p-4 bg-[#f5f5f7] rounded-full text-[#0071e3] mb-4">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[#1d1d1f] mb-1">
                  {t('selectFile')}
                </p>
                <p className="text-xs text-[#6e6e73]">
                  {t('dragDrop')}
                </p>
              </div>
            ) : (
              // Preview list of spreadsheets content parsed
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6e6e73]">
                    {t('excelPreview')} ({parsedRows.length} {t('itemsCount')})
                  </span>
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                    }}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    حذف وإعادة اختيار ملف آخر
                  </button>
                </div>

                <div className="border border-[#d2d2d7] rounded-2xl overflow-hidden max-h-[250px] overflow-y-auto">
                  <table className="w-full text-xs text-right bg-white select-none">
                    <thead className="bg-[#f5f5f7] sticky top-0 text-[#1d1d1f] border-b border-[#d2d2d7]">
                      <tr>
                        <th className="py-3 px-4 text-center">{t('status')}</th>
                        <th className="py-3 px-4">اسم الصنف</th>
                        <th className="py-3 px-4 text-center">الكراتين</th>
                        <th className="py-3 px-4 text-center">القطع بالكرتونة</th>
                        <th className="py-3 px-4 text-left">شراء الكرتون</th>
                        <th className="py-3 px-4 text-left">بيع الكرتون</th>
                        <th className="py-3 px-4 text-left">بيع الحبة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f5f5f7]">
                      {parsedRows.map((row, index) => (
                        <tr key={index} className={`hover:bg-[#f5f5f7]/50 ${!row.isValid ? 'bg-red-50/30' : ''}`}>
                          <td className="py-2.5 px-4 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                <Check className="w-3.5 h-3.5" />
                                <span>جاهز</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-500 font-medium" title={row.reason}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="text-[10px] max-w-[80px] truncate">{row.reason}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#1d1d1f]">
                            {row.name}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-[#1d1d1f]">
                            {row.numCartons}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-[#6e6e73]">
                            {row.piecesPerCarton}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-left">
                            {row.cartonPurchasePrice.toLocaleString()} SDG
                          </td>
                          <td className="py-2.5 px-4 font-medium text-left">
                            {row.cartonSellingPrice.toLocaleString()} SDG
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-emerald-600 text-left">
                            {row.pieceSellingPrice.toLocaleString()} SDG
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-xs bg-amber-50 rounded-xl p-3 text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    {lang === 'ar' 
                      ? 'سيتم استيراد كافة المنتجات الموسومة بـ "جاهز" وتجاوز المنتجات التي تحتوي أخطاء. سيقر النظام إجمالي القطع كـ (عدد الكراتين × حبات الكرتونة) تلقائياً.'
                      : 'All products marked as "Ready" will be added. Pieces total will be computed automatically and correctly by Carton schema.'}
                  </div>
                </div>
              </div>
            )}

            {errorText && (
              <div className="bg-red-50 text-red-600 rounded-xl p-4 text-xs font-semibold">
                {errorText}
              </div>
            )}
          </div>

          {/* Footer content */}
          <div className="px-6 py-4 bg-[#f5f5f7] border-t border-[#d2d2d7] flex justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-[#d2d2d7] text-sm text-[#1d1d1f] hover:bg-[#f5f5f7] transition-all rounded-xl font-medium"
            >
              {t('cancel')}
            </button>
            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2.5 bg-[#34c759] hover:bg-[#2fb550] text-white text-sm font-medium rounded-xl transition-all"
              >
                {t('confirmImport')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
