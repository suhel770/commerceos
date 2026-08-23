"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
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
      group: "General",
      searchable: true,
      filterable: true,
    });

    setNewKey("");
    setNewLabel("");
  };

  return (
    <Panel
      title="Master Attributes"
      description="CommerceOS maps these source attributes to each marketplace's field names and requirements."
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={newLabel}
          placeholder="Attribute label"
          onChange={(event) => setNewLabel(event.target.value)}
        />

        <Input
          value={newKey}
          placeholder="API key (optional)"
          onChange={(event) => setNewKey(event.target.value)}
        />

        <Button onClick={addAttribute}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="space-y-3">
        {listing.attributes.map((attribute) => (
          <AttributeRow
            key={attribute.id}
            attribute={attribute}
            onChange={updateAttribute}
            onRemove={() => removeAttribute(attribute.key)}
          />
        ))}
      </div>
    </Panel>
  );
}

function AttributeRow({
  attribute,
  onChange,
  onRemove,
}: {
  attribute: MasterAttribute;
  onChange(attribute: MasterAttribute): void;
  onRemove(): void;
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1.5fr_1fr_auto]">
      <Input
        aria-label={`${attribute.label} label`}
        value={attribute.label}
        onChange={(event) =>
          onChange({
            ...attribute,
            label: event.target.value,
          })
        }
      />

      <Input
        aria-label={`${attribute.label} value`}
        value={
          Array.isArray(attribute.value)
            ? attribute.value.join(", ")
            : String(attribute.value ?? "")
        }
        onChange={(event) =>
          onChange({
            ...attribute,
            value: Array.isArray(attribute.value)
              ? event.target.value
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean)
              : event.target.value,
          })
        }
      />

      <Input
        aria-label={`${attribute.label} group`}
        value={attribute.group}
        onChange={(event) =>
          onChange({
            ...attribute,
            group: event.target.value,
          })
        }
      />

      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${attribute.label}`}
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

