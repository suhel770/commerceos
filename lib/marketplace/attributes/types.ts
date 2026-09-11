import type { AttributeRequirement, MarketplaceName } from "@/lib/types/master-listing";

export type UniversalDataType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "multi-select"
  | "date"
  | "measurement"
  | "currency"
  | "object"
  | "array";

export type AttributeGroup =
  | "general"
  | "physical"
  | "variant"
  | "compliance"
  | "commercial"
  | "seo";

export interface UniversalAttribute {
  key: string;
  label: string;
  dataType: UniversalDataType;
  unit?: string;
  allowedValues?: string[];
  group: AttributeGroup;
  description?: string;
  active: boolean;
}

export type ConditionalOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "IN"
  | "NOT_IN"
  | "CONTAINS"
  | "EXISTS"
  | "GREATER_THAN"
  | "LESS_THAN";

export interface ConditionalRule {
  id: string;
  targetField: string;
  operator: ConditionalOperator;
  expectedValue: unknown;
  thenRequirement: AttributeRequirement;
  errorMessage?: string;
}

export type TransformationType =
  | "MAP_ENUM"
  | "UNIT_CONVERT"
  | "TEXT_CASE"
  | "PREFIX_SUFFIX"
  | "SPLIT_TO_ARRAY"
  | "JOIN_ARRAY"
  | "FORMAT_DATE"
  | "DEFAULT_FALLBACK";

export interface TransformationRule {
  type: TransformationType;
  params: Record<string, unknown>;
}

export interface MarketplaceAttributeSchemaDefinition {
  attributeKey: string;
  label: string;
  dataType: UniversalDataType;
  unit?: string;
  allowedValues?: string[];
  isRequired: boolean;
  requirementLevel: AttributeRequirement;
  universalAttributeKey?: string;
  conditionalRules?: ConditionalRule[];
  transformationRules?: TransformationRule[];
}

export interface AttributeValidationResult {
  attributeKey: string;
  valid: boolean;
  requirement: AttributeRequirement;
  providedValue?: unknown;
  transformedValue?: unknown;
  errors: string[];
  warnings: string[];
}
