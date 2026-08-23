/* ============================================================================
   CommerceOS
   Master Listing Domain Model
   ----------------------------------------------------------------------------
   Single Source of Truth for every product listing.

   Philosophy:
   - User creates ONE master listing.
   - CommerceOS maps it automatically to every marketplace.
   - AI is optional.
   - Marketplace specific complexity stays internal.
   ============================================================================ */

export type UUID = string

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

export enum ListingStatus {
  DRAFT = "draft",
  READY = "ready",
  PUBLISHED = "published",
  PARTIALLY_PUBLISHED = "partially_published",
  FAILED = "failed",
  ARCHIVED = "archived",
}

export enum MarketplaceName {
  AMAZON = "amazon",
  FLIPKART = "flipkart",
  MEESHO = "meesho",
  SHOPIFY = "shopify",
  WOOCOMMERCE = "woocommerce",
  AJIO = "ajio",
  MYNTRA = "myntra",
}

export enum MarketplacePublishStatus {
  NOT_CONNECTED = "not_connected",
  NOT_PUBLISHED = "not_published",
  VALIDATING = "validating",
  READY = "ready",
  PUBLISHING = "publishing",
  PUBLISHED = "published",
  FAILED = "failed",
  SYNCING = "syncing",
}

export enum ValidationSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export enum AttributeRequirement {
  REQUIRED = "required",
  RECOMMENDED = "recommended",
  OPTIONAL = "optional",
}

/* -------------------------------------------------------------------------- */
/*                             PRODUCT IDENTITY                               */
/* -------------------------------------------------------------------------- */

export interface ProductIdentity {
  id: UUID

  sku: string

  productName: string

  shortName?: string

  brand: string

  manufacturer?: string

  category: string

  subCategory?: string

  productType?: string

  variantGroupId?: string

  barcode?: string

  gtin?: string

  upc?: string

  ean?: string

  hsn?: string

  taxCode?: string
}

/* -------------------------------------------------------------------------- */
/*                                MEDIA                                       */
/* -------------------------------------------------------------------------- */

export interface ListingMedia {

  id: UUID

  kind: MediaKind

  url: string

  thumbnail?: string

  alt?: string

  isPrimary: boolean

  width?: number

  height?: number

  tags?: string[]

  sortOrder: number
}

/* -------------------------------------------------------------------------- */
/*                                PRICING                                     */
/* -------------------------------------------------------------------------- */

export interface ListingPricing {

  mrp: number

  sellingPrice: number

  costPrice: number

  currency: string

  taxPercentage?: number
}

/* -------------------------------------------------------------------------- */
/*                               INVENTORY                                    */
/* -------------------------------------------------------------------------- */

export interface ListingInventory {

  available: number

  reserved: number

  incoming: number

  safetyStock: number

  warehouseIds: UUID[]
}

/* -------------------------------------------------------------------------- */
/*                            MASTER ATTRIBUTE                                */
/* -------------------------------------------------------------------------- */

export interface MasterAttribute {

  id: UUID

  key: string

  label: string

  value: unknown

  group: string

  searchable?: boolean

  filterable?: boolean
}

/* -------------------------------------------------------------------------- */
/*                       MARKETPLACE ATTRIBUTE MAP                            */
/* -------------------------------------------------------------------------- */

export interface MarketplaceAttributeMapping {

  marketplace: MarketplaceName

  marketplaceField: string

  masterAttributeKey: string

  required: AttributeRequirement

  transformedValue?: unknown
}

/* -------------------------------------------------------------------------- */
/*                              VALIDATION                                    */
/* -------------------------------------------------------------------------- */

export interface ValidationIssue {

  id: UUID

  severity: ValidationSeverity

  title: string

  description: string

  field?: string

  marketplaces: MarketplaceName[]
}

/* -------------------------------------------------------------------------- */
/*                            MARKETPLACE STATE                               */
/* -------------------------------------------------------------------------- */

export interface MarketplaceConnection {

  marketplace: MarketplaceName

  enabled: boolean

  publishStatus: MarketplacePublishStatus

  listingId?: string

  externalId?: string

  listingUrl?: string

  lastPublishedAt?: string

  lastSyncedAt?: string

  validationScore: number

  issues: ValidationIssue[]
}

/* -------------------------------------------------------------------------- */
/*                                AI                                           */
/* -------------------------------------------------------------------------- */

export interface AIInsight {

  id: UUID

  type:
    | "title"
    | "description"
    | "seo"
    | "pricing"
    | "image"
    | "inventory"

  title: string

  description: string

  applied: boolean

  creditRequired: boolean
}

/* -------------------------------------------------------------------------- */
/*                              AUDIT                                          */
/* -------------------------------------------------------------------------- */

export interface AuditMetadata {

  createdAt: string

  updatedAt: string

  createdBy: UUID

  updatedBy: UUID

  version: number
}

/* -------------------------------------------------------------------------- */
/*                            PERMISSIONS                                      */
/* -------------------------------------------------------------------------- */

export interface ListingPermissions {

  canView: boolean

  canEdit: boolean

  canPublish: boolean

  canArchive: boolean

  canDelete: boolean

  canManagePricing: boolean

  canManageInventory: boolean

  canUseAI: boolean
}

export interface AIEntitlement {

  enabled: boolean

  creditsRemaining: number

  plan?: string
}

export type MediaKind =
  | "image"
  | "video"
  | "document"

export interface ProductVariant {
  id: UUID
  sku: string
  title: string
  optionValues: Record<
    string,
    string
  >
  barcode?: string
  sellingPrice?: number
  available?: number
  mediaIds: UUID[]
  active: boolean
}

export interface ProductCommercials {
  minimumPrice?: number
  maximumPrice?: number
  weightGrams?: number
  packageLengthCm?: number
  packageWidthCm?: number
  packageHeightCm?: number
}

export interface ProductSupply {
  primarySupplier?: string
  supplierSku?: string
  leadTimeDays?: number
  minimumOrderQuantity?: number
  reorderQuantity?: number
  procurementReference?: string
}

export interface ComplianceDocument {
  id: UUID
  name: string
  type: string
  url: string
  expiresAt?: string
}

export interface ProductCompliance {
  countryOfOrigin?: string
  warranty?: string
  legalMetrology?: string
  certifications: string[]
  documents: ComplianceDocument[]
}

export interface ProductGrowth {
  seoTitle?: string
  metaDescription?: string
  searchTerms: string[]
  bulletPoints: string[]
  merchandisingTags: string[]
}

export interface ListingActivity {
  id: UUID
  type: string
  title: string
  description?: string
  actorId: UUID
  actorName: string
  timestamp: string
  before?: unknown
  after?: unknown
}

/* -------------------------------------------------------------------------- */
/*                           MASTER LISTING                                   */
/* -------------------------------------------------------------------------- */

export interface MasterListing {

  id: UUID

  organizationId: UUID

  workspaceId: UUID

  revision: number

  identity: ProductIdentity

  status: ListingStatus

  media: ListingMedia[]

  pricing: ListingPricing

  commercials: ProductCommercials

  inventory: ListingInventory

  supply: ProductSupply

  variants: ProductVariant[]

  compliance: ProductCompliance

  growth: ProductGrowth

  attributes: MasterAttribute[]

  attributeMappings: MarketplaceAttributeMapping[]

  marketplaces: MarketplaceConnection[]

  validationIssues: ValidationIssue[]

  aiInsights: AIInsight[]

  aiEntitlement?: AIEntitlement

  activity: ListingActivity[]

  permissions: ListingPermissions

  audit: AuditMetadata
}