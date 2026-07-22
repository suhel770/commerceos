import { useLayoutContext } from "@/providers/LayoutProvider";

export function useLayout() {
  return useLayoutContext();
}