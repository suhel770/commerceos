# CommerceOS Development Standards v1.0
## Official Engineering Rulebook (FROZEN)

**Document Status**: FROZEN  
**Version**: 1.0  
**Effective Date**: August 4, 2026  
**Authority**: Chief Software Architect, Staff Frontend & Backend Engineers, Next.js Technical Lead  

---

## EXECUTIVE SUMMARY

This Engineering Rulebook defines the strict standards, code patterns, component boundaries, state management rules, and conventions for every line of code written in **CommerceOS**. All engineers, subagents, and future contributors MUST strictly adhere to this rulebook.

---

## SECTION 1: PROJECT PHILOSOPHY

1. **Enterprise First**: Written with clean architecture, enterprise reliability, and long-term maintainability.
2. **Readable & Self-Documenting**: Code must express intent clearly through explicit naming and structured interfaces without hidden magic.
3. **Reusable & Modular**: Zero duplicated logic. Shared code lives in domain engines, repositories, and UI primitives.
4. **API-First & DDD**: Domain logic lives in clean domain engines (`lib/inventory/`). UI components act as presentational layers consuming engine APIs.
5. **Capability-Driven**: Features adapt via dynamic capabilities (`CapabilityEngine`), NEVER via hardcoded tier checks (`isSolo` / `isEnterprise`).
6. **AI Optional**: AI features advise, predict, and optimize. AI MUST NEVER block core business execution.
7. **Accessibility & Performance**: Native keyboard support, focus management, zero wasteful re-renders, and fast load times.

---

## SECTION 2: FOLDER STRUCTURE STANDARDS

To maintain clear boundary separation, code MUST be organized strictly into these top-level directories:

```
c:\Users\suhel\OneDrive\commerceos\
├── app/                  # Next.js App Router pages, layouts, API routes (Presentation Routing)
├── components/           # React UI Components
│   ├── ui/               # Reusable Atomic UI Primitives (Buttons, Cards, Dialogs, Badges)
│   ├── layout/           # AppShell, TopNavbar, Sidebar, CommandPalette
│   ├── storage/          # Storage Module Workspaces & Views
│   ├── warehouse/        # WMS Physical Dashboards, Switcher, Setup Wizards
│   ├── inventory/        # Stock SOT Views
│   └── purchase/         # Procurement Views
├── lib/                  # Pure Core Domain Engines, Repositories, & Business Logic
│   ├── core/             # NotificationEngine, AuditEngine, TaskEngine
│   ├── inventory/        # Inventory Engine SOT, StorageNetworkEngine, StorageOperationEngine
│   └── finance/          # Accounting & COGS Engine
├── hooks/                # Custom React Hooks (UI State & Event Hooks)
├── providers/            # React Context Providers (ExperienceProvider, LayoutProvider)
├── types/                # Global Shared TypeScript Models & DTO Interfaces
├── mocks/                # Testing Mock Data & Repositories
├── styles/               # Global CSS & Tailwind Configurations
└── docs/                 # Authoritative Product & Engineering Specifications
```

**Rule 2.1**: Never create ad-hoc root folders outside this standard tree.

---

## SECTION 3: COMPONENT STANDARDS & CATEGORIZATION

Components MUST be categorized into one of 5 strict types:

1. **Atomic UI Primitives (`components/ui/`)**: Presentational, stateless components (*e.g., ActionableKpiCard, Button, Dialog*).
2. **Container Components (`components/storage/`)**: Orchestrates data loading from domain engines and passes props down.
3. **Workspace Components (`components/warehouse/`)**: Complete feature workspaces (*e.g., HomeStorageWorkspace, WarehouseDashboard*).
4. **Layout Components (`components/layout/`)**: Application shell, navigation headers, and sidebar wrappers.
5. **Shared Components**: Modals and slide-overs shared across multiple modules.

**Single Responsibility Rule**: Every component MUST have exactly ONE primary responsibility. If a component exceeds 300 lines, extract presentational child components.

---

