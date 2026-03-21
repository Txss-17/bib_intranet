

## Plan: Create 8 Dedicated Sub-Section Pages (4 Ethics + 4 Gateway)

### Overview

Currently, all Ethics sub-routes (`/received`, `/ongoing`, `/closed`, `/stats`) render the same `EthicsDashboard`, and all Gateway sub-routes (`/inbox`, `/validation`, `/routing`, `/responses`) render the same `GatewayDashboard`. We will create 8 dedicated pages with filtered data and specific UI for each sub-section.

---

### Ethics Module (4 pages)

**1. `EthicsReceived.tsx`** — Signalements reçus
- Table of incoming reports (status: "new/pending triage")
- Columns: ID, type, priority, source (anonymous/identified), date, channel, actions (assign, escalate)
- Filters: priority, category, source type
- KPIs: total received (7d/30d), anonymous %, avg response time

**2. `EthicsOngoing.tsx`** — Dossiers en cours
- Table of active investigations
- Columns: ID, case type, priority, investigator, status (investigating/escalated/due diligence), opened date, last update
- Filters: priority, investigator, status
- KPIs: open cases, avg duration, escalation rate

**3. `EthicsClosed.tsx`** — Dossiers clôturés
- Table of resolved cases with outcomes
- Columns: ID, case type, priority, resolution (confirmed/dismissed/mediated), investigator, duration, closed date
- Filters: resolution type, priority, date range
- KPIs: total closed, confirmed rate, avg resolution time

**4. `EthicsStats.tsx`** — Statistiques anonymisées
- Aggregated charts (no individual case details)
- Pie charts: by category, by priority, by source
- Bar chart: monthly trend of reports
- KPIs: total reports YTD, resolution rate, anonymous %, repeat categories

### Gateway Module (4 pages)

**5. `GatewayInbox.tsx`** — Réception
- Table filtered to status "new" + "read" (unprocessed messages)
- Columns: ID, sender, subject, channel, category, received date, actions (mark read, assign)
- Filters: channel, category, priority

**6. `GatewayValidation.tsx`** — Validation
- Table of messages pending validation before routing
- Columns: ID, sender, subject, category, validator, validation status, actions (approve, reject, flag)
- Filters: category, validation status

**7. `GatewayRouting.tsx`** — Routage
- Table of validated messages being routed to poles
- Columns: ID, subject, category, assigned pole, routing status (pending/routed/confirmed), routed by, date
- Filters: target pole, routing status

**8. `GatewayResponses.tsx`** — Réponses
- Table of messages with responses sent
- Columns: ID, subject, original sender, responded by, response date, response status (draft/sent/acknowledged)
- Filters: response status, pole

---

### Routing Changes (`App.tsx`)

Add 8 explicit routes:
- `/modules/ethics/received` → `EthicsReceived`
- `/modules/ethics/ongoing` → `EthicsOngoing`
- `/modules/ethics/closed` → `EthicsClosed`
- `/modules/ethics/stats` → `EthicsStats`
- `/modules/gateway/inbox` → `GatewayInbox`
- `/modules/gateway/validation` → `GatewayValidation`
- `/modules/gateway/routing` → `GatewayRouting`
- `/modules/gateway/responses` → `GatewayResponses`

Each page uses `useTableInteractions` + `SortableTableHead` for consistent table behavior. All data is realistic French-context mock data with 8-12 entries per table.

### Files to Create
- `src/pages/modules/ethics/EthicsReceived.tsx`
- `src/pages/modules/ethics/EthicsOngoing.tsx`
- `src/pages/modules/ethics/EthicsClosed.tsx`
- `src/pages/modules/ethics/EthicsStats.tsx`
- `src/pages/modules/gateway/GatewayInbox.tsx`
- `src/pages/modules/gateway/GatewayValidation.tsx`
- `src/pages/modules/gateway/GatewayRouting.tsx`
- `src/pages/modules/gateway/GatewayResponses.tsx`

### Files to Edit
- `src/App.tsx` — add 8 imports + 8 routes

