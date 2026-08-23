# CommerceOS — Universal Design System Specification

## 1. Typography System
CommerceOS uses a clean, enterprise-grade typography scale powered by **Inter** (Primary UI) and **JetBrains Mono** (Technical Data & Code).

| Token | Class / Value | Weight | Usage |
| :--- | :--- | :--- | :--- |
| **Display** | `text-3xl font-black tracking-tight` | 900 | Main workspace titles |
| **H1** | `text-2xl font-extrabold tracking-tight` | 800 | Section titles |
| **H2** | `text-xl font-bold` | 700 | Subsection headers |
| **H3** | `text-lg font-bold` | 700 | Card titles & modal headers |
| **H4** | `text-base font-semibold` | 600 | Grouping headers |
| **Body Large** | `text-base font-medium` | 500 | Hero descriptions |
| **Body** | `text-sm font-normal` | 400 | Standard UI text |
| **Body Small** | `text-xs font-normal` | 400 | Secondary helper text |
| **Caption** | `text-[10px] font-extrabold uppercase tracking-widest` | 800 | Labels & KPI category subtitles |
| **Table Header** | `text-[10px] font-black uppercase tracking-widest` | 900 | Data table headers |
| **Table Cell** | `text-xs font-medium` | 500 | Standard table cells |
| **AI Heading** | `text-base font-black text-purple-900` | 900 | AI drawer & report titles |
| **AI Body** | `text-xs font-medium text-purple-800` | 500 | AI insight text |

---

## 2. Universal Color Palette
Neutral, professional surfaces with semantic status accents.

| Token | CSS Variable | Hex / Tailwind | Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `#f8fafc` | Page canvas background |
| **Foreground** | `--foreground` | `#0f172a` | Primary text color |
| **Card Surface** | `--card` | `#ffffff` | Elevated surface cards |
| **Primary** | `--primary` | `#4f46e5` (`indigo-600`) | Main interactive actions & navigation |
| **Primary Hover** | `--primary-hover` | `#4338ca` (`indigo-700`) | Hover state for primary buttons |
| **Muted Text** | `--muted-foreground` | `#64748b` (`slate-500`) | Secondary & helper text |
| **Border** | `--border` | `#e2e8f0` (`slate-200`) | Standard card & container borders |
| **Border Strong**| `--border-strong` | `#cbd5e1` (`slate-300`) | Input & active borders |

---

## 3. Universal CommerceOS AI Identity (Purple / Violet Brand)
Every AI component across Purchase, Storage, Inventory, Orders, Finance, and Reports shares the exact same recognizable purple visual language.

| AI Token | CSS Variable / Class | Visual Appearance | Purpose |
| :--- | :--- | :--- | :--- |
| **AI Primary** | `--ai-primary` (`#7c3aed` / `violet-600`) | Deep Violet | Primary AI buttons & hero icons |
| **AI Hover** | `--ai-primary-hover` (`#6d28d9`) | Dark Violet | Hover state for AI buttons |
| **AI Surface** | `--ai-surface` (`#faf5ff` / `purple-50`) | Soft Lavender Surface | AI drawer background & AI cards |
| **AI Border** | `--ai-border` (`#e9d5ff` / `purple-200`) | Soft Lavender Border | AI card & modal borders |
| **AI Foreground**| `--ai-foreground` (`#581c87` / `purple-950`) | Deep Purple | AI headings & executive titles |
| **AI Accent** | `--ai-accent` (`#f59e0b` / `amber-500`) | Golden Spark | AI credit badges & spark icons |
| **Ask AI Tag** | `bg-emerald-100 text-emerald-800` | Green Pill | **FREE (0 Credits)** action indicator |
| **Credit Tag** | `bg-amber-100 text-amber-900` | Amber Pill | **Credit-consuming (e.g. 5 Credits)** action indicator |

---

## 4. Semantic Status System

| Status Category | Text Color | Background | Border | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `text-emerald-700` | `bg-emerald-50` | `border-emerald-200` | Confirmed, Delivered, Paid, Healthy |
| **Warning** | `text-amber-700` | `bg-amber-50` | `border-amber-200` | Low Stock, Pending Payment, On Hold |
| **Danger** | `text-rose-700` | `bg-rose-50` | `border-rose-200` | Out of Stock, Dead Stock, Cancelled, QC Failed |
| **Info** | `text-sky-700` | `bg-sky-50` | `border-sky-200` | In Transit, Incoming GRN, Draft |

---

## 5. Component Standardization

### Buttons
- **Primary**: `bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition active:scale-95`
- **Secondary**: `bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition`
- **AI Primary**: `bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition active:scale-95 inline-flex items-center gap-1.5`
- **AI Secondary**: `bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs px-3.5 py-2 rounded-xl transition inline-flex items-center gap-1.5`

### Cards
- **Standard Card**: `bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm`
- **AI Card**: `bg-purple-50/60 border border-purple-200 rounded-2xl p-5 shadow-xs`

## 6. Global Reorderable KPI Interaction Standard

> **GLOBAL KPI RULE:** Every KPI section introduced anywhere in CommerceOS must use the shared KPI system (`@/components/ui/kpi`). KPI cards must support drag-and-drop rearrangement, keyboard accessibility, and persisted user ordering in `localStorage` unless a page has a documented UX reason to explicitly disable rearrangement.

### Architecture & Conventions
1. **Hook**: `useReorderableKpis({ storageKey, defaultOrder })`
2. **Components**: `<ReorderableKpiSection />`, `<ReorderableKpiCard />`
3. **Features**:
   - Smooth HTML5 drag-and-drop with drag handle affordance (`GripVertical`).
   - Visual states: Dragging (`opacity-40 scale-95 border-dashed border-violet-400`), DragOver target (`border-violet-500 ring-2 ring-violet-200 scale-102 bg-violet-50/20`), Default (`border-slate-200/80 hover:border-slate-300`).
   - Keyboard accessibility: `Alt + ArrowLeft` and `Alt + ArrowRight` to shift metric order.
   - Dynamic **Reset Order** action that restores default arrangement.
   - User preference persistence per module / workspace / tenant key in `localStorage`.

### Tables
- **Header**: `bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 px-4`
- **Rows**: `border-b border-slate-100 hover:bg-slate-50/60 transition`

---

## 6. Verification & Accessibility Rules
1. **No Hardcoded One-Off Colors**: Pages use semantic utility classes or theme tokens.
2. **AI Identity Consistency**: Purchase AI = Storage AI = Inventory AI = Orders AI = Finance AI.
3. **Credit Transparency**: Ask AI is clearly tagged as FREE; Run Analysis shows credit cost before confirmation.
