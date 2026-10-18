/**
 * ReliefOS + DARK ZONE: REST API Server (Node.js + Express)
 * Implements System Architecture & Backend Handoff Contract under /api/v1
 * Supports mobile app endpoints: GET /api/v1/safe-zones and POST /api/v1/reports/batch
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { evaluateDarkZone } from '../src/shared/darkZone.js';
import { computePriorityList } from '../src/shared/priority.js';
import { generateAllocationSuggestions, haversineDistance } from '../src/shared/allocation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// ----------------- In-Memory Database (Seeded from JSON) ----------------- //

function loadSeed(filename) {
  const filePath = path.join(__dirname, '..', 'src', 'data', 'mock', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

let areas = loadSeed('areas.json');
let camps = loadSeed('camps.json');
let volunteers = loadSeed('volunteers.json');
let duties = loadSeed('duties.json');
let reports = loadSeed('reports.json');
let syncLedger = new Set();
let activityLog = [
  { id: 1, kind: 'system', message: 'ReliefOS REST backend initialized.', timestamp: new Date().toISOString(), label: null },
  { id: 2, kind: 'dark_zone', message: 'Potential Dark Zone flagged in Delta Sector 9 (Area C) based on 98% reporting silence.', timestamp: new Date().toISOString(), label: 'Suggested' },
  { id: 3, kind: 'shortage', message: 'Critical water shortage detected at Camp B (Coastal School). Deficit: 160L.', timestamp: new Date().toISOString(), label: 'Suggested' }
];

function logActivity(kind, message, label = 'Suggested') {
  activityLog.unshift({
    id: Date.now(),
    kind,
    message,
    timestamp: new Date().toISOString(),
    label
  });
  if (activityLog.length > 50) activityLog.pop();
}

// ----------------- Standard Envelope Helpers ----------------- //

function success(res, data, meta = {}, status = 200) {
  return res.status(status).json({ data, meta });
}

function error(res, code, message, status = 400) {
  return res.status(status).json({ error: { code, message } });
}

// ----------------- Routes: /api/v1 ----------------- //

// 1. Health Check
app.get('/api/v1/health', (req, res) => {
  return res.json({
    status: 'ok',
    healthy: true,
    service: 'ReliefOS + DARK ZONE Engine',
    timestamp: new Date().toISOString()
  });
});

// 2. Areas
app.get('/api/v1/areas', (req, res) => {
  const results = areas.map(a => ({
    ...a,
    assessment: evaluateDarkZone(a)
  }));
  return success(res, results);
});

app.get('/api/v1/areas/:id', (req, res) => {
  const area = areas.find(a => a.id === req.params.id);
  if (!area) return error(res, 'NOT_FOUND', `Area ${req.params.id} not found`, 404);
  return success(res, {
    ...area,
    assessment: evaluateDarkZone(area)
  });
});

app.post('/api/v1/areas/:id/field-team', (req, res) => {
  const { volunteerIds = [] } = req.body;
  const area = areas.find(a => a.id === req.params.id);
  if (!area) return error(res, 'NOT_FOUND', 'Area not found', 404);

  area.verification = 'team_sent';

  volunteerIds.forEach(vId => {
    const vol = volunteers.find(v => v.id === vId);
    if (vol) {
      vol.status = 'on_duty';
      vol.availability = false;
    }
    duties.push({
      id: `duty-field-${Date.now()}-${vId}`,
      volunteerId: vId,
      volunteerName: vol ? vol.name : 'Volunteer Team',
      type: 'verification',
      fromCampId: 'camp-a',
      toType: 'area',
      toId: area.id,
      toName: area.name,
      status: 'assigned',
      instructions: `Verification scout deployment to ${area.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  logActivity('field_team', `Field team dispatched to ${area.name}. Status updated to team_sent.`);
  return success(res, { area, assessment: evaluateDarkZone(area) });
});

app.post('/api/v1/areas/:id/verification', (req, res) => {
  const { outcome, note = '' } = req.body;
  const validOutcomes = ['team_sent', 'confirmed', 'rejected', 'verified_safe'];
  if (!validOutcomes.includes(outcome)) {
    return error(res, 'INVALID_OUTCOME', `Outcome must be one of: ${validOutcomes.join(', ')}`);
  }

  const area = areas.find(a => a.id === req.params.id);
  if (!area) return error(res, 'NOT_FOUND', 'Area not found', 404);

  area.verification = outcome;
  const msg = outcome === 'confirmed'
    ? `Ground hazards in ${area.name} CONFIRMED. Dark Zone priority elevated.`
    : outcome === 'verified_safe'
    ? `Ground inspection in ${area.name} VERIFIED SAFE. Removed from Silent Risk.`
    : `Area ${area.name} flag REJECTED by coordinator.`;

  logActivity('verification', msg);
  return success(res, { area, assessment: evaluateDarkZone(area) });
});

// 3. Camps & Safe Zones (For Mobile App Requirements)
app.get('/api/v1/camps', (req, res) => {
  return success(res, camps);
});

app.get('/api/v1/safe-zones', (req, res) => {
  const { since } = req.query;
  let list = camps;
  if (since) {
    const sinceTime = new Date(since).getTime();
    list = list.filter(c => new Date(c.updatedAt).getTime() >= sinceTime);
  }

  const responseList = list.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    capacity: c.capacity,
    occupancy: c.occupancy,
    type: c.type || 'camp',
    updatedAt: c.updatedAt || new Date().toISOString()
  }));

  return res.json(responseList);
});

app.post('/api/v1/safe-zones', (req, res) => {
  const { name, lat, lng, capacity, type } = req.body;
  if (!name || lat === undefined || lng === undefined) {
    return error(res, 'VALIDATION_ERROR', 'Name, lat, and lng are required.');
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
    return error(res, 'INVALID_COORDINATES', 'Latitude must be [-90, 90] and longitude [-180, 180]');
  }

  const newZone = {
    id: `camp-${Date.now()}`,
    name,
    lat: numLat,
    lng: numLng,
    capacity: parseInt(capacity) || 200,
    occupancy: 0,
    minReserve: 20,
    type: type || 'safe_zone',
    updatedAt: new Date().toISOString(),
    items: [
      { item: 'water', stock: 100, need: 100 },
      { item: 'food', stock: 100, need: 100 },
      { item: 'medicine', stock: 50, need: 50 },
      { item: 'relief', stock: 50, need: 50 }
    ]
  };

  camps.push(newZone);
  logActivity('safe_zone', `New Safe Zone designated: ${newZone.name}.`);
  return res.status(201).json(newZone);
});

// 4. Volunteers
app.get('/api/v1/volunteers', (req, res) => {
  return success(res, volunteers);
});

app.patch('/api/v1/volunteers/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['available', 'on_duty', 'offline'];
  if (!valid.includes(status)) return error(res, 'INVALID_STATUS', 'Invalid status');

  const vol = volunteers.find(v => v.id === req.params.id);
  if (!vol) return error(res, 'NOT_FOUND', 'Volunteer not found', 404);

  vol.status = status;
  vol.availability = status === 'available';
  return success(res, vol);
});

// 5. Duties
app.get('/api/v1/duties', (req, res) => {
  return success(res, duties);
});

app.patch('/api/v1/duties/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['assigned', 'in_progress', 'done'];
  if (!valid.includes(status)) return error(res, 'INVALID_STATUS', 'Invalid status');

  const duty = duties.find(d => d.id === req.params.id);
  if (!duty) return error(res, 'NOT_FOUND', 'Duty not found', 404);

  duty.status = status;
  duty.updatedAt = new Date().toISOString();
  logActivity('duty', `Duty #${duty.id.substr(-6)} status updated to ${status}.`);
  return success(res, duty);
});

// 6. Reports & Batch Mesh Upload (For Mobile App Requirements)
app.get('/api/v1/reports', (req, res) => {
  return success(res, reports);
});

app.post('/api/v1/reports', (req, res) => {
  const { text, areaId, source = 'web', clientId } = req.body;
  if (!text) return error(res, 'MISSING_TEXT', 'Report text is required');

  if (clientId && syncLedger.has(clientId)) {
    return success(res, { message: 'Already processed', clientId });
  }

  const newReport = {
    id: `rep-${Date.now()}`,
    text,
    areaId: areaId || 'area-c',
    source,
    label: 'Suggested',
    clientId: clientId || null,
    createdAt: new Date().toISOString()
  };

  reports.unshift(newReport);
  if (clientId) syncLedger.add(clientId);

  const matchedArea = areas.find(a => a.id === newReport.areaId);
  if (matchedArea) {
    matchedArea.actualReports = (matchedArea.actualReports || 0) + 1;
    matchedArea.lastReportAt = newReport.createdAt;
  }

  logActivity('report', `Emergency distress report logged for ${matchedArea ? matchedArea.name : 'Sector'} (${source}).`);
  return success(res, newReport, {}, 201);
});

app.post('/api/v1/reports/batch', (req, res) => {
  const { gatewayId, reports: incomingReports = [] } = req.body;
  if (!Array.isArray(incomingReports)) {
    return res.status(400).json({ error: 'reports array is required' });
  }

  let accepted = 0;
  let duplicates = 0;
  let rejected = 0;

  for (const rep of incomingReports) {
    if (!rep.id || !rep.text) {
      rejected++;
      continue;
    }

    if (rep.lat !== undefined && (rep.lat < -90 || rep.lat > 90)) {
      rejected++;
      continue;
    }
    if (rep.lng !== undefined && (rep.lng < -180 || rep.lng > 180)) {
      rejected++;
      continue;
    }

    const exists = reports.some(r => r.id === rep.id || r.clientId === rep.id);
    if (exists || syncLedger.has(rep.id)) {
      duplicates++;
      continue;
    }

    // Assign nearest area if lat/lng available
    let targetAreaId = 'area-c';
    if (rep.lat && rep.lng) {
      let minDist = Infinity;
      for (const a of areas) {
        const d = haversineDistance(rep.lat, rep.lng, a.lat, a.lng);
        if (d < minDist) {
          minDist = d;
          targetAreaId = a.id;
        }
      }
    }

    const saved = {
      id: rep.id,
      areaId: targetAreaId,
      text: rep.text,
      source: 'mesh',
      gatewayId: gatewayId || 'unknown-gateway',
      hops: rep.hops || 1,
      label: 'Suggested',
      clientId: rep.id,
      createdAt: rep.timestamp || new Date().toISOString()
    };

    reports.unshift(saved);
    syncLedger.add(rep.id);
    accepted++;

    const a = areas.find(ar => ar.id === targetAreaId);
    if (a) a.actualReports = (a.actualReports || 0) + 1;
  }

  logActivity('mesh_batch', `Batch mesh upload via ${gatewayId}: ${accepted} accepted, ${duplicates} duplicates, ${rejected} rejected.`);
  return res.json({ accepted, duplicates, rejected });
});

// 7. Priority & Allocation Engines
app.get('/api/v1/priority', (req, res) => {
  const ranked = computePriorityList(areas, camps, []);
  return success(res, ranked);
});

app.get('/api/v1/allocations/suggestions', (req, res) => {
  const suggestions = generateAllocationSuggestions(camps, []);
  return success(res, suggestions);
});

app.post('/api/v1/allocations/approve', (req, res) => {
  const { suggestionId } = req.body;
  const suggestions = generateAllocationSuggestions(camps, []);
  const suggestion = suggestions.find(s => s.suggestionId === suggestionId || s.id === suggestionId);

  if (!suggestion) return error(res, 'NOT_FOUND', 'Allocation suggestion not found', 404);

  const newDuty = {
    id: `duty-del-${Date.now()}`,
    volunteerId: 'vol-2',
    volunteerName: 'Ahmed Raza',
    type: 'delivery',
    fromCampId: suggestion.fromCampId,
    fromCampName: suggestion.fromCampName,
    toType: 'camp',
    toId: suggestion.toCampId,
    toName: suggestion.toCampName,
    item: suggestion.item,
    quantity: suggestion.quantity,
    status: 'assigned', // Pending
    instructions: `Approved transfer: Deliver ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  duties.push(newDuty);
  logActivity('allocation', `Transfer approved: ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}. Duty created.`);

  return success(res, {
    duty: newDuty,
    deliveryStatus: 'Pending'
  });
});

// 8. Offline Queue Sync (Idempotent with sync_ledger)
app.post('/api/v1/sync', (req, res) => {
  const { items = [] } = req.body;
  let processed = 0;

  for (const item of items) {
    if (item.clientId && syncLedger.has(item.clientId)) {
      continue;
    }

    if (item.type === 'duty_status') {
      const d = duties.find(duty => duty.id === item.payload.dutyId);
      if (d) {
        d.status = item.payload.status;
        d.updatedAt = item.timestamp || new Date().toISOString();
      }
      processed++;
    } else if (item.type === 'report') {
      reports.unshift(item.payload);
      processed++;
    }

    if (item.clientId) syncLedger.add(item.clientId);
  }

  return success(res, { ok: true, processedCount: processed });
});

// 9. Admin Stats
app.get('/api/v1/admin/stats', (req, res) => {
  let activeDarkZones = 0;
  let highRiskAreas = 0;
  for (const a of areas) {
    const evalResult = evaluateDarkZone(a);
    if (evalResult.isDarkZone) activeDarkZones++;
    else if (evalResult.score >= 50) highRiskAreas++;
  }

  let criticalShortages = 0;
  let totalOccupied = 0;
  let totalCapacity = 0;
  const stockVsNeed = {
    water: { stock: 0, need: 0 },
    food: { stock: 0, need: 0 },
    medicine: { stock: 0, need: 0 },
    relief: { stock: 0, need: 0 }
  };

  for (const c of camps) {
    totalOccupied += (c.occupancy || 0);
    totalCapacity += (c.capacity || 0);
    for (const itm of c.items || []) {
      const k = (itm.item || '').toLowerCase();
      if (stockVsNeed[k]) {
        stockVsNeed[k].stock += (itm.stock || 0);
        stockVsNeed[k].need += (itm.need || 0);
      }
      if (itm.need > itm.stock) {
        const diff = itm.need - itm.stock;
        if (diff >= 50 && (diff / itm.need) >= 0.5) {
          criticalShortages++;
        }
      }
    }
  }

  const volunteersByStatus = { available: 0, on_duty: 0, offline: 0 };
  for (const v of volunteers) {
    volunteersByStatus[v.status] = (volunteersByStatus[v.status] || 0) + 1;
  }

  const dutiesByStatus = { assigned: 0, in_progress: 0, done: 0 };
  const deliveriesByStatus = { Pending: 0, 'In transit': 0, Delivered: 0 };

  for (const d of duties) {
    dutiesByStatus[d.status] = (dutiesByStatus[d.status] || 0) + 1;
    if (d.type === 'delivery') {
      if (d.status === 'assigned') deliveriesByStatus.Pending++;
      else if (d.status === 'in_progress') deliveriesByStatus['In transit']++;
      else if (d.status === 'done') deliveriesByStatus.Delivered++;
    }
  }

  const pendingVerifications = areas.filter(a => a.verification === 'team_sent').length;

  return success(res, {
    totalAreas: areas.length,
    activeDarkZones,
    highRiskAreas,
    criticalShortages,
    camps: camps.length,
    occupancy: {
      occupied: totalOccupied,
      capacity: totalCapacity,
      percentage: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0
    },
    reports: reports.length,
    pendingVerifications,
    volunteersByStatus,
    dutiesByStatus,
    deliveriesByStatus,
    stockVsNeed,
    recentActivity: activityLog.slice(0, 10),
    dataAsOf: new Date().toLocaleTimeString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ReliefOS REST API] Server active on http://0.0.0.0:${PORT}`);
  console.log(`[ReliefOS REST API] Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`[ReliefOS REST API] Safe Zones: http://localhost:${PORT}/api/v1/safe-zones`);
});
