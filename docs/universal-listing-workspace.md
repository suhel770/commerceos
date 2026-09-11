# CommerceOS — Universal Listing Workspace Architecture Document

**Author**: Antigravity Engineering  
**Version**: 2.0.0 (Phase 2A Architecture)  
**Status**: APPROVED DESIGN SPECIFICATION  

---

## 1. Workspace Purpose

The **Universal Listing Workspace** is the central command center of CommerceOS for catalog orchestration and multi-channel publishing. 

### Core Vision:
```
ONE MASTER PRODUCT
        ↓
ONE MASTER DATASET
        ↓
AUTOMATIC CATEGORY MAPPING
        ↓
AUTOMATIC ATTRIBUTE MAPPING
        ↓
MARKETPLACE REQUIREMENT ANALYSIS
        ↓
ONLY EXCEPTIONS SHOWN TO USER ("Action Required")
        ↓
CHANNEL READINESS
        ↓
PUBLISH EVERYWHERE (ELIGIBLE CHANNELS)
        ↓
FUTURE API SYNC
```

The seller interacts with **one master product**. They never fill repetitive forms for Amazon, Flipkart, Myntra, Meesho, Shopify, etc. CommerceOS automatically normalizes data, evaluates channel requirements, computes genuine readiness scores, and isolates channel-specific overrides.

---

## 2. User Journey

1. **Product Discovery / Creation**:
   - User navigates from **Product List** or **Purchase Flow** into the Universal Listing Workspace (`/products/[slug]/edit`).
   - Canonical `PRD-xxxxxx` Product ID is displayed as an immutable badge.
2. **Master Product Orchestration**:
   - User inputs or updates universal product data (Identity, Content, Media, Commercials, Inventory, Variants, Attributes, Compliance, Supply).
3. **Automatic Intelligence & Readiness Review**:
   - In real-time, CommerceOS evaluates category mappings, attribute schemas, and compliance rules across all connected channels.
   - The **Channel Readiness Strip** displays overall listing health (e.g. `86% Ready`) and individual channel badges.
4. **Exception-First Resolution ("Action Required")**:
   - If a channel has missing mandatory attributes (e.g. Myntra requires `Brand Size`, Amazon requires `Country of Origin`), the **Exceptions Drawer / Panel** highlights only the specific delta fields needed.
   - User resolves exceptions in one unified screen without switching between tabs.
5. **Marketplace Preview**:
   - User previews the transformed listing payload for each channel (simulated catalog view showing transformed title, pricing, mapped attributes, and images).
6. **Publish Everywhere**:
   - User reviews eligible channels and triggers publishing. (In Phase 2A, the Publish Center validates and stages the payload; live API integration is deferred).

---

## 3. Information Architecture

The Universal Listing Workspace is structured into two core visual zones:

