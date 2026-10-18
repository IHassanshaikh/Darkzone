# ReliefOS + DARK ZONE

Finding who needs help most in disaster response and matching scarce resources to them before situations become critical.

## 1. What the Project Is

ReliefOS combines disaster operations management (volunteers, camps, resource allocation, field delivery) with the **DARK ZONE** engine. 

Traditional humanitarian logistics relies heavily on incoming call volumes and incident sitreps. However, the hardest-hit communities often experience catastrophic power and cellular outages, leaving them completely silent. ReliefOS compares expected incident reporting volume against actual incoming reports to flag **Dark Zones**—areas characterized by high hazard severity and high vulnerability but unexpectedly low reports. Dark Zones are flagged for urgent human field verification, never for automatic rescue dispatch.

---

## 2. Honesty Notes

- **Mock data only, no real personal data:** All disaster sectors, camps, responder names, and sitrep texts represent synthetic scenarios. No real personally identifiable information (PII) is stored or tracked.
- **Weights are our assumptions, not validated:** Dark Zone composite scoring formulas, urgency weightings, and surplus-deficit matching rules are operational heuristics created for this prototype, not calibrated against historical empirical ground-truth disaster logs.
- **Mesh is simulated:** Browsers cannot run ad-hoc Bluetooth or Wi-Fi Direct radio mesh protocols in the background without native mobile operating system bridges. The Mesh Simulator demonstrates cryptographic key derivation and hop-by-hop packet encapsulation using the browser's native Web Crypto API. Radio transmission is simulated.
- **Role switcher is not authentication:** Toggling between "Admin" and "Volunteer" roles is a UI convenience mode for demonstration purposes and does not enforce cryptographic identity, permission barriers, or session tokens.
- **Research note:** "We did not find this combination in the ~20 papers we reviewed"—specifically, combining an expected-vs-actual reporting volume gap, vulnerability indicators, hazard severity, and connectivity failure to guide field verification before camp supply allocation.
- **Human in the loop:** Every automatic output is explicitly labeled **Suggested**. A human operator confirms before dispatching resources or elevating priorities.

---

## 3. Technology Stack

- **Core & Runtime:** React 19, JavaScript (ES modules)
- **Tooling & Bundler:** Vite 8, `@vitejs/plugin-react`
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`) with curated light-theme operational tokens
- **Routing:** React Router v7 (`react-router-dom`)
- **Mapping:** Leaflet & React Leaflet (`react-leaflet`, `leaflet`) with custom camp pins and sector boundary circles
- **Charts & Data Visualization:** Recharts (`recharts`)
- **Offline Storage:** IndexedDB via `idb-keyval`
- **PWA & Service Worker:** `vite-plugin-pwa` with Workbox offline app shell precaching and runtime tile caching
- **Cryptography:** Native browser Web Crypto API (ECDH P-256 key exchange + AES-GCM 256-bit encryption)

---

## 4. Windows Run Steps

Execute the following commands in Windows PowerShell or Command Prompt:

```powershell
# 1. Install dependencies
npm.cmd install

# 2. Run logic smoke checks (verifies pure ES logic modules)
node scripts/check-logic.mjs

# 3. Start development server
npm.cmd run dev

# 4. Create production build with PWA service worker
npm.cmd run build

# 5. Preview production build locally
npm.cmd run preview
```

---

## 5. Environment Variables & Connecting the Backend

Configuration is handled through environment variables. An example template is provided in [.env.example](file:///d:/Project/.env.example):

```bash
# Backend API Base URL
VITE_API_URL=http://localhost:3000
```

### How to Connect the Backend (`VITE_API_URL`)
1. Create a `.env` file in the root directory:
   ```bash
   copy .env.example .env
   ```
2. Set `VITE_API_URL` to point to your backend server (e.g., `http://localhost:3000` or `https://api.reliefos.internal`).
3. If `VITE_API_URL` is omitted, blank, or the backend is temporarily unreachable, the frontend automatically falls back to simulated acceptance so the entire offline demonstration workflow functions smoothly.
4. All sync operations dispatch batches of queued events via `POST ${VITE_API_URL}/sync`.

---

## 6. Project Structure

