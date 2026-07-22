"use client";

import { useState } from "react";

interface SaveViewDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, isDefault: boolean) => void;
}

export default function SaveViewDialog({
  open,
  onClose,
  onSave,
}: SaveViewDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  if (!open) return null;

  function handleSave() {
    if (!name.trim()) return;

    onSave(
      name.trim(),
      description.trim(),
      isDefault
    );

    setName("");
    setDescription("");
    setIsDefault(false);

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">

        {/* Header */}

        <div className="border-b border-slate-200 px-6 py-5">

          <h2 className="text-xl font-semibold text-slate-900">
            Save Current View
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Save your current filters so you can quickly return to this view later.
          </p>

        </div>

        {/* Body */}

        <div className="space-y-6 p-6">

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              View Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Amazon Active Products"
              className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-slate-900"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Optional description"
              className="w-full rounded-xl border border-slate-200 p-4 outline-none transition focus:border-slate-900"
            />

          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">

            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) =>
                setIsDefault(e.target.checked)
              }
            />

            <div>

              <p className="text-sm font-medium text-slate-800">
                Make this my default view
              </p>

              <p className="text-xs text-slate-500">
                This view will automatically open every time you visit Products.
              </p>

            </div>

          </label>

        </div>

        {/* Footer */}

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Save View
          </button>

        </div>

      </div>

    </div>
  );
}