import { useLayoutContext } from "@/providers/LayoutProvider";

export function useCommandCenter() {
  const {
    commandCenterOpen: open,
    openCommandCenter,
    closeCommandCenter,
    toggleCommandCenter,
  } = useLayoutContext();

  return {
    open,
    openCommandCenter,
    closeCommandCenter,
    toggleCommandCenter,
  };
}