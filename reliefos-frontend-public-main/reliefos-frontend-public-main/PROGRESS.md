# ReliefOS — PROGRESS.md

## Step 0 — Scaffold, seed data, pure-logic modules ✅

### Done
- [x] Scaffolded Vite + React (`--template react --overwrite`)
- [x] Installed: `react-router-dom react-leaflet leaflet recharts idb-keyval`
- [x] Installed dev: `vite-plugin-pwa tailwindcss @tailwindcss/vite`
- [x] Created folder structure: `src/api src/components src/pages src/hooks src/store src/lib src/data/mock scripts`
- [x] Seed mock JSON (exact counts per ARCHITECTURE.md §8):
  - `src/data/mock/areas.json` — 3 areas (A, B, C)
  - `src/data/mock/camps.json` — 4 camps (A, B, C, D)
  - `src/data/mock/volunteers.json` — 8 volunteers
  - `src/data/mock/duties.json` — 6 duties
  - `src/data/mock/reports.json` — 10 reports
- [x] `src/lib/darkZone.js` — pure ES module, commented CONFIG (baselineRate 0.16, weights), assessArea(), assessAreas()
- [x] `src/lib/priority.js` — pure ES module, commented CONFIG (darkZoneBoost 20, confirmedBoost 15), buildPriorityList()
- [x] `src/lib/allocation.js` — pure ES module, haversineKm(), computeSuggestions()
- [x] `scripts/check-logic.mjs` — runs assertions; Area C isDarkZone true ✓; Camp D→Camp B water suggestion ✓
- [x] `vite.config.js` — Tailwind v4, PWA (app-shell cache), React
- [x] `src/index.css` — Tailwind v4 import + design tokens

### Verified outputs (check-logic.mjs — exit 0)
```
Area C isDarkZone true   score 89  confidence high
Camp D to Camp B water suggestion  ✓  qty: 460  dist: 5.9 km
✓ All checks passed.
```

---

## Step 2 (Fixed to UI_SPEC.md) — Shell, Light Theme, Exact Routes & Role Visibility ✅

### Done
- [x] **Light theme applied**: Navy sidebar `#0F172A`, app background `#F8FAFC`, white cards with `#E2E8F0` border.
- [x] **Role switcher exact labels**: "Admin" and "Volunteer" in header.
- [x] **Exact routes and navigation labels configured**:
  - `/` — Dashboard (unified priority matrix and Dark Zone alerts reside directly here)
  - `/areas/:id` — Area Detail (standalone detail page, hidden from sidebar navigation)
  - `/resources` — Resources (camps & stock inventory)
  - `/allocation` — Allocation & Delivery (surplus-deficit matching & transfers)
  - `/volunteers` — Volunteers (duty roster & operations)
  - `/verification` — Field Verification (Dark Zone survey dispatch & verification actions)
  - `/triage` — Report Triage (field report submission & entity extraction)
  - `/mesh` — Mesh Simulator (ECDH P-256 + AES-GCM simulation with realistic indoor disclaimer)
  - `/limits` — Limits & Trade-offs (disclosures, model boundaries, and configuration snapshots)
  - `/admin` — Admin Panel (admin-only placeholder, displays "Admin access only" in Volunteer role)
- [x] **Role-based visibility**:
  - In **Volunteer** role, sidebar displays strictly: `Volunteers`, `Mesh Simulator`, `Limits & Trade-offs`. Navigating to `/admin` shows `"Admin access only"`.
  - In **Admin** role, all operational management links are accessible.
- [x] **Shared components**: `StatCard`, `StatusBadge`, `SuggestedChip`, `TagChip`, `LowConfidenceBanner`, `ScoreGauge`, `ProgressBar`, `EmptyState`, `ErrorState`, `Skeleton`, `ConfirmDialog` updated with white cards and `#E2E8F0` borders.

---

## Step 3 — Dashboard Screen Implementation ✅

### Done
- [x] **4 StatCards**: Active Dark Zones, Critical Shortages, Volunteers Active, Deliveries In Transit with dynamic metrics from store.
- [x] **react-leaflet Map**:
  - Imported `leaflet/dist/leaflet.css` and fixed default marker icon path resolution for Vite.
  - Custom camp pins (🏕️).
  - Green / Red / Purple area circles (Purple for Dark Zone Silent Risk, Red for High Risk / Severe flood, Green for Stable).
  - Clean legend and popup with "View details" button linking to `/areas/:id`.
