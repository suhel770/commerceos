"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload, X } from "lucide-react";

import {
  extractPanFromGstin,
  stateNameFromGstin,
  type CreateVendorInput,
  type Vendor,
  type VendorRegistrationType,
} from "@/lib/purchase";

type BulkUploadVendorsDialogProps = {
  open: boolean;
  submitting: boolean;
  onClose(): void;
  onBulkCreate(vendors: CreateVendorInput[]): Promise<Vendor[] | null>;
};

const SAMPLE_CSV = `Vendor Name,Registration Type,GSTIN,PAN,Phone,Email,Contact Person,Address,City,State,Pincode,Bank Name,Account Name,Account Number,IFSC Code,Status,Notes
AgraSole Traders,Regular (With GST),09AAKFA4410Q1Z8,AAKFA4410Q,+91 9822001122,orders@agrasole.com,Rajesh Gupta,"12 Industrial Area",Agra,Uttar Pradesh,282001,HDFC Bank,AgraSole Traders,9988776655,HDFC0001234,Active (Purchasable),Primary footwear supplier
Nova Footwear,Regular (With GST),33AABCN6821F1Z2,AABCN6821F,+91 9444012345,contact@nova.in,Senthil Kumar,"45 Mount Road",Chennai,Tamil Nadu,600002,State Bank of India,Nova Footwear,8877665544,SBIN0000123,Active (Purchasable),Leather boots vendor
ShipFast Logistics,Regular (With GST),27AAGCS7712K1Z4,AAGCS7712K,+91 9890098900,support@shipfast.com,Vikram Shah,"88 Freight Complex",Mumbai,Maharashtra,400099,Axis Bank,ShipFast Logistics,7766554433,UTIB0000456,Active (Purchasable),Inward transport logistics
PixelReach Media,Unregistered (Without GST),,,+91 9811098110,billing@pixelreach.agency,Ananya Roy,"202 Creative Park",New Delhi,Delhi,110001,Kotak Bank,PixelReach Media,6655443322,KKBK0000789,Active (Purchasable),Digital advertising agency
LabelMark Stickers,Composition (With GST),27AADFL2201P1ZB,AADFL2201P,+91 98920 77889,hello@labelmark.in,Farhan Qureshi,"Shop 22, Dharavi Industrial Lane",Mumbai,Maharashtra,400017,ICICI Bank,LabelMark Stickers,1122334455,ICIC0005678,Active (Purchasable),Primary sticker vendor
`;

function normalizeRegistrationType(val?: string | null): VendorRegistrationType {
  if (!val) return "regular";
  const l = val.trim().toLowerCase();
  if (l.includes("composition")) return "composition";
  if (l.includes("tax_deductor") || l.includes("collector") || l.includes("deductor")) return "tax_deductor_collector";
  if (l.includes("unregistered") || l.includes("without gst")) return "unregistered";
  if (l.includes("unknown")) return "unknown";
  return "regular";
}

function normalizeVendorStatus(val?: string | null): "active" | "blocked" | "inactive" {
  if (!val) return "active";
  const l = val.trim().toLowerCase();
  if (l.includes("block")) return "blocked";
  if (l.includes("inactive")) return "inactive";
  return "active";
}

