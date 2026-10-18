import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Vite asset bundling for default Leaflet markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom camp marker pin icon in forest green #2F4A2B
const campIcon = L.divIcon({
  className: 'custom-camp-pin',
  html: `
    <div style="
      background-color: #2F4A2B;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #FFFDF7;
      box-shadow: 0 2px 6px rgba(28,42,31,0.3);
    ">
      <div style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">🏕️</div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

export default function DashboardMap({ areas = [], camps = [] }) {
  // Center coordinates around Karachi / seed scenario
  const defaultCenter = [24.88, 67.05];
  const defaultZoom = 12;

  const getAreaColor = (area) => {
    if (area.assessment?.isDarkZone) {
      return {
        stroke: '#7C3AED',
        fill: '#7C3AED',
        label: 'Dark Zone (Silent Risk)',
        isDarkZone: true,
      };
    }
    if ((area.hazardSeverity || 0) >= 0.7 || (area.actualReports || 0) > 6) {
      return { stroke: '#DC2626', fill: '#DC2626', label: 'High Risk', isDarkZone: false };
    }
    return { stroke: '#16A34A', fill: '#16A34A', label: 'Safe / Monitored', isDarkZone: false };
  };

  return (
    <div className="relative overflow-hidden rounded-[12px] border border-[#E4DFD0] bg-[#FFFDF7] shadow-[0_1px_3px_rgba(28,42,31,0.04)]">
      {/* Map Header & Legend */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E4DFD0] p-4 bg-[#F6F3EA]/70">
        <div>
          <h3 className="text-base font-bold font-heading text-[#1C2A1F]">Disaster Sector & Camp Map</h3>
          <p className="text-xs text-[#5F6B5E]">Live geographic distribution of impact zones and relief camps</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#5F6B5E] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#F5F3FF] border-2 border-dashed border-[#7C3AED]" />
            <span className="font-semibold text-[#7C3AED]">Dark Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEE2E2] border border-[#DC2626]" />
            <span>High Risk (Red)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DCFCE7] border border-[#16A34A]" />
            <span>Safe (Green)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🏕️</span>
            <span>Relief Camp</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="h-[440px] w-full z-10">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Area Circles (Green / Red / Purple) */}
          {areas.map((area) => {
            const colors = getAreaColor(area);
            const radius = 1800 + (area.population || 800) * 0.8;

            return (
              <Circle
                key={area.id}
                center={[area.lat, area.lng]}
                radius={radius}
                pathOptions={{
                  color: colors.stroke,
                  fillColor: colors.fill,
                  fillOpacity: colors.isDarkZone ? 0.22 : 0.18,
                  weight: colors.isDarkZone ? 2.5 : 2,
                  dashArray: colors.isDarkZone ? '6, 8' : undefined,
                  className: colors.isDarkZone ? 'pulse-darkzone' : undefined,
                }}
              >
                {colors.isDarkZone && (
                  <Tooltip direction="top" opacity={0.95}>
                    <span className="text-xs font-bold text-[#7C3AED]">
                      Potential Dark Zone · Silence ratio ≥ 0.6
                    </span>
                  </Tooltip>
                )}
                <Popup>
                  <div className="p-1 text-[#1C2A1F] font-sans">
                    <div className="flex items-center gap-1.5 mb-1">
                      <strong className="text-sm font-bold font-heading text-[#1C2A1F]">{area.name}</strong>
                      <span className="rounded bg-[#F6F3EA] px-1 py-0.5 text-xs font-mono text-[#5F6B5E] border border-[#E4DFD0]">
                        {area.id}
                      </span>
                    </div>
                    {colors.isDarkZone && (
                      <div className="mb-1.5 inline-block rounded-full bg-[#F5F3FF] border border-[#A78BFA] px-2 py-0.5 text-[11px] font-bold text-[#7C3AED]">
                        Potential Dark Zone · Silence ratio ≥ 0.6
                      </div>
                    )}
                    <div className="text-xs space-y-0.5 text-[#5F6B5E]">
                      <div>Status: <span className="font-semibold" style={{ color: colors.stroke }}>{colors.label}</span></div>
                      <div>Population: <strong className="text-[#1C2A1F] tabular-nums">{area.population}</strong></div>
                      <div>Reports: <strong className="text-[#1C2A1F] tabular-nums">{area.actualReports}</strong> (Hazard: {area.hazardSeverity})</div>
                    </div>
                    <div className="mt-2.5 border-t border-[#E4DFD0] pt-2">
                      <Link
                        to={`/areas/${area.id}`}
                        className="inline-block w-full text-center rounded-lg bg-[#2F4A2B] hover:bg-[#243A21] px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Circle>
            );
          })}

          {/* Camp Pins */}
          {camps.map((camp) => (
            <Marker
              key={camp.id}
              position={[camp.lat, camp.lng]}
              icon={campIcon}
            >
              <Popup>
                <div className="p-1 text-[#1C2A1F] font-sans">
                  <div className="font-bold font-heading text-sm text-[#1C2A1F]">{camp.name}</div>
                  <div className="text-xs text-[#5F6B5E] mt-0.5">
                    Occupancy: <strong className="text-[#1C2A1F] tabular-nums">{camp.occupancy} / {camp.capacity}</strong>
                  </div>
                  <div className="mt-1 text-xs text-[#5F6B5E]">
                    Water: <strong className="text-[#1C2A1F] tabular-nums">{(camp.stock || {}).water || 0}</strong> | Food: <strong className="text-[#1C2A1F] tabular-nums">{(camp.stock || {}).food || 0}</strong>
                  </div>
                  <div className="mt-2 border-t border-[#E4DFD0] pt-1.5">
                    <Link
                      to="/resources"
                      className="text-xs font-semibold text-[#2F4A2B] hover:underline"
                    >
                      View camp stock →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