- [x] **Unified Priority Queue**:
  - Displays TagChip, ScoreGauge urgency, reason, and Suggested chip.
  - Clicking any row navigates directly to `/areas/:id` (or `/resources`).
- [x] **State Handling**: Skeleton loading placeholders, EmptyState when queue is empty, and ErrorState with retry callback.
- [x] **Build Verification**: `vite build` completed cleanly with exit code 0.

---

## Step 4 (Fixed to UI_SPEC.md Screen 2) — Area Detail Screen ✅

### Done
- [x] **"Why flagged" checklist**: Added tick/cross (✓ / ✗) evaluations for all three flag conditions (Silence ratio ≥ 0.60, Hazard severity ≥ 0.60, Vulnerable share ≥ 25% OR Network failure ≥ 50%) plus human-readable `reasons[]` lines.
- [x] **recharts BarChart**: Integrated "Expected vs actual reports" dual-bar comparison chart with volume tooltips.
- [x] **Honesty & Confidence Controls**: Attached `SuggestedChip` adjacent to the Dark Zone score gauge, conditional `LowConfidenceBanner` on partial/missing data, and footer disclaimer: *"Weights are our assumptions, not validated."*
- [x] **Build & Tests Verification**: `vite build` passed with exit code 0 and `scripts/check-logic.mjs` verified.

---

## Step 5 — Resources & Allocation Screens Implementation ✅

### Done
- [x] **Resources (`/resources`)**:
  - One card per camp with occupancy ("270 / 300").
  - Rows for Food, Water, Medicine, Relief with ProgressBar stock vs need and exact numbers.
  - Shortage rows rendered in red with explicit label `"Shortage: N"`.
  - Badges `"Critical shortage"` (red) or `"OK"` (green).
  - Empty state: `"No camps found."`
- [x] **Allocation & Delivery (`/allocation`)**:
  - **Suggested transfers** list displaying donor-to-recipient camps, item, quantity, distance in km, detailed reason, and `SuggestedChip`.
  - Interactive **"Approve"** button with `ConfirmDialog` modal that dispatches a delivery Duty through the store.
  - **Delivery tracker** with a visual 3-step stepper per delivery: `"Pending"`, `"In transit"`, `"Delivered"`, with buttons to advance delivery status.
  - Empty state: `"No transfers needed."`
- [x] **Build Verification**: `vite build` completed cleanly with exit code 0.

---

## Step 6 (Fixed to UI_SPEC.md Screens 5 & 6) — Volunteers & Field Verification ✅

### Done
- [x] **Field Verification (`/verification`)**:
  - Top banner: *"Verification is required. No automatic rescue."*
  - List of areas that are Dark Zones or have a field team sent, with reasons, "Assign team" multi-select of available volunteers, and "Confirm" / "Reject" actions.
  - "Confirm" raises the area in priority (+15 confirmedBoost) and shows toast *"Area raised in priority list."*
  - "Reject" prompts for a verification note and removes the area from Silent Risk.
  - Empty state: *"No areas need verification."*
- [x] **Volunteer My Dashboard (`/volunteers`)**:
  - Added live "Online"/"Offline" status chip, "Pending sync (0)" badge, and disabled "Sync now" button.
- [x] **Admin Roster Side Panel (`/volunteers`)**:
  - Clicking any volunteer card in the Admin roster opens a profile side panel drawer displaying contact/GPS coordinates, skills, and full assigned duties with status progression.
- [x] **Build Verification**: `vite build` passed with exit code 0 and `scripts/check-logic.mjs` verified.

---

## Step 7 — Offline Queue & Sync ✅

### Done
- [x] **`src/api/index.js`**: `postSync(items)` POSTs to `/sync`; falls back to simulated full-acceptance when the backend is unreachable (demo safe).
- [x] **`src/lib/offlineQueue.js`**: idb-keyval-backed queue. Items: `{ clientId, type, payload, createdAt, attempts }`. `enqueue()`, `flushQueue()`, `getQueue()`, `getPendingCount()`, `subscribeToQueue()`. Auto-flush fires on browser `'online'` event. Failed items stay queued with `attempts + 1`.
- [x] **`src/hooks/usePendingSync.js`**: React hook wrapping `subscribeToQueue` → reactive `pendingCount` + `flush()`.
- [x] **Store wired**: `addReport` and `updateDutyStatus` call `enqueue()` when `!isOnline`. Both still apply optimistic local state immediately. Store `useEffect` seeds and subscribes to queue → `pendingSyncCount` stays live.
- [x] **Volunteer dashboard**: Badge shows real `pendingCount`; "Sync now" button is enabled when `pendingCount > 0` and calls `flush()`.
- [x] **Header chip**: Already reads `isOnline` + `pendingSyncCount` from store — now backed by real queue count.
- [x] **AreaDetail sitrep form & AllocationPage stepper**: Route through `addReport` / `updateDutyStatus` in store → automatically queued when offline.
- [x] **Build Verification**: `vite build` passed exit 0, 680 modules, PWA service worker generated.

