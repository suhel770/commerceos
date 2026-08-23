# Purchase (`lib/purchase`)

Runtime purchase/procurement helpers used by the Purchase workspace.

## Purchase Stock (Finance handoff)

`/purchase/stock` aggregates stock-path bills (`inventory_product`,
`packaging_material`):

- Purchased qty = line `quantity`
- Damaged qty = line `qtyDamaged`
- Sellable qty = `quantity - qtyDamaged`
- Damage value ₹ ≈ damaged × unit cost (for Finance loss signal)

Recording damage via `POST /api/v1/purchase/bills/[id]/damage` does **not**
call Inventory adjust/damage. Inventory remains stock SoR until Phase B.

Helpers: `aggregatePurchaseStockBySku`, `summarizePurchaseStock` in
`stock-data.ts`.

## GST tax mode (Finance handoff)

Purchase bills store **one GST rate per line** plus **split tax amounts**. The
user never enters CGST / SGST / IGST separately.

### Tax mode (auto) — your GST vs vendor GST

| Condition | Tax mode | Split of line GST % |
|---|---|---|
| Vendor GST-registered and GSTIN state = **your** GSTIN state | Intrastate | CGST + SGST (each half) |
| Vendor GST-registered and GSTIN state ≠ **your** GSTIN state | Interstate | IGST (full rate) |
| Vendor unregistered / unknown | No GST | All tax amounts = 0 |

- **Your** state comes from business profile GSTIN
  (`lib/business-profile`, Settings → Business & GST). Example: UP GSTIN
  `09…` + Delhi vendor `07…` → IGST; UP vendor `09…` → CGST + SGST.
- Seeded default is StrideKids MH `27`; change in Settings for your state.
- Persisted on each bill: `buyerStateCode`, `buyerGstin`, `interstate`, and
  split tax amounts.
- Decision helpers: `isInterstateSupply`, `splitGst`, `vendorIsGstRegistered`
  in `gst.ts`.

### Rate slabs

Line GST % uses statutory slabs: `GST_RATE_SLABS = [0, 5, 12, 18, 28]`.
Free rates are snapped via `normalizeGstRate`.

### What Finance should use

Prefer stored columns — do **not** re-derive tax type from rate alone:

- Header: `interstate`, `buyerStateCode`, `cgstAmount`, `sgstAmount`,
  `igstAmount`, `taxAmount`
- Lines: `gstRate`, `cgstAmount`, `sgstAmount`, `igstAmount`, `taxAmount`

Sum `cgstAmount` / `sgstAmount` / `igstAmount` for ledgers and ITC. Use
`interstate` + `buyerStateCode` for place-of-supply grouping.
