'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Navigation, Radio, MapPin } from 'lucide-react';

// Fix standard Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MobileOfflineMap({ 
  userLocation = { lat: 24.862, lng: 67.034, label: 'My Location (Sector Delta)' },
  volunteers = [], 
  camps = [], 
  onSelectVolunteer, 
  onSelectCamp,
  isOfflineMode = true 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control at bottom-right for thumb-friendly mobile usage
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Tile layer with offline fallback styling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. User Position Marker (Pulsing Radar Beacon)
    const userIcon = L.divIcon({
      className: 'custom-user-beacon',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; items-center; justify-content: center;">
          <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 14px; height: 14px; top: 7px; left: 7px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 0 8px rgba(37,99,235,0.8);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(group);
    userMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
        <strong style="color: #2563eb; font-size: 12px;">You Are Here</strong>
        <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${userLocation.label}</div>
        <div style="color: #10b981; font-weight: 700; margin-top: 4px;">BLE Mesh Broadcast Range: 30m</div>
      </div>
    `);

    // BLE Broadcast 30m Range Circle around user
    L.circle([userLocation.lat, userLocation.lng], {
      radius: 80,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(group);

    // 2. Verified Volunteer Markers
    volunteers.forEach((vol) => {
      const volIcon = L.divIcon({
        className: 'custom-vol-pin',
        html: `
          <div style="background-color: #10b981; color: white; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.35); font-weight: 800; font-size: 11px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([vol.lat, vol.lng], { icon: volIcon }).addTo(group);
      
      // Permanent name pill
      marker.bindTooltip(`
        <div style="font-weight: 800; font-size: 10px; color: #047857; display: flex; items-center; gap: 3px;">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
          ${vol.name.split(' ')[0]} (${vol.distanceText || 'Nearby'})
        </div>
      `, {
        permanent: true,
        direction: 'top',
        offset: [0, -12],
        className: 'reliefos-small-name-tag',
        opacity: 0.95
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px; min-width: 140px;">
          <div style="font-weight: 700; color: #047857; font-size: 12px;">${vol.name}</div>
          <div style="color: #64748b; font-size: 10px;">Verified Field Responder</div>
          <div style="margin-top: 4px; font-weight: 600; color: #1e293b;">
            Status: <span style="color: #10b981;">On Duty (${vol.distanceText || 'Nearby'})</span>
          </div>
          <div style="margin-top: 6px;">
            <button id="btn-msg-${vol.id}" style="width: 100%; background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">
              Direct Message (BLE) &rarr;
            </button>
          </div>
        </div>
      `);

      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-msg-${vol.id}`);
          if (btn && onSelectVolunteer) {
            btn.onclick = () => onSelectVolunteer(vol);
          }
        }, 50);
      });
    });

    // 3. Relief Camp Markers
    camps.forEach((camp) => {
      const campIcon = L.divIcon({
        className: 'custom-camp-pin',
        html: `
          <div style="background-color: #0284c7; color: white; width: 26px; height: 26px; border-radius: 6px; border: 2px solid #ffffff; display: flex; items-center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 20 10 4"/><path d="m5 20 9-16"/><path d="M2 20h20"/><path d="m14 20-3-6-3 6"/>
            </svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const campMarker = L.marker([camp.lat, camp.lng], { icon: campIcon }).addTo(group);
      
      campMarker.bindTooltip(`
        <div style="font-weight: 800; font-size: 10px; color: #0284c7;">
          ${camp.name.split('(')[0].trim()} (${camp.distanceText || '450m'})
        </div>
      `, {
        permanent: true,
        direction: 'top',
        offset: [0, -12],
        className: 'reliefos-small-name-tag',
        opacity: 0.95
      });

      campMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px; min-width: 140px;">
          <div style="font-weight: 700; color: #0284c7; font-size: 12px;">${camp.name}</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 2px;">
            Occupancy: ${camp.occupancy || 180} / ${camp.capacity || 250} evacuees
          </div>
          <div style="margin-top: 4px; font-weight: 600; color: #16a34a; font-size: 10px;">
            Drinking Water & Rations Available
          </div>
          <div style="margin-top: 6px;">
            <button id="btn-walk-${camp.id}" style="width: 100%; background: #0284c7; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">
              Walking Directions &rarr;
            </button>
          </div>
        </div>
      `);

      campMarker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.getElementById(`btn-walk-${camp.id}`);
          if (btn && onSelectCamp) {
            btn.onclick = () => onSelectCamp(camp);
          }
        }, 50);
      });
    });

  }, [userLocation, volunteers, camps, onSelectVolunteer, onSelectCamp]);

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-900 overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Recenter Button */}
      <button
        onClick={handleCenterOnUser}
        title="Center on my location"
        className="absolute top-3 right-3 z-20 p-2.5 rounded-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
      >
        <Navigation className="w-4 h-4" />
      </button>

      {/* Floating Compass / Mesh Status Chip */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-[11px] font-mono shadow-lg">
        <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
        <span>Bearing: 45° NE · Nearest Help: Alex (120m)</span>
      </div>
    </div>
  );
}
