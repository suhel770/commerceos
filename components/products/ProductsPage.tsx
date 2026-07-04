import PageHeader from "@/components/ui/PageHeader";
import ProductStats from "./ProductStats";
import ProductTable from "./ProductTable";

export default function ProductsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        description="Manage your products across all marketplaces."
        buttonText="+ Add Product"
      />

      <ProductStats />

      <ProductTable />
    </div>
  );
}