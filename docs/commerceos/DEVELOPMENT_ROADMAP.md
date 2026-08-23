# CommerceOS Development Roadmap

Version: 1.0  
Status: Active — master development checklist  
Source: Project audit (2026-07-25) + `IMPLEMENTATION_STATUS.md` + Engineering Bible phases  
Precedence: Bible chapters remain authoritative for *how* to build; this file is the *what / when* checklist.

---

## How to use this document

- Check boxes as milestones land (local simulation vs live production called out where needed).
- Do not start a module before its **Depends on** items are checked (or explicitly waived).
- Complexity: **Low** / **Medium** / **High** relative to current codebase effort.
- “Completed” below means **local / simulated milestone done** — not live marketplace production.

---

## Legend

| Mark | Meaning |
|------|---------|
| `[x]` | Done (local milestone unless noted) |
| `[~]` | Partially complete — usable but incomplete |
| `[ ]` | Not started / remaining |
| L / M / H | Complexity Low / Medium / High |

---

## 1. Completed modules

Local Phase 1 milestones that are implemented and usable in-app.

- [x] **Master Listings** — master product model, Products UI, APIs (`/api/v1/products*`) — **M**
- [x] **Product Studio** — foundation workspaces, validation, autosave, permissions — **H**
- [x] **Marketplace Readiness** — adapters, readiness scoring (Amazon / Flipkart / generic) — **M**
- [x] **Marketplace Publishing** — publish queue, state machine, simulated connectors — **H**
- [x] **Inventory Management** — stock engine, movements, reservations, `/inventory` — **H**
- [x] **Inventory Planning** — planning / health / insights + PO *suggestions* (no PO create) — **M**
- [x] **Order Management** — full local OMS lifecycle, `/orders` workspace, bulk/export — **H**
  - Includes Milestone 4: Reserved≠Allocated, Shipment entity, hold history, drawer panels

---

## 2. Partially completed modules

Usable pieces exist; do not treat as v1-done.

- [~] **Workspace Management** — mock `organizationId` / `workspaceId` only; no workspace UI — **M**
- [~] **Users & Roles (RBAC)** — typed permissions + `authorize()`; no user admin UI; mock Owner actor — **H**
- [~] **Dashboard** — full UI on demo data; not wired to domain APIs — **M**
- [~] **Shipping & Label Management** — mode-aware label/AWB on Shipment entity; no live carriers — **H**
- [~] **Returns** — OMS return path (requested→disposed); no standalone Returns module — **M**
- [~] **RTO** — OMS RTO via Shipment events (not order status) — **M**
- [~] **Claims Management** — order claims + history in drawer — **M**
- [~] **Settlements** — enriched settlement fields on order; not Finance settlements — **M**
- [~] **Analytics** — product Performance tab (mock); no analytics platform — **M**
- [~] **Audit Logs** — local audit writes; no audit UI / API — **M**
- [~] **AI Features** — optional Studio dock / suggestions / stubs; no `/copilot` — **H**
- [~] **Integrations** — listing adapters + empty channel connectors — **H**
- [~] **API Layer** — strong `/api/v1` for Phase 1 domains; no public API platform — **H**
- [~] **Security** — Zod + policies; no real authentication boundary — **H**

---

## 3. Remaining modules

Not started (or placeholder only).

- [ ] **Authentication** — login, session, middleware — **H**
- [ ] **Marketplace Connections** — OAuth, credentials, connection health UI — **H**
- [ ] **Global Settings** — org, branding, notifications prefs, API keys UI — **M**
- [ ] **Warehouse Management** — replace `/warehouse` placeholder with real ops — **H**
- [ ] **Purchase Management (Procurement)** — PO create, approvals, GRN → inventory — **H**
- [ ] **Finance** — finance workspace (not order settle stub) — **H**
- [ ] **Reports** — operational / financial reports — **M**
- [ ] **Notifications** — in-app + customer/channel notifications — **M**
- [ ] **Automation** — workflow rules / triggers — **H**
- [ ] **Billing** — subscriptions, plans, usage — **H**
- [ ] **GST** — Indian tax compliance module — **H**
- [ ] **Production Readiness** — real DB, env, CI/CD, E2E, observability — **H**
- [ ] **Public APIs** — partner/public API platform (Phase 3) — **H**
- [ ] **Live marketplace order webhooks** — replace OMS import simulation — **H**
- [ ] **Live carrier connectors** — replace label/AWB stubs — **H**

---

## 4. Recommended build order

Execute **top to bottom**. Only one active module at a time unless a dependency is a short foundation spike.

### Wave A — Unblock fulfillment (Phase 2 start)

