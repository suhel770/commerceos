"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import CommerceSelect from "@/components/ui/CommerceSelect";
import {
  ALL_INDIAN_STATES_AND_UTS,
  ALL_VENDOR_REGISTRATION_TYPES,
  VENDOR_REGISTRATION_TYPE_LABELS,
  extractPanFromGstin,
  stateNameFromGstin,
  vendorRequiresGstin,
  ALL_BUSINESS_INTENTS,
  BUSINESS_INTENT_LABELS,
  type BusinessIntent,
  type CreateVendorInput,
  type Vendor,
  type VendorRegistrationType,
  type VendorStatus,
} from "@/lib/purchase";

type EditVendorDialogProps = {
  vendor: Vendor | null;
  submitting: boolean;
  onClose(): void;
  onUpdate(id: string, patch: Partial<CreateVendorInput> & { status?: VendorStatus }): Promise<Vendor | null>;
};

export default function EditVendorDialog({
  vendor,
  submitting,
  onClose,
  onUpdate,
}: EditVendorDialogProps) {
  const [form, setForm] = useState({
    name: "",
    registrationType: "regular" as VendorRegistrationType,
    gstin: "",
    pan: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactPerson: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    paymentTermsDays: "30",
    leadTimeDays: "7",
    status: "active" as VendorStatus,
    notes: "",
    defaultPurchaseIntent: "sellable" as BusinessIntent,
    allowedPurchaseIntents: ["sellable"] as BusinessIntent[],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendor) return;
    setForm({
      name: vendor.name ?? "",
      registrationType: vendor.registrationType ?? "regular",
      gstin: vendor.gstin ?? "",
      pan: vendor.pan ?? extractPanFromGstin(vendor.gstin) ?? "",
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      address: vendor.address ?? "",
      city: vendor.city ?? "",
      state: vendor.state ?? "",
      pincode: vendor.pincode ?? "",
      contactPerson: vendor.contactPerson ?? "",
      bankName: vendor.bankName ?? "",
      bankAccountName: vendor.bankAccountName ?? "",
      bankAccountNumber: vendor.bankAccountNumber ?? "",
      bankIfsc: vendor.bankIfsc ?? "",
      paymentTermsDays: String(vendor.paymentTermsDays ?? 30),
      leadTimeDays: String(vendor.leadTimeDays ?? 7),
      status: vendor.status ?? "active",
      notes: vendor.notes ?? "",
      defaultPurchaseIntent: vendor.defaultPurchaseIntent ?? "sellable",
      allowedPurchaseIntents: vendor.allowedPurchaseIntents ?? ["sellable"],
    });
    setError(null);
  }, [vendor]);

  useEffect(() => {
    if (!vendor) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [vendor, onClose]);

  if (!vendor) return null;

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGstinChange = (value: string) => {
    const uppercaseGstin = value.toUpperCase();
    const extractedPan = extractPanFromGstin(uppercaseGstin);
    const autoState = stateNameFromGstin(uppercaseGstin);
    setForm((prev) => ({
      ...prev,
      gstin: uppercaseGstin,
      pan: extractedPan || prev.pan,
      state: autoState || prev.state,
    }));
  };

  const setRegistrationType = (value: VendorRegistrationType) => {
    setForm((prev) => ({
      ...prev,
      registrationType: value,
      gstin: vendorRequiresGstin(value) ? prev.gstin : "",
    }));
  };

  const requiresGstin = vendorRequiresGstin(form.registrationType);

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Vendor name is required.");
      return;
    }
    if (requiresGstin && !form.gstin.trim()) {
      setError("GSTIN is required for this registration type.");
      return;
    }

    const patch: Partial<CreateVendorInput> & { status?: VendorStatus } = {
      name: form.name.trim(),
      registrationType: form.registrationType,
      gstin: form.gstin.trim(),
      pan: form.pan.trim() || extractPanFromGstin(form.gstin.trim()) || "",
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      contactPerson: form.contactPerson.trim(),
      bankName: form.bankName.trim(),
      bankAccountName: form.bankAccountName.trim(),
      bankAccountNumber: form.bankAccountNumber.trim(),
      bankIfsc: form.bankIfsc.trim(),
      paymentTermsDays: Number(form.paymentTermsDays) || 30,
      leadTimeDays: Number(form.leadTimeDays) || 7,
      status: form.status,
      notes: form.notes.trim(),
      defaultPurchaseIntent: form.defaultPurchaseIntent,
      allowedPurchaseIntents: form.allowedPurchaseIntents,
    };

    const updated = await onUpdate(vendor.id, patch);
    if (updated) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Edit Vendor Details</h3>
            <p className="text-xs text-slate-500">GST registration, PAN/TAN, bank details & owner status control.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Vendor name <span className="text-rose-500">*</span>
                </label>
              </div>
              <input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="e.g. Vendor company name"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <CommerceSelect
                label="Registration Type"
                value={form.registrationType}
                onChange={(value) =>
                  setRegistrationType(value as VendorRegistrationType)
                }
                options={ALL_VENDOR_REGISTRATION_TYPES.map((value) => ({
                  value,
                  label: VENDOR_REGISTRATION_TYPE_LABELS[value],
                }))}
                searchable
                placeholder="Select registration type"
              />
            </div>

            <div>
              <CommerceSelect
                label="Vendor Status"
                value={form.status}
                onChange={(value) => setField("status", value as VendorStatus)}
                options={[
                  { value: "active", label: "Active (Purchasable)" },
                  { value: "blocked", label: "Blocked by Owner" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  GSTIN{requiresGstin ? <span className="text-rose-500"> *</span> : ""}
                </label>
              </div>
              <input
                value={form.gstin}
                onChange={(event) => handleGstinChange(event.target.value)}
                disabled={!requiresGstin}
                placeholder={
                  requiresGstin
                    ? "e.g. 09CULPS2301H1ZJ"
                    : "Not required for this type"
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase focus:border-violet-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 font-mono tracking-wide"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">PAN/TAN</label>
                {extractPanFromGstin(form.gstin) ? (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md leading-none">
                    Auto-extracted
                  </span>
                ) : form.gstin.length >= 10 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const extracted = extractPanFromGstin(form.gstin);
                      if (extracted) setField("pan", extracted);
                    }}
                    className="text-[10px] text-violet-600 font-medium hover:underline leading-none"
                  >
                    Extract from GSTIN
                  </button>
                ) : null}
              </div>
              <input
                value={form.pan}
                onChange={(event) => setField("pan", event.target.value)}
                placeholder="e.g. CULPS2301H"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase focus:border-violet-500 focus:outline-none font-mono tracking-wide"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
              </div>
              <input
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="+91 9876543210"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Email</label>
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="vendor@example.com"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Contact person</label>
              </div>
              <input
                value={form.contactPerson}
                onChange={(event) => setField("contactPerson", event.target.value)}
                placeholder="e.g. Rajesh Gupta"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Address / Street</label>
              </div>
              <input
                value={form.address}
                onChange={(event) => setField("address", event.target.value)}
                placeholder="e.g. 12 Industrial Area"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <div className="mb-1 flex h-5 items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                </div>
                <input
                  value={form.city}
                  onChange={(event) => setField("city", event.target.value)}
                  placeholder="e.g. Agra"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <CommerceSelect
                  label="State"
                  value={form.state}
                  onChange={(value) => setField("state", value)}
                  options={ALL_INDIAN_STATES_AND_UTS.map((item) => ({
                    value: item.name,
                    label: `${item.name} (${item.code})`,
                  }))}
                  searchable
                  placeholder="Select state or UT"
                />
              </div>

              <div>
                <div className="mb-1 flex h-5 items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Pincode</label>
                </div>
                <input
                  value={form.pincode}
                  onChange={(event) => setField("pincode", event.target.value)}
                  placeholder="e.g. 282001"
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Purchase Profile
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <CommerceSelect
                    label="Default Purchase Intent"
                    value={form.defaultPurchaseIntent}
                    onChange={(value) => {
                      const intent = value as BusinessIntent;
                      setForm((prev) => ({
                        ...prev,
                        defaultPurchaseIntent: intent,
                        allowedPurchaseIntents: Array.from(new Set([...prev.allowedPurchaseIntents, intent])),
                      }));
                    }}
                    options={ALL_BUSINESS_INTENTS.map((intent) => ({
                      value: intent,
                      label: BUSINESS_INTENT_LABELS[intent],
                    }))}
                  />
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    The default classification for purchases from this vendor.
                  </p>
                </div>
                <div>
                  <div className="mb-1 flex h-5 items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Allowed Purchase Intents</label>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto rounded-xl border border-slate-200 p-2 bg-slate-50">
                    {ALL_BUSINESS_INTENTS.map((intent) => (
                      <label
                        key={intent}
                        className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs border border-slate-200 hover:border-violet-300 cursor-pointer shadow-sm transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={form.allowedPurchaseIntents.includes(intent)}
                          disabled={form.defaultPurchaseIntent === intent}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm((prev) => ({
                                ...prev,
                                allowedPurchaseIntents: [...prev.allowedPurchaseIntents, intent],
                              }));
                            } else {
                              setForm((prev) => ({
                                ...prev,
                                allowedPurchaseIntents: prev.allowedPurchaseIntents.filter((i) => i !== intent),
                              }));
                            }
                          }}
                          className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className={form.defaultPurchaseIntent === intent ? "font-semibold text-slate-900" : "text-slate-600"}>
                          {BUSINESS_INTENT_LABELS[intent]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Bank Details
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex h-5 items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Bank name</label>
                  </div>
                  <input
                    value={form.bankName}
                    onChange={(event) => setField("bankName", event.target.value)}
                    placeholder="e.g. HDFC Bank"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="mb-1 flex h-5 items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Account name</label>
                  </div>
                  <input
                    value={form.bankAccountName}
                    onChange={(event) =>
                      setField("bankAccountName", event.target.value)
                    }
                    placeholder="e.g. AgraSole Traders"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="mb-1 flex h-5 items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Account number</label>
                  </div>
                  <input
                    value={form.bankAccountNumber}
                    onChange={(event) =>
                      setField("bankAccountNumber", event.target.value)
                    }
                    placeholder="e.g. 50200012345678"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <div className="mb-1 flex h-5 items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">IFSC</label>
                  </div>
                  <input
                    value={form.bankIfsc}
                    onChange={(event) => setField("bankIfsc", event.target.value)}
                    placeholder="e.g. HDFC0000123"
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase focus:border-violet-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Payment terms (days)
                </label>
              </div>
              <input
                type="number"
                min={0}
                value={form.paymentTermsDays}
                onChange={(event) =>
                  setField("paymentTermsDays", event.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Lead time (days)
                </label>
              </div>
              <input
                type="number"
                min={0}
                value={form.leadTimeDays}
                onChange={(event) => setField("leadTimeDays", event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1 flex h-5 items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Notes</label>
              </div>
              <textarea
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                rows={2}
                placeholder="Additional supplier terms or notes..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/90 backdrop-blur-sm px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSave()}
            className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Update Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}
