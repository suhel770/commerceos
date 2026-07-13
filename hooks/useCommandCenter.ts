import { useContext } from "react";
import { CommandCenterContext } from "@/providers/CommandCenterProvider";

export function useCommandCenter() {
  const context = useContext(CommandCenterContext);

  if (!context) {
    throw new Error(
      "useCommandCenter must be used inside CommandCenterProvider"
    );
  }

  return context;
}