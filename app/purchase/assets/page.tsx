import { redirect } from "next/navigation";

export default function PurchaseAssetsRedirectPage() {
  redirect("/purchase?tab=assets");
}
