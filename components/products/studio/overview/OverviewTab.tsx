"use client";

import {
  BadgeIndianRupee,
  Bot,
  Boxes,
  ClipboardCheck,
  FileText,
  ImageIcon,
  PackageCheck,
  Palette,
  Search,
  ShieldCheck,
  Store,
  Tags,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import { useStudio } from "../context/StudioContext";
import type { StudioWorkspaceId } from "../config/studio.config";

interface OverviewTabProps {
  product: Product;
}

type CardTone = "blue" | "emerald" | "violet" | "amber";

interface WorkspaceCard {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  tone: CardTone;
  workspace: StudioWorkspaceId;
}

export default function OverviewTab({ product }: OverviewTabProps) {
  const { setActiveWorkspace } = useStudio();
  const imageCount = product.gallery?.length ?? (product.image ? 1 : 0);

  const cards: WorkspaceCard[] = [
    {
      title: "Product Identity",
      description: "Manage your product identity, brand, category and identifiers.",
      badge: "Ready",
      icon: Tags,
      tone: "blue",
      workspace: "identity",
    },
    {
      title: "Media",
      description: "Manage product images, videos and marketplace media.",
      badge: `${imageCount} Images`,
      icon: ImageIcon,
      tone: "blue",
      workspace: "media",
    },
    {
      title: "Pricing & Commercials",
      description: "Manage pricing, costs, tax, margin and other commercial details.",
      badge: "Healthy",
      icon: BadgeIndianRupee,
      tone: "amber",
      workspace: "commercials",
    },
    {
      title: "Inventory",
      description: "Manage stock, warehouses, availability and inventory settings.",
      badge: `${product.inventory.available} In Stock`,
      icon: Boxes,
      tone: "emerald",
      workspace: "supply",
    },
    {
      title: "Marketplace Listings",
      description: "Manage marketplace-specific data and listing status.",
      badge: `${product.listings.length} Listings`,
      icon: Store,
      tone: "violet",
      workspace: "channels",
    },
    {
      title: "Variants",
      description: "Manage product variants like size, color and other attributes.",
      badge: "Ready",
      icon: Palette,
      tone: "emerald",
      workspace: "variants",
    },
    {
      title: "SEO",
      description: "Optimize titles, descriptions, keywords and SEO settings.",
      badge: "91 / 100",
      icon: Search,
      tone: "blue",
      workspace: "growth",
    },
    {
      title: "Compliance",
      description: "Manage compliance, GST, HSN, origin and other legal details.",
      badge: "Ready",
      icon: ClipboardCheck,
      tone: "emerald",
      workspace: "compliance",
    },
    {
      title: "AI Suggestions",
      description: "Review AI-generated content and product suggestions.",
      badge: `${product.aiRecommendations.length} Pending`,
      icon: Bot,
      tone: "violet",
      workspace: "attributes",
    },
    {
      title: "Fulfillment",
      description: "Manage shipping, fulfillment and delivery settings.",
      badge: "Ready",
      icon: PackageCheck,
      tone: "blue",
      workspace: "supply",
    },
    {
      title: "Documents",
      description: "Manage important documents and certifications.",
      badge: "3 Files",
      icon: FileText,
      tone: "amber",
      workspace: "publishing",
    },
    {
      title: "Activity Timeline",
      description: "Track all changes and activity on this product.",
      badge: "Recent",
      icon: ShieldCheck,
      tone: "violet",
      workspace: "activity",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <WorkspaceCard
          key={card.title}
          card={card}
          onOpen={() => setActiveWorkspace(card.workspace)}
        />
      ))}
    </section>
  );
}

function WorkspaceCard({
  card,
  onOpen,
}: {
  card: WorkspaceCard;
  onOpen: () => void;
}) {
  const Icon = card.icon;
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-h-[108px] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[card.tone]}`}
      >
        <Icon size={19} strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold leading-5 text-slate-900">
            {card.title}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {card.badge}
          </span>
        </span>

        <span className="mt-1.5 line-clamp-2 block text-xs leading-4 text-slate-500">
          {card.description}
        </span>
      </span>

      <ChevronRight
        size={20}
        className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900"
      />
    </button>
  );
}
