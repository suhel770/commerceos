# Business profile

Seller / organization identity used as the **buyer** for Purchase GST.

- Source of truth at runtime: `businessProfileRepository` (seeded from
  `DEMO_BUSINESS`, editable via `PATCH /api/v1/settings/business`).
- UI: Settings → Business & GST details.
- Purchase tax mode compares `stateCodeFromGstin(yourGstin)` with
  `stateCodeFromGstin(vendorGstin)`.