```
d:/Project/
├── docs/
│   └── ARCHITECTURE.md          # System architecture and mathematical formulas
├── public/
│   ├── favicon.svg              # App icon
│   ├── icon-192.png             # 192x192 PWA standalone manifest icon
│   ├── icon-512.png             # 512x512 PWA splash screen icon
│   └── icons.svg                # Shared SVG icon sprites
├── scripts/
│   ├── check-logic.mjs          # Smoke test verifying pure math & allocation logic
│   └── generate-icons.mjs       # Script to generate valid standalone PWA icons
├── src/
│   ├── api/
│   │   └── index.js             # Thin HTTP client connecting to VITE_API_URL /sync
│   ├── components/
│   │   ├── ConfirmDialog.jsx    # Modal dialog for confirmation barriers
│   │   ├── DashboardMap.jsx     # Leaflet map with camp pins & sector risk circles
│   │   ├── EmptyState.jsx       # Standardized fallback empty container
│   │   ├── ErrorState.jsx       # Error display with retry handler
│   │   ├── Header.jsx           # Top bar with role switch, sync status & demo chip
│   │   ├── Layout.jsx           # Application shell with responsive sidebar & content
│   │   ├── LowConfidenceBanner.jsx # Warning on partial or unverified sensor data
│   │   ├── ProgressBar.jsx      # Stock vs need visual progress bars
│   │   ├── ScoreGauge.jsx       # 0-100 Dark Zone risk gauge
│   │   ├── Sidebar.jsx          # Light-theme navy (#0F172A) navigation drawer
│   │   ├── Skeleton.jsx         # Loading placeholders
│   │   ├── StatCard.jsx         # Standard metric card (danger, purple, warning)
│   │   ├── StatusBadge.jsx      # Entity lifecycle badges
│   │   ├── SuggestedChip.jsx    # Non-intrusive "Suggested" AI badge
│   │   └── TagChip.jsx          # Priority matrix category chip
│   ├── data/
│   │   └── mock/                # Seed fixtures (areas, camps, volunteers, duties, reports)
│   ├── hooks/
│   │   └── usePendingSync.js    # Reactive subscription to IndexedDB queue depth
│   ├── lib/
│   │   ├── allocation.js        # Pure ES Haversine & camp transfer engine
│   │   ├── darkZone.js          # Pure ES Dark Zone detection formula engine
│   │   ├── meshCrypto.js        # Pure Web Crypto ECDH P-256 + AES-GCM engine
│   │   ├── mockExtractor.js     # Pure ES keyword incident entity extractor
│   │   ├── offlineQueue.js      # idb-keyval offline action persistence queue
│   │   └── priority.js          # Pure ES unified urgency matrix engine
│   ├── pages/
│   │   ├── AdminPage.jsx        # Admin telemetry, 2x2 recharts, and activity audit log
│   │   ├── AllocationPage.jsx   # Surplus-to-deficit matching & delivery stepper
│   │   ├── AreaDetailPage.jsx   # Sector deep dive, checklist, and comparison chart
│   │   ├── DashboardPage.jsx    # Unified priority matrix, stat cards & Leaflet map
│   │   ├── LimitsPage.jsx       # "What we built", "What we left out", "Why"
│   │   ├── MeshSimulatorPage.jsx# 4-node animated multi-hop encrypted relay
│   │   ├── ResourcesPage.jsx    # Camp occupancy and 4-tier resource inventory
│   │   ├── TriagePage.jsx       # Emergency message parsing & entity extraction
│   │   ├── VerificationPage.jsx # Ground-truth field dispatch console
│   │   └── VolunteersPage.jsx   # Admin responder roster & Volunteer dashboard
│   ├── store/
│   │   └── index.jsx            # Unified application state, actions & activity log
│   ├── App.jsx                  # React Router definitions & route guard
│   ├── index.css                # Tailwind CSS v4 configuration
│   └── main.jsx                 # React root mount & PWA service worker registration
├── vite.config.js               # Vite bundler, Tailwind, and PWA plugin config
└── README.md                    # This documentation file
```

---

## 7. Operational Limits & Boundaries

1. **No Automatic Rescue:** Dark Zone scores flag areas for human survey teams. Aid is never automatically diverted without ground confirmation.
2. **Deterministic Heuristics:** Allocation and priority calculations are transparent, deterministic mathematical formulas with zero hidden black-box optimization.
3. **Hardware Boundaries:** Ad-hoc radio mesh is strictly simulated; production deployments require dedicated hardware (such as Meshtastic, goTenna, or native OS radios).
4. **Offline Resilience:** All reports and task updates created while offline persist in browser IndexedDB and automatically flush when connectivity is restored.
