"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PurchaseAiForecastPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/purchase");
  }, [router]);
  return null;
}
