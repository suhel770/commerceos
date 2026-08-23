import { redirect } from "next/navigation";

export default function PurchasePaymentsRedirectPage() {
  redirect("/purchase?tab=bills");
}
