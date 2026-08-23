import { redirect } from "next/navigation";

export default function PurchaseExpensesRedirectPage() {
  redirect("/purchase?tab=expenses");
}
