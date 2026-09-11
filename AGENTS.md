<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CommerceOS Engineering Bible

The authoritative product and engineering documentation is stored in
`docs/commerceos/`.

Follow this precedence before changing code:

1. Frozen product, engineering, design, security, API, database, and testing
   chapters.
2. The relevant active module chapter.
3. Existing approved CommerceOS UI and interaction patterns.
4. `docs/commerceos/IMPLEMENTATION_STATUS.md` for implementation decisions and
   current completion state.

Preserve approved UI. Implement one documented workspace at a time. Keep AI
optional, enforce tenant and permission boundaries, validate every external
input, and record auditable business actions.

### Global KPI Rule
Every KPI section introduced anywhere in CommerceOS must use the shared KPI system (`@/components/ui/kpi`). KPI cards must support drag-and-drop rearrangement, keyboard accessibility, and persisted user ordering in `localStorage` unless a page has a documented UX reason to explicitly disable rearrangement.

### Global Dropdown / Select Rule
Native browser `<select>` elements are NOT permitted in CommerceOS product UI. All dropdowns and select inputs must reuse the standardized custom select component `CommerceSelect` (`@/components/ui/CommerceSelect`). Any additions or extensions (such as searchable filters or multiple selection checkboxes) should be implemented directly within `CommerceSelect` rather than creating parallel or duplicate select elements.

