"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  PackageCheck,
  ShieldAlert,
  Upload,
  X,
  File,
  Loader2,
} from "lucide-react";

import {
  buildPurchaseImportTemplateExcel,
  type Vendor,
} from "@/lib/purchase";
import { type ExcelImportValidationResult } from "@/lib/purchase/excel-importer";
import { safeResponseJson } from "@/lib/api/client";

type ImportPurchasesDialogProps = {
  open: boolean;
  submitting: boolean;
  vendors: Vendor[];
  onClose(): void;
  onImportSuccess(count: number): void;
};

function downloadBlob(filename: string, contentType: string, body: Uint8Array | string) {
  const blob = new Blob([body as any], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ImportPurchasesDialog({
  open,
  submitting,
  vendors,
  onClose,
  onImportSuccess,
}: ImportPurchasesDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [validationResult, setValidationResult] = useState<ExcelImportValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [base64File, setBase64File] = useState<string | null>(null);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const downloadTemplate = () => {
    const file = buildPurchaseImportTemplateExcel(vendors);
    downloadBlob(file.filename, file.contentType, file.body);
  };

  const toBase64 = (file: globalThis.File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = error => reject(error);
  });

  const processFile = async (file: globalThis.File) => {
    setValidationResult(null);
    setFileName(file.name);
    setBase64File(null);

    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx")) {
      setValidationResult({
        isValid: false,
        totalInvoicesCount: 0,
        totalItemsCount: 0,
        totalChargesCount: 0,
        totalGrandAmount: 0,
        bills: [],
        warnings: [],
        errors: [{
          sheet: "File",
          rowNumber: 1,
          invoiceNumber: "FORMAT_ERROR",
          field: "File Format",
          problem: "Unsupported file format. Please upload an .xlsx Excel workbook.",
          suggestedFix: "Use the official .xlsx template and do not upload CSVs or other formats."
        }]
      });
      return;
    }

    setIsValidating(true);
    try {
      const base64 = await toBase64(file);
      setBase64File(base64);

      const response = await fetch("/api/v1/purchase/bills/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate_only",
          fileName: file.name,
          fileContent: base64
        })
      });

      const payload = await safeResponseJson(response);
      setValidationResult(payload.data.validationResult);
    } catch (err) {
      setValidationResult({
        isValid: false,
        totalInvoicesCount: 0,
        totalItemsCount: 0,
        totalChargesCount: 0,
        totalGrandAmount: 0,
        bills: [],
        warnings: [],
        errors: [{
          sheet: "API",
          rowNumber: 1,
          invoiceNumber: "NETWORK_ERROR",
          field: "Network",
          problem: err instanceof Error ? err.message : "Failed to connect to validation server.",
          suggestedFix: "Check your internet connection and try again."
        }]
      });
    } finally {
      setIsValidating(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || !validationResult.isValid || !base64File) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/v1/purchase/bills/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileContent: base64File
        })
      });

      const payload = await safeResponseJson(response);
      if (payload.data.success) {
        setImportSuccessCount(payload.data.createdCount || validationResult.totalInvoicesCount);
      }
    } catch (err: any) {
      // Fallback in case of runtime failure during import
      console.error(err);
      const msg = err?.message || "Unknown error";
      const reason = msg.length > 300 ? "... " + msg.slice(-250) : msg;
      alert(`An error occurred during import: ${reason}. Please try again.`);
    } finally {
      setIsImporting(false);
    }
  };

  const buildErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return;
    
    let csv = "Sheet,Row,Invoice Number,Field,Error Problem,Suggested Fix\n";
    for (const err of validationResult.errors) {
      const row = [
        err.sheet,
        err.rowNumber,
        err.invoiceNumber,
        err.field,
        err.problem,
        err.suggestedFix
      ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      csv += row.join(",") + "\n";
    }
    downloadBlob("import-error-report.csv", "text/csv", csv);
  };

  if (importSuccessCount !== null) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
            <CheckCircle2 size={38} className="animate-in bounce-in duration-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900">Import Complete</h3>
            <p className="text-sm text-slate-600">
              Successfully imported <strong className="text-emerald-700 font-extrabold text-lg">{importSuccessCount}</strong> purchase invoices.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-1 text-left">
            <p><strong>Invoices imported:</strong> {validationResult?.totalInvoicesCount || importSuccessCount}</p>
            <p><strong>Items imported:</strong> {validationResult?.totalItemsCount || 0}</p>
            <p><strong>Charges imported:</strong> {validationResult?.totalChargesCount || 0}</p>
            <p className="pt-2 mt-2 border-t border-emerald-200/60 font-bold">Total: ₹{validationResult?.totalGrandAmount?.toLocaleString() || 0}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const count = importSuccessCount;
              setImportSuccessCount(null);
              setValidationResult(null);
              setFileName("");
              onImportSuccess(count);
            }}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition cursor-pointer"
          >
            View Purchases
          </button>
        </div>
      </div>
    );
  }

  // View modes
  const isUploadMode = !validationResult && !isValidating;
  const isPreviewMode = validationResult && validationResult.isValid;
  const isErrorMode = validationResult && !validationResult.isValid;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import Purchases from Excel"
        className="w-full max-w-3xl flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                <FileSpreadsheet className="w-3.5 h-3.5 text-violet-600" />
                Excel Importer
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold text-slate-900">
              Import Purchases
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 md:p-8">
          {isUploadMode && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
                  isDragging
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void processFile(file);
                  }}
                  className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                  aria-label="Upload your purchase Excel workbook"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm mb-4">
                  <Upload className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Upload your purchase Excel or CSV file</h3>
                <p className="mt-2 text-sm text-slate-500">
                  [ Drag & Drop file here ] <span className="mx-2">or</span> [ <span className="text-violet-600 font-semibold underline decoration-violet-300 underline-offset-2">Choose File</span> ]
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Supported formats: <span className="rounded-md bg-slate-200 px-2.5 py-1 text-slate-700 font-bold">.xlsx</span> <span className="rounded-md bg-slate-200 px-2.5 py-1 text-slate-700 font-bold">.csv</span>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                >
                  <Download size={18} /> [ Download Template ]
                </button>
              </div>
            </div>
          )}

          {isValidating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in duration-300">
              <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-slate-900">Preparing for validation...</p>
                <p className="text-xs text-slate-500 mt-1">Checking {fileName}</p>
              </div>
            </div>
          )}

          {isPreviewMode && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                <File className="text-violet-600 h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Selected file:</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{fileName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Status:</p>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Validated</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-4">Import Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Invoices</p>
                    <p className="text-2xl font-black text-slate-900">{validationResult.totalInvoicesCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Items</p>
                    <p className="text-2xl font-black text-slate-900">{validationResult.totalItemsCount}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Charges</p>
                    <p className="text-2xl font-black text-slate-900">{validationResult.totalChargesCount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-slate-600 font-medium">Subtotal:</span>
                      <span className="font-bold">₹{validationResult.bills.reduce((sum, b) => sum + (b.previewSubtotal || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-slate-600 font-medium">GST:</span>
                      <span className="font-bold">₹{validationResult.bills.reduce((sum, b) => sum + (b.previewTax || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 text-sm">
                      <span className="text-slate-600 font-medium">Charges:</span>
                      <span className="font-bold">₹{validationResult.bills.reduce((sum, b) => sum + (b.freightAmount || 0) + (b.otherCharges || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 text-base bg-slate-50/50 rounded-b-xl">
                      <span className="text-slate-900 font-bold">Grand Total:</span>
                      <span className="font-black text-violet-700">₹{validationResult.totalGrandAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Vendor Mapping:</h4>
                      <p className="text-sm text-slate-600"><span className="font-bold text-emerald-600">{validationResult.bills.length} matched</span></p>
                      <p className="text-sm text-slate-600">0 missing</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 mb-2">Product/SKU Mapping:</h4>
                      <p className="text-sm text-slate-600"><span className="font-bold text-emerald-600">{validationResult.totalItemsCount} matched</span></p>
                      <p className="text-sm text-slate-600">0 missing</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isErrorMode && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 bg-rose-50 px-4 py-3 rounded-xl border border-rose-200">
                <File className="text-rose-600 h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-rose-700">Selected file:</p>
                  <p className="text-sm font-bold text-rose-900 truncate">{fileName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-rose-700">Status:</p>
                  <p className="text-sm font-bold text-rose-700 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Validation Failed</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-rose-900">Import Validation Failed</h3>
                  <button
                    onClick={buildErrorReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> [ Download Error Report ]
                  </button>
                </div>

                <div className="border border-rose-200 rounded-xl overflow-hidden divide-y divide-rose-100 max-h-80 overflow-y-auto custom-scrollbar">
                  {validationResult.errors.map((err, idx) => (
                    <div key={idx} className="p-4 bg-rose-50/30">
                      <div className="grid grid-cols-[auto_1fr] gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-500 mt-0.5" />
                        <div>
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs font-bold text-rose-900 mb-1">
                            <span>Sheet: {err.sheet}</span>
                            <span>•</span>
                            <span>Row: {err.rowNumber}</span>
                            <span>•</span>
                            <span>Field: {err.field}</span>
                          </div>
                          <p className="text-sm font-semibold text-rose-800">{err.problem}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          {(isPreviewMode || isErrorMode) && (
            <button
              type="button"
              onClick={() => {
                setValidationResult(null);
                setFileName("");
                setBase64File(null);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
            >
              [ Cancel ]
            </button>
          )}

          {(!isUploadMode && !isValidating) && (
            <button
              type="button"
              disabled={isErrorMode || isImporting || submitting}
              onClick={() => void handleConfirmImport()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold transition shadow-sm active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isImporting || submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <PackageCheck className="w-5 h-5" />
                  [ Confirm Import ]
                </>
              )}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
