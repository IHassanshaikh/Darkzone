'use client';

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, Tent } from 'lucide-react';

// Fix standard Leaflet default icon paths in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function CommandMap({ areas = [], camps = [], onSelectArea }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center roughly around Karachi disaster coordinates (24.86, 67.03)
      const map = L.map(mapContainerRef.current, {
        center: [24.855, 67.03],
        zoom: 12,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const group = layersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // Plot Areas (Circle polygons & markers)
    areas.forEach((area) => {
      const isDarkZone = area.assessment ? area.assessment.isDarkZone : area.id === 'area-c';
      const isHighRisk = area.assessment ? area.assessment.score >= 50 : area.hazardSeverity >= 0.5;

      const color = isDarkZone ? '#d946ef' : isHighRisk ? '#ef4444' : '#10b981';
      const fillColor = isDarkZone ? '#a21caf' : isHighRisk ? '#dc2626' : '#16a34a';

      // Area boundary circle
      const circle = L.circle([area.lat, area.lng], {
        color: color,
        fillColor: fillColor,
        fillOpacity: isDarkZone ? 0.45 : 0.25,
        radius: isDarkZone ? 1800 : 1400,
        weight: isDarkZone ? 3 : 2,
        dashArray: isDarkZone ? '6, 6' : null
      });

      // Small Name Tooltip (Shows by default)
      const areaTooltipContent = `
        <div style="display: flex; align-items: center; gap: 4px; font-weight: 800; font-size: 11px; white-space: nowrap;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${color}; display: inline-block; flex-shrink: 0;"></span>
          <span style="color: ${color};">${area.name}</span>
          ${isDarkZone ? '<span style="font-size: 8px; font-weight: 800; background: #a21caf; color: #ffffff; padding: 1px 4px; border-radius: 3px; margin-left: 2px;">DARK ZONE</span>' : ''}
        </div>
      `;

      // Bind permanent small tooltip with name showing by default
      circle.bindTooltip(areaTooltipContent, {
        permanent: true,
        interactive: true,
        direction: 'center',
        className: 'reliefos-small-name-tag',
        opacity: 0.95
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; color: inherit;">
          <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: ${color};">
            ${area.name}
          </div>
          <div style="margin-bottom: 6px; font-weight: 600;">
            ${isDarkZone ? 'POTENTIAL DARK ZONE' : isHighRisk ? 'HIGH RISK SECTOR' : 'NORMAL SECTOR'}
          </div>
          <div>Pop: ${area.population} | Hazard: ${area.hazardSeverity}</div>
          <div>Actual Reports: ${area.actualReports || 0}</div>
          <div style="margin-top: 8px;">
            <a href="/areas/${area.id}" style="display: inline-block; padding: 4px 8px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: 600;">
              Inspect Area Detail &rarr;
            </a>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.on('click', () => {
        if (onSelectArea) onSelectArea(area);
      });

      group.addLayer(circle);

      // Solid operational marker for Dark Zone center
      if (isDarkZone) {
        const darkIcon = L.divIcon({
          className: 'custom-dark-marker',
          html: `<div style="background-color: #4f46e5; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white;"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        const marker = L.marker([area.lat, area.lng], { icon: darkIcon });
        marker.bindPopup(popupContent);
        group.addLayer(marker);
      }
    });

    // Plot Camps (Pins)
    camps.forEach((camp) => {
      const campIcon = L.divIcon({
        className: 'custom-camp-marker',
        html: `<div style="background-color: #0284c7; width: 22px; height: 22px; border-radius: 6px; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20 10 4"/><path d="m5 20 9-16"/><path d="M2 20h20"/><path d="m14 20-3-6-3 6"/></svg></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const campMarker = L.marker([camp.lat, camp.lng], { icon: campIcon });
      const hasShortage = (camp.items || []).some(i => i.need > i.stock);
      const occupancyPct = camp.capacity ? Math.round((camp.occupancy / camp.capacity) * 100) : 0;

      // Small Name Tooltip (Shows by default above marker)
      const campTooltipContent = `
        <div style="display: flex; align-items: center; gap: 5px; font-weight: 800; font-size: 11px; white-space: nowrap;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 20 10 4"/><path d="m5 20 9-16"/><path d="M2 20h20"/><path d="m14 20-3-6-3 6"/></svg>
          <span>${camp.name.split('(')[0].trim()}</span>
          ${hasShortage ? '<span style="font-size: 8px; font-weight: 800; background: #dc2626; color: #ffffff; padding: 1px 4px; border-radius: 3px;">SHORTAGE</span>' : ''}
        </div>
      `;

      // Bind permanent small tooltip with name showing by default
      campMarker.bindTooltip(campTooltipContent, {
        permanent: true,
        interactive: true,
        direction: 'top',
        offset: [0, -14],
        className: 'reliefos-small-name-tag',
        opacity: 0.95
      });

      campMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: inherit;">
          <div style="font-weight: 700; font-size: 13px; color: #0284c7;">${camp.name}</div>
          <div>Occupancy: ${camp.occupancy || 0} / ${camp.capacity || 0} (${occupancyPct}%)</div>
          <div style="color: ${hasShortage ? '#dc2626' : '#16a34a'}; font-weight: 600; margin-top: 3px;">
            ${hasShortage ? 'Critical Shortage Reported' : 'Stock Stable'}
          </div>
          <div style="margin-top: 6px;">
            <a href="/resources" style="color: #2563eb; text-decoration: underline; font-size: 11px; font-weight: 600;">
              View Stock Levels &rarr;
            </a>
          </div>
        </div>
      `);
      group.addLayer(campMarker);
    });

    return () => {
      // Keep map instance alive across rerenders
    };
  }, [areas, camps]);

  return (
    <div className="relative w-full h-[450px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Floating Overlay (Solid White / Dark Slate) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-lg pointer-events-auto">
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
            Map Legend
          </span>
          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
            Names Visible
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 border border-white shadow-sm flex items-center justify-center text-white">
            <Zap className="w-2.5 h-2.5 text-white fill-white" />
          </span>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Potential Dark Zone (Area C)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
          <span className="text-slate-700 dark:text-slate-300">High Risk Sector</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
          <span className="text-slate-700 dark:text-slate-300">Normal / Monitored Area</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-sky-600 border border-white flex items-center justify-center text-white">
            <Tent className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-slate-700 dark:text-slate-300">Relief Camp / Depot</span>
        </div>
      </div>
    </div>
  );
}
