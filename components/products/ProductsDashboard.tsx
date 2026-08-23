"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Globe,
  Image as ImageIcon,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import CommerceSelect from "@/components/ui/CommerceSelect";

export type MasterProduct = {
  id: string; // Immutable Master Product ID (UUID)
  name: string;
  sku: string;
  brand: string;
  category: string;
  supplier: string;
  image: string;
  sellingPrice: number;
  costPrice: number;
  stockBalance: number;
  hsn: string;
  gstRate: number;
  readinessScore: number; // 0-100%
  channelStatus: {
    amazon: "active" | "error" | "pending";
    flipkart: "active" | "error" | "pending";
    shopify: "active" | "error" | "pending";
  };
  lifecycle: "active" | "conception" | "phase_out" | "discontinued";
  approvalStatus: "approved" | "pending_review" | "draft";
  variantsCount: number;
  updatedAt: string;
};

type ProductAdvisorRec = {
  id: string;
  title: string;
  reason: string;
  confidence: number;
  businessImpact: string;
  revenueOpportunity: string;
  timeSaved: string;
  actionLabel: string;
};

const INITIAL_PRODUCTS: MasterProduct[] = [];

const INITIAL_AI_RECS: ProductAdvisorRec[] = [
  {
    id: "rec-p1",
    title: "Fix Amazon Listing Attribute Error for Rain Poncho",
    reason: "Amazon requires 'Water Resistance Level' attribute. Adding this resolves the listing sync error.",
    confidence: 96,
    businessImpact: "Unblocks sales on Amazon Marketplace",
    revenueOpportunity: "₹34,000 / month",
    timeSaved: "10 mins",
    actionLabel: "Autofill Attribute & Sync",
  },
  {
    id: "rec-p2",
    title: "Optimize Title for StrideKids Sandal Olive",
    reason: "Adding keywords 'Waterproof School Sandals for Boys & Girls' boosts organic search ranking by +28%.",
    confidence: 91,
    businessImpact: "Boosts conversion rate & search impressions",
    revenueOpportunity: "₹18,500 / month",
    timeSaved: "5 mins",
    actionLabel: "Apply Optimized Title",
  },
];

const INSPECTOR_TABS = [
  ["overview", "Overview"],
  ["inventory", "Inventory"],
  ["purchase", "Purchase History"],
  ["warehouses", "Warehouses"],
  ["listings", "Marketplace Listings"],
  ["orders", "Sales & Orders"],
  ["returns", "Returns & Defect Rate"],
  ["media", "Media & Assets"],
  ["seo", "SEO & Search"],
  ["attributes", "Attributes"],
  ["variants", "Variants"],
  ["mapping", "Channel Mapping"],
  ["compliance", "Compliance & HSN"],
  ["audit", "Audit Trail"],
  ["ai", "AI Insights"],
  ["bom", "BOM / Manufacturing"],
] as const;

