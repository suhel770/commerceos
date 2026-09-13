"use client";

import { useState, useMemo } from "react";
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
import {
  getCategorySpecs,
  type CategoryVerticalConfig,
  type CategorySpecDefinition,
} from "@/lib/marketplace/specifications/category-specs.service";

export function AttributesWorkspace() {
  const {
    listing,
    updateAttribute,
    removeAttribute,
    product,
  } = useStudio();

  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newGroup, setNewGroup] = useState("General");

  const categoryConfig: CategoryVerticalConfig | null = useMemo(() => {
    if (!listing) return null;
    return getCategorySpecs(
      listing.identity.category || (product as any)?.category,
      listing.identity.subCategory || listing.identity.productName || (product as any)?.name
    );
  }, [listing?.identity.category, listing?.identity.subCategory, listing?.identity.productName, product]);

  if (!listing) return null;

  const getAttributeValue = (key: string): string => {
    const attr = listing.attributes?.find((a) => a.key === key);
    return (attr?.value as string) || "";
  };

  const handleSpecChange = (key: string, label: string, group: string, value: string) => {
    updateAttribute({
      id: listing.attributes?.find((a) => a.key === key)?.id || crypto.randomUUID(),
      key,
      label,
      value,
      group: group.toUpperCase(),
      searchable: true,
      filterable: true,
    });
  };

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
      {/* Dynamic Category Schema Specifications Panel */}
      {categoryConfig && categoryConfig.specifications.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Category Schema Specifications</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    {categoryConfig.badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Standard marketplace specifications dynamically adapted for {categoryConfig.displayName}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              {categoryConfig.specifications.length} Category Specs
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categoryConfig.specifications.map((spec: CategorySpecDefinition) => {
              const val = getAttributeValue(spec.key);
              return (
                <div key={spec.key} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>{spec.label}</span>
                      {spec.required && <span className="text-rose-500">*</span>}
                    </label>
                    {val && (
                      <span className="inline-flex items-center text-[9px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                        Set
                      </span>
                    )}
                  </div>

                  <Input
                    value={val}
                    onChange={(e) => handleSpecChange(spec.key, spec.label, spec.group, e.target.value)}
                    placeholder={spec.placeholder}
                    className="h-8 text-xs bg-white border-slate-200"
                  />

                  {spec.suggestions?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] font-bold text-slate-400 mr-0.5">Quick:</span>
                      {spec.suggestions.slice(0, 4).map((sug: string) => {
                        const isPicked = val.toLowerCase() === sug.toLowerCase();
                        return (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleSpecChange(spec.key, spec.label, spec.group, sug)}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                              isPicked
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            {sug}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
