"use client";

import { useState, useEffect } from "react";
import { X, Settings, ShieldAlert, Check, Trash2 } from "lucide-react";

interface LocationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  locationCode?: string;
  isDefault?: boolean;
  isArchived?: boolean;
  retentionExpiresAt?: string;
  onSaveSettings: (data: { name: string; code: string; isDefault: boolean }) => void;
  onArchiveLocation?: () => void;
  onRestoreLocation?: () => void;
  onPermanentDeleteLocation?: () => void;
}

export default function LocationSettingsModal({
  isOpen,
  onClose,
  locationName,
  locationCode = "",
  isDefault = false,
  isArchived = false,
  retentionExpiresAt,
  onSaveSettings,
  onArchiveLocation,
  onRestoreLocation,
  onPermanentDeleteLocation,
}: LocationSettingsModalProps) {
  const [name, setName] = useState(locationName);
  const [code, setCode] = useState(locationCode);
  const [defaultLoc, setDefaultLoc] = useState(isDefault);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(locationName);
      setCode(locationCode);
      setDefaultLoc(isDefault);
      setSavedSuccess(false);
      setConfirmDelete(false);
    }
  }, [isOpen, locationName, locationCode, isDefault]);

  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      name: name.trim() || locationName,
      code: code.trim() || locationCode,
      isDefault: defaultLoc,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const remainingDays = retentionExpiresAt
    ? Math.max(0, Math.ceil((new Date(retentionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Location Settings</h2>
              <p className="text-xs font-medium text-slate-500">Configure parameters for {locationName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 space-y-2 border border-emerald-200">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-5 w-5" />
            </div>
            <p className="text-sm font-extrabold">Location Settings Updated Successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold text-slate-900 focus:border-violet-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                Location Reference Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold text-slate-900 focus:border-violet-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPrimaryDefault"
                checked={defaultLoc}
                onChange={(e) => setDefaultLoc(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="isPrimaryDefault" className="text-xs font-bold text-slate-700 cursor-pointer">
                Primary Storage Location
              </label>
            </div>

            {/* Archival & 30-Day Retention Zone */}
            {isArchived ? (
              <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Archived Location (Retention Grace Period)
                </div>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  This location is archived and saved for <strong>{remainingDays} more days</strong>. After 30 days, it will be automatically removed from the database permanently.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onRestoreLocation) onRestoreLocation();
                    onClose();
                  }}
                  className="rounded-xl bg-amber-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-amber-800 transition-colors shadow-sm"
                >
                  Restore Location
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-50/70 p-4 border border-rose-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-800">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  Archive Location (30-Day Retention Policy)
                </div>
                <p className="text-[11px] text-rose-700 font-medium leading-relaxed">
                  Archiving hides this location from active receiving & fulfillment. All stock logs will be safely preserved for <strong>30 days</strong> before permanent removal from the database.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Archive "${locationName}"? It will be saved for 30 days before permanent database removal.`)) {
                      if (onArchiveLocation) onArchiveLocation();
                      onClose();
                    }
                  }}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Archive Location (30-Day Retention)
                </button>
              </div>
            )}

            {/* Permanent Delete — Danger Zone */}
            {onPermanentDeleteLocation && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-900">
                  <Trash2 className="h-4 w-4 text-red-600" />
                  Permanently Delete from Database
                </div>
                <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                  This action <strong>cannot be undone</strong>. The location and all associated records will be <strong>immediately and permanently removed</strong> from the database — no 30-day retention.
                </p>
                {!confirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="rounded-xl border-2 border-red-600 px-4 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Delete Permanently
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold text-red-800">
                      ⚠️ Are you absolutely sure? This cannot be recovered.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onPermanentDeleteLocation();
                          onClose();
                        }}
                        className="rounded-xl bg-red-700 px-4 py-2 text-xs font-extrabold text-white hover:bg-red-800 transition-colors shadow-sm"
                      >
                        Yes, Delete Permanently
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-5 py-2 font-extrabold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
