"use client";

import { Product } from "@/lib/types/product";

import ProductCell from "./cells/ProductCell";
import OrdersCell from "./cells/OrdersCell";
import StockCell from "./cells/StockCell";
import RevenueCell from "./cells/RevenueCell";
import ProfitCell from "./cells/ProfitCell";
import ReturnCell from "./cells/ReturnCell";
import HealthCell from "./cells/HealthCell";
import AIRecommendationCell from "./cells/AIRecommendationCell";
import StatusCell from "./cells/StatusCell";
import ActionCell from "./cells/ActionCell";

interface ProductRowProps {
  product: Product;
}

export default function ProductRow({
  product,
}: ProductRowProps) {
  return (
    <tr className="border-b border-slate-100 transition-all duration-200 hover:bg-blue-50/40">
      <td className="px-3 py-4 align-top">
        <input type="checkbox" />
      </td>

      <td className="w-[360px] px-3 py-4">
        <ProductCell product={product} />
      </td>

      <td className="px-3 py-4">
        <OrdersCell orders={product.performance.ordersToday} />
      </td>

      <td className="px-3 py-4">
        <StockCell stock={product.inventory.available} />
      </td>

      <td className="px-3 py-4">
        <RevenueCell revenue={product.performance.revenueToday} />
      </td>

      <td className="px-3 py-4">
        <ProfitCell
          profit={product.pricing.profit}
          margin={product.pricing.margin}
        />
      </td>

      <td className="px-3 py-4">
        <ReturnCell
          returns={product.performance.returnsPercentage}
        />
      </td>

      <td className="px-3 py-4">
        <HealthCell
          score={product.performance.healthScore}
        />
      </td>

      <td className="w-36 px-3 py-4">
        <AIRecommendationCell
          recommendation={product.aiRecommendations[0]}
        />
      </td>

      <td className="px-3 py-4">
        <StatusCell status={product.status} />
      </td>

      <td className="px-3 py-4">
        <ActionCell productId={product.slug} />
      </td>
    </tr>
  );
}