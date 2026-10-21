'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Default Safe Zones directly from SafeZone.java
const DEFAULT_SAFE_ZONES = [
  { id: 'camp-a', name: 'Camp A', lat: 24.9215, lng: 67.0920, capacity: 250 },
  { id: 'camp-b', name: 'Camp B', lat: 24.9056, lng: 67.0822, capacity: 200 },
  { id: 'camp-c', name: 'Camp C', lat: 24.8800, lng: 67.0600, capacity: 150 },
  { id: 'camp-d', name: 'Camp D', lat: 24.9400, lng: 67.1100, capacity: 300 }
];

const COMPASS_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function calculateDistanceAndBearing(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // in meters

  // Bearing
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  brng = (brng + 360) % 360;
  const dirIndex = Math.round(brng / 45) % 8;

  return {
    meters: Math.round(d),
    text: d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`,
    direction: COMPASS_DIRS[dirIndex]
  };
}

// Client-side RSA & AES simulated encryption matching CryptoBox.java
function mockEncryptForAdmin(plainText) {
  const keySnippet = btoa('aes-key-' + Math.random().toString(36).substring(2, 10)).substring(0, 16);
  const ivSnippet = btoa('iv-' + Date.now()).substring(0, 12);
  const cipherSnippet = btoa(encodeURIComponent(plainText));
  return `${keySnippet}.${ivSnippet}.${cipherSnippet}`;
}

function mockDecryptAsAdmin(bundle) {
  try {
    const parts = bundle.split('.');
    if (parts.length === 3) {
      return decodeURIComponent(atob(parts[2]));
    }
    return '(unrecognized encrypted bundle)';
  } catch {
    return '(could not decrypt)';
  }
}

export default function ReliefOSJavaApp({ onSwitchToHub }) {
  // User Profile
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempNameInput, setTempNameInput] = useState('');

  // Location & Map Refs
  const [userLoc, setUserLoc] = useState({ lat: 24.9120, lng: 67.0850 });
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Mesh & Peers (from MeshManager.java & MainActivity.java)
  const [meshActive, setMeshActive] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [nearbyPeers, setNearbyPeers] = useState([
    { id: 'peer-1', name: 'Fatima Noor', lat: 24.9145, lng: 67.0870, lastSeen: Date.now() },
    { id: 'peer-2', name: 'Sara Khan', lat: 24.9080, lng: 67.0810, lastSeen: Date.now() },
    { id: 'peer-3', name: 'Bilal Ahmed', lat: 24.9190, lng: 67.0910, lastSeen: Date.now() }
  ]);

  // Admin Mode & Private Box (PIN 1234)
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [privateBox, setPrivateBox] = useState([
    {
      id: 'pkt-priv-1',
      name: 'Dr. Tariq',
      text: mockEncryptForAdmin('Need 4 units of O-negative blood at Camp A clinic urgently.'),
      hops: 2,
      ts: Date.now() - 360000
    }
  ]);
  const [showAdminInbox, setShowAdminInbox] = useState(false);
  const [showNearbyModal, setShowNearbyModal] = useState(false);

  // Dialogs
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageInput, setMessageInput] = useState('');

  // Mesh Activity Terminal
  const [logExpanded, setLogExpanded] = useState(false);
  const [logs, setLogs] = useState([
    'Mesh started as anon-7492',
    'RX PRESENCE from Fatima Noor (direct BLE)',
    'RX PRESENCE from Sara Khan (direct BLE)',
    'Mesh ready: P2P_CLUSTER active'
  ]);

  // Received Incident/Distress Markers on map
  const [packetMarkers, setPacketMarkers] = useState([]);

  // Toast notification
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const addLog = (msg) => {
    setLogs((prev) => [...prev.slice(-30), msg]);
  };

  // Initialize identity from storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedId = localStorage.getItem('relief_myId');
      if (!storedId) {
        storedId = 'anon-' + (1000 + Math.floor(Math.random() * 9000));
        localStorage.setItem('relief_myId', storedId);
      }
      setMyId(storedId);

      const storedName = localStorage.getItem('relief_myName');
      if (!storedName) {
        setShowNameModal(true);
      } else {
        setMyName(storedName);
        addLog(`Mesh initialized for ${storedName} (${storedId})`);
      }

      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Try reading real GPS
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserLoc({ lat, lng });
            addLog(`GPS lock acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([lat, lng], 14);
            }
          },
          () => {
            addLog('GPS offline fallback: using default sector coordinates');
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Compute nearest safe zone
  const nearestZone = React.useMemo(() => {
    if (!userLoc) return null;
    let closest = null;
    let minMeters = Infinity;

    DEFAULT_SAFE_ZONES.forEach((zone) => {
      const calc = calculateDistanceAndBearing(userLoc.lat, userLoc.lng, zone.lat, zone.lng);
      if (calc.meters < minMeters) {
        minMeters = calc.meters;
        closest = {
          ...zone,
          distanceText: calc.text,
          direction: calc.direction,
          meters: calc.meters
        };
      }
    });

    return closest;
  }, [userLoc]);

  // Leaflet Map Initialization and Layer updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLoc.lat, userLoc.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. User Position Marker (Blue radar circle + avatar)
    const userIcon = L.divIcon({
      className: 'relief-user-pin',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(37,99,235,0.8);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const userMarker = L.marker([userLoc.lat, userLoc.lng], { icon: userIcon }).addTo(group);
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
        <strong style="color: #2563eb; font-size: 12px; display: block;">You are here</strong>
        <span style="color: #0f172a; font-weight: bold;">${myName || myId}</span>
        <div style="color: #10b981; font-weight: 700; margin-top: 4px;">● BLE Mesh Beacon Active</div>
      </div>
    `);

    // 80m Broadcast Range Circle around user
    L.circle([userLoc.lat, userLoc.lng], {
      radius: 80,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(group);

    // 2. Safe Zones from SafeZone.java (Camp A, B, C, D)
    DEFAULT_SAFE_ZONES.forEach((zone) => {
      const zoneIcon = L.divIcon({
        className: 'relief-zone-pin',
        html: `
          <div style="background: #10b981; color: white; padding: 4px 8px; border-radius: 8px; border: 2px solid white; font-weight: 800; font-size: 11px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span>🛡️</span>
            <span>${zone.name}</span>
          </div>
        `,
        iconSize: [80, 28],
        iconAnchor: [40, 14]
      });

      const zMarker = L.marker([zone.lat, zone.lng], { icon: zoneIcon }).addTo(group);
      zMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <strong style="color: #0f172a; font-size: 12px; display: block;">${zone.name}</strong>
          <span style="color: #64748b;">Capacity: ${zone.capacity} beds</span>
          <div style="color: #10b981; font-weight: bold; margin-top: 2px;">Designated Safe Haven</div>
        </div>
      `);
    });

    // 3. Nearby Peers Markers (personIcon from MainActivity.java)
    nearbyPeers.forEach((peer) => {
      const peerIcon = L.divIcon({
        className: 'relief-peer-pin',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #ffffff; border: 3px solid #3b82f6; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.25);">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #3b82f6;"></div>
            </div>
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 1px 6px; margin-top: 2px; font-weight: 700; font-size: 10px; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.15); white-space: nowrap;">
              ${peer.name}
            </div>
          </div>
        `,
        iconSize: [60, 42],
        iconAnchor: [30, 12]
      });

      const pMarker = L.marker([peer.lat, peer.lng], { icon: peerIcon }).addTo(group);
      pMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <strong style="color: #0f172a; font-size: 12px; display: block;">👤 ${peer.name}</strong>
          <span style="color: #3b82f6; font-weight: bold;">Peer via Bluetooth Mesh</span>
        </div>
      `);
    });

    // 4. Incident / Distress Packet Markers
    packetMarkers.forEach((pkt) => {
      const pktIcon = L.divIcon({
        className: 'relief-pkt-pin',
        html: `
          <div style="background: #dc2626; color: white; padding: 3px 6px; border-radius: 6px; border: 2px solid white; font-weight: 800; font-size: 10px; box-shadow: 0 2px 6px rgba(220,38,38,0.5); animation: bounce 1s infinite;">
            ⚠️ ${pkt.type}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });
      const m = L.marker([pkt.lat, pkt.lng], { icon: pktIcon }).addTo(group);
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <strong style="color: #dc2626; display: block;">${pkt.type} Alert</strong>
          <div>${pkt.name}: ${pkt.text}</div>
        </div>
      `);
    });

  }, [userLoc, nearbyPeers, packetMarkers, myName, myId]);

  // Clean up map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Name Save
  const handleSaveName = (e) => {
    e.preventDefault();
    if (!tempNameInput.trim()) return;
    const clean = tempNameInput.trim();
    localStorage.setItem('relief_myName', clean);
    setMyName(clean);
    setShowNameModal(false);
    addLog(`Welcome ${clean}! P2P Mesh advertising enabled.`);
    showToast(`Welcome ${clean}!`);
  };

  // SOS Trigger
  const handleConfirmSos = () => {
    setShowSosDialog(false);
    const pkt = {
      id: 'sos-' + Date.now(),
      type: 'SOS',
      name: myName || myId,
      text: 'Help needed',
      lat: userLoc.lat,
      lng: userLoc.lng,
      hops: 0,
      ts: Date.now()
    };
    setPacketMarkers((prev) => [...prev, pkt]);
    addLog(`Sent SOS (peers: ${nearbyPeers.length})`);
    showToast(
      nearbyPeers.length > 0
        ? `SOS broadcasted to ${nearbyPeers.length} nearby phone(s)`
        : 'SOS saved to offline mesh queue. Will transmit when peer is near.'
    );
  };

  // I'm Safe Trigger
  const handleSendSafe = () => {
    const pkt = {
      id: 'safe-' + Date.now(),
      type: 'STATUS',
      name: myName || myId,
      text: 'I am safe',
      lat: userLoc.lat,
      lng: userLoc.lng,
      hops: 0,
      ts: Date.now()
    };
    setPacketMarkers((prev) => [...prev, pkt]);
    addLog(`Sent STATUS "I am safe" (peers: ${nearbyPeers.length})`);
    showToast(
      nearbyPeers.length > 0
        ? `Status shared with ${nearbyPeers.length} nearby phone(s)`
        : 'Status saved. Will be relayed when another phone comes in range.'
    );
  };

  // Custom Encrypted Admin Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const cipher = mockEncryptForAdmin(messageInput.trim());
    const pkt = {
      id: 'pkt-priv-' + Date.now(),
      type: 'PRIVATE',
      name: myName || myId,
      text: cipher,
      hops: 1,
      ts: Date.now()
    };
    setPrivateBox((prev) => [...prev, pkt]);
    addLog(`Sent PRIVATE (encrypted), peers: ${nearbyPeers.length}`);
    showToast(
      nearbyPeers.length > 0
        ? 'Encrypted and sent. Only the admin can read it.'
        : 'Saved. Will be passed on when a phone comes nearby.'
    );
    setMessageInput('');
    setShowMessageDialog(false);
  };

  // Admin Unlock (PIN 1234)
  const handleUnlockAdmin = (e) => {
    e.preventDefault();
    if (adminPinInput === '1234') {
      setIsAdmin(true);
      setShowAdminPinModal(false);
      setAdminPinInput('');
      showToast('Admin mode ON. Tap the title to open inbox.');
      addLog('Admin unlocked with PIN 1234. Zero-knowledge decryption active.');
    } else {
      showToast('Wrong PIN (try 1234)');
    }
  };

  // Center map on Safe Zone click
  const handleZoneNameClick = () => {
    if (nearestZone && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([nearestZone.lat, nearestZone.lng], 16, { animate: true });
      showToast(`Zoomed to ${nearestZone.name}`);
    }
  };

  // Long press timer for Logo to trigger Admin PIN
  const longPressTimerRef = useRef(null);
  const handleLogoMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (isAdmin) {
        setIsAdmin(false);
        showToast('Admin mode OFF');
        addLog('Admin mode disabled.');
      } else {
        setShowAdminPinModal(true);
      }
    }, 800);
  };
  const handleLogoMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#F8FAFC] overflow-hidden select-none font-sans flex flex-col justify-between">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] max-w-[90%] bg-[#0F172A]/95 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10 text-center animate-fade-in font-medium pointer-events-none">
          {toastMsg}
        </div>
      )}

      {/* FULL-BLEED MAP LAYER (Simulating osmdroid MapView) */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* TOP HEADER CARD (Matches layout: activity_main.xml Header) */}
      <div className="relative z-10 m-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-3.5 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo Badge (Long-press triggers Admin PIN) */}
            <div
              id="btn-android-logo"
              onMouseDown={handleLogoMouseDown}
              onMouseUp={handleLogoMouseUp}
              onTouchStart={handleLogoMouseDown}
              onTouchEnd={handleLogoMouseUp}
              title="Long-press to enter Admin PIN (1234)"
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition-transform select-none"
            >
              ⚡
            </div>

            <div>
              <div
                id="tv-title"
                onClick={() => {
                  if (isAdmin) setShowAdminInbox(true);
                }}
                className={`text-[17px] font-bold leading-tight ${
                  isAdmin ? 'text-amber-600 cursor-pointer hover:underline' : 'text-slate-900'
                }`}
              >
                {isAdmin ? `ReliefOS · ADMIN (${privateBox.length})` : 'ReliefOS'}
              </div>
              <div className="text-[12px] text-slate-500 leading-tight">Find safety, even offline</div>
            </div>
          </div>

          {/* Quick jump to Extended Hub / Portals */}
          {onSwitchToHub && (
            <button
              id="btn-switch-to-hub"
              onClick={onSwitchToHub}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-colors shadow-sm"
              title="Open Extended Portal Hub"
            >
              <span>Hub</span>
              <span className="text-[10px]">↗</span>
            </button>
          )}
        </div>

        {/* Status Chips Row (Matches tvMesh, tvPeers, tvNet from activity_main.xml) */}
        <div className="flex items-center gap-1.5 mt-2.5">
          {/* tvMesh */}
          <div
            id="chip-mesh"
            onClick={() => {
              setMeshActive(!meshActive);
              addLog(meshActive ? 'Mesh disabled by user' : 'Mesh enabled');
              showToast(meshActive ? 'Mesh turned OFF' : 'Mesh turned ON');
            }}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors border shadow-sm ${
              meshActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            ● {meshActive ? 'Mesh ON' : 'Mesh OFF'}
          </div>

          {/* tvPeers (Click opens "People nearby" dialog) */}
          <div
            id="chip-peers"
            onClick={() => setShowNearbyModal(true)}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors shadow-sm"
          >
            ● {nearbyPeers.length} nearby
          </div>

          {/* tvNet */}
          <div
            id="chip-net"
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-sm ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            ● {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* BOTTOM FLOATING CARD (Matches layout: activity_main.xml Bottom Card) */}
      <div className="relative z-10 m-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-4 transition-all">
        {/* Uppercase Header */}
        <div className="text-[11px] font-bold text-slate-500 tracking-wider">NEAREST SAFE ZONE</div>

        {/* Zone Name & Distance Row */}
        <div className="flex items-baseline justify-between mt-1">
          <div
            id="tv-zone-name"
            onClick={handleZoneNameClick}
            title="Tap to focus on map"
            className="text-[20px] font-extrabold text-slate-900 cursor-pointer hover:text-blue-600 transition-colors leading-tight"
          >
            {nearestZone ? nearestZone.name : 'Locating you…'}
          </div>
          <div id="tv-zone-dist" className="text-[15px] font-bold text-emerald-600">
            {nearestZone ? `${nearestZone.distanceText} · ${nearestZone.direction}` : 'Waiting for GPS'}
          </div>
        </div>

        {/* Zone Subtitle */}
        <div className="text-[12px] text-slate-500 mt-0.5">
          {nearestZone
            ? `Capacity ${nearestZone.capacity} · tap name to see on map`
            : 'GPS works without internet. Step outside for a faster fix.'}
        </div>

        {/* Action Buttons Row (SOS, I'm safe, Message) */}
        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {/* btnSos */}
          <button
            id="btn-sos"
            onClick={() => setShowSosDialog(true)}
            className="h-[52px] rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-[15px] shadow-lg shadow-red-500/25 active:scale-95 transition-all flex items-center justify-center tracking-wide"
          >
            SOS
          </button>

          {/* btnSafe */}
          <button
            id="btn-safe"
            onClick={handleSendSafe}
            className="h-[52px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-[15px] shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center tracking-wide"
          >
            I'm safe
          </button>

          {/* btnQuestion (Message) */}
          <button
            id="btn-message"
            onClick={() => setShowMessageDialog(true)}
            className="h-[52px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-[15px] shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center tracking-wide"
          >
            Message
          </button>
        </div>

        {/* Mesh Activity Expandable Terminal */}
        <div className="mt-3">
          <button
            id="btn-mesh-activity-toggle"
            onClick={() => setLogExpanded(!logExpanded)}
            className="text-[13px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <span>Mesh activity</span>
            <span>{logExpanded ? '▴' : '▾'}</span>
          </button>

          {logExpanded && (
            <div id="mesh-activity-terminal" className="mt-2 h-24 overflow-y-auto bg-slate-900 text-slate-200 rounded-xl p-2.5 font-mono text-[11px] leading-relaxed border border-slate-800 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className="whitespace-nowrap">
                  <span className="text-emerald-400 select-none mr-1">$</span>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- DIALOGS (Matching Android AlertDialogs) ---------- */}

      {/* 1. First Run Name Dialog (askName() in MainActivity.java) */}
      {showNameModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900">Welcome to ReliefOS</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Enter your name. People near you will see it on their map.
            </p>
            <form onSubmit={handleSaveName} className="mt-3.5 space-y-3">
              <input
                id="input-relief-name"
                type="text"
                autoFocus
                maxLength={14}
                value={tempNameInput}
                onChange={(e) => setTempNameInput(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                id="btn-save-name"
                type="submit"
                disabled={!tempNameInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. SOS Confirmation Dialog */}
      {showSosDialog && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-red-600 flex items-center gap-1.5">
              <span>⚠️</span> Send SOS?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Your SOS will be passed on through nearby phones until it reaches help.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                id="btn-cancel-sos"
                onClick={() => setShowSosDialog(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-sos"
                onClick={handleConfirmSos}
                className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-md shadow-red-500/20"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Message to Admin Dialog (askCustomMessage() with CryptoBox encryption) */}
      {showMessageDialog && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🔒</span> Message to admin
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Only the admin can read this. Phones that pass it on see only scrambled text.
            </p>
            <form onSubmit={handleSendMessage} className="mt-3 space-y-3">
              <textarea
                id="textarea-admin-msg"
                rows={3}
                autoFocus
                maxLength={200}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message for the admin..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>RSA-2048 + AES-GCM</span>
                <span>{200 - messageInput.length} left</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMessageDialog(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-send-encrypted-msg"
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-xl transition-colors shadow-md shadow-blue-500/20"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Admin PIN Dialog (toggleAdmin() in MainActivity.java, PIN: 1234) */}
      {showAdminPinModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>⚡</span> Admin mode
            </h3>
            <p className="text-xs text-slate-500 mt-1">Enter Master Admin PIN to decrypt private messages.</p>
            <form onSubmit={handleUnlockAdmin} className="mt-3 space-y-3">
              <input
                id="input-admin-pin"
                type="password"
                autoFocus
                maxLength={8}
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Admin PIN (1234)"
                className="w-full px-3 py-2 text-center tracking-widest text-base font-bold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPinModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-unlock-admin"
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-md shadow-amber-500/20"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Admin Inbox Dialog (showInbox() in MainActivity.java) */}
      {showAdminInbox && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[80vh]">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>📬</span> Admin inbox
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Messages decrypted with Admin Private Key ({privateBox.length} total)
            </p>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {privateBox.length === 0 ? (
                <div className="text-slate-400 py-6 text-center italic">No private messages yet.</div>
              ) : (
                privateBox.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                      <span>• {p.name}</span>
                      <span className="text-slate-400">({p.hops} hops)</span>
                    </div>
                    <div className="mt-1 text-slate-800 font-medium">
                      {mockDecryptAsAdmin(p.text)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
              <button
                id="btn-close-admin-inbox"
                onClick={() => setShowAdminInbox(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. People Nearby Dialog (showNearbyDialog() in MainActivity.java) */}
      {showNearbyModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>👥</span> People nearby
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Detected via BLE P2P mesh cluster</p>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto text-xs">
              {nearbyPeers.length === 0 ? (
                <div className="text-slate-400 py-4 italic text-center">
                  No one nearby yet. Make sure the other phone has the app open.
                </div>
              ) : (
                nearbyPeers.map((peer) => {
                  const dist = calculateDistanceAndBearing(
                    userLoc.lat,
                    userLoc.lng,
                    peer.lat,
                    peer.lng
                  );
                  return (
                    <div
                      key={peer.id}
                      className="flex justify-between items-center p-2 rounded-lg bg-slate-50 border border-slate-100 font-medium"
                    >
                      <span className="text-slate-800">• {peer.name}</span>
                      <span className="text-blue-600 font-bold">~{dist.text}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex justify-end">
              <button
                id="btn-close-nearby-modal"
                onClick={() => setShowNearbyModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