| # | Module | Complexity | Depends on | Outcome |
|---|--------|------------|------------|---------|
| 1 | **Warehouse Management** | High | Inventory (done), Orders allocate (done) | Real WH ops; unblocks GRN / pick-face truth |
| 2 | **Purchase Management** | High | Warehouse (#1), Inventory Planning suggestions (done) | PO → GRN → Incoming/Available |
| 3 | **Shipping & Label Management** (complete) | High | Orders (done), Warehouse (#1) | Harden mode actions; still stub carriers until Wave C |

### Wave B — Platform foundations (required before live marketplaces)

| # | Module | Complexity | Depends on | Outcome |
|---|--------|------------|------------|---------|
| 4 | **Authentication** | High | — (product decision: IdP) | Real sessions; end mock Owner |
| 5 | **Workspace Management** (complete) | Medium | Auth (#4) | Org/workspace switch + isolation |
| 6 | **Users & Roles** (complete) | High | Auth (#4), Workspace (#5) | Invite, roles UI, enforce RBAC |
| 7 | **Global Settings** | Medium | Auth (#4), Workspace (#5) | Settings surface for connections/keys |
| 8 | **Security** (harden) | High | Auth (#4)–(#7) | Tenant isolation proof, secrets, middleware |
| 9 | **Production Readiness** (baseline) | High | Auth (#4), real DB choice | Persistence, env, CI, basic observability |

### Wave C — Live marketplace truth

| # | Module | Complexity | Depends on | Outcome |
|---|--------|------------|------------|---------|
| 10 | **Marketplace Connections** | High | Settings (#7), Auth (#4), Security (#8) | OAuth / credentials |
| 11 | **Integrations** (live connectors) | High | Connections (#10), Publishing (done) | Replace simulated publish path |
| 12 | **Live order webhooks** | High | Connections (#10), Orders (done) | Real imported orders |
| 13 | **Live carrier connectors** | High | Shipping (#3), Connections optional | Real AWB / labels |

### Wave D — Reverse logistics & money

| # | Module | Complexity | Depends on | Outcome |
|---|--------|------------|------------|---------|
| 14 | **Returns** (standalone complete) | Medium | Orders returns (partial), Warehouse (#1) | Dedicated Returns module |
| 15 | **RTO** (complete) | Medium | Returns (#14), Warehouse (#1) | Ops-grade RTO |
| 16 | **Claims Management** (complete) | Medium | Orders claims stub, Returns (#14) | Claims engine |
| 17 | **Settlements** (Finance-grade) | High | Orders settle stub, Connections (#10) | Marketplace settlement import/recon |
| 18 | **Finance** | High | Settlements (#17) | Finance workspace |
| 19 | **GST** | High | Finance (#18), Products HSN (done) | Compliance |
| 20 | **Reports** | Medium | Finance (#18), Orders, Inventory | Report pack |

### Wave E — Command center & intelligence

| # | Module | Complexity | Depends on | Outcome |
|---|--------|------------|------------|---------|
| 21 | **Dashboard** (wire real KPIs) | Medium | Orders, Inventory, Listings (done) | Replace demo data |
| 22 | **Analytics** | Medium | Dashboard (#21), Orders, Listings | Analytics platform |
| 23 | **Audit Logs** (UI + API) | Medium | Platform audit (partial), Auth (#4) | Enterprise audit viewer |
| 24 | **Notifications** | Medium | Auth (#4), Orders/Inventory events | Operator + customer notify |
| 25 | **AI Features** (Copilot) | High | Auth (#4), credit model | Optional AI — never required |
| 26 | **Automation** | High | Notifications (#24), domain events | Rules engine |
| 27 | **Billing** | High | Auth (#4), Workspace (#5) | SaaS monetization |
| 28 | **Public APIs** | High | Auth (#4), Security (#8), API Layer | Partner integrations |
| 29 | **Production Readiness** (full) | High | All Wave B–D critical paths | E2E, SLOs, hardening |

---

## 5. Dependency map (summary)

```
Master Listings ──► Product Studio ──► Readiness / Publishing (sim) ──► Live Integrations
       │                                      │
       ▼                                      ▼
 Inventory ──► Inventory Planning ──► Purchase Management
       │                                      ▲
       ▼                                      │
 Warehouse Management ────────────────────────┘
       │
       ▼
 Order Management ──► Shipping/Labels ──► Live carriers
       │
       ├──► Returns / RTO / Claims
       └──► Settlements ──► Finance ──► GST / Reports

Authentication ──► Workspace ──► Users/RBAC ──► Settings ──► Marketplace Connections
       │
       └──► Security harden ──► Production baseline ──► Public APIs / Billing
```

**Hard rules**

1. Do **not** build live Marketplace Connections before Authentication + Settings.
2. Do **not** build Purchase (PO/GRN) before Warehouse.
3. Do **not** treat Dashboard/AI as blockers — wire them after core ops truth exists.
4. AI must remain **optional** at every step.

---

## 6. Immediate next action (single module)

- [ ] **#1 Warehouse Management** (High)  
  - Depends on: Inventory ✅, Orders warehouse allocation ✅  
  - Unblocks: Purchase, stronger Shipping ops, Returns putaway  
  - Replace: `app/warehouse` placeholder (“Coming in Sprint 7”)

---

## 7. Checklist progress tracker

### Phase 1 (Bible) — local

- [x] Product Studio  
- [x] Listings (simulated)  
- [x] Inventory  
- [x] Orders  

### Phase 2 (Bible)

- [ ] Warehouse  
- [ ] Procurement  
- [ ] Finance  
- [ ] GST  

### Phase 3 (Bible)

- [ ] AI Copilot  
- [ ] Forecasting  
- [ ] Automation  
- [ ] Public APIs  
- [ ] Global marketplace integrations (live)  

### Cross-cutting always-on

- [ ] Authentication  
- [ ] Real multi-tenancy  
- [ ] Production persistence + CI  
- [ ] Audit UI  
- [ ] Notifications  

---

## Related documents

- `docs/commerceos/IMPLEMENTATION_STATUS.md` — chapter-level implementation registry  
- `docs/commerceos/001-Project-Vision/README.md` — phase vision  
- `AGENTS.md` — engineering precedence  

When a module checklist item is completed, update **both** this roadmap and `IMPLEMENTATION_STATUS.md` in the same change.