## Step 8 — Mesh Simulator & Web Crypto Relay ✅

### Done
- [x] **`src/lib/meshCrypto.js`**: Pure Web Crypto implementation (zero external libraries).
  - Gateway creates ECDH P-256 key pair via `generateGatewayKeyPair()`.
  - Sender derives shared key via ECDH with Gateway public key, encrypts payload using AES-GCM (12-byte random IV) via `encryptMessage()`.
  - Gateway decrypts using its private key and sender's ephemeral public key via `decryptMessage()`.
- [x] **`src/pages/MeshSimulatorPage.jsx`**:
  - Permanent amber banner: *"Simulated demo. Real mesh needs a native app (Bluetooth range is often about 10 m indoors)."*
  - 4 node cards in a row with arrows: Volunteer 1, Volunteer 2, Volunteer 3, Gateway.
  - Controls: input "Message", buttons "Encrypt and send" and "Reset".
  - Multi-hop animation through Volunteer 1 → Volunteer 2 → Volunteer 3 → Gateway.
  - Relays show only `"Ciphertext only"` and base64 text; Gateway decrypts and displays `"Decrypted message"`.
  - Badges: `"Encryption: real (Web Crypto, ECDH P-256 + AES-GCM)"` and `"Radio: simulated"`.
- [x] **Build & Verification**: `vite build` completed cleanly with exit code 0; `scripts/check-logic.mjs` passed.

## Step 6b — Admin Panel & Telemetry Dashboard ✅

### Done
- [x] **Store Activity Log**: Small audit log in `src/store/index.jsx` recording `sendFieldTeam`, `verifyArea`, `approveTransfer`, and `updateDutyStatus` with timestamps.
- [x] **8 StatCards**: "Total Areas", "Active Dark Zones" (purple), "High-risk Areas" (red), "Critical Shortages" (red), "Camps", "Camp Occupancy" (occupied / capacity), "Reports Received", "Pending Verifications" (amber) with zero new API calls.
- [x] **2x2 recharts Grid**: "Volunteers by status", "Duties by status", "Total stock vs need", and "Areas by risk level".
- [x] **Deliveries Card**: Metrics for "Pending", "In transit", and "Delivered".
- [x] **Recent Activity & Role Guard**: Shows last 10 actions (or "No activity yet."); displays "Data as of [time]" and "Demo data" chip; hides nav item and renders "Admin access only" in Volunteer role.
- [x] **Build & Verification**: `vite build` completed cleanly with exit code 0; `scripts/check-logic.mjs` passed.

## Step 9 — Report Triage & Limits and Trade-offs ✅

### Done
- [x] **`src/lib/mockExtractor.js`**: Pure ES module keyword extraction without browser APIs. Extracts `age`, `mobilityIssue`, `hazard`, `urgency`, and `assistanceNeeded`. Unfound fields return strictly `"Not found"` (zero hallucinated guesses).
- [x] **`src/pages/TriagePage.jsx`**: Textarea `"Paste an emergency message"`, `"Extract details"` button, result card with `SuggestedChip`, explicit displays of all 5 fields with `"Not found"` fallback, and required footer `"A human must review this result."`
- [x] **`src/pages/LimitsPage.jsx`**: Three dedicated cards: `"What we built"`, `"What we left out"`, and `"Why"`.
- [x] **Disclosures List**: Exact 5 items per PRD section 7:
  - *"Mock data only, no real personal data"*
  - *"Weights are our assumptions, not validated"*
  - *"Mesh is simulated"*
  - *"Role switcher is not authentication"*
  - *"We did not find this combination in the ~20 papers we reviewed"*
- [x] **Build & Verification**: `vite build` completed cleanly with exit code 0; `scripts/check-logic.mjs` passed.

## Step 10 — PWA Configuration & Offline Map Tile Caching ✅

