import type { PurchaseSuggestion } from "./types";

class LocalPurchaseSuggestionStore {
  private readonly suggestions: PurchaseSuggestion[] = [];

  async save(suggestion: PurchaseSuggestion): Promise<PurchaseSuggestion> {
    const next: PurchaseSuggestion = {
      ...suggestion,
      status: "saved",
      createdAt: suggestion.createdAt || new Date().toISOString(),
    };
    const index = this.suggestions.findIndex(
      (row) =>
        row.productId === next.productId &&
        row.status === "saved" &&
        row.quantity === next.quantity,
    );
    if (index >= 0) {
      this.suggestions[index] = next;
    } else {
      this.suggestions.unshift(next);
    }
    return structuredClone(next);
  }

  async list(filter?: {
    productId?: string;
  }): Promise<PurchaseSuggestion[]> {
    return structuredClone(
      this.suggestions.filter((row) => {
        if (filter?.productId && row.productId !== filter.productId) {
          return false;
        }
        return row.status === "saved";
      }),
    );
  }
}

export const purchaseSuggestionStore = new LocalPurchaseSuggestionStore();
