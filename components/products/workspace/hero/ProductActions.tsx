"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Archive,
  Copy,
  Pencil,
  ShieldAlert,
  AlertTriangle,
  Barcode,
  Printer,
  X,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import type { ProductWorkspaceNavigate } from "../types";
import { getProductSlug } from "@/lib/products/slug";
import { generateCode128SvgString } from "@/lib/storage/barcode/code128";

interface ProductActionsProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

export default function ProductActions({
  product,
  onNavigate,
}: ProductActionsProps) {
  const router = useRouter();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const barcodeSvg = generateCode128SvgString(product.sku, {
    height: 48,
    moduleWidth: 2,
  });

  const handlePrintBarcode = () => {
    const printWindow = window.open("", "_blank", "width=400,height=300");
    if (!printWindow) {
      window.print();
      return;
    }

    const mrpText = product.pricing?.mrp ? ` · MRP: ₹${product.pricing.mrp}` : "";
    const sizeText = product.size ? ` · Size: ${product.size}` : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode_${product.sku}</title>
          <style>
            @page {
              size: 50mm 25mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              width: 50mm;
              height: 25mm;
              padding: 2mm 3mm;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: #ffffff;
              overflow: hidden;
            }
            .name {
              font-size: 8.5pt;
              font-weight: 800;
              color: #000000;
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              line-height: 1.1;
            }
            .meta {
              font-size: 6.5pt;
              font-weight: 700;
              color: #333333;
              margin-top: 1px;
              line-height: 1;
            }
            .barcode-wrap {
              margin-top: 2px;
              margin-bottom: 1px;
              display: flex;
              justify-content: center;
              align-items: center;
              width: 100%;
            }
            .barcode-wrap svg {
              height: 28px;
              width: 92%;
              max-width: 42mm;
            }
            .sku {
              font-size: 7pt;
              font-family: monospace;
              font-weight: 900;
              letter-spacing: 0.8px;
              color: #000000;
              line-height: 1;
            }
          </style>
        </head>
        <body>
          <div class="name">${product.name}</div>
          <div class="meta">ID: ${product.productId || "PRD-000101"}${mrpText}${sizeText}</div>
          <div class="barcode-wrap">${barcodeSvg}</div>
          <div class="sku">${product.sku}</div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.close();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleArchiveConfirm = async () => {
    setArchiving(true);
    try {
      await fetch(`/api/v1/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Archived" }),
      });
      setShowArchiveConfirm(false);
      router.push("/products/list");
    } catch {
      alert("Failed to archive product. Please try again.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Actions</h2>
        <p className="mt-0.5 text-xs text-slate-500 font-semibold">
          Master commands for this SKU
        </p>
      </div>

      <div className="mt-4 space-y-1.5">
        <ActionButton
          primary
          icon={<Pencil size={15} />}
          title="Edit Product"
          subtitle="Open Product Studio"
          onClick={() => {
            // Use the current page's pathname as the `from` return destination,
            // so the back button in Product Studio returns here (product detail), not to /products/list.
            const currentPath = typeof window !== "undefined"
              ? window.location.pathname
              : `/products/${getProductSlug(product)}`;
            const slug = getProductSlug(product);
            router.push(`/products/${slug}/edit?from=${encodeURIComponent(currentPath)}`);
          }}
        />

        <ActionButton
          amber
          icon={<Copy size={15} />}
          title="Duplicate"
          subtitle="Clone master catalog entry"
          onClick={() =>
            router.push(
              `/products/list?duplicate=${encodeURIComponent(getProductSlug(product))}`,
            )
          }
        />

        <ActionButton
          blue
          icon={<Barcode size={15} />}
          title="Barcode Label"
          subtitle="Print packaging sticker"
          onClick={() => setShowBarcodeModal(true)}
        />

        <ActionButton
          orange
          icon={<ShieldAlert size={15} />}
          title="Wrong Return"
          subtitle="File courier claim"
          onClick={() => onNavigate("returns")}
        />

        <ActionButton
          danger
          icon={<Archive size={15} />}
          title="Archive Product"
          subtitle="Remove from active catalog"
          onClick={() => setShowArchiveConfirm(true)}
        />
      </div>

      {/* BARCODE PRINT MODAL */}
      {showBarcodeModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Barcode size={18} />
                <h3 className="text-sm font-black text-slate-900">Product Barcode Label</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBarcodeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* STICKER PREVIEW BOX */}
            <div className="my-5 p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center text-center">
              <div className="w-full max-w-[300px] rounded-xl bg-white p-4 border border-slate-200 shadow-2xs flex flex-col items-center">
                <h4 className="text-xs font-black text-slate-900 line-clamp-1 max-w-[280px]">
                  {product.name}
                </h4>
                
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mt-1">
                  <span>ID: {product.productId || "PRD-000101"}</span>
                  {product.pricing?.mrp ? <span>· MRP: ₹{product.pricing.mrp}</span> : null}
                  {product.color ? <span>· {product.color}</span> : null}
                  {product.size ? <span>· Size {product.size}</span> : null}
                </div>

                {/* Barcode SVG constrained within container */}
                <div
                  className="mt-3 flex w-full max-w-[240px] items-center justify-center overflow-hidden [&>svg]:h-11 [&>svg]:w-full [&>svg]:max-w-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />

                <span className="mt-1 text-xs font-mono font-black tracking-widest text-slate-900">
                  {product.sku}
                </span>
              </div>

              <span className="mt-2 text-[10px] font-medium text-slate-400">
                Standard 50 × 25 mm Thermal Adhesive Label Format
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBarcodeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintBarcode}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition cursor-pointer active:scale-95"
              >
                <Printer size={13} />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showArchiveConfirm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Archive Product {product.sku}?
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Archiving <strong className="text-slate-900">{product.name}</strong> will remove it from active seller views and pause marketplace inventory synchronization. Historical orders and financial records will remain preserved.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={archiving}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={archiving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                {archiving ? "Archiving..." : "Yes, Archive Product"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  onClick,
  primary,
  blue,
  amber,
  orange,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  primary?: boolean;
  blue?: boolean;
  amber?: boolean;
  orange?: boolean;
  danger?: boolean;
}) {
  let button =
    "border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs";
  let iconBg = "bg-slate-100 text-slate-600";
  let titleColor = "text-slate-900";
  let subtitleColor = "text-slate-500";

  if (primary) {
    button =
      "border-blue-600 bg-blue-600 text-white shadow-2xs hover:bg-blue-700";
    iconBg = "bg-white/20 text-white";
    titleColor = "text-white";
    subtitleColor = "text-blue-100";
  }

  if (blue) iconBg = "bg-sky-50 text-sky-600 border border-sky-100";
  if (amber) iconBg = "bg-amber-50 text-amber-600 border border-amber-100";
  if (orange) iconBg = "bg-orange-50 text-orange-600 border border-orange-100";

  if (danger) {
    button = "border-rose-200 bg-rose-50/50 hover:bg-rose-50";
    iconBg = "bg-rose-100 text-rose-600";
    titleColor = "text-rose-700";
    subtitleColor = "text-rose-500";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 cursor-pointer ${button}`}
    >
      <div
        className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl shadow-2xs ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-bold leading-tight ${titleColor}`}>
          {title}
        </p>
        <p className={`mt-0.5 text-[11px] font-medium leading-tight ${subtitleColor}`}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}
