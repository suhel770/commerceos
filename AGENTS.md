<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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

