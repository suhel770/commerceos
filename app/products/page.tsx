import AppShell from "@/components/layout/AppShell";
import PageContainer from "@/components/ui/PageContainer";

import ProductsPage from "@/components/products/ProductsPage";

export default function Page() {
  return (
    <AppShell
      title="Products"
      subtitle="Manage and optimize products across all marketplaces."
    >
      <PageContainer>

        <ProductsPage />

      </PageContainer>
    </AppShell>
  );
}