export default function ProductsDashboard() {
  const [products] = useState<MasterProduct[]>(INITIAL_PRODUCTS);
  const [aiRecs] = useState<ProductAdvisorRec[]>(INITIAL_AI_RECS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<string>("overview");

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      const matchStatus =
        statusFilter === "all" || p.approvalStatus === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const avgReadiness = useMemo(
    () =>
      Math.round(
        products.reduce((acc, p) => acc + p.readinessScore, 0) / products.length,
      ),
    [products],
  );

  return (
    <div className="space-y-4">
      {/* Top Page Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Master Product Information Management (PIM)
          </span>
          <h1 className="text-lg font-bold text-slate-900">
            Universal Product Engine
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Globe className="h-3.5 w-3.5" />
            Import Catalog
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Master Product
          </button>
        </div>
      </div>

      {/* TIER 1: TODAY'S PRODUCT FOCUS & CATALOG HEALTH */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's Product Focus */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Catalog Operational Priorities
              </span>
              <h2 className="mt-0.5 text-base font-bold text-slate-900">
                Which products need your attention today?
              </h2>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              {products.length} Master SKUs Active
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Marketplace Errors (1 SKU)
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Missing Attributes (1 SKU)
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <Tag className="h-3.5 w-3.5" />
              Pending Approval (1 SKU)
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Opportunities (2 SKUs)
            </button>
          </div>
        </div>

        {/* Catalog Health Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Catalog Health Score
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {avgReadiness}%
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  Ready to Sell
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Package className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Images & Gallery</span>
              <span className="font-bold text-emerald-600">100% Complete</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Attributes & HSN</span>
              <span className="font-bold text-emerald-600">92% Complete</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>SEO Titles & Meta</span>
              <span className="font-bold text-amber-600">85% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: MARKETPLACE READINESS STRIP */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Marketplace Channel Readiness — Which products cannot currently be sold?
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Channel Matrix (Amazon, Flipkart, Shopify)
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Amazon India</span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              3/4 Active (1 Error)
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Flipkart</span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              3/4 Active (1 Pending)
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Shopify D2C</span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              4/4 Active (100%)
            </span>
          </div>
        </div>
      </div>

      {/* WORKSPACE FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, Master SKU, brand..."
              className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="w-48">
            <CommerceSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: "all", label: "All Categories" },
                { value: "Footwear / Sandals", label: "Footwear / Sandals" },
                { value: "Apparel / Rainwear", label: "Apparel / Rainwear" },
                { value: "Packaging Supplies", label: "Packaging Supplies" },
              ]}
            />
          </div>

          <div className="w-44">
            <CommerceSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "approved", label: "Approved" },
                { value: "pending_review", label: "Pending Review" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of {products.length} Master Products
        </p>
      </div>

      {/* TIER 3: MASTER PRODUCT WORKSTATION TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Master SKU</th>
                <th className="px-4 py-3">Brand & Category</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Cost Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">Readiness</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className="cursor-pointer transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {typeof product.image === "string" && product.image.trim().length > 0 && product.image !== "{}" ? (
                        <img
                          src={product.image}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {product.variantsCount} Variant(s) · HSN: {product.hsn}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                    {product.sku}
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{product.brand}</p>
                    <p className="text-[11px] text-slate-500">{product.category}</p>
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    ₹{product.sellingPrice.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-600">
                    ₹{product.costPrice.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {product.stockBalance.toLocaleString()} units
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        product.readinessScore >= 90
                          ? "bg-emerald-100 text-emerald-700"
                          : product.readinessScore >= 70
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {product.readinessScore}% Ready
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        product.approvalStatus === "approved"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {product.approvalStatus.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductId(product.id);
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition"
                    >
                      Inspect PIM
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRODUCT ADVISOR (AI RECOMMENDATIONS) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h2 className="text-base font-bold text-slate-900">
              Product Advisor Intelligence
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Explains Reason, Confidence & Estimated Revenue Opportunity
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {aiRecs.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/60 to-white p-4 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{rec.title}</span>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 font-bold text-violet-700">
                  {rec.confidence}% Confidence
                </span>
              </div>
              <p className="text-slate-600">{rec.reason}</p>
              <div className="flex items-center justify-between text-slate-700 pt-2 border-t border-violet-100">
                <span>Business Impact: <strong className="text-slate-900">{rec.businessImpact}</strong></span>
                <span>Opportunity: <strong className="text-emerald-700">{rec.revenueOpportunity}</strong></span>
              </div>
              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-violet-600 py-1.5 font-semibold text-white hover:bg-violet-700 transition"
              >
                {rec.actionLabel}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CONTEXTUAL 16-TAB PRODUCT INSPECTOR DRAWER */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedProductId(null)}
              className="fixed inset-0 z-[90] cursor-default bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed inset-y-0 right-0 z-[100] flex h-screen w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="border-b border-slate-200 px-5 pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProduct.image}
                      alt=""
                      className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                    />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">
                        Master ID: {selectedProduct.id} · SKU: {selectedProduct.sku}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProductId(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 16 Tab Selector Bar */}
                <div className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 pt-1 pb-2 scrollbar-thin">
                  {INSPECTOR_TABS.map(([tabId, tabLabel]) => (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setInspectorTab(tabId)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        inspectorTab === tabId
                          ? "bg-violet-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tabLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 uppercase">
                      Active Tab: {inspectorTab}
                    </span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
                      Readiness: {selectedProduct.readinessScore}%
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-slate-500">Brand</dt>
                      <dd className="font-bold text-slate-900">{selectedProduct.brand}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Category</dt>
                      <dd className="font-bold text-slate-900">{selectedProduct.category}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Primary Supplier</dt>
                      <dd className="font-bold text-slate-900">{selectedProduct.supplier}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">HSN & Tax</dt>
                      <dd className="font-bold text-slate-900">{selectedProduct.hsn} ({selectedProduct.gstRate}% GST)</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Selling Price</dt>
                      <dd className="font-bold text-slate-900">₹{selectedProduct.sellingPrice.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Cost Price</dt>
                      <dd className="font-bold text-slate-900">₹{selectedProduct.costPrice.toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
