import { AIRecommendation } from "@/lib/types/product";

interface AIRecommendationCellProps {
  recommendation?: AIRecommendation;
}

export default function AIRecommendationCell({
  recommendation,
}: AIRecommendationCellProps) {

  if (!recommendation) {
    return (
      <span className="text-xs text-slate-400">
        No Recommendation
      </span>
    );
  }

  const colors = {
    low: "bg-blue-50 text-blue-700 border-blue-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    high: "bg-red-50 text-red-700 border-red-200",
  };

    const labels = {
      pricing: "Pricing",
      inventory: "Inventory",
      listing: "Listing",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
          colors[recommendation.priority]
        }`}
      >
        💡 {labels[recommendation.type]}
      </span>
    );
}