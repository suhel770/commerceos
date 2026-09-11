import { AttributeRequirement } from "@/lib/types/master-listing";
import type { ConditionalRule } from "./types";

export function evaluateConditionalRule(
  rule: ConditionalRule,
  contextValues: Record<string, unknown>,
): { isTriggered: boolean; requirement: AttributeRequirement } {
  const contextVal = contextValues[rule.targetField];

  let isTriggered = false;

  switch (rule.operator) {
    case "EXISTS":
      isTriggered = contextVal !== undefined && contextVal !== null && contextVal !== "";
      break;

    case "EQUALS":
      isTriggered =
        String(contextVal).trim().toLowerCase() ===
        String(rule.expectedValue).trim().toLowerCase();
      break;

    case "NOT_EQUALS":
      isTriggered =
        String(contextVal).trim().toLowerCase() !==
        String(rule.expectedValue).trim().toLowerCase();
      break;

    case "IN":
      if (Array.isArray(rule.expectedValue)) {
        isTriggered = rule.expectedValue.some(
          (v) => String(v).toLowerCase() === String(contextVal).toLowerCase(),
        );
      }
      break;

    case "NOT_IN":
      if (Array.isArray(rule.expectedValue)) {
        isTriggered = !rule.expectedValue.some(
          (v) => String(v).toLowerCase() === String(contextVal).toLowerCase(),
        );
      }
      break;

    case "CONTAINS":
      isTriggered = String(contextVal || "")
        .toLowerCase()
        .includes(String(rule.expectedValue).toLowerCase());
      break;

    case "GREATER_THAN":
      isTriggered = Number(contextVal) > Number(rule.expectedValue);
      break;

    case "LESS_THAN":
      isTriggered = Number(contextVal) < Number(rule.expectedValue);
      break;

    default:
      isTriggered = false;
  }

  return {
    isTriggered,
    requirement: isTriggered
      ? ((String(rule.thenRequirement).toLowerCase() === "required" ? AttributeRequirement.REQUIRED : String(rule.thenRequirement).toLowerCase() === "recommended" ? AttributeRequirement.RECOMMENDED : AttributeRequirement.OPTIONAL) as AttributeRequirement)
      : AttributeRequirement.OPTIONAL,
  };
}

export function resolveAttributeRequirement(
  baseRequirement: AttributeRequirement | string,
  conditionalRules: ConditionalRule[] | undefined,
  contextValues: Record<string, unknown>,
): AttributeRequirement {
  const normBase = (String(baseRequirement).toLowerCase() as AttributeRequirement) || AttributeRequirement.OPTIONAL;

  if (!conditionalRules || conditionalRules.length === 0) {
    return normBase;
  }

  for (const rule of conditionalRules) {
    const result = evaluateConditionalRule(rule, contextValues);
    if (result.isTriggered) {
      // If any conditional rule makes it REQUIRED, prioritize REQUIRED
      if (result.requirement === AttributeRequirement.REQUIRED) {
        return AttributeRequirement.REQUIRED;
      }
      if (result.requirement === AttributeRequirement.RECOMMENDED && normBase !== AttributeRequirement.REQUIRED) {
        return AttributeRequirement.RECOMMENDED;
      }
    }
  }

  return normBase;
}
