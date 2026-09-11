import { AttributeRequirement } from "@/lib/types/master-listing";
import type {
  AttributeValidationResult,
  MarketplaceAttributeSchemaDefinition,
} from "./types";
import { resolveAttributeRequirement } from "./conditional-rules";
import { applyTransformation } from "./transformations";

export function evaluateAttribute(
  definition: MarketplaceAttributeSchemaDefinition,
  providedValue: unknown,
  contextValues: Record<string, unknown>,
): AttributeValidationResult {
  const requirement = resolveAttributeRequirement(
    definition.requirementLevel || (definition.isRequired ? AttributeRequirement.REQUIRED : AttributeRequirement.OPTIONAL),
    definition.conditionalRules,
    contextValues,
  );

  const errors: string[] = [];
  const warnings: string[] = [];

  const hasValue =
    providedValue !== undefined &&
    providedValue !== null &&
    String(providedValue).trim() !== "";

  // 1. Mandatory check
  if (!hasValue) {
    if (requirement === AttributeRequirement.REQUIRED) {
      errors.push(`Field '${definition.label || definition.attributeKey}' is mandatory for this marketplace.`);
    } else if (requirement === AttributeRequirement.RECOMMENDED) {
      warnings.push(`Field '${definition.label || definition.attributeKey}' is recommended for better discoverability.`);
    }

    return {
      attributeKey: definition.attributeKey,
      valid: errors.length === 0,
      requirement,
      providedValue,
      transformedValue: undefined,
      errors,
      warnings,
    };
  }

  // 2. Transformation
  const transformedValue = applyTransformation(
    providedValue,
    definition.transformationRules,
  );

  // 3. Allowed Values / Enum check
  if (definition.allowedValues && definition.allowedValues.length > 0) {
    const valStr = String(transformedValue).toLowerCase().trim();
    const isAllowed = definition.allowedValues.some(
      (allowed) => allowed.toLowerCase().trim() === valStr,
    );

    if (!isAllowed) {
      if (requirement === AttributeRequirement.REQUIRED) {
        errors.push(
          `Value '${transformedValue}' is not permitted for '${definition.label}'. Allowed values: ${definition.allowedValues.slice(0, 5).join(", ")}${definition.allowedValues.length > 5 ? "..." : ""}`,
        );
      } else {
        warnings.push(
          `Value '${transformedValue}' does not match standard values: ${definition.allowedValues.slice(0, 3).join(", ")}`,
        );
      }
    }
  }

  // 4. Data Type check
  if (definition.dataType === "number" || definition.dataType === "integer") {
    const num = Number(transformedValue);
    if (isNaN(num)) {
      errors.push(`Field '${definition.label}' must be a valid number.`);
    } else if (definition.dataType === "integer" && !Number.isInteger(num)) {
      errors.push(`Field '${definition.label}' must be an integer.`);
    }
  }

  return {
    attributeKey: definition.attributeKey,
    valid: errors.length === 0,
    requirement,
    providedValue,
    transformedValue,
    errors,
    warnings,
  };
}
