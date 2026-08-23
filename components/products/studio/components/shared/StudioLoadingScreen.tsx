"use client";

import { Loader2, Package2, Sparkles } from "lucide-react";

export default function StudioLoadingScreen() {
  return (
    <div className="flex h-full min-h-[700px] items-center justify-center bg-background">
      <div className="w-full max-w-xl">

        {/* Logo */}

        <div className="mb-10 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border bg-card shadow-sm">
            <Package2 className="h-10 w-10 text-primary" />

            <div className="absolute -right-1 -top-1 rounded-full border bg-background p-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
        </div>

        {/* Title */}

        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Loading Product Studio
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            Preparing your master listing, validating marketplace
            requirements and restoring your editing workspace.
          </p>
        </div>

        {/* Progress */}

        <div className="mt-10 space-y-5">

          <LoadingRow
            title="Loading Master Listing"
            active
          />

          <LoadingRow
            title="Preparing Studio Engine"
          />

          <LoadingRow
            title="Loading Marketplace Configuration"
          />

          <LoadingRow
            title="Checking Publishing Readiness"
          />

          <LoadingRow
            title="Restoring AI Workspace"
          />

        </div>

        {/* Spinner */}

        <div className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>
            This usually takes a few seconds...
          </span>
        </div>
      </div>
    </div>
  );
}

interface LoadingRowProps {
  title: string;
  active?: boolean;
}

function LoadingRow({
  title,
  active = false,
}: LoadingRowProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-4">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            active
              ? "bg-primary/10"
              : "bg-muted"
          }`}
        >
          <Loader2
            className={`h-4 w-4 ${
              active
                ? "animate-spin text-primary"
                : "text-muted-foreground"
            }`}
          />
        </div>

        <div className="flex-1">

          <div className="mb-2 text-sm font-medium">
            {title}
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                active
                  ? "w-2/3 animate-pulse bg-primary"
                  : "w-1/4 bg-muted-foreground/20"
              }`}
            />
          </div>

        </div>

      </div>
    </div>
  );
}