### Done
- [x] **Web App Manifest**: Configured in `vite.config.js` with `name: "ReliefOS + DARK ZONE"`, `short_name: "ReliefOS"`, `theme_color: "#0F172A"`, `background_color: "#0F172A"`, and `display: "standalone"`.
- [x] **PWA PNG Icons**: Generated valid 192x192 and 512x512 PNG files in `/public` (`icon-192.png`, `icon-512.png`) matching `#0F172A` theme color.
- [x] **App Shell Precaching**: Configured service worker with workbox `globPatterns` to precache all JS, CSS, HTML, SVG, PNG, and JSON assets for zero-network launches.
- [x] **OpenStreetMap Tile Runtime Cache**: Added `runtimeCaching` rule for `https://*.tile.openstreetmap.org/*` using `CacheFirst` strategy with a 120-entry maximum and 30-day expiration.
- [x] **Build & Preview Verification**: `npm.cmd run build` produced `dist/sw.js` and `dist/manifest.webmanifest`; tested with `npm.cmd run preview` to confirm 200 HTTP responses on app shell, service worker, manifest, and icons.

## Step 11 — Demo Script Walkthrough, Bug Fixes & Project Documentation ✅

### Done
- [x] **Demo Walkthrough Completed**: Executed all 10 screen workflows across Dashboard, Area Detail, Resources, Allocation, Volunteers, Verification, Triage, Mesh Simulator, Limits, and Admin Panel.
- [x] **Fixed 3 Small Bugs**:
  1. `src/api/index.js`: Switched to `VITE_API_URL` with trailing slash normalization for backend compatibility.
  2. `src/pages/VerificationPage.jsx`: Filtered out rejected areas (`a.verification !== 'rejected'`) so they cleanly depart the verification queue upon rejection.
  3. `src/store/index.jsx`: Updated responder status to `on_duty` when dispatched via `sendFieldTeam`.
- [x] **Unfixed Known Observations Noted**:
  - Map center coordinates are static `[24.86, 67.01]` rather than dynamic fitBounds for remote sectors.
  - Volunteer profile drawer does not attach popstate listener to close on browser back button.
  - Delivery tracker stepper advances without click debouncing.
- [x] **`README.md` Written**: Comprehensive documentation with purpose, honesty notes, tech stack, Windows run steps, `.env.example`, project structure, backend connection (`VITE_API_URL`), and operational limits.
- [x] **Environment Configuration**: Added `.env.example` documenting `VITE_API_URL` without secrets.
- [x] **Build & Verification**: `vite build` completed cleanly with exit code 0; `scripts/check-logic.mjs` passed all assertions.

---

## Step 12 — Design Overrides & Forest Green Theme System ✅

### Done
- [x] **Typography & Offline Precaching**: Installed `@fontsource-variable/hanken-grotesk` and `@fontsource-variable/public-sans`, imported in `src/main.jsx`, configured `woff2` in `vite.config.js` workbox precaching, and updated manifest colors.
- [x] **Theme Tokens & Styling (`src/index.css`)**: Replaced navy palette with deep forest `#1F3D2B`, warm cream background `#F6F3EA`, card surfaces `#FFFDF7` with `#E4DFD0` border, primary buttons `#2F4A2B` (hover `#243A21`), and active sidebar pill `#2F5A3A`.
- [x] **Dark Zone Hero Styling**: Implemented `#F5F3FF` background, `#A78BFA` border, `#7C3AED` left accent, purple pill tags, and slow CSS pulse ring with `Potential Dark Zone · Silence ratio ≥ 0.6` tooltip.
- [x] **Shell Layout & Chrome**: Updated `Layout.jsx`, `Header.jsx`, and `Sidebar.jsx` with deep forest green chrome, white text, and `#2F5A3A` active pills.
- [x] **11 Shared Components**: Styled `StatCard` (40px bold Hanken Grotesk metric), `StatusBadge` (safe green check icon, red high risk, amber warning, purple Dark Zone), `SuggestedChip`, `TagChip`, `LowConfidenceBanner`, `ScoreGauge`, `ProgressBar`, `EmptyState`, `ErrorState`, `Skeleton`, and `ConfirmDialog`.
- [x] **Build & Logic Verification**: `npm run build` and `npm run check` completed cleanly with exit code 0; all woff2 assets precached.

---

## Next Step (waiting for "haan")
- Waiting for user's "haan" to proceed to subsequent screen refinements or testing.
