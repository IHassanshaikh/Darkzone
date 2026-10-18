# ReliefOS Mobile (React Native / Expo)
### Citizen & Affected Person Offline Disaster SOS Application

A dedicated **React Native** application engineered specifically for affected citizens during severe disasters when cellular towers and power grids are offline.

---

## 1. Core Architecture & Offline Mesh Transfer

```
 [ Affected Person Mobile App ]
              │
              ├── (No Internet/Cellular) ──► Encrypted Bluetooth / BLE P2P Mesh (Range ~30m)
              │                                                │
              │                                                ▼
              │                                 [ Nearby Volunteer Device ]
              │                                                │
              │                                      (Moves into network zone)
              │                                                │
              │                                                ▼
              └──────────────────────────────► [ ReliefOS Central Backend HQ ]
                                                      (/api/v1/reports)
```

1. **Bluetooth Low Energy (BLE) Multi-Hop**:
   - Packets hop device-to-device with a standard ~30 meter radio range per hop.
   - Multi-hop store-and-forward routes packets across bystander nodes until reaching a verified Field Volunteer.
2. **End-to-End Encryption (E2EE)**:
   - ECDH P-256 Key Exchange + AES-GCM-256 authenticated encryption.
   - Intermediary hops (other citizens' phones relaying the message) **cannot** decrypt or view the distress text.
3. **Automatic Central HQ Synchronization**:
   - Volunteer devices cache delivered packets in local `AsyncStorage`.
   - When a volunteer device regains connectivity (satellite terminal or cell zone), the app pushes queued reports directly to the ReliefOS central endpoint (`/api/v1/reports`).

---

## 2. 3-Tab Interface Breakdown

### Tab 1: Live Interactive Map (`Map View`)
- **Simulated Radar Beacon**: Live position lock with sector indicator (Sector Delta 9) and 3m GPS accuracy.
- **Volunteer Pins**: Shows nearby on-duty volunteers (e.g. *Alex Rivera*, 120m away; *Sarah Chen*, 340m away) with direct BLE radio coverage indicators.
- **Camp Pins**: Visual pins for emergency shelters with distance and capacity status.
- **Compass & Orientation**: Real-time compass heading for foot navigation without cellular data.

### Tab 2: SOS & Emergency Messaging (`SOS & Chat`)
- **One-Tap Emergency Distress Grid**:
  - `Medical Assistance` (High priority)
  - `Rescue Needed` (Immediate emergency)
  - `Clean Water` (Survival resources)
  - `Evacuation Boat` (Flood/water rescue)
- **Direct Volunteer P2P Chat**: Select active field volunteer and exchange encrypted messages.
- **AES-GCM-256 Cipher Inspector**: Tap the lock badge to view real-time cryptographic payload (IV, Auth Tag, Ciphertext hex).
- **4-Step Delivery Pipeline Badges**:
  1. `Queued Offline` (Stored in device SQLite/AsyncStorage)
  2. `Sent via BLE` (Radio transmission initiated)
  3. `Delivered to Volunteer` (Acknowledged by volunteer device)
  4. `Relayed to HQ` (Integrated into ReliefOS Command Center)

### Tab 3: Relief Camps Directory (`Relief Camps`)
- **Proximity Sort**: Camps dynamically sorted by straight-line distance (`450m`, `850m`, `1.4km`).
- **Live Shelter Occupancy Meter**: High-contrast capacity progress bars showing current occupancy vs limit.
- **Stock & Supplies Status**: Instant visibility into reserves for Water, Food Rations, and Medical clinics.
- **Walking Directions & Compass Bearing**: Displays estimated walking time and compass azimuth (e.g. `Southeast 135°`).
- **Show on Map**: Instantly transitions to the Map view focused on the chosen camp.

---

## 3. Tech Stack & Styling Guidelines

- **Framework**: React Native 0.74+ with Expo SDK 51.
- **Icons**: `lucide-react-native` (Pure SVG icons; zero emojis).
- **Storage**: `@react-native-async-storage/async-storage` for offline packet queueing.
- **Typography & Theme**: Tactical disaster dark palette (`#020617`, `#0f172a`, `#1e293b`) with high-contrast accessibility tokens for sunlight visibility.

---

## 4. Directory Structure

```
reliefos-mobile/
├── App.js                     # Root component with state management & tab switching
├── app.json                   # Expo configuration & hardware permissions (BLE, GPS)
├── babel.config.js            # Expo babel preset
├── package.json               # Dependencies and scripts
└── src/
    ├── components/
    │   ├── CampCard.js        # Camp card with occupancy meter & supplies
    │   ├── DeliveryBadge.js   # 4-stage delivery pipeline badge
    │   ├── HeaderStatusBar.js # Top BLE mesh status & online toggle
    │   └── SOSButton.js       # High-contrast one-tap emergency SOS button
    ├── data/
    │   ├── mockCamps.js       # Camp locations, capacities & supplies
    │   └── mockVolunteers.js  # Nearby field volunteer positions & radio signal
    ├── screens/
    │   ├── CampsScreen.js     # Tab 3: Relief Camps list & proximity filters
    │   ├── MapScreen.js       # Tab 1: Live Radar Map & volunteer beacons
    │   └── SOSChatScreen.js   # Tab 2: SOS grid, direct P2P chat & cipher inspection
    ├── services/
    │   ├── BleMeshService.js  # BLE hop propagation & ~30m radio simulation
    │   ├── CryptoService.js   # E2EE (ECDH-P256 + AES-GCM-256)
    │   └── StorageService.js  # Offline queue & ReliefOS backend synchronization
    └── theme/
        └── colors.js          # Tactical disaster color tokens
```

---

## 5. How to Run Locally

### Option A: Run on Physical Device via Expo Go (Recommended)
1. Install the **Expo Go** app from the App Store (iOS) or Google Play (Android).
2. From the project directory, install dependencies:
   ```bash
   cd reliefos-mobile
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code displayed in your terminal using the Expo Go app (or iOS Camera).

### Option B: Run in Android Emulator or iOS Simulator
```bash
# Android
npx expo start --android

# iOS (macOS required)
npx expo start --ios
```

### Option C: Web / Desktop Interactive Preview
You can also preview this exact citizen mobile interface inside the running ReliefOS Command Center at:
```
http://localhost:3000/mobile
```
This route emulates a mobile device chassis running the same 3-tab layout, interactive offline Leaflet map, emergency SOS dispatch, and direct synchronization with the `/api/v1/reports` endpoint.
