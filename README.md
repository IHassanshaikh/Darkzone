# ReliefOS 🆘📡

> **"ReliefOS doesn't only help those who ask. It finds those who can't ask, then sends supplies there first."**

An intelligent, offline-first disaster response coordination platform built for CODE//CONNECT'26. **ReliefOS + DARK ZONE** identifies high-risk areas suffering from communication blackouts (Dark Zones), coordinates camp inventories, and manages field volunteer dispatches—even with zero internet connectivity.

---

## 🌟 Key Features

* 🕵️ **DARK ZONE Risk Engine**: Evaluates expected vs. actual reporting gaps alongside hazard severity, vulnerability, and network failure rates to flag silent risk zones needing immediate human verification.
* 📶 **Offline-First PWA & Auto-Sync**: Operates seamlessly without internet using Service Workers and IndexedDB; automatically flushes pending queues once reconnected.
* 🔒 **Simulated Encrypted Mesh Network**: Leverages the Web Crypto API (ECDH P-256 + AES-GCM) to route distress messages via peer-to-peer device hops (Bluetooth / BLE) to nearby field volunteers.
* ⛺ **Resource & Allocation Engine**: Automated shortage detection and smart supply transfers between camps based on surplus and proximity.
* 👥 **Multi-Role Dashboards**: Tailored command centers for **Rescue Coordinators (Admins)**, **Camp Managers**, and **Field Volunteers**.
* 📱 **Affected Person Mobile Bridge**: Low-power mobile interface allowing citizens to broadcast SOS messages and locate nearby camps/volunteers offline.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Tailwind CSS, Vite, React Router, Leaflet / OpenStreetMap, Recharts, `vite-plugin-pwa`, `idb-keyval`
* **Backend**: Node.js, Express REST API, Zod Validation
* **Database & Auth**: Supabase PostgreSQL, Supabase Realtime
* **Security & Cryptography**: Web Crypto API (ECDH P-256 + AES-GCM)

---

## ⚙️ Quick Start

```bash
# Clone the repository
git clone [https://github.com/your-username/relief-os.git](https://github.com/your-username/relief-os.git)

# Install dependencies
npm install

# Run frontend in development mode
npm run dev

# Build production PWA bundle
npm run build && npm run preview
