import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useAppStore } from '../store/index.jsx';
import ScoreGauge from '../components/ScoreGauge.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SuggestedChip from '../components/SuggestedChip.jsx';
import LowConfidenceBanner from '../components/LowConfidenceBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

// Fix Leaflet icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const campIcon = L.divIcon({
  className: 'custom-camp-pin',
  html: `
    <div style="
      background-color: #0284C7;
      color: white;
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">
      <div style="transform: rotate(45deg); font-size: 11px;">🏕️</div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
});

export default function AreaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    areas,
    camps,
    volunteers,
    duties,
    reports,
    sendFieldTeam,
    updateAreaVerification,
    addReport,
  } = useAppStore();

  const area = areas.find((a) => a.id === id);

  // Modal states
  const [isFieldTeamModalOpen, setIsFieldTeamModalOpen] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState(['v-02']);
  const [fieldTeamNote, setFieldTeamNote] = useState('Check road access first, verify flood levels');

  const [verificationModalAction, setVerificationModalAction] = useState(null); // 'confirmed' | 'rejected' | 'verified_safe'
  const [verificationNote, setVerificationNote] = useState('');

  // Quick report form
  const [newReportText, setNewReportText] = useState('');

  if (!area) {
    return (
      <div className="py-8">
        <EmptyState
          title="Area Sector Not Found"
          description={`No operational sector found with identifier "${id}".`}
          actionText="Return to Dashboard"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  const areaReports = reports.filter((r) => r.areaId === area.id);
  const areaDuties = duties.filter(
    (d) => d.toAreaOrCampId === area.id || d.fromCampId === area.id
  );

  const baselineRate = 0.16;
  const expectedReports = (
    area.population *
    area.vulnerableShare *
    area.hazardSeverity *
    baselineRate
  ).toFixed(1);
  const silenceRatio = Math.max(
    0,
    1 - area.actualReports / (parseFloat(expectedReports) || 1)
  );
  const vulnerableCount = Math.round(area.population * area.vulnerableShare);

  const isDarkZone = Boolean(area.assessment?.isDarkZone);
  const areaColor = isDarkZone ? '#7C3AED' : area.hazardSeverity >= 0.7 ? '#EF4444' : '#10B981';

  // Handle Send Field Team submission
  const handleDeployFieldTeam = () => {
    if (selectedVolunteers.length === 0) return;
    sendFieldTeam(area.id, selectedVolunteers, fieldTeamNote);
    setIsFieldTeamModalOpen(false);
  };

  // Handle Verification outcome confirmation
  const handleConfirmVerification = () => {
    if (!verificationModalAction) return;
    updateAreaVerification(area.id, verificationModalAction, verificationNote);
    setVerificationModalAction(null);
    setVerificationNote('');
  };

  // Handle Quick report submit
  const handleAddReport = (e) => {
    e.preventDefault();
    if (!newReportText.trim()) return;

    addReport({
      areaId: area.id,
      text: newReportText,
      source: 'volunteer',
      extracted: {
        age: newReportText.toLowerCase().includes('elderly') ? 'elderly' : newReportText.toLowerCase().includes('child') ? 'children' : null,
        mobilityIssue: newReportText.toLowerCase().includes('stuck') || newReportText.toLowerCase().includes('walk'),
        hazard: 'flood',
        urgency: 'high',
        assistanceNeeded: 'evacuation and medical',
      },
    });

    setNewReportText('');
  };

  const availableVolunteers = volunteers.filter(
    (v) => v.status === 'available' || v.status === 'on_duty'
  );

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="hover:text-slate-800 font-medium">Dashboard</Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Area Detail</span>
          <span>/</span>
          <span className="font-mono text-slate-600 font-bold uppercase">{area.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <SuggestedChip text="Automated Assessment" />
        </div>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-black text-[#0F172A]">{area.name}</h1>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                {area.id}
              </span>
              <StatusBadge status={area.verification || 'none'} />
              {isDarkZone && (
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                  Potential Dark Zone
                </span>
              )}
            </div>

            <p className="mt-1.5 text-xs text-slate-500">
              Coordinates: <strong className="text-slate-700 font-mono">{area.lat}, {area.lng}</strong> •
              Data Quality: <span className="font-semibold capitalize text-slate-700">{area.dataQuality}</span> •
              Last sitrep: <span className="font-mono text-slate-600">{area.lastReportAt || 'N/A'}</span>
            </p>

            {area.verificationNote && (
              <div className="mt-2 text-xs text-purple-900 bg-purple-50/80 border border-purple-200 rounded-lg p-2.5">
                <strong>Verification Log:</strong> {area.verificationNote}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ScoreGauge score={area.assessment?.score} label="Dark Zone Score" />
            <SuggestedChip text="Suggested" />
          </div>
        </div>

        {/* Low Confidence Banner when dataQuality is partial or missing */}
        {(area.dataQuality === 'partial' || area.dataQuality === 'missing') && (
          <div className="mt-5">
            <LowConfidenceBanner
              detail={`Data quality flagged as "${area.dataQuality}". Ground-truth field verification recommended before auto-allocations.`}
            />
          </div>
        )}

        {/* 6 Key Telemetry Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 text-xs">
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Population</span>
            <div className="mt-1 text-lg font-bold text-[#0F172A]">{area.population.toLocaleString()}</div>
            <span className="text-[10px] text-slate-400">Total residents</span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Vulnerable Share</span>
            <div className="mt-1 text-lg font-bold text-[#0F172A]">{Math.round(area.vulnerableShare * 100)}%</div>
            <span className="text-[10px] text-slate-400">~{vulnerableCount} people at risk</span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Hazard Severity</span>
            <div className="mt-1 text-lg font-bold text-[#0F172A]">{area.hazardSeverity} / 1.0</div>
            <span className="text-[10px] text-slate-400">{area.hazardSeverity >= 0.7 ? 'Severe flood risk' : 'Moderate'}</span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Network Outage</span>
            <div className="mt-1 text-lg font-bold text-rose-600">{Math.round(area.networkFailure * 100)}% Down</div>
            <span className="text-[10px] text-slate-400">Cell & gateway loss</span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Expected Reports</span>
            <div className="mt-1 text-lg font-bold text-[#0F172A]">~{expectedReports}</div>
            <span className="text-[10px] text-slate-400">Baseline rate: 0.16</span>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <span className="text-[11px] font-semibold uppercase text-slate-500">Silence Ratio</span>
            <div className="mt-1 text-lg font-bold text-purple-700">{Math.round(silenceRatio * 100)}%</div>
            <span className="text-[10px] text-slate-400">{area.actualReports} received</span>
          </div>
        </div>

        {/* Why Flagged Checklist & recharts BarChart Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* "Why flagged" checklist with tick/cross */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Why Flagged
              </h4>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isDarkZone ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
                {isDarkZone ? 'Potential Dark Zone' : 'Standard Monitoring'}
              </span>
            </div>

            {/* Three Flag Conditions */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${silenceRatio >= 0.6 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {silenceRatio >= 0.6 ? '✓' : '✗'}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">Condition 1: Silence Ratio ≥ 0.60</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Current silence ratio: <strong>{(silenceRatio * 100).toFixed(0)}%</strong> ({area.actualReports} actual vs ~{expectedReports} expected)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${area.hazardSeverity >= 0.6 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {area.hazardSeverity >= 0.6 ? '✓' : '✗'}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">Condition 2: Hazard Severity ≥ 0.60</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Current severity index: <strong>{area.hazardSeverity}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200 shadow-2xs">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${(area.vulnerableShare >= 0.25 || area.networkFailure >= 0.5) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {(area.vulnerableShare >= 0.25 || area.networkFailure >= 0.5) ? '✓' : '✗'}
                </span>
                <div>
                  <span className="font-semibold text-slate-800">Condition 3: Vulnerable Share ≥ 25% OR Network Failure ≥ 50%</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vulnerable: <strong>{Math.round(area.vulnerableShare * 100)}%</strong> • Network failure: <strong>{Math.round(area.networkFailure * 100)}%</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Reasons lines */}
            {area.assessment?.reasons && area.assessment.reasons.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Detailed Reasons
                </div>
                <ul className="space-y-1 text-xs text-slate-700">
                  {area.assessment.reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* recharts BarChart: Expected vs actual reports (2 bars) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Expected vs actual reports
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Gap: {Math.max(0, Math.round(parseFloat(expectedReports) - area.actualReports))} reports
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">
                Comparison of statistical report expectation versus verified incoming sitreps
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Expected reports', count: parseFloat(expectedReports) || 0, fill: '#0284C7' },
                    { name: 'Actual reports', count: area.actualReports || 0, fill: '#EF4444' },
                  ]}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                    }}
                    formatter={(val) => [`${val} reports`, 'Volume']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    <Cell fill="#0284C7" />
                    <Cell fill="#EF4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Human-in-the-Loop Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4">
          <div className="text-xs text-slate-500">
            Current Status: <strong className="text-slate-800 capitalize">{area.verification || 'none'}</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setVerificationModalAction('verified_safe');
                setVerificationNote('Direct radio contact established, sector verified stable.');
              }}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Mark Verified Safe
            </button>

            <button
              type="button"
              onClick={() => {
                setVerificationModalAction('rejected');
                setVerificationNote('Field team report confirmed false positive.');
              }}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Reject Dark Zone
            </button>

            <button
              type="button"
              onClick={() => {
                setVerificationModalAction('confirmed');
                setVerificationNote('Ground team confirmed high vulnerability and acute shortages.');
              }}
              className="rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 text-xs font-bold text-purple-800 transition-colors shadow-2xs"
            >
              Confirm Dark Zone (+15 Urgency)
            </button>

            <button
              type="button"
              onClick={() => setIsFieldTeamModalOpen(true)}
              className="rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors"
            >
              Send Field Team →
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Mini Map + Verification Duties */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sector Mini Map */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-[#0F172A] mb-2">Sector Geographic Perimeter</h3>
          <p className="text-xs text-slate-500 mb-3">Live map showing impact radius and adjacent support camps</p>
          <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200">
            <MapContainer
              center={[area.lat, area.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Circle
                center={[area.lat, area.lng]}
                radius={2000}
                pathOptions={{
                  color: areaColor,
                  fillColor: areaColor,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans">
                    <strong>{area.name}</strong> ({area.id})<br />
                    Population: {area.population}
                  </div>
                </Popup>
              </Circle>

              {camps.map((camp) => (
                <Marker key={camp.id} position={[camp.lat, camp.lng]} icon={campIcon}>
                  <Popup>
                    <div className="text-xs p-1 font-sans">
                      <strong>{camp.name}</strong><br />
                      Occupancy: {camp.occupancy} / {camp.capacity}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Assigned Duties / Verification Activity */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-[#0F172A] mb-2">Field Verification Duties ({areaDuties.length})</h3>
          <p className="text-xs text-slate-500 mb-3">Active volunteer missions and dispatched field surveys</p>

          {areaDuties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              No field duties currently dispatched for this sector. Click "Send Field Team" to assign responders.
            </div>
          ) : (
            <div className="space-y-2.5">
              {areaDuties.map((duty) => {
                const vol = volunteers.find((v) => v.id === duty.volunteerId);

                return (
                  <div
                    key={duty.id}
                    className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0F172A] capitalize">{duty.type} Mission</span>
                        <span className="font-mono text-slate-400">[{duty.id}]</span>
                        <StatusBadge status={duty.status} size="sm" />
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        Assigned to: <strong className="text-slate-800">{vol?.name || duty.volunteerId}</strong>
                        {duty.note && ` — Note: ${duty.note}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Incident Reports Feed & Submission */}
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Sector Incident Reports ({areaReports.length})</h3>
            <p className="text-xs text-slate-500">Incoming sitreps and triage extractions</p>
          </div>
        </div>

        {/* Quick Report Add */}
        <form onSubmit={handleAddReport} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newReportText}
            onChange={(e) => setNewReportText(e.target.value)}
            placeholder={`Log emergency sitrep for ${area.name}... (e.g. 5 elderly residents stranded)`}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition-colors shadow-xs"
          >
            Submit Sitrep
          </button>
        </form>

        {areaReports.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            No incident reports recorded yet for {area.name}.
          </p>
        ) : (
          <div className="space-y-3">
            {areaReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-600">[{r.id}]</span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 capitalize">
                      via {r.source}
                    </span>
                    <SuggestedChip text="Extracted" />
                  </div>
                  <StatusBadge status={r.extracted?.urgency || 'moderate'} size="sm" />
                </div>
                <p className="text-sm font-medium text-slate-900 mb-2">{r.text}</p>

                {r.extracted && (
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    {r.extracted.age && (
                      <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                        Demographic: <strong className="text-slate-800 capitalize">{r.extracted.age}</strong>
                      </span>
                    )}
                    {r.extracted.mobilityIssue && (
                      <span className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 border border-rose-200">
                        Mobility Impaired
                      </span>
                    )}
                    {r.extracted.assistanceNeeded && (
                      <span className="rounded bg-sky-50 text-sky-700 px-2 py-0.5 border border-sky-200">
                        Needed: {r.extracted.assistanceNeeded}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Send Field Team */}
      <ConfirmDialog
        isOpen={isFieldTeamModalOpen}
        title={`Deploy Verification Team to ${area.name}`}
        description="Select available volunteers to survey the sector and confirm ground truth."
        confirmText="Deploy Field Team"
        confirmVariant="danger"
        onConfirm={handleDeployFieldTeam}
        onCancel={() => setIsFieldTeamModalOpen(false)}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Volunteer(s):</label>
            <select
              multiple
              value={selectedVolunteers}
              onChange={(e) =>
                setSelectedVolunteers(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              className="w-full h-24 rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            >
              {availableVolunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.status}) — Skills: {v.skills.join(', ')}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400">Hold Ctrl / Cmd to select multiple responders</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deployment Mission Brief / Note:</label>
            <input
              type="text"
              value={fieldTeamNote}
              onChange={(e) => setFieldTeamNote(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </ConfirmDialog>

      {/* Modal: Confirm / Reject / Mark Verified Safe */}
      <ConfirmDialog
        isOpen={Boolean(verificationModalAction)}
        title={
          verificationModalAction === 'confirmed'
            ? `Confirm ${area.name} as Dark Zone`
            : verificationModalAction === 'verified_safe'
            ? `Mark ${area.name} Verified Safe`
            : `Reject Dark Zone Flag for ${area.name}`
        }
        description={
          verificationModalAction === 'confirmed'
            ? 'Confirming raises the area urgency by +15 points in the unified priority queue.'
            : 'This will remove the area from the high-urgency Silent Risk queue.'
        }
        confirmText="Confirm Status Change"
        confirmVariant={verificationModalAction === 'confirmed' ? 'warning' : 'primary'}
        onConfirm={handleConfirmVerification}
        onCancel={() => setVerificationModalAction(null)}
      >
        <div className="mt-3 text-xs">
          <label className="block font-semibold text-slate-700 mb-1">Verification Note / Ground Evidence:</label>
          <input
            type="text"
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </ConfirmDialog>

      {/* Footer text */}
      <div className="py-4 text-center text-xs text-slate-400 font-medium border-t border-[#E2E8F0]">
        Weights are our assumptions, not validated.
      </div>
    </div>
  );
}
