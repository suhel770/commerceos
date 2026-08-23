"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { BusinessProfile } from "@/lib/business-profile";
import { stateCodeFromGstin, stateName } from "@/lib/purchase";

type FormState = {
  legalName: string;
  brand: string;
  tradeName: string;
  ownerName: string;
  gstin: string;
  pan: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  bankAccount: string;
  ifsc: string;
  bankName: string;
  upiId: string;
};

function toForm(p: BusinessProfile): FormState {
  return {
    legalName: p.legalName ?? "",
    brand: p.brand ?? "",
    tradeName: p.tradeName ?? "",
    ownerName: p.ownerName ?? "",
    gstin: p.gstin ?? "",
    pan: p.pan ?? "",
    address: p.address ?? "",
    pincode: p.pincode ?? "",
    city: p.city ?? "",
    state: p.buyerState ?? "",
    country: "India",
    phone: p.phone ?? "",
    email: p.email ?? "",
    bankAccount: "",
    ifsc: "",
    bankName: "",
    upiId: "",
  };
}

export default function BusinessProfileSettings() {
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/settings/business");
        const payload = await safeResponseJson(response);
        setForm(toForm(payload.data as BusinessProfile));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load business profile.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const derivedStateCode = stateCodeFromGstin(form?.gstin);
  const derivedState = useMemo(
    () => stateName(derivedStateCode),
    [derivedStateCode],
  );

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/v1/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await safeResponseJson(response);
      const saved = payload.data as BusinessProfile;
      setForm(toForm(saved));
      setMessage(
        `Saved. Your GST state is ${saved.buyerState} (${saved.buyerStateCode}). Purchase tax mode will use this vs vendor GSTIN.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save business profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading business profile…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Business & GST details
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your GSTIN state drives Purchase tax mode: same state as vendor →
            CGST + SGST, other state → IGST. Update this when your registration
            state changes (e.g. Uttar Pradesh).
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Legal name *"
            value={form.legalName}
            onChange={(value) => update("legalName", value)}
          />
          <Field
            label="Trade / brand name"
            value={form.tradeName}
            onChange={(value) => update("tradeName", value)}
          />
          <Field
            label="GSTIN *"
            value={form.gstin}
            onChange={(value) => update("gstin", value.toUpperCase())}
            hint="First 2 digits = your state (09 = Uttar Pradesh, 07 = Delhi, 27 = Maharashtra)"
          />
          <Field
            label="PAN"
            value={form.pan}
            onChange={(value) => update("pan", value.toUpperCase())}
          />
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 sm:col-span-2">
            <p className="text-[11px] font-bold tracking-wide text-emerald-700 uppercase">
              Derived buyer state (for tax mode)
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-950">
              {derivedStateCode
                ? `${derivedState} (${derivedStateCode})`
                : "Enter a valid 15-character GSTIN"}
            </p>
          </div>
          <Field
            label="Address"
            value={form.address}
            onChange={(value) => update("address", value)}
            className="sm:col-span-2"
          />
          <Field
            label="City"
            value={form.city}
            onChange={(value) => update("city", value)}
          />
          <Field
            label="Pincode"
            value={form.pincode}
            onChange={(value) => update("pincode", value)}
          />
          <Field
            label="Phone"
            value={form.phone}
            onChange={(value) => update("phone", value)}
          />
          <Field
            label="Email"
            value={form.email}
            onChange={(value) => update("email", value)}
          />
          <Field
            label="Owner name"
            value={form.ownerName}
            onChange={(value) => update("ownerName", value)}
          />
        </div>

        {error ? (
          <p className="mt-3 text-sm text-rose-600">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-emerald-700">{message}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save business GST"}
          </button>
          <Link
            href="/purchase"
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            Open Purchase →
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  className = "",
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
      />
      {hint ? <p className="mt-1 text-[11px] text-slate-400">{hint}</p> : null}
    </label>
  );
}