export default function BulkUploadVendorsDialog({
  open,
  submitting,
  onClose,
  onBulkCreate,
}: BulkUploadVendorsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsedVendors, setParsedVendors] = useState<CreateVendorInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const downloadDemoTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "commerceos_vendors_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = (file: File) => {
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        // Parse CSV or JSON
        if (file.name.endsWith(".json")) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            setParsedVendors(json as CreateVendorInput[]);
          }
          return;
        }

        // Quote-aware CSV parser
        function parseCsvLine(lineText: string): string[] {
          const result: string[] = [];
          let cur = "";
          let inQuotes = false;
          for (let i = 0; i < lineText.length; i++) {
            const char = lineText[i];
            if (char === '"') {
              if (inQuotes && lineText[i + 1] === '"') {
                cur += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === "," && !inQuotes) {
              result.push(cur.trim());
              cur = "";
            } else {
              cur += char;
            }
          }
          result.push(cur.trim());
          return result.map((c) => c.replace(/^"|"$/g, "").trim());
        }

        function normalizeHeaderKey(rawHeader: string): string {
          const h = rawHeader.toLowerCase().replace(/[^a-z0-9]/g, "");

          if (h.includes("vendorcode") || h.includes("suppliercode") || h === "code" || h === "vendorid" || h === "supplierid" || h === "id") {
            return "code";
          }
          if (h.includes("vendorname") || h.includes("suppliername") || h === "name" || h === "vendor" || h === "supplier") {
            return "name";
          }
          if (h.includes("registrationtype") || h.includes("regtype") || h.includes("registration")) {
            return "registrationType";
          }
          if (h.includes("gstin") || h.includes("gstno") || h.includes("gstnumber") || h === "gst") {
            return "gstin";
          }
          if (h.includes("pan") || h.includes("tannumber") || h === "tan" || h.includes("pantan")) {
            return "pan";
          }
          if (h.includes("phonenumber") || h.includes("phone") || h.includes("mobile") || h.includes("contactno") || h.includes("telephone")) {
            return "phone";
          }
          if (h.includes("email") || h.includes("mail")) {
            return "email";
          }
          if (h.includes("contactperson") || h.includes("contactname") || h === "contact" || h.includes("person")) {
            return "contactPerson";
          }
          if (h.includes("address") || h.includes("street")) {
            return "address";
          }
          if (h.includes("city") || h.includes("town") || h.includes("district")) {
            return "city";
          }
          if (h.includes("state") || h.includes("province") || h === "ut") {
            return "state";
          }
          if (h.includes("pincode") || h.includes("pin") || h.includes("zip") || h.includes("postal")) {
            return "pincode";
          }
          if (h.includes("bankname") || h === "bank") {
            return "bankName";
          }
          if (h.includes("accountname") || h.includes("accname") || h.includes("accountholder")) {
            return "bankAccountName";
          }
          if (h.includes("accountnumber") || h.includes("accountno") || h.includes("accno") || h.includes("accnumber")) {
            return "bankAccountNumber";
          }
          if (h.includes("ifsc") || h.includes("ifsccode")) {
            return "bankIfsc";
          }
          if (h.includes("paymentterms") || h.includes("creditdays") || h.includes("terms")) {
            return "paymentTermsDays";
          }
          if (h.includes("leadtime") || h.includes("deliverytime")) {
            return "leadTimeDays";
          }
          if (h.includes("status") || h.includes("vendorstatus")) {
            return "status";
          }
          if (h.includes("notes") || h.includes("remarks") || h.includes("comments")) {
            return "notes";
          }
          return rawHeader.trim();
        }

        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setError("CSV file must contain a header row and at least one data row.");
          return;
        }

        const rawHeaders = parseCsvLine(lines[0]);
        const normalizedHeaders = rawHeaders.map(normalizeHeaderKey);
        const list: CreateVendorInput[] = [];

        const addressIdx = normalizedHeaders.indexOf("address");

        for (let i = 1; i < lines.length; i++) {
          let cols = parseCsvLine(lines[i]);
          if (!cols[0]) continue;

          // Heuristic address repair: if row has 1 extra column and split occurred at unquoted comma in address
          if (addressIdx !== -1 && cols.length === normalizedHeaders.length + 1 && cols[addressIdx]) {
            cols = [
              ...cols.slice(0, addressIdx),
              `${cols[addressIdx]}, ${cols[addressIdx + 1]}`,
              ...cols.slice(addressIdx + 2),
            ];
          }

          const rowData: Record<string, string> = {};
          normalizedHeaders.forEach((normKey, idx) => {
            rowData[normKey] = cols[idx] ?? "";
          });

          const rawEmail = (rowData.email || "").trim();
          const cleanEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : undefined;
          const gstinVal = rowData.gstin?.trim() || undefined;
          const panVal = rowData.pan?.trim() || extractPanFromGstin(gstinVal) || undefined;

          let stateVal = rowData.state?.trim() || undefined;
          let pincodeVal = rowData.pincode?.trim() || undefined;
          let contactVal = rowData.contactPerson?.trim() || undefined;

          // Auto-populate state from GSTIN if state is missing
          if (!stateVal && gstinVal) {
            stateVal = stateNameFromGstin(gstinVal) || undefined;
          }

          list.push({
            name: (rowData.name || cols[0]).trim(),
            registrationType: normalizeRegistrationType(rowData.registrationType),
            gstin: gstinVal,
            pan: panVal,
            phone: rowData.phone?.trim() || undefined,
            email: cleanEmail,
            address: rowData.address?.trim() || undefined,
            city: rowData.city?.trim() || undefined,
            state: stateVal,
            pincode: pincodeVal ? pincodeVal.slice(0, 20) : undefined,
            contactPerson: contactVal,
            bankName: rowData.bankName?.trim() || undefined,
            bankAccountName: rowData.bankAccountName?.trim() || undefined,
            bankAccountNumber: rowData.bankAccountNumber?.trim() || undefined,
            bankIfsc: rowData.bankIfsc?.trim() || undefined,
            paymentTermsDays: Number(rowData.paymentTermsDays) || 30,
            leadTimeDays: Number(rowData.leadTimeDays) || 7,
            notes: rowData.notes?.trim() || undefined,
          });
        }

        if (!list.length) {
          setError("No valid vendor rows found in CSV file.");
          return;
        }

        setParsedVendors(list);
      } catch {
        setError("Failed to parse vendor file. Please use the demo template format.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!parsedVendors.length) {
      setError("Please select a valid CSV file with vendor entries.");
      return;
    }

    const created = await onBulkCreate(parsedVendors);
    if (created) {
      setCompletedCount(created.length || parsedVendors.length);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {completedCount !== null ? (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 size={38} className="animate-in bounce-in duration-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Process Complete! 🎉</h3>
              <p className="text-xs text-slate-600">
                Successfully imported <strong className="text-emerald-700 font-extrabold text-sm">{completedCount}</strong> vendor record{completedCount === 1 ? "" : "s"} into CommerceOS.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-800 space-y-1 text-left">
              <div className="flex items-center justify-between font-bold border-b border-emerald-200/60 pb-1.5 mb-1.5">
                <span>Total Vendors Processed:</span>
                <span className="font-mono text-sm">{completedCount}</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                ✓ Unique permanent Vendor Codes assigned automatically<br />
                ✓ Vendor Master database updated instantly
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCompletedCount(null);
                setParsedVendors([]);
                setFileName("");
                onClose();
              }}
              className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition cursor-pointer"
            >
              Done & View Vendors
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Bulk Upload Vendors</h3>
                <p className="text-xs text-slate-500">Import suppliers via CSV or Excel file</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            {error}
          </div>
        ) : null}

        {/* STEP 1: DOWNLOAD DEMO TEMPLATE */}
        <div className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-violet-900">Demo Excel Template</p>
              <p className="text-[11px] text-violet-700">Download formatted CSV template with all fields</p>
            </div>
          </div>
          <button
            type="button"
            onClick={downloadDemoTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm border border-violet-200 hover:bg-violet-100"
          >
            <Download size={14} />
            Download
          </button>
        </div>

        {/* STEP 2: UPLOAD FILE AREA */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Upload CSV / Excel File
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
              isDragging
                ? "border-violet-600 bg-violet-100/70 scale-[1.01]"
                : "border-slate-300 bg-slate-50 hover:border-violet-500 hover:bg-violet-50/50"
            }`}
          >
            <Upload size={24} className={`mb-2 transition ${isDragging ? "text-violet-600 animate-bounce" : "text-slate-400"}`} />
            <p className="text-sm font-semibold text-slate-800">
              {fileName || (isDragging ? "Drop your vendor file here!" : "Click to browse or drop vendor file")}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Supports .csv or .json files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        {parsedVendors.length > 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>Ready to import {parsedVendors.length} vendors</span>
            <span className="text-[11px] text-emerald-600 font-normal">Parsed cleanly</span>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || parsedVendors.length === 0}
            onClick={() => void handleUploadSubmit()}
            className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? "Importing..." : `Import ${parsedVendors.length || ""} Vendors`}
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