## SECTION 4: STATE MANAGEMENT & CACHING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STATE MANAGEMENT RULES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Local Component State (useState)  ► UI toggles, active tabs, search query  │
│ 2. Context Providers (React Context) ► Theme, User Session, Business Stage   │
│ 3. Domain Repositories (lib/*)       ► Single Source of Truth Business State  │
│ 4. Server Cache & Revalidation       ► SOT Data Engine Repositories         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rule 4.1**: Never duplicate business state in local `useState`. Read directly from owner domain engines (`loadSellableBalancesFromPurchase()`, `storageNetworkEngine`).

---

## SECTION 5: REPOSITORY PATTERN

UI components MUST NEVER contain raw data fetch loops or direct business calculations. Every domain module (*Purchase, Inventory, Products, Orders, Returns, Finance, Storage*) MUST expose a repository module.

```tsx
// GOOD: Component consumes domain repository
import { storageNetworkEngine } from "@/lib/inventory/storage-network-engine";

export default function StorageLocationList() {
  const locations = storageNetworkEngine.getAllLocations();
  return <LocationListView items={locations} />;
}
```

---

## SECTION 6: TYPESCRIPT STANDARDS

1. **Strict Typing**: `any` is strictly prohibited. Use explicit types or generic parameters (`T`).
2. **Shared Models**: Define domain models in `lib/` or `types/`.
3. **DTO Readiness**: Use explicit interfaces matching future PostgreSQL API DTOs.
4. **Readonly & Immutable**: Prefer `readonly` arrays for initial constants (`INITIAL_STORAGE_LOCATIONS`).

---

## SECTION 7: UI STANDARDS & DESIGN SYSTEM

- **Color Palette**: Curated HSL/Tailwind Slate palette (Slate-900 text, Slate-50/100 backgrounds, Indigo/Emerald accent colors). Avoid plain default colors.
- **Typography**: Inter / Outfit font stack. Hierarchy: Title `text-xl font-black`, Subtitle `text-xs text-slate-500`, Mono codes `font-mono text-xs`.
- **Modals & Dialogs**: Backdrop `bg-slate-900/60 backdrop-blur-xs`, `max-h-[88vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`.
- **Top-Right `X` Close Button**: Every modal MUST include a sticky top-right `X` close button + `ESC` keydown listener.

---

## SECTION 8: ACTIONABLE UI RULE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          THE ACTIONABLE UI RULE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ • NO read-only KPI cards.                                                   │
│ • NO dead placeholder buttons.                                             │
│ • Every KPI card MUST include a primary action or drill-down modal.        │
│ • Every action button MUST execute a real workflow or open a wizard.        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 9: PERFORMANCE STANDARDS

1. **Memoization**: Wrap expensive domain filtering in `useMemo()` (`filteredBalances`, `filteredLocations`).
2. **Pagination & Virtualization**: Paginate tables exceeding 10 items (`itemsPerPage = 10`).
3. **Scrollbar Hiding**: Use `[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` to prevent default browser vertical scrollbar overflow.
4. **Dynamic Imports**: Lazy load heavy 3D Digital Twin canvases or chart packages.

---

## SECTION 10: ERROR HANDLING & FALLBACKS

1. **Form Validation**: Validate inputs before submission; display inline error messages.
2. **Fallback UI**: Show clean loading skeletons and empty state views when data arrays are empty.
3. **In-App Notifications**: Use `notificationEngine.send()` to inform users of successful operations or recoverable failures.

---

## SECTION 11: DATA RULES & SOT INTEGRITY

- **SOT Integrity**: Inventory Engine owns stock quantities, Storage Network Engine owns location topology, Storage Operation Engine owns workflow execution.
- **No Duplicate Calculations**: Never recalculate stock totals in UI components. Delegate to domain engine helpers (`loadSellableBalancesFromPurchase()`).

---

## SECTION 12: NAMING CONVENTIONS

| Asset Category | Convention | Example |
| :--- | :--- | :--- |
| **Components** | PascalCase | `UniversalStorageSetupWizardModal.tsx` |
| **Custom Hooks** | camelCase (`use` prefix) | `useExperience()` |
| **Domain Repositories** | camelCase (`Engine` suffix) | `storageNetworkEngine.ts` |
| **Interfaces / Types** | PascalCase | `StorageLocation`, `StockBalance` |
| **Enums / Const Types** | UPPER_SNAKE_CASE | `INITIAL_STORAGE_LOCATIONS` |
| **Domain Events** | dot.separated.lowercase | `warehouse.qc.completed` |
| **File Names** | kebab-case / PascalCase | `storage-network-engine.ts`, `Sidebar.tsx` |

---

## SECTION 13: TESTING READINESS & MOCK BOUNDARIES

- **Isolated Testing**: Components must be testable without live API backends by mocking domain engine singletons (`storageNetworkEngine`).
- **Mock Repositories**: Maintain mock seed datasets in `mocks/` or inside engine initializers (`INITIAL_STORAGE_LOCATIONS`).

---

## SECTION 14: ACCESSIBILITY (a11y)

1. **Keyboard Navigation**: All interactive elements MUST be focusable via `Tab` key.
2. **ESC Dismissal**: All modals, slide-overs, and dropdowns MUST listen for `Escape` keypress to close.
3. **ARIA Labels**: Include `aria-label` or `title` on icon-only buttons (`Close modal (ESC)`).

---

## SECTION 15: AI STANDARDS

1. **Non-Blocking**: AI suggestions MUST be advisory (`generateAiRecommendation()`).
2. **Manual Alternative**: Users MUST always have a 1-click manual override option.
3. **Clear Indicator**: AI suggestions MUST feature the `Sparkles` icon and `AI Advisory` badge.

---

## SECTION 16: SECURITY & AUDIT COMPLIANCE

1. **Role-Based Access Control**: Verify user permissions before rendering restricted actions.
2. **Audit Logging**: Operational actions MUST log an immutable audit event (`auditReference`, `executedBy`, `timestamp`).

---

## SECTION 17: CODE REVIEW CHECKLIST (PRE-MERGE GATEWAY)

Before submitting a PR or merging any code, the developer MUST verify:

- [x] **No Duplicate Logic**: Logic is placed in domain engines/repositories, NOT duplicated in components.
- [x] **Uses Domain Engines**: Consumes `inventoryEngine`, `storageNetworkEngine`, or `storageOperationEngine`.
- [x] **Uses Capability Engine**: Controlled by dynamic capability matrix rather than hardcoded tier flags.
- [x] **No `any` Types**: Strict TypeScript types enforced across all signatures.
- [x] **Actionable UI Compliant**: All visible buttons and cards lead to functional actions.
- [x] **Keyboard Accessible**: ESC key dismisses modals; buttons are keyboard focusable.
- [x] **Architecture Constitution Compliant**: Adheres 100% to [architecture_specification_v1.0.md](file:///c:/Users/suhel/OneDrive/commerceos/docs/commerceos/architecture_specification_v1.0.md).

---

**FINAL STATUS**: **FROZEN v1.0**  
*All future CommerceOS engineering work must strictly comply with this rulebook.*
