import {
  MarketplaceName,
  ValidationSeverity,
  type MasterListing,
  type ValidationIssue,
} from "@/lib/types/master-listing";

function issue(
  code: string,
  severity: ValidationSeverity,
  title: string,
  description: string,
  field: string,
  marketplaces: MarketplaceName[] = [],
): ValidationIssue {
  return {
    id: code,
    severity,
    title,
    description,
    field,
    marketplaces,
  };
}

export interface MasterListingValidationResult {
  valid: boolean;
  score: number;
  issues: ValidationIssue[];
}

export function validateMasterListing(
  listing: MasterListing,
): MasterListingValidationResult {
  const issues: ValidationIssue[] =
    [];

  if (
    !listing.identity.productName.trim()
  ) {
    issues.push(
      issue(
        "identity.productName.required",
        ValidationSeverity.ERROR,
        "Product title required",
        "Product title is required.",
        "identity.productName",
      ),
    );
  }

  if (!listing.identity.sku.trim()) {
    issues.push(
      issue(
        "identity.sku.required",
        ValidationSeverity.ERROR,
        "SKU required",
        "Master SKU is required.",
        "identity.sku",
      ),
    );
  }

  if (!listing.identity.brand.trim()) {
    issues.push(
      issue(
        "identity.brand.required",
        ValidationSeverity.WARNING,
        "Brand missing",
        "Brand is required by most marketplaces.",
        "identity.brand",
      ),
    );
  }

  if (
    !listing.identity.category.trim()
  ) {
    issues.push(
      issue(
        "identity.category.required",
        ValidationSeverity.ERROR,
        "Category required",
        "A master category is required for marketplace mapping.",
        "identity.category",
      ),
    );
  }

  const primaryImage =
    listing.media.find(
      (item) =>
        item.kind === "image" &&
        item.isPrimary &&
        item.url,
    );

  if (!primaryImage) {
    issues.push(
      issue(
        "media.primary.required",
        ValidationSeverity.ERROR,
        "Primary image missing",
        "Add a primary product image.",
        "media",
      ),
    );
  }

  const imageCount =
    listing.media.filter(
      (item) =>
        item.kind === "image" &&
        Boolean(item.url),
    ).length;

  if (imageCount < 4) {
    issues.push(
      issue(
        "media.gallery.recommended",
        ValidationSeverity.INFO,
        "Add more gallery images",
        "Four or more images improve marketplace coverage.",
        "media",
      ),
    );
  }

  if (
    listing.pricing.sellingPrice <= 0
  ) {
    issues.push(
      issue(
        "pricing.sellingPrice.invalid",
        ValidationSeverity.ERROR,
        "Invalid selling price",
        "Selling price must be greater than zero.",
        "pricing.sellingPrice",
      ),
    );
  }

  if (
    listing.pricing.costPrice >
    listing.pricing.sellingPrice
  ) {
    issues.push(
      issue(
        "pricing.costPrice.high",
        ValidationSeverity.WARNING,
        "Cost exceeds selling price",
        "The product currently has a negative gross margin.",
        "pricing.costPrice",
      ),
    );
  }

  if (
    listing.pricing.mrp <
    listing.pricing.sellingPrice
  ) {
    issues.push(
      issue(
        "pricing.mrp.low",
        ValidationSeverity.ERROR,
        "MRP below selling price",
        "MRP cannot be lower than the selling price.",
        "pricing.mrp",
      ),
    );
  }

  if (
    listing.inventory.available === 0
  ) {
    issues.push(
      issue(
        "inventory.outOfStock",
        ValidationSeverity.WARNING,
        "Out of stock",
        "Publishing can continue, but inventory synchronization will send zero stock.",
        "inventory.available",
      ),
    );
  }

  const duplicateSkus =
    listing.variants.filter(
      (variant, index, variants) =>
        variants.findIndex(
          (candidate) =>
            candidate.sku ===
            variant.sku,
        ) !== index,
    );

  if (duplicateSkus.length > 0) {
    issues.push(
      issue(
        "variants.sku.duplicate",
        ValidationSeverity.ERROR,
        "Duplicate variant SKU",
        "Every active variant must have a unique SKU.",
        "variants",
      ),
    );
  }

  if (!listing.identity.hsn) {
    issues.push(
      issue(
        "compliance.hsn.required",
        ValidationSeverity.WARNING,
        "HSN code missing",
        "Add an HSN code before publishing to Indian marketplaces.",
        "identity.hsn",
        [
          MarketplaceName.AMAZON,
          MarketplaceName.FLIPKART,
          MarketplaceName.MEESHO,
          MarketplaceName.AJIO,
          MarketplaceName.MYNTRA,
        ],
      ),
    );
  }

  if (
    !listing.marketplaces.some(
      (marketplace) =>
        marketplace.enabled,
    )
  ) {
    issues.push(
      issue(
        "channels.enabled.required",
        ValidationSeverity.WARNING,
        "No publishing channel enabled",
        "Enable at least one channel before publishing.",
        "marketplaces",
      ),
    );
  }

  const score = Math.max(
    0,
    100 -
      issues.reduce(
        (total, item) =>
          total +
          (item.severity ===
          ValidationSeverity.ERROR
            ? 15
            : item.severity ===
                ValidationSeverity.WARNING
              ? 5
              : 1),
        0,
      ),
  );

  return {
    valid: !issues.some(
      (item) =>
        item.severity ===
        ValidationSeverity.ERROR,
    ),
    score,
    issues,
  };
}
