# Procurement AI Copilot

Status: Active

Optional intelligence layer for the Purchase workspace (`/purchase`). The
Procurement Engine must work fully without AI. AI only observes, analyzes,
recommends, explains, predicts, and summarizes. The user always decides.

Platform AI rules live in frozen `docs/commerceos/1400-AI/`. This chapter is the
Procurement-specific product bible.

## Philosophy

- CommerceOS works perfectly with AI disabled.
- AI is never mandatory and never a dependency.
- Nothing saves automatically from AI output.
- Never auto-create purchase orders, never auto-select vendors, never mutate
  inventory or finance from a recommendation.
- Every recommendation must explain **why**.
- Low confidence → ask the user; never guess silently into data.

## Surfaces (target)

| Surface | Behaviour |
|---------|-----------|
| Universal Bill Scanner | Extract vendor, GST, invoice fields, lines, tax, freight, due date + confidence. User reviews before Apply. |
| Smart Classification | Suggest purchase type; ask if confidence is low. |
| Vendor Intelligence | Best/previous vendor, avg price, credit days, delivery, outstanding, alternatives — never auto-select. |
| Cost Intelligence | Price / GST / quantity / freight / vendor-change warnings vs history — warn only, never block. |
| Duplicate Detection | Invoice, bill, payment, vendor, purchase — warn only. |
| Procurement Advisor | Quantity, reorder timing, stock risk from inventory/sales/lead time — recommendations only. |
| Procurement Chat | Natural language → navigate filters / open dialogs (e.g. unpaid bills, packaging spend). |
| Vendor Health Score | Score from price, delivery, quality, returns, credit, fill rate — display only. |
| Procurement Summary | Today / week / month spend, top vendors/categories, outstanding, pending. |
| Predictive Procurement | Future purchases, cash need, reorder timing, seasonal demand — recommendations only. |

## Procurement Memory Engine (signature)

Silently learn how the business purchases over time. Never ask users to train
the model manually.

Learns (examples):

- Preferred vendors and reorder cycles
- Typical quantities and payment methods
- Seasonality and marketplace-driven demand
- Lead times, delays, pricing trends
- Packaging consumption, courier and office spend patterns

Uses memory **only** for recommendations, e.g.:

- “Packaging boxes are usually reordered every 28 days.”
- “Vendor ABC usually delivers within 3 days.”
- “Festival season increases inventory purchases by ~250%.”

Never automatically create purchases or modify stored data from memory.

## Shell implementation (current)

Phase A++ ships a **non-blocking CommerceOS AI shell** on `/purchase`:

- Header control labeled **CommerceOS AI** (not a separate product)
- **Credit gate first**: every AI use checks remaining credits via
  `lib/ai/credits.ts` before running; insufficient credits blocks the action
- Collapsible panel; AI can be turned off
- Mock summary chips from loaded bills
- Suggestion cards with Why / Apply / Dismiss (Apply opens or pre-fills UI only;
  each Apply spends 1 credit)
- Canned chat intents (no LLM; 1 credit each)
- Bill scan stub with review-first Apply / Discard (fake extraction; scan spends
  1 credit)

### Procurement Advisor + AI Forecast (shipped)

Primary intelligence is **not** a chatbot. Two surfaces:

1. **Procurement Insights** collapsible card on `/purchase` Overview — severity
   rows (ok / watch / risk / opportunity), entity + lines + why, View / Act /
   Dismiss. **Act** opens or prefills UI only and spends 1 credit. Opening or
   collapsing the card does not spend credits.
2. **AI Forecast** page at `/purchase/ai-forecast` (sidebar under Purchase) —
   on-demand like Inventory / Procurement Advisor: Enable AI → Generate
   Analysis (1 credit, cached history free). Rule-based modules: Inventory
   Forecast, Days of Cover, Reorder Suggestions, Seasonal Demand, Fast/Slow
   Moving, Overstock/Understock, Vendor Risk, Purchase Calendar. Opening the
   page does not auto-run analysis. CTAs navigate to Stocks / Vendors /
   Overview only — never auto-create bills.

Insights are built in `lib/purchase/procurement-insights.ts` from purchase bills,
stock aggregates, and optional inventory insights (soft-fail). No LLM.

Real OCR, LLM providers, billing-backed credit packs, and persisted memory
storage are deferred.

## Fallback

If AI is disabled or unavailable:

- Manual New Purchase
- Manual vendor and bill entry
- Manual filters, export, reports

AI only saves time.
