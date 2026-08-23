"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, FileSpreadsheet, Plus, X } from "lucide-react";

import {
  SHIPPING_MODE_LABELS,
  buildOrdersExcel,
  type ClaimType,
  type Order,
  type OrderDocumentType,
  type ShippingMode,
} from "@/lib/orders";
import { products } from "@/lib/mocks/products";
import ProductPagination from "@/components/shared/pagination/ProductPagination";
import CommerceSelect from "@/components/ui/CommerceSelect";
import { safeFetchJson, safeResponseJson } from "@/lib/api/client";

import OrderInspectorDrawer from "./OrderInspectorDrawer";
import OrdersDataTable from "./OrdersDataTable";
import OrdersFilterBar from "./OrdersFilterBar";
import OrdersKPIGrid from "./OrdersKPIGrid";
import OrdersStatusTabs from "./OrdersStatusTabs";
import {
  computeVisionKpis,
  computeVisionTabCounts,
  matchesSearch,
  matchesVisionTab,
  opsChip,
  requiresOrderConfirm,
  shippingModeLabel,
  type ShippingUiAction,
  type VisionTab,
} from "./order-ops";

const ORDER_PAGE_SIZES = [10, 25, 50, 100];
const CHANNELS = ["Manual", "Amazon", "Flipkart", "Myntra", "Meesho", "Shopify"] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<VisionTab>("pending");
  const [search, setSearch] = useState("");
  const [marketplace, setMarketplace] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shippingMode, setShippingMode] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [payment, setPayment] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sla, setSla] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [channel, setChannel] = useState<string>(CHANNELS[0]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const query = params.toString();
      const payload = await safeFetchJson<{ data: Order[] }>(
        query ? `/api/v1/orders?${query}` : "/api/v1/orders",
      );
      const data = payload.data as Order[];
      setOrders(data);
      setDetail((current) =>
        current ? (data.find((row) => row.id === current.id) ?? null) : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => computeVisionKpis(orders), [orders]);
  const tabCounts = useMemo(() => computeVisionTabCounts(orders), [orders]);

  const filterOptions = useMemo(() => {
    const marketplaces = new Set<string>();
    const warehouses = new Set<string>();
    const statuses = new Set<string>();
    const modes = new Set<string>();
    for (const order of orders) {
      marketplaces.add(order.channel);
      if (order.warehouseId) warehouses.add(order.warehouseId);
      statuses.add(opsChip(order).label);
      modes.add(order.shippingMode);
    }
    const all = (label: string) => [{ value: "all", label }];
    return {
      marketplaces: [
        ...all("Marketplaces"),
        ...Array.from(marketplaces).sort().map((value) => ({ value, label: value })),
      ],
      statuses: [
        ...all("Status"),
        ...Array.from(statuses).sort().map((value) => ({ value, label: value })),
      ],
      shippingModes: [
        ...all("Shipping Mode"),
        ...Array.from(modes)
          .sort()
          .map((value) => ({
            value,
            label: shippingModeLabel(value as ShippingMode),
          })),
      ],
      warehouses: [
        ...all("Warehouse"),
        ...Array.from(warehouses).sort().map((value) => ({ value, label: value })),
      ],
    };
  }, [orders]);

  const visible = useMemo(() => {
    return orders.filter((order) => {
      if (!matchesVisionTab(order, tab)) return false;
      if (!matchesSearch(order, search)) return false;
      if (marketplace !== "all" && order.channel !== marketplace) return false;
      if (statusFilter !== "all" && opsChip(order).label !== statusFilter) {
        return false;
      }
      if (shippingMode !== "all" && order.shippingMode !== shippingMode) {
        return false;
      }
      if (warehouse !== "all" && (order.warehouseId ?? "") !== warehouse) {
        return false;
      }
      if (payment !== "all" && order.paymentStatus !== payment) return false;
      if (priority !== "all" && order.priority !== priority) return false;
      if (sla === "breached" && !order.slaBreached) return false;
      if (sla === "ok" && order.slaBreached) return false;
      return true;
    });
  }, [
    orders,
    tab,
    search,
    marketplace,
    statusFilter,
    shippingMode,
    warehouse,
    payment,
    priority,
    sla,
  ]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [
    tab,
    search,
    marketplace,
    statusFilter,
    shippingMode,
    warehouse,
    payment,
    priority,
    sla,
    dateFrom,
    dateTo,
  ]);

  const totalItems = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = useMemo(
    () => visible.slice((safePage - 1) * pageSize, safePage * pageSize),
    [visible, safePage, pageSize],
  );

  const activeFilterCount = [
    marketplace !== "all",
    statusFilter !== "all",
    shippingMode !== "all",
    warehouse !== "all",
    payment !== "all",
    priority !== "all",
    sla !== "all",
    Boolean(dateFrom || dateTo),
    Boolean(search.trim()),
  ].filter(Boolean).length;

  const toInputDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyDatePreset = (days: number | null) => {
    if (days === null) {
      setDateFrom("");
      setDateTo("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setDateFrom(toInputDate(start));
    setDateTo(toInputDate(end));
  };

  const clearAllFilters = () => {
    setSearch("");
    setMarketplace("all");
    setStatusFilter("all");
    setShippingMode("all");
    setWarehouse("all");
    setPayment("all");
    setPriority("all");
    setSla("all");
    setDateFrom("");
    setDateTo("");
    setTab("pending");
  };

  const productOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        label: `${product.sku} · ${product.name}`,
        sku: product.sku,
        name: product.name,
        price: product.listings[0]?.sellingPrice ?? 0,
      })),
    [],
  );
  const selectedProduct = productOptions.find((row) => row.id === productId);

  const exportExcel = (scope: "visible" | "selected" = "visible") => {
    const rows =
      scope === "selected"
        ? orders.filter((order) => selectedIds.has(order.id))
        : visible;
    if (rows.length === 0) {
      setMessage(
        scope === "selected"
          ? "Select orders first to export."
          : "No orders to export for the current filters.",
      );
      return;
    }
    const excel = buildOrdersExcel(rows);
    const blob = new Blob([excel.body], { type: excel.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = excel.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${rows.length} order(s) to Excel.`);
  };

  const createOrder = async () => {
    if (!selectedProduct) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setMessage("Enter a positive quantity.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = await safeFetchJson<{ data: Order }>("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          paymentStatus: "paid",
          lines: [
            {
              productId: selectedProduct.id,
              sku: selectedProduct.sku,
              productName: selectedProduct.name,
              quantity: qty,
              unitPrice: selectedProduct.price,
            },
          ],
        }),
      });
      setDialogOpen(false);
      setMessage(`Created ${payload.data.orderNumber}.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (
    order: Order,
    action: { label: string; path: string; body?: object },
  ) => {
    setSubmitting(true);
    try {
      const payload = await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/${action.path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.body ?? {}),
        },
      );
      setMessage(`${order.orderNumber} → ${payload.data.status}`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runLabelAction = async (
    order: Order,
    action: ShippingUiAction,
    options?: { courier?: string },
  ) => {
    if (action.kind === "api") {
      await runAction(order, {
        label: action.label,
        path: action.path,
        body: action.body,
      });
      return;
    }

    setSubmitting(true);
    try {
      const qs = options?.courier
        ? `?courier=${encodeURIComponent(options.courier)}`
        : "";
      const response = await fetch(`/api/v1/orders/${order.id}/label${qs}`);
      if (!response.ok) {
        const payload = await safeResponseJson(response).catch(() => null);
        throw new Error(payload?.error?.message ?? `${action.label} failed.`);
      }

      const shouldDownload = action.kind !== "ensure_label";
      if (shouldDownload) {
        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") ?? "";
        const match = /filename="([^"]+)"/.exec(disposition);
        const filename =
          match?.[1] ?? `${order.channel}_${order.orderNumber}_label.txt`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }

      setMessage(`${action.label} · ${order.orderNumber}`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : `${action.label} failed.`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (order: Order) => {
    setSubmitting(true);
    try {
      const payload = await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled from OMS workspace" }),
        },
      );
      setMessage(`${order.orderNumber} cancelled.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Cancel failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const disposeReturn = async (
    order: Order,
    disposition: "restock" | "refurbish" | "scrap",
  ) => {
    setSubmitting(true);
    try {
      const payload = await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/returns/dispose`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disposition }),
        },
      );
      setMessage(`${order.orderNumber} return ${disposition}.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Dispose failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const addNote = async (order: Order, body: string) => {
    setSubmitting(true);
    try {
      await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Note failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const addClaim = async (order: Order, type: ClaimType, note?: string) => {
    setSubmitting(true);
    try {
      await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/claims`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, note, evidence: ["evidence-stub.jpg"] }),
        },
      );
      setMessage(`Claim opened on ${order.orderNumber}.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Claim failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const generateDocument = async (order: Order, type: OrderDocumentType) => {
    setSubmitting(true);
    try {
      await safeFetchJson<{ data: Order }>(
        `/api/v1/orders/${order.id}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        },
      );
      setMessage(`Generated ${type.replace(/_/g, " ")}.`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Document failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.id)),
    [orders, selectedIds],
  );
  const selectedAcceptCount = useMemo(
    () => selectedOrders.filter((order) => requiresOrderConfirm(order)).length,
    [selectedOrders],
  );

  const runBulk = async (action: string) => {
    setBulkOpen(false);
    const ids = Array.from(selectedIds);
    if (action === "export") {
      exportExcel(ids.length > 0 ? "selected" : "visible");
      return;
    }
    if (ids.length === 0) {
      setMessage("Select orders first.");
      return;
    }
    const executable = new Set([
      "confirm",
      "accept",
      "reserve",
      "allocate",
      "pick",
      "pack",
      "generate_labels",
      "print_labels",
      "generate_invoice",
      "print_pick_list",
      "generate_manifest",
      "ship",
      "hold",
      "release_hold",
      "cancel",
      "mark_packed",
      "mark_shipped",
    ]);
    if (!executable.has(action)) {
      setMessage(`“${action.replace(/_/g, " ")}” is stubbed for this simulation.`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = await safeFetchJson<{
        data: { successCount: number; failureCount: number };
      }>("/api/v1/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: ids,
          action,
          reason:
            action === "hold"
              ? "manual_review"
              : "Bulk action from OMS workspace",
        }),
      });
      setMessage(
        `Bulk ${action}: ${payload.data.successCount} ok, ${payload.data.failureCount} failed.`,
      );
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) for (const id of ids) next.delete(id);
      else for (const id of ids) next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Order Management</h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Manage, fulfill and track all your marketplace orders in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setBulkOpen((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Bulk Actions
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {bulkOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {[
                  ["accept", "Accept / Confirm"],
                  ["reserve", "Reserve"],
                  ["allocate", "Allocate"],
                  ["pick", "Pick"],
                  ["pack", "Pack"],
                  ["generate_labels", "Generate Label"],
                  ["ship", "Ship"],
                  ["hold", "Hold"],
                  ["cancel", "Cancel"],
                  ["export", "Export Excel"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void runBulk(id)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  More
                </p>
                {[
                  ["release_hold", "Release Hold"],
                  ["print_labels", "Print Labels"],
                  ["generate_invoice", "Generate Invoice"],
                  ["print_pick_list", "Print Pick List"],
                  ["generate_manifest", "Generate Manifest"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void runBulk(id)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
        </div>
      </div>

      <OrdersKPIGrid
        counts={kpis}
        loading={loading}
        activeTab={tab}
        onSelect={setTab}
      />

      <OrdersFilterBar
        search={search}
        marketplace={marketplace}
        status={statusFilter}
        shippingMode={shippingMode}
        warehouse={warehouse}
        payment={payment}
        priority={priority}
        sla={sla}
        dateFrom={dateFrom}
        dateTo={dateTo}
        activeFilterCount={activeFilterCount}
        onSearch={setSearch}
        onMarketplace={setMarketplace}
        onStatus={setStatusFilter}
        onShippingMode={setShippingMode}
        onWarehouse={setWarehouse}
        onPayment={setPayment}
        onPriority={setPriority}
        onSla={setSla}
        onDateRange={(from, to) => {
          setDateFrom(from);
          setDateTo(to);
        }}
        onClearAll={clearAllFilters}
        onDatePreset={applyDatePreset}
        options={filterOptions}
      />

      <OrdersStatusTabs active={tab} counts={tabCounts} onChange={setTab} />

      {error ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="min-w-0 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded-md p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-800"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {message ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="min-w-0 flex-1">{message}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="Dismiss message"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold text-white">
              {selectedIds.size}
            </span>
            <p className="text-sm font-semibold text-blue-950">
              {selectedIds.size === 1
                ? "1 order selected"
                : `${selectedIds.size} orders selected`}
            </p>
            {selectedAcceptCount > 0 ? (
              <span className="text-xs text-blue-800/80">
                · {selectedAcceptCount} pending accept/confirm
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedAcceptCount > 0 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void runBulk("accept")}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Accept selected ({selectedAcceptCount})
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => exportExcel("selected")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-100"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
      ) : (
        <OrdersDataTable
          orders={pagedOrders}
          selectedIds={selectedIds}
          activeId={detail?.id}
          submitting={submitting}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onOpen={setDetail}
          onRunAction={(order, action) => void runAction(order, action)}
          onLabelAction={(order, action, options) =>
            void runLabelAction(order, action, options)
          }
          onCancel={(order) => void cancelOrder(order)}
        />
      )}

      {!loading && totalItems > 0 ? (
        <ProductPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={totalItems}
          itemLabel="orders"
          pageSizeOptions={ORDER_PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
        />
      ) : null}

      {detail ? (
        <OrderInspectorDrawer
          order={detail}
          submitting={submitting}
          onClose={() => setDetail(null)}
          onRunAction={(order, action) => void runAction(order, action)}
          onLabelAction={(order, action, options) =>
            void runLabelAction(order, action, options)
          }
          onCancel={(order) => void cancelOrder(order)}
          onAddNote={(order, body) => void addNote(order, body)}
          onAddClaim={(order, type, note) => void addClaim(order, type, note)}
          onGenerateDocument={(order, type) => void generateDocument(order, type)}
          onDisposeReturn={(order, disposition) =>
            void disposeReturn(order, disposition)
          }
        />
      ) : null}

      {dialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Create order</h2>
            <div className="mt-4 space-y-3">
              <CommerceSelect
                label="Product"
                value={productId}
                onChange={setProductId}
                options={productOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                searchable
                placeholder="Select product"
              />
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm"
                />
              </label>
              <CommerceSelect
                label="Channel"
                value={channel}
                onChange={setChannel}
                options={CHANNELS.map((value) => ({ value, label: value }))}
                searchable={false}
                placeholder="Select channel"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
              >
                Close
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void createOrder()}
                className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
