import { redirect } from "next/navigation";

export default function PurchaseReceivingRedirectPage() {
  redirect("/purchase?tab=inventory");
}
