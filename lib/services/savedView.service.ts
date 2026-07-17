import type { ProductFilters } from "@/lib/types/product-filter";

const STORAGE_KEY = "commerceos:saved-views";

export interface SavedView {
  id: string;
  name: string;
  description?: string;

  filters: ProductFilters;

  isDefault: boolean;

  createdAt: string;
  updatedAt: string;
}

class SavedViewService {
  getAll(): SavedView[] {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  get(id: string) {
    return this.getAll().find((view) => view.id === id);
  }

  save(view: SavedView) {
    const views = this.getAll();

    const index = views.findIndex(
      (v) => v.id === view.id
    );

    if (index >= 0) {
      views[index] = view;
    } else {
      views.push(view);
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(views)
    );
  }

  rename(id: string, name: string) {
    const views = this.getAll();

    const updated = views.map((view) =>
      view.id === id
        ? {
            ...view,
            name,
            updatedAt: new Date().toISOString(),
          }
        : view
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  delete(id: string) {
    const updated = this.getAll().filter(
      (view) => view.id !== id
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  setDefault(id: string) {
    const updated = this.getAll().map((view) => ({
      ...view,
      isDefault: view.id === id,
    }));

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );
  }

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const savedViewService =
  new SavedViewService();