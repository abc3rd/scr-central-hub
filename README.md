# SCR Central Hub — demo build (v3)

Sweet Cypress Ranch operations hub demo, built to the **v3 ruleset**:

- **Two-step fulfillment** — orders reserve stock when placed; a pick ticket
  opens per order. Ranch hands tick off lines; the card hold is captured and the
  Rewards Fund credited only when the ticket is marked done.
- **Stars Club membership** — Free plan or $9.99/mo Stars Club. No tiers, no
  points: Stars members get one-tap reorders from the barn QR and a Rewards
  Fund that earns 5% of every completed order.
- **Customer-gated substitutions** — staff propose a swap, the customer
  approves or declines from the portal before the ticket moves.
- **Per-store QuickBooks ledger** — each location syncs to its own QBO company
  file via Synder, with per-invoice retry for failed syncs.
- **Hay Announcements** — store posts land on the customer portal and queue as
  a GHL SMS broadcast.
- **Web-link QR tags** — hay-row tags encode `./#/q/<store-slug>/<rowId>`, so a
  phone camera opens the hub straight into the intake modal for that row.

## Stack

Vite + React 19 + TypeScript + Tailwind + shadcn/ui. Local-state demo with
`localStorage` persistence (key `scr-hub-v3`) and a PWA service worker.
All payments / Shopify / QBO / SMS calls are mocked in `src/lib/services.ts`.

## Run

```bash
npm install
npm run dev      # dev server
npm run build    # production build → dist/
```

The header switcher flips between Owner/Admin, Ranch Hand/Staff, and the
customer portal. The reset button reseeds the demo data.

## Notes

- PWA icons under `public/icons/` are shipped in the demo/source zips but not
  in git (binary assets) — copy them from a zip before publishing.
- `package-lock.json` is likewise kept in the zips; `npm install` regenerates it.