```
+---------------------------------------------------------------------------------------------------+
| COMPACT WORKSPACE HEADER: Title | Status | Canonical PRD-000101 | Save State | Publish Everywhere |
+---------------------------------------------------------------------------------------------------+
| SUB-NAVIGATION: Master Product | Channels & Readiness | Exceptions (2) | Preview | Publish Center |
+---------------------------------------------------------------------------------------------------+
| MAIN CONTENT AREA                                                | SIDEBAR / INTELLIGENCE PANEL   |
| 1. Product Identity (SKU, Name, Brand, Category, HSN, Tax)       | - Overall Readiness Score      |
| 2. Content & Growth (Descriptions, Bullets, Keywords)            | - Connected Channels Status    |
| 3. Visual Media (Images, Gallery, Video, Size Charts)            | - Action Required Items (2)    |
| 4. Commercials & Pricing (MRP, Selling Price, Cost, Margins)     | - Category Mapping State       |
| 5. Inventory & Stock (Available, Reserved, Safety Buffer)        | - Quick Navigation Jump Links  |
| 6. Variants (Sizes, Colors, Barcodes, Variant Pricing)           |                                |
| 7. Universal Attributes (Color, Material, Gender, Fit, Occasion) |                                |
| 8. Regulatory Compliance (HSN, Origin, Legal Metrology)          |                                |
| 9. Supply & Procurement (Vendor, MOQ, Lead Time)                 |                                |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Master vs Channel Data Model

```mermaid
classDiagram
    class MasterProduct {
        +String productId (PRD-000101)
        +String sku
        +String name
        +String brand
        +String category
        +Decimal costPrice
        +Decimal sellingPrice
        +Decimal mrp
        +String hsn
        +List~ListingMedia~ media
        +List~MasterAttribute~ attributes
    }

    class MarketplaceCategoryMapping {
        +String commerceCategory
        +MarketplaceName marketplace
        +String marketplaceCategoryId
        +String marketplaceVertical
        +Float confidenceScore
    }

    class MarketplaceAttributeMapping {
        +String masterAttributeKey
        +String marketplaceField
        +AttributeRequirement requirement
        +Object transformedValue
    }

    class MarketplaceListing {
        +String marketplaceSku
        +String externalProductId (ASIN/FSN)
        +String channelTitle (Override)
        +Decimal sellingPrice (Channel Price)
        +MarketplacePublishStatus publishStatus
        +DateTime lastSyncedAt
    }

    MasterProduct "1" --> "*" MarketplaceListing : publishes to
    MasterProduct "1" --> "*" MarketplaceCategoryMapping : resolves via
    MasterProduct "1" --> "*" MarketplaceAttributeMapping : transforms via
