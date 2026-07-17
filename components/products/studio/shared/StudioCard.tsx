"use client";

import { ReactNode } from "react";

interface StudioCardProps {
  children: ReactNode;

  className?: string;

  padding?: "none" | "sm" | "md" | "lg";
}

export default function StudioCard({
  children,
  className = "",
  padding = "lg",
}: StudioCardProps) {
  const paddingClass = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <section
      className={`
        rounded-3xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-200
        hover:shadow-md
        ${paddingClass[padding]}
        ${className}
      `}
    >
      {children}
    </section>
  );
}