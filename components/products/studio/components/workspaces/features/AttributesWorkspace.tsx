"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Globe,
  Sparkles,
  Info,
  Layers,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MarketplaceName,
  type MasterAttribute,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel } from "./workspace-ui";

export function AttributesWorkspace() {
  const {
    listing,
    updateAttribute,
    removeAttribute,
  } = useStudio();

  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newGroup, setNewGroup] = useState("General");

  if (!listing) return null;

  const addAttribute = () => {
    const key = newKey.trim() ||
      newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

    if (!key || !newLabel.trim()) return;

    updateAttribute({
      id: crypto.randomUUID(),
      key,
      label: newLabel.trim(),
      value: "",
      group: newGroup.trim() || "General",
      searchable: true,
      filterable: true,
    });

    setNewKey("");
    setNewLabel("");
  };

  const channels = [
    MarketplaceName.AMAZON,
    MarketplaceName.FLIPKART,
    MarketplaceName.MEESHO,
    MarketplaceName.MYNTRA,
  ];

  return (
    <Panel
      title="Universal Master Attributes"
      description="Enter attributes once in standard formats. CommerceOS automatically transforms and distributes them to match each marketplace's expected schema."
    >
      {/* Add Attribute Row */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
          Add New Master Attribute
        </span>
        <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
          <Input
            value={newLabel}
            placeholder="Attribute name (e.g. Material)"
            onChange={(e) => setNewLabel(e.target.value)}
            className="h-9 text-xs"
          />

          <Input
            value={newKey}
            placeholder="Key (e.g. material_composition)"
            onChange={(e) => setNewKey(e.target.value)}
            className="h-9 text-xs"
          />

          <Input
            value={newGroup}
            placeholder="Group (General, Material, Style)"
            onChange={(e) => setNewGroup(e.target.value)}
            className="h-9 text-xs"
          />

          <Button
            size="sm"
            onClick={addAttribute}
            disabled={!newLabel.trim()}
            className="h-9 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Attribute
          </Button>
        </div>
      </div>

      {/* Attributes List */}
      <div className="space-y-3">
        {listing.attributes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
            No custom attributes added yet. Add attributes above to enhance marketplace search ranking.
          </div>
        ) : (
          listing.attributes.map((attribute) => (
            <AttributeRow
              key={attribute.id || attribute.key}
              attribute={attribute}
              channels={channels}
              onChange={updateAttribute}
              onRemove={() => removeAttribute(attribute.key)}
            />
          ))
        )}
      </div>
    </Panel>
  );
}

function AttributeRow({
  attribute,
  channels,
  onChange,
  onRemove,
}: {
  attribute: MasterAttribute;
  channels: MarketplaceName[];
  onChange(attribute: MasterAttribute): void;
  onRemove(): void;
}) {
  const hasValue = Boolean(
    attribute.value !== undefined &&
    attribute.value !== null &&
    String(attribute.value).trim() !== ""
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 space-y-2.5">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1.5fr_1fr_auto] items-center">
        {/* Label */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Label
          </span>
          <Input
            aria-label={`${attribute.label} label`}
            value={attribute.label}
            onChange={(e) =>
              onChange({
                ...attribute,
                label: e.target.value,
              })
            }
            className="h-8.5 text-xs font-bold text-slate-900"
          />
        </div>

        {/* Value */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Universal Value
          </span>
          <Input
            aria-label={`${attribute.label} value`}
            placeholder="Enter value (e.g. Cotton, Pink, Leather)"
            value={
              Array.isArray(attribute.value)
                ? attribute.value.join(", ")
                : String(attribute.value ?? "")
            }
            onChange={(e) =>
              onChange({
                ...attribute,
                value: Array.isArray(attribute.value)
                  ? e.target.value.split(",").map((v) => v.trim()).filter(Boolean)
                  : e.target.value,
              })
            }
            className="h-8.5 text-xs text-slate-800"
          />
        </div>

        {/* Group */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Group
          </span>
          <Input
            aria-label={`${attribute.label} group`}
            value={attribute.group || "General"}
            onChange={(e) =>
              onChange({
                ...attribute,
                group: e.target.value,
              })
            }
            className="h-8.5 text-xs text-slate-600"
          />
        </div>

        {/* Delete */}
        <div className="flex items-end justify-end pt-4 md:pt-0">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove ${attribute.label}`}
            onClick={onRemove}
            className="h-8.5 w-8.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Used by Channels Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px]">
        <div className="flex items-center gap-1.5 font-semibold text-slate-400">
          <span>Used by Channels:</span>
          {channels.map((ch) => (
            <span
              key={ch}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                hasValue
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {hasValue ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> : "—"}
              {ch}
            </span>
          ))}
        </div>

        <span className="font-mono text-[10px] text-slate-400">
          Key: {attribute.key}
        </span>
      </div>
    </div>
  );
}
