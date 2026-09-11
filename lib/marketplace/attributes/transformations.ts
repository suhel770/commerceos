import type { TransformationRule } from "./types";

export function applyTransformation(
  value: unknown,
  rules: TransformationRule[] | undefined,
): unknown {
  if (!rules || rules.length === 0 || value === undefined || value === null) {
    return value;
  }

  let transformed: any = value;

  for (const rule of rules) {
    switch (rule.type) {
      case "MAP_ENUM": {
        const mapping = (rule.params.mapping as Record<string, string>) || {};
        const strVal = String(transformed).trim();
        // Case-insensitive lookup
        const matchKey = Object.keys(mapping).find(
          (k) => k.toLowerCase() === strVal.toLowerCase(),
        );
        if (matchKey) {
          transformed = mapping[matchKey];
        } else if (rule.params.defaultFallback) {
          transformed = rule.params.defaultFallback;
        }
        break;
      }

      case "UNIT_CONVERT": {
        const fromUnit = String(rule.params.fromUnit || "").toLowerCase();
        const toUnit = String(rule.params.toUnit || "").toLowerCase();
        const numVal = Number(transformed);

        if (!isNaN(numVal)) {
          if (fromUnit === "cm" && toUnit === "inches") {
            transformed = Number((numVal / 2.54).toFixed(2));
          } else if (fromUnit === "inches" && toUnit === "cm") {
            transformed = Number((numVal * 2.54).toFixed(2));
          } else if (fromUnit === "g" && toUnit === "kg") {
            transformed = Number((numVal / 1000).toFixed(3));
          } else if (fromUnit === "kg" && toUnit === "g") {
            transformed = Number((numVal * 1000).toFixed(0));
          }
        }
        break;
      }

      case "TEXT_CASE": {
        const targetCase = String(rule.params.case || "UPPERCASE").toUpperCase();
        const strVal = String(transformed);
        if (targetCase === "UPPERCASE") {
          transformed = strVal.toUpperCase();
        } else if (targetCase === "LOWERCASE") {
          transformed = strVal.toLowerCase();
        } else if (targetCase === "TITLECASE") {
          transformed = strVal.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
        }
        break;
      }

      case "PREFIX_SUFFIX": {
        const prefix = String(rule.params.prefix || "");
        const suffix = String(rule.params.suffix || "");
        transformed = `${prefix}${transformed}${suffix}`;
        break;
      }

      case "SPLIT_TO_ARRAY": {
        const delimiter = String(rule.params.delimiter || ",");
        if (typeof transformed === "string") {
          transformed = transformed
            .split(delimiter)
            .map((s) => s.trim())
            .filter(Boolean);
        }
        break;
      }

      case "JOIN_ARRAY": {
        const separator = String(rule.params.separator || ", ");
        if (Array.isArray(transformed)) {
          transformed = transformed.join(separator);
        }
        break;
      }

      case "DEFAULT_FALLBACK": {
        if (!transformed || String(transformed).trim() === "") {
          transformed = rule.params.fallbackValue as unknown;
        }
        break;
      }
    }
  }

  return transformed;
}
