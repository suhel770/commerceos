"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
} from "lucide-react";
import type { Product } from "@/lib/types/product";
import { calculateProductHealth } from "@/lib/products/health-score";
import Link from "next/link";

interface ProductPreviewDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductPreviewDrawer({
  product,
  isOpen,
  onClose,
}: ProductPreviewDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !product) return null;

  const health = calculateProductHealth(product);
  const ats = product.inventory?.available ?? 0;
  const reserved = product.inventory?.reserved ?? 0;
  const damaged = product.inventory?.damaged ?? 0;
  const slug = product.slug || product.sku?.toLowerCase() || product.id;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs cursor-default"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-base font-bold tracking-tight text-slate-900 line-clamp-1">
                      {product.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      SKU: <span className="font-mono font-semibold text-slate-700">{product.sku}</span> • Brand: {product.brand}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
                
                {/* Health & Completeness */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Product Health Score
                    </p>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${health.badgeClass}`}>
                      {health.grade}
                    </span>
                  </div>
                  <div className="flex items-end gap-2.5">
                    <h3 className="text-2xl font-bold text-slate-900">{health.score}%</h3>
                    <p className="text-xs text-slate-400 pb-0.5">Completeness criteria</p>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    {health.checks.map((check, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${check.passed ? "bg-emerald-500" : "bg-rose-400"}`} />
                          {check.label}
                        </span>
                        <span className={check.passed ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>
                          {check.passed ? "Complete" : "Missing"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Balances */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    Inventory Available (ATS)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase">Available</p>
                      <h4 className="text-lg font-bold text-slate-800 mt-0.5">{ats}</h4>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase">Reserved</p>
                      <h4 className="text-lg font-bold text-slate-800 mt-0.5">{reserved}</h4>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase">Damaged</p>
                      <h4 className="text-lg font-bold text-slate-800 mt-0.5">{damaged}</h4>
                    </div>
                  </div>
                </div>

                {/* Pricing & Commercials */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    Pricing & Commercials
                  </p>
                  <dl className="grid grid-cols-2 gap-y-2 text-xs font-medium text-slate-700">
                    <div>
                      <dt className="text-slate-500">Selling Price</dt>
                      <dd className="mt-0.5 text-sm font-bold text-slate-900">₹{product.pricing?.sellingPrice || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Cost Price</dt>
                      <dd className="mt-0.5 text-sm font-bold text-slate-900">₹{product.pricing?.costPrice || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">MRP</dt>
                      <dd className="mt-0.5 text-sm font-bold text-slate-900">₹{product.pricing?.mrp || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Profit Margin</dt>
                      <dd className="mt-0.5 text-sm font-bold text-purple-700">
                        {product.pricing?.margin ? `${product.pricing.margin}%` : "0%"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Marketplace Channels */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                    Marketplace readiness
                  </p>
                  {product.listings && product.listings.length > 0 ? (
                    <div className="space-y-2">
                      {product.listings.map((listing, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs font-semibold bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          <span className="capitalize">{listing.marketplace}</span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            listing.status === "active" || listing.listingStatus === "Live" 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-150" 
                              : "bg-slate-150 text-slate-600"
                          }`}>
                            {listing.status || listing.listingStatus || "Draft"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs font-medium text-slate-400">
                      Not connected to any sales channel
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-2 shrink-0">
                <Link
                  href={`/products/${slug}`}
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
                >
                  Open Product Workspace
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
