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

| Role | Class | Weight | Usage |
|---|---|---|---|
| Page Titles | `text-2xl font-black` | 800 / 900 | Main workspace title (Dashboard, Purchase, Storage) |
| Section Headings | `text-base` / `text-lg font-extrabold` | 800 | Section banners, hero cards |
| Table Headers | `text-xs font-extrabold uppercase tracking-wider` | 800 | Column headers across all data tables |
| Table Body (Standard) | `text-xs font-medium` or `text-sm font-semibold` | 500 / 600 | General table cells, descriptions |
| Table Primary Text | `text-sm font-bold` | 700 | Bill numbers, product titles, vendor names |
| Numeric / Currency | `text-sm font-bold tabular-nums tracking-tight` | 700 | Financial amounts, balances, quantities |
| Sub-labels / Timestamps | `text-xs font-medium text-slate-500` | 500 | Secondary vendor text, relative time ago |
| Badges & Status Pills | `text-[10px]` to `text-xs font-bold` | 700 | Status chips, workflow states, tags |

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
