# CommerceOS — Global Typography System

*Last Updated: 2026-08-18 (Production Migration to Inter)*

## 1. Primary UI Font: Inter

**Inter** is the official primary typeface for CommerceOS. It provides optimal legibility for dense ERP screens, financial tables, numeric data, form controls, and analytical dashboards.

- **Import Source:** `next/font/google` in `app/layout.tsx`
- **CSS Variable:** `--font-sans`
- **Loaded Weights:** `400` (Regular), `500` (Medium), `600` (SemiBold), `700` (Bold), `800` (ExtraBold)
- **Subsets:** `latin`
- **Display:** `swap`
- **Global Base Size:** `16px`
- **Letter Spacing:** `-0.011em` (tuned for Inter's x-height and kerning)
- **Line Height:** `1.5`
- **Smoothing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

### Fallback Chain
```css
font-family: var(--font-sans), Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

---

## 2. Technical & Monospace Font: JetBrains Mono

**JetBrains Mono** is preserved as the official monospace font for technical identifiers, reference codes, SKUs, and invoice numbers.

- **Import Source:** `next/font/google` in `app/layout.tsx`
- **CSS Variable:** `--font-mono`
- **Loaded Weights:** `400`, `500`, `600`, `700`
- **Usage:**
  - SKU tags (`font-mono text-[11px]`)
  - Invoice numbers (`Inv: INV-2026-001`)
  - Batch / Lot identifiers
  - System Node IDs (`font-mono`)
  - `code, kbd, samp, pre, .font-mono`

---

## 3. Typography Hierarchy

| Role | Token / Class | Weight | Size / Line Height | Primary Usage |
|---|---|---|---|---|
| Display | `text-display` / `text-3xl font-black` | 700 / 800 | 32px / 38px | Hero executive metrics, major statistics |
| Page Titles | `text-page-title` / `text-2xl font-bold` | 700 | 26px / 32px | Main workspace titles (*Product Control Center*, *Purchase*) |
| Section Headings | `text-section-title` / `text-lg font-semibold` | 600 | 18px / 24px | Section banners, drawer titles, modal headings |
| Card Titles | `text-card-title` / `text-base font-semibold` | 600 | 15px / 20px | Analytics cards, widget headers, panels |
| Body Large | `text-body-lg` / `text-base font-normal` | 400 / 500 | 16px / 24px | Hero summaries, lead descriptions |
| Body (Primary) | `text-body-base` / `text-sm font-normal` | 400 / 500 | 15px / 22px | Standard body, modal content, primary entity name |
| Body Small | `text-body-sm` / `text-xs font-normal` | 400 / 500 | 14px / 20px | Secondary content, table cells, form inputs |
| Labels & KPI Tags | `text-label` / `text-xs font-bold uppercase` | 600 / 700 | 12px–13px / 18px | Form labels, KPI card categories, table headers |
| Captions & Subtext | `text-caption` / `text-xs font-medium` | 500 | 12px / 16px | Subtext, timestamps, helper notes, badges |
| Micro / SKU Codes | `text-micro` / `text-[11px] font-semibold` | 600 | 11px / 14px | SKU tags (`font-mono`), keyboard shortcuts, system IDs |

---

## 4. Currency Presentation Standard

All Indian Rupee values displayed in the UI follow the strict CommerceOS presentation standard:

```
₹ 35,000
```

- A non-breaking thin space (`\u2009`) separates the `₹` glyph from the digits.
- The `₹` glyph and the digits share the **identical font size, weight, baseline, and font family** (Inter).
- Use centralized formatters (`fmtINR`, `formatPurchaseMoney`, `formatCurrency`) for all UI display.
- Raw database values, calculations, API responses, JSON payloads, and CSV/Excel exports maintain raw numeric formats without formatting characters.

---

## 5. AI Identity Typography

AI workspaces and panels (e.g. Storage AI Advisor, Procurement Copilot, Inventory Advisor) inherit Inter for clean readability while retaining their distinct visual design tokens (`--ai-primary: #7c3aed`, AI surface tints, and glowing borders).

---

## 6. Strict Rules for Future Components

> [!IMPORTANT]
> **Strict Engineering Rule:**
> New CommerceOS components MUST use the global typography system (`--font-sans` for UI, `--font-mono` for technical codes) and MUST NOT introduce a new primary font without design-system approval.
