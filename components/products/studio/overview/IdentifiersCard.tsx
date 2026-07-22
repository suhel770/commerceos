"use client";

import {
  Barcode,
  Fingerprint,
  Hash,
  ShieldCheck,
} from "lucide-react";

import StudioCard from "../shared/StudioCard";
import StudioSection from "../shared/StudioSection";

import CommerceInput from "@/components/shared/forms/CommerceInput";

export default function IdentifiersCard() {
  return (
    <StudioCard>

      <StudioSection
        title="Product Identifiers"
        description="Global product identifiers used by marketplaces."
      >

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          <Field
            icon={<Hash size={16} />}
            title="HSN Code"
            value="64029990"
          />

          <Field
            icon={<Barcode size={16} />}
            title="UPC"
            value=""
          />

          <Field
            icon={<Barcode size={16} />}
            title="EAN"
            value=""
          />

          <Field
            icon={<Fingerprint size={16} />}
            title="GTIN"
            value=""
          />

        </div>

        <div className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-700">

          ✓ HSN validated.

          GST compatibility verified.

          Marketplace schema compatible.

        </div>

      </StudioSection>

    </StudioCard>
  );
}

function Field({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 flex items-center gap-2 text-sm font-semibold">

        {icon}

        {title}

      </label>

      <CommerceInput
        defaultValue={value}
      />

    </div>
  );
}