```

### Invariant Rules:
1. **Source of Truth**: `MasterProduct` remains marketplace-agnostic.
2. **Channel Overrides**: Channel-specific titles or price modifications are stored in `MarketplaceListing` and **never** overwrite `MasterProduct.name` or `MasterProduct.sellingPrice`.
3. **No Marketplace Columns in Master Schema**: Zero columns like `amazonTitle` or `flipkartPrice` in the `Product` entity.

---

## 5. Navigation Structure

1. **Deterministic Return Navigation**:
   - Preserves `?from=/products` or `?from=/purchase` query parameters when navigating in and out of the studio.
2. **Tabbed Top Navigation**:
   - `Overview` (Master Product 360 view)
   - `Channels` (Channel breakdown & configurations)
   - `Exceptions` (Unified action items)
   - `Preview` (Multi-channel simulated layout)
   - `Publish` (Publish center command interface)
3. **Sub-Workspace Deep Links**:
   - Deep-linking directly to sub-workspaces (`/products/[slug]/edit?workspace=identity`, `?workspace=inventory`, `?workspace=attributes`).

---

## 6. Readiness Model

Readiness is computed in real-time by [`channelReadinessService`](file:///c:/Users/suhel/OneDrive/commerceos/lib/marketplace/readiness/channel-readiness.service.ts) using genuine database fields:

$$\text{Readiness Score} = \text{Base Completeness} (40\%) + \text{Category Mapping} (25\%) + \text{Attributes Valid} (20\%) + \text{Media/Compliance} (15\%)$$

### Distinct Status States:
- **`READY`**: 100% complete, category mapped, mandatory attributes filled, valid price/stock, zero blockers.
- **`ACTION_REQUIRED`**: Channel is connected, but missing required attributes or compliance data.
- **`NOT_CONFIGURED`**: Product lacks fundamental identity (title, sku, price).
- **`NOT_CONNECTED`**: Seller has not connected/authenticated this marketplace in settings.

---

## 7. Exception Model ("Action Required")

Instead of forcing sellers to review 100+ marketplace schema fields, CommerceOS isolates the delta exceptions:

```json
{
  "channel": "MYNTRA",
  "field": "brand_size",
  "label": "Brand Size (UK)",
  "severity": "BLOCKER",
  "reason": "Myntra catalog requires explicit UK sizing for kids footwear",
  "action": "Set shoe_size_uk in Master Attributes"
}
```

The **Exceptions Panel** aggregates all blockers across all connected channels into a single 1-click resolution checklist.

---

## 8. Marketplace Preview Model

The preview engine transforms the universal product into channel-specific visual representations:
- **Amazon Preview**: Renders Amazon buy-box mockup with calculated title, bullet points, image carousel, and ASIN tag.
- **Flipkart Preview**: Renders Flipkart product page mockup with FSN tag, key features list, and price discount badge.
- **Meesho Preview**: Renders Meesho mobile-first catalog card with supplier price and catalog name.

---

## 9. Publishing UX (Publish Center)

The **Publish Center** provides a safe, idempotent multi-channel publishing interface:
- Displays **Eligible Channels** (channels with status `READY` and active connection).
- Displays **Ineligible Channels** with clear explanations of missing requirements.
- Provides **"Publish All Eligible"** action that validates payloads and transitions listings to `STAGED_FOR_SYNC`.
- *(Note: External API execution is deferred as per project specifications).*

---

## 10. Save & Autosave Strategy

1. **Hybrid Save Model**:
   - Explicit **"Save Changes"** button in top header with visual unsaved dirty state indicator (`dot` + `Unsaved changes`).
   - Debounced draft persistence to `localStorage` to prevent accidental loss on tab close.
2. **Optimistic UI with Pessimistic Server Validation**:
   - Client updates local state immediately; server verifies tenant boundaries and schema integrity.

---

## 11. Responsive Strategy

- **Desktop (>= 1440px)**: 2-column layout (Main Workspace + Right Intelligence Sidebar).
- **Laptop (1024px - 1439px)**: High-density stacked layout with collapsible intelligence drawer.
- **Tablet (768px - 1023px)**: Single-column high-density layout with compact headers and full touch support.

---

## 12. Component Reuse Plan

| Existing Component | Status | Role in Universal Workspace |
| :--- | :--- | :--- |
| `StudioHeader.tsx` | Reuse & Enhance | Compact adaptive header with save state & Product ID badge |
| `StudioWorkflowNavigation.tsx` | Reuse & Enhance | Drag-and-drop workspace slider matching container width |
| `WorkspaceGrid.tsx` / `WorkspaceCard.tsx` | Reuse | Drag-and-drop sub-workspace cards |
| `IdentitySection.tsx` | Reuse & Enhance | Compact 2-column identity inputs with `CommerceSelect` |
| `ChannelsSection.tsx` | Redesign | Real-data channel readiness cards consuming `channelReadinessService` |
| `PublishingSection.tsx` | Redesign | Real-data Publish Center shell with exception checklist |
| `AttributesWorkspace.tsx` | Enhance | Dynamic universal attribute manager with mapping indicators |
| `CommerceSelect.tsx` | Mandate Everywhere | All select inputs standardizing across studio |

---

## 13. Data Sources & Services

- **Product Identity & Master Listing**: `lib/repositories/product.repository.ts`, `lib/repositories/masterListing.repository.ts`
- **Channel Readiness**: `lib/marketplace/readiness/channel-readiness.service.ts`
- **Category Taxonomy**: `lib/marketplace/taxonomy/category-mapping.service.ts`
- **Marketplace Registry**: `lib/marketplace/registry/marketplace-registry.ts`
- **Connection Security**: `lib/marketplace/connection/connection.service.ts`
- **Channel Adapters**: `lib/marketplace/adapters/generic.adapter.ts`

---

## 14. What Remains for Later API Integration

The following modules remain intentionally decoupled and will be connected in the final integration phase:
- Live OAuth seller authentication flow
- Direct HTTP/REST/GraphQL API endpoints for Amazon SP-API, Flipkart API, Meesho API, Myntra API, Shopify GraphQL, ONDC BECKN protocol.
- Real-time marketplace inventory webhook listeners and Buy Box price sync workers.
