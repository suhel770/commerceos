import { redirect } from "next/navigation";

export default function PurchaseProductsRedirectPage() {
  redirect("/purchase?tab=purchases");
}
