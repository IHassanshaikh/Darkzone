/**
 * ReliefOS + DARK ZONE: Unified API Client Layer with Transparent Mock Fallback
 * Works 100% offline or online. When backend is live, queries /api/v1 REST endpoints.
 * When backend is unreachable, evaluates identical pure ES logic modules locally.
 */

import { evaluateDarkZone } from '../shared/darkZone.js';
import { computePriorityList } from '../shared/priority.js';
import { generateAllocationSuggestions, haversineDistance } from '../shared/allocation.js';

import initialAreas from '../data/mock/areas.json';
import initialCamps from '../data/mock/camps.json';
import initialVolunteers from '../data/mock/volunteers.json';
import initialDuties from '../data/mock/duties.json';
import initialReports from '../data/mock/reports.json';

const API_BASE = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '/api/v1';

function loadStoredArray(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

let isBroadcastingSync = false;

// Global flag: skip the next sync cycle after an optimistic update to prevent flicker
let _skipSyncUntil = 0;
export function skipSyncFor(ms = 2000) { _skipSyncUntil = Date.now() + ms; }
export function shouldSkipSync() { return Date.now() < _skipSyncUntil; }

function saveStoredArray(key, val) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(val);
    const existing = localStorage.getItem(key);
    if (existing === serialized) return; // No change, do not trigger sync loop!
    localStorage.setItem(key, serialized);

    if (!isBroadcastingSync) {
      isBroadcastingSync = true;
      try {
        window.dispatchEvent(new CustomEvent('reliefos_db_sync', { detail: { key } }));
      } finally {
        setTimeout(() => { isBroadcastingSync = false; }, 1500);
      }
    }
  } catch {}
}

// Persistent state store for mock / offline fallback and cross-tab reactive state
class LocalStore {
  constructor() {
    this.areas = JSON.parse(JSON.stringify(initialAreas));
    this.camps = loadStoredArray('reliefos_db_camps', JSON.parse(JSON.stringify(initialCamps)));
    this.volunteers = JSON.parse(JSON.stringify(initialVolunteers));
    this.duties = loadStoredArray('reliefos_db_duties', JSON.parse(JSON.stringify(initialDuties)));
    this.reports = loadStoredArray('reliefos_db_reports', JSON.parse(JSON.stringify(initialReports)));
    this.messages = loadStoredArray('reliefos_db_messages', [
      {
        id: 'msg-seed-1',
        sender: 'user',
        senderName: 'Citizen (Khanpur Valley)',
        recipientId: 'vol-3',
        recipientName: 'Fatima Noor (Volunteer)',
        text: 'Water entered ground floor, emergency boat requested for 4 citizens.',
        category: 'Rescue Needed',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'relayed_hq',
        hopRoute: 'Your Phone -> Peer Mobile (14m) -> Fatima Noor -> HQ',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
    this.requisitions = loadStoredArray('reliefos_db_requisitions', [
      {
        id: 'req-seed-1',
        volunteerId: 'vol-3',
        volunteerName: 'Fatima Noor',
        campId: 'camp-b',
        campName: 'Camp B (Coastal School)',
        items: [
          { item: 'water', quantity: 60, unit: 'Liters' },
          { item: 'medicine', quantity: 15, unit: 'Trauma Packs' }
        ],
        priority: 'critical',
        notes: 'Area C flood surge: 12 elderly residents require sterile dressing and hydration.',
        status: 'pending',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ]);
    this.notifications = loadStoredArray('reliefos_db_notifications', []);
    this.activityLog = [
      { id: 1, kind: 'system', message: 'ReliefOS core monitoring engines initialized.', timestamp: new Date(Date.now() - 3600000).toISOString(), label: null },
      { id: 2, kind: 'dark_zone', message: 'Potential Dark Zone flagged in Delta Sector 9 (Area C) based on 98% reporting silence.', timestamp: new Date(Date.now() - 1800000).toISOString(), label: 'Suggested' },
      { id: 3, kind: 'shortage', message: 'Critical water shortage detected at Camp B (Coastal School). Deficit: 160L.', timestamp: new Date(Date.now() - 900000).toISOString(), label: 'Suggested' }
    ];
    this.isMockActive = true;
  }

  save(key) {
    if (key === 'messages') saveStoredArray('reliefos_db_messages', this.messages);
    if (key === 'requisitions') saveStoredArray('reliefos_db_requisitions', this.requisitions);
    if (key === 'camps') saveStoredArray('reliefos_db_camps', this.camps);
    if (key === 'duties') saveStoredArray('reliefos_db_duties', this.duties);
    if (key === 'reports') saveStoredArray('reliefos_db_reports', this.reports);
    if (key === 'notifications') saveStoredArray('reliefos_db_notifications', this.notifications);
  }

  logActivity(kind, message, label = 'Suggested') {
    this.activityLog.unshift({
      id: Date.now(),
      kind,
      message,
      timestamp: new Date().toISOString(),
      label
    });
    if (this.activityLog.length > 50) this.activityLog.pop();
  }

  addMessage(messageData) {
    const msg = {
      id: messageData.id || `msg-${Date.now()}`,
      sender: messageData.sender || 'user',
      senderName: messageData.senderName || 'Resident',
      recipientId: messageData.recipientId || 'vol-3',
      recipientName: messageData.recipientName || 'Fatima Noor (Volunteer)',
      text: messageData.text,
      category: messageData.category || 'Emergency',
      hopRoute: messageData.hopRoute || 'P2P Bluetooth Mesh',
      status: 'delivered',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    this.messages.unshift(msg);

    // Auto-create assigned duty & broadcast notification for citizen/user emergency
    if (msg.sender === 'user' || msg.sender === 'citizen') {
      const newDuty = {
        id: `duty-sos-${Date.now()}`,
        volunteerId: msg.recipientId || 'vol-1',
        volunteerName: msg.recipientName || 'Sara Khan',
        title: `EMERGENCY DISPATCH: ${msg.category || 'CITIZEN SOS'}`,
        location: 'Area C (Delta Sector)',
        areaId: 'area-c',
        status: 'assigned',
        priority: 'critical',
        notes: `Distress text: "${msg.text}". Route: ${msg.hopRoute}`,
        type: 'rescue',
        createdAt: new Date().toISOString()
      };
      this.duties.unshift(newDuty);

      this.broadcastNotification({
        type: 'sos_message',
        title: `EMERGENCY SOS // ${(msg.category || 'CITIZEN SOS').toUpperCase()}`,
        message: `From ${msg.senderName}: "${msg.text}" (Routed to ${msg.recipientName || 'Sara Khan'})`,
        targetRole: 'all',
        targetRoles: ['all', 'volunteer', 'admin', 'coordinator'],
        targetVolunteerId: msg.recipientId || null,
        link: '/volunteer'
      });
      this.save('duties');
      this.save('notifications');
    }
    this.save('messages');
    return msg;
  }

  addRequisition(reqData) {
    const req = {
      id: reqData.id || `req-${Date.now()}`,
      volunteerId: reqData.volunteerId || 'vol-3',
      volunteerName: reqData.volunteerName || 'Fatima Noor',
      campId: reqData.campId || 'camp-b',
      campName: reqData.campName || 'Camp B (Coastal School)',
      items: reqData.items || [{ item: 'water', quantity: 50, unit: 'Liters' }],
      priority: reqData.priority || 'high',
      notes: reqData.notes || 'Emergency field supplies requisition.',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.requisitions.unshift(req);

    this.broadcastNotification({
      type: 'resource_requisition',
      title: 'NEW RESOURCE REQUISITION',
      message: `${req.volunteerName} requested supplies for ${req.campName}`,
      targetRole: 'camp_manager',
      link: '/camp-manager'
    });

    this.save('requisitions');
    return req;
  }

  updateRequisition(id, updates) {
    const req = this.requisitions.find(r => r.id === id);
    if (!req) return null;
    Object.assign(req, updates, { updatedAt: new Date().toISOString() });

    if (updates.status === 'approved') {
      // Deduct stock from target camp in local store
      const targetCamp = this.camps.find(c => c.id === req.campId);
      if (targetCamp && targetCamp.items && req.items) {
        req.items.forEach(reqItem => {
          const targetName = (reqItem.item || reqItem.name || '').toLowerCase();
          const campItem = targetCamp.items.find(i => (i.item || i.name || '').toLowerCase() === targetName);
          if (campItem && campItem.stock !== undefined) {
            campItem.stock = Math.max(0, campItem.stock - (Number(reqItem.quantity) || 0));
          }
        });
        this.save('camps');
      }

      // Create delivery duty
      const deliveryDuty = {
        id: `duty-del-${Date.now()}`,
        volunteerId: req.volunteerId,
        volunteerName: req.volunteerName,
        title: `SUPPLY CONVOY DISPATCH: ${req.campName}`,
        location: req.campName,
        status: 'in_progress',
        priority: 'high',
        notes: `Fulfilling requisition ${req.id} for field responder ${req.volunteerName}.`,
        instructions: `Deliver approved supplies from ${req.campName} to field sector.`,
        type: 'delivery',
        createdAt: new Date().toISOString()
      };
      this.duties.unshift(deliveryDuty);
      this.save('duties');

      this.broadcastNotification({
        type: 'requisition_approved',
        title: 'REQUISITION APPROVED',
        message: `Your supply request has been APPROVED by Camp Operations. Supplies are staged for pickup!`,
        targetRole: 'all',
        targetRoles: ['all', 'volunteer', 'admin', 'coordinator'],
        targetVolunteerId: req.volunteerId,
        link: '/volunteer',
        meta: { requisitionId: req.id }
      });
    }

    this.save('requisitions');
    return req;
  }

  broadcastNotification(notif) {
    const newNotif = {
      id: notif.id || `notif-${Date.now()}`,
      type: notif.type || 'alert',
      title: notif.title || 'System Alert',
      message: notif.message,
      targetRole: notif.targetRole || 'all',
      targetVolunteerId: notif.targetVolunteerId || null,
      link: notif.link || '/',
      acknowledged: false,
      timestamp: new Date().toISOString()
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }
}

export const localStore = new LocalStore();

let backendAvailable = false;
let checkDone = false;

// Probe backend health once at startup
export async function checkBackendHealth() {
  if (checkDone && backendAvailable) return true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    backendAvailable = res.ok;
  } catch (err) {
    backendAvailable = false;
  }
  checkDone = true;
  localStore.isMockActive = !backendAvailable;
  return backendAvailable;
}

export function isUsingMockData() {
  return localStore.isMockActive;
}

// ----------------- Core API Methods ----------------- //

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch {}
  return { status: 'mock_fallback', healthy: true, isMock: true };
}

export async function fetchAreas() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/areas`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  // Local fallback
  return localStore.areas.map(a => ({
    ...a,
    assessment: evaluateDarkZone(a)
  }));
}

export async function fetchAreaById(id) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/areas/${id}`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  const area = localStore.areas.find(a => a.id === id);
  if (!area) return null;
  return {
    ...area,
    assessment: evaluateDarkZone(area)
  };
}

export async function sendFieldTeamAction(areaId, volunteerIds = []) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/areas/${areaId}/field-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerIds })
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  // Local state update
  const area = localStore.areas.find(a => a.id === areaId);
  if (area) {
    area.verification = 'team_sent';
    
    // Update volunteers
    volunteerIds.forEach(vId => {
      const vol = localStore.volunteers.find(v => v.id === vId);
      if (vol) {
        vol.status = 'on_duty';
        vol.availability = false;
      }
      // Create duty
      localStore.duties.push({
        id: `duty-${Date.now()}-${vId}`,
        volunteerId: vId,
        volunteerName: vol ? vol.name : 'Volunteer Team',
        type: 'verification',
        fromCampId: 'camp-a',
        toType: 'area',
        toId: areaId,
        toName: area.name,
        status: 'assigned',
        instructions: `Rapid ground reconnaissance & verification of silent risk conditions in ${area.name}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    localStore.logActivity('field_team', `Field verification team dispatched to ${area.name}. Status upgraded to team_sent.`);
  }
  return { success: true, area };
}

export async function verifyAreaAction(areaId, outcome, note = '') {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/areas/${areaId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, note })
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const area = localStore.areas.find(a => a.id === areaId);
  if (area) {
    area.verification = outcome;
    const msg = outcome === 'confirmed'
      ? `Area ${area.name} ground conditions CONFIRMED. Dark Zone priority boosted.`
      : outcome === 'verified_safe'
      ? `Area ${area.name} inspected and VERIFIED SAFE. Removed from Silent Risk.`
      : `Area ${area.name} flag REJECTED by coordinator.`;
    localStore.logActivity('verification', msg);
  }
  return { success: true, area };
}

export async function fetchCamps() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/camps`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  return localStore.camps;
}

export async function updateCampInventoryAction(campId, item, deltaQty, reason = 'Restock') {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/camps/${campId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, deltaQty, reason })
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const camp = localStore.camps.find(c => c.id === campId);
  if (camp) {
    const targetItem = (camp.items || []).find(i => i.item === item);
    if (targetItem) {
      targetItem.stock = Math.max(0, targetItem.stock + deltaQty);
    }
    camp.updatedAt = new Date().toISOString();
    localStore.logActivity(
      'camp_stock',
      `Camp ${camp.name}: ${item} stock adjusted by ${deltaQty > 0 ? '+' : ''}${deltaQty} (${reason}). New stock: ${targetItem?.stock}.`,
      'Confirmed'
    );
  }
  return camp;
}

export async function updateCampOccupancyAction(campId, deltaOccupancy) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/camps/${campId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaOccupancy })
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const camp = localStore.camps.find(c => c.id === campId);
  if (camp) {
    camp.occupancy = Math.max(0, Math.min(camp.capacity || 1000, camp.occupancy + deltaOccupancy));
    camp.updatedAt = new Date().toISOString();
    localStore.logActivity(
      'camp_intake',
      `Camp ${camp.name}: Shelter intake updated by ${deltaOccupancy > 0 ? '+' : ''}${deltaOccupancy}. Occupancy: ${camp.occupancy}/${camp.capacity}.`,
      'Confirmed'
    );
  }
  return camp;
}

export async function confirmDeliveryArrivalAction(dutyId, campId, item, quantity) {
  // Update duty status to done
  await updateDutyStatusAction(dutyId, 'done');

  // Update camp inventory
  if (campId && item && quantity) {
    await updateCampInventoryAction(campId, item, Number(quantity), `Delivered via Duty #${dutyId.substr(-6)}`);
  }

  return { success: true };
}

export async function submitCampRequisitionAction(reqData) {
  // Create an emergency requisition duty / command alert
  const newDuty = {
    id: `req-${Date.now()}`,
    type: 'requisition',
    fromCampId: reqData.campId,
    fromCampName: reqData.campName,
    toType: 'command',
    item: reqData.item,
    quantity: reqData.quantity,
    priority: reqData.priority || 'high',
    notes: reqData.notes || '',
    status: 'assigned',
    instructions: `URGENT REQUISITION: ${reqData.campName} requests ${reqData.quantity} ${reqData.item} (${reqData.priority?.toUpperCase()} priority). ${reqData.notes}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (await checkBackendHealth()) {
    try {
      await fetch(`${API_BASE}/duties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDuty)
      });
    } catch {}
  }

  const newReqRecord = {
    id: newDuty.id,
    volunteerId: 'camp-mgr',
    volunteerName: `${reqData.campName} Manager`,
    campId: reqData.campId,
    campName: reqData.campName,
    items: [{ item: reqData.item, quantity: Number(reqData.quantity), unit: reqData.item === 'water' ? 'Liters' : 'Packs' }],
    priority: reqData.priority || 'critical',
    notes: reqData.notes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  localStore.duties.unshift(newDuty);
  localStore.save('duties');
  localStore.requisitions.unshift(newReqRecord);
  localStore.save('requisitions');

  localStore.logActivity(
    'requisition',
    `Emergency Requisition from ${reqData.campName}: ${reqData.quantity} ${reqData.item} (${reqData.priority?.toUpperCase()}).`,
    'Pending Command Review'
  );

  return newDuty;
}

export async function fetchSafeZones() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/safe-zones`);
      if (res.ok) return await res.json();
    } catch {}
  }
  return localStore.camps.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    capacity: c.capacity,
    occupancy: c.occupancy,
    type: c.type || 'camp',
    updatedAt: c.updatedAt
  }));
}

export async function addSafeZoneAction(zoneData) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/safe-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneData)
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const newZone = {
    id: zoneData.id || `safe-zone-${Date.now()}`,
    name: zoneData.name,
    lat: parseFloat(zoneData.lat),
    lng: parseFloat(zoneData.lng),
    capacity: parseInt(zoneData.capacity || 200),
    occupancy: 0,
    minReserve: 20,
    type: zoneData.type || 'safe_zone',
    updatedAt: new Date().toISOString(),
    items: [
      { item: 'water', stock: 100, need: 100 },
      { item: 'food', stock: 100, need: 100 },
      { item: 'medicine', stock: 50, need: 50 },
      { item: 'relief', stock: 50, need: 50 }
    ]
  };

  localStore.camps.push(newZone);
  localStore.save('camps');
  localStore.logActivity('safe_zone', `New designated Safe Zone added: ${newZone.name}.`);
  return newZone;
}

export async function fetchVolunteers() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/volunteers`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  return localStore.volunteers;
}

export async function updateVolunteerStatusAction(volId, status) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/volunteers/${volId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const vol = localStore.volunteers.find(v => v.id === volId);
  if (vol) {
    vol.status = status;
    vol.availability = status === 'available';
  }
  return { success: true, volunteer: vol };
}

export async function fetchDuties() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/duties`);
      if (res.ok) {
        const body = await res.json();
        if (Array.isArray(body.data)) {
          localStore.duties = body.data;
          localStore.save('duties');
          return body.data;
        }
      }
    } catch {}
  }
  return localStore.duties;
}

export async function createDutyAction(dutyData) {
  const newDuty = {
    id: dutyData.id || `duty-${Date.now()}`,
    volunteerId: dutyData.volunteerId,
    volunteerName: dutyData.volunteerName || 'Volunteer',
    title: dutyData.title || dutyData.instructions,
    location: dutyData.location || dutyData.toName || 'Field Zone',
    areaId: dutyData.areaId || 'area-c',
    status: dutyData.status || 'assigned',
    priority: dutyData.priority || 'high',
    notes: dutyData.notes || '',
    type: dutyData.type || 'field_task',
    instructions: dutyData.instructions || dutyData.title,
    toName: dutyData.toName || dutyData.location,
    fromCampId: dutyData.fromCampId,
    fromCampName: dutyData.fromCampName,
    item: dutyData.item,
    quantity: dutyData.quantity,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  localStore.duties.unshift(newDuty);
  localStore.save('duties');

  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/duties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDuty)
      });
      if (res.ok) {
        const body = await res.json();
        return body.data || newDuty;
      }
    } catch (err) {
      console.warn('Network duty creation failed, stored locally:', err);
    }
  }
  return newDuty;
}

export async function updateDutyStatusAction(dutyId, status) {
  // 1. Optimistically update localStore right away
  const duty = localStore.duties.find(d => d.id === dutyId || String(d.id).toLowerCase() === String(dutyId).toLowerCase());
  if (duty) {
    duty.status = status;
    duty.updatedAt = new Date().toISOString();
    localStore.logActivity('duty', `Duty #${duty.id.substr(-6)} status updated to ${status}.`);
    localStore.save('duties');
  }

  // 2. Transmit to server
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/duties/${dutyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          const idx = localStore.duties.findIndex(d => d.id === dutyId || String(d.id).toLowerCase() === String(dutyId).toLowerCase());
          if (idx !== -1) {
            localStore.duties[idx] = body.data;
          } else {
            localStore.duties.unshift(body.data);
          }
          localStore.save('duties');
          return body.data;
        }
      }
    } catch (err) {
      console.warn('Network duty update failed, using local store:', err);
    }
  }

  return { success: true, duty };
}

export async function fetchPriorityList() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/priority`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  // Compute using shared module
  return computePriorityList(localStore.areas, localStore.camps, []);
}

export async function fetchAllocationSuggestions() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/allocations/suggestions`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  return generateAllocationSuggestions(localStore.camps, [], localStore.duties);
}

export async function approveAllocationAction(suggestionId) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/allocations/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data?.duty) {
          localStore.duties.unshift(body.data.duty);
          localStore.save('duties');
        }
        return body.data;
      }
    } catch {}
  }

  const suggestions = generateAllocationSuggestions(localStore.camps, [], localStore.duties);
  const suggestion = suggestions.find(s => s.suggestionId === suggestionId || s.id === suggestionId);

  if (!suggestion) return { error: 'Suggestion not found' };

  // Deduct donor stock locally
  const donorCamp = localStore.camps.find(c => c.id === suggestion.fromCampId);
  if (donorCamp && Array.isArray(donorCamp.items)) {
    const itm = donorCamp.items.find(i => (i.item || i.name || '').toLowerCase() === suggestion.item.toLowerCase());
    if (itm && itm.stock !== undefined) {
      itm.stock = Math.max(0, itm.stock - suggestion.quantity);
      localStore.save('camps');
    }
  }

  // Create a delivery duty
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
    instructions: `Approved resource transfer: Deliver ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  localStore.duties.unshift(newDuty);
  localStore.logActivity('allocation', `Transfer approved: ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampName} to ${suggestion.toCampName}. Duty created as Pending.`);
  localStore.save('duties');

  return {
    success: true,
    duty: newDuty,
    deliveryStatus: 'Pending'
  };
}

export async function fetchReports() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/reports`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }
  return localStore.reports;
}

export async function submitReportAction(reportData) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  const newReport = {
    id: reportData.id || `rep-${Date.now()}`,
    areaId: reportData.areaId || 'area-c',
    text: reportData.text,
    source: reportData.source || 'web',
    label: 'Suggested',
    extracted: reportData.extracted || null,
    clientId: reportData.clientId || `client-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  localStore.reports.unshift(newReport);
  
  // If report has area, increment actualReports
  const targetArea = localStore.areas.find(a => a.id === newReport.areaId);
  if (targetArea) {
    targetArea.actualReports = (targetArea.actualReports || 0) + 1;
    targetArea.lastReportAt = newReport.createdAt;
  }

  localStore.logActivity('report', `Incoming distress report received for ${targetArea ? targetArea.name : 'unknown area'} (${newReport.source}).`);
  return newReport;
}

export async function submitReportBatchAction(batch) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/reports/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      });
      if (res.ok) return await res.json();
    } catch {}
  }

  // Deduplicate and insert
  let accepted = 0;
  let duplicates = 0;
  let rejected = 0;

  for (const rep of batch.reports || []) {
    if (!rep.id || !rep.text) {
      rejected++;
      continue;
    }
    const exists = localStore.reports.some(r => r.id === rep.id || r.clientId === rep.id);
    if (exists) {
      duplicates++;
    } else {
      accepted++;
      // Find nearest area if lat/lng available
      let matchedAreaId = 'area-c';
      if (rep.lat && rep.lng) {
        let minDist = Infinity;
        for (const a of localStore.areas) {
          const d = haversineDistance(rep.lat, rep.lng, a.lat, a.lng);
          if (d < minDist) {
            minDist = d;
            matchedAreaId = a.id;
          }
        }
      }

      localStore.reports.unshift({
        id: rep.id,
        areaId: matchedAreaId,
        text: rep.text,
        source: 'mesh',
        hops: rep.hops || 1,
        gatewayId: batch.gatewayId,
        label: 'Suggested',
        extracted: extractKeywordsFromText(rep.text),
        clientId: rep.id,
        createdAt: rep.timestamp || new Date().toISOString()
      });

      const matchedArea = localStore.areas.find(a => a.id === matchedAreaId);
      if (matchedArea) {
        matchedArea.actualReports = (matchedArea.actualReports || 0) + 1;
      }
    }
  }

  localStore.logActivity('mesh_batch', `Processed mesh batch upload: ${accepted} accepted, ${duplicates} duplicates, ${rejected} rejected.`);
  return { accepted, duplicates, rejected };
}

export async function syncQueueAction(items) {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) return await res.json();
    } catch {}
  }

  // Local sync
  for (const item of items) {
    if (item.type === 'duty_status') {
      const d = localStore.duties.find(duty => duty.id === item.payload.dutyId);
      if (d) d.status = item.payload.status;
    } else if (item.type === 'report') {
      localStore.reports.unshift(item.payload);
    }
  }
  return { ok: true, syncedCount: items.length };
}

export async function fetchAdminStats() {
  if (await checkBackendHealth()) {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`);
      if (res.ok) {
        const body = await res.json();
        return body.data;
      }
    } catch {}
  }

  // Calculate local admin stats matching PRD & seed benchmarks
  const areas = localStore.areas;
  const camps = localStore.camps;
  const volunteers = localStore.volunteers;
  const duties = localStore.duties;
  const reports = localStore.reports;

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

  return {
    totalAreas: areas.length,
    activeDarkZones, // exactly 1 (Area C)
    highRiskAreas,
    criticalShortages, // exactly 1 (Camp B water)
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
    recentActivity: localStore.activityLog.slice(0, 10),
    dataAsOf: new Date().toLocaleTimeString()
  };
}

/**
 * Deterministic keyword & entity extractor for emergency distress messages
 * Guaranteed to return 'Not found' if entity is not detected
 */
export function extractKeywordsFromText(text = '') {
  const clean = text.toLowerCase();

  // Age extraction
  let age = 'Not found';
  if (clean.includes('elderly') || clean.includes('grandma') || clean.includes('grandfather') || clean.includes('senior') || clean.includes('old age')) {
    age = 'elderly';
  } else if (clean.includes('child') || clean.includes('infant') || clean.includes('baby') || clean.includes('toddler') || clean.includes('pregnant')) {
    age = clean.includes('baby') || clean.includes('infant') ? 'infant' : 'child / pregnant';
  } else if (clean.includes('adult') || clean.includes('men') || clean.includes('women')) {
    age = 'adult';
  }

  // Mobility issue extraction
  let mobilityIssue = 'Not found';
  if (clean.includes('cannot walk') || clean.includes('bedridden') || clean.includes('wheelchair') || clean.includes('paralyzed') || clean.includes('disabled') || clean.includes('stretcher')) {
    mobilityIssue = 'Yes (impaired mobility)';
  } else if (clean.includes('can walk') || clean.includes('mobile')) {
    mobilityIssue = 'No';
  }

  // Hazard extraction
  let hazard = 'Not found';
  if (clean.includes('water rising') || clean.includes('flood') || clean.includes('submerged') || clean.includes('ground floor') || clean.includes('drowning')) {
    hazard = 'Rapid Flood Inundation';
  } else if (clean.includes('downed wire') || clean.includes('electrical') || clean.includes('sparking') || clean.includes('wire')) {
    hazard = 'Electrocution / Downed Power Lines';
  } else if (clean.includes('landslide') || clean.includes('mud') || clean.includes('rubble') || clean.includes('collapsed')) {
    hazard = 'Structural Collapse / Landslide';
  } else if (clean.includes('fire') || clean.includes('smoke') || clean.includes('gas leak')) {
    hazard = 'Fire / Gas Hazard';
  }

  // Urgency extraction
  let urgency = 'Medium';
  if (clean.includes('water rising') || clean.includes('cannot walk') || clean.includes('emergency') || clean.includes('critical') || clean.includes('immediately') || clean.includes('life threatening')) {
    urgency = 'Critical';
  } else if (clean.includes('soon') || clean.includes('needed today') || clean.includes('shortage')) {
    urgency = 'High';
  } else if (clean.includes('safe') || clean.includes('status') || clean.includes('clear')) {
    urgency = 'Low';
  }

  // Assistance needed extraction
  let assistanceNeeded = 'Not found';
  const needs = [];
  if (clean.includes('boat') || clean.includes('evacuat')) needs.push('Evacuation Boat');
  if (clean.includes('stretcher') || clean.includes('medic') || clean.includes('doctor') || clean.includes('insulin')) needs.push('Medical Transport / Supplies');
  if (clean.includes('water') || clean.includes('drink')) needs.push('Clean Drinking Water');
  if (clean.includes('food') || clean.includes('ration') || clean.includes('formula')) needs.push('Emergency Rations');
  if (clean.includes('blanket') || clean.includes('shelter')) needs.push('Shelter / Blankets');

  if (needs.length > 0) {
    assistanceNeeded = needs.join(', ');
  }

  return {
    age,
    mobilityIssue,
    hazard,
    urgency,
    assistanceNeeded,
    label: 'Suggested',
    timestamp: new Date().toISOString()
  };
}

/**
 * ReliefOS AI Integration Client
 * Invokes backend /api/v1/ai endpoint
 */
export async function queryGeminiAI({ prompt, task = 'chat', context = {} }) {
  try {
    const res = await fetch('/api/v1/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, task, context })
    });
    const json = await res.json();
    return json?.data || { response: 'AI assistance active.' };
  } catch (err) {
    console.warn('AI query network fallback:', err);
    return {
      response: 'ReliefOS AI offline triage active. Prioritize vertical evacuation to high ground, keep devices on low-energy mode, and signal field scouts.',
      model: 'ReliefOS AI Engine'
    };
  }
}

/**
 * Send Citizen SOS Message to Volunteer
 */
export async function sendMessageAction(messageData) {
  // Always save to persistent local store first so UI and reloads are immediately synchronized
  const localSaved = localStore.addMessage(messageData);
  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data || localSaved;
    }
  } catch (err) {
    console.warn('Network message send failed, saved to persistent local store:', err);
  }
  return localSaved;
}

/**
 * Fetch Messages for a Volunteer or Citizen
 */
export async function fetchMessages({ volunteerId = null, recipient = null } = {}) {
  try {
    const query = new URLSearchParams();
    if (volunteerId) query.set('volunteerId', volunteerId);
    if (recipient) query.set('recipient', recipient);
    const res = await fetch(`${API_BASE}/messages?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        json.data.forEach(srvMsg => {
          if (!localStore.messages.some(m => m.id === srvMsg.id)) {
            localStore.messages.unshift(srvMsg);
          }
        });
        localStore.save('messages');
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network message fetch failed, using local store:', err);
  }
  let msgs = [...localStore.messages];
  if (volunteerId) {
    msgs = msgs.filter(m => m.recipientId === volunteerId || m.sender === volunteerId || m.sender === 'user' || m.sender === 'citizen');
  }
  return msgs;
}

/**
 * Submit Volunteer Camp Resource Requisition
 */
export async function submitRequisitionAction(reqData) {
  try {
    const res = await fetch(`${API_BASE}/requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    console.warn('Network requisition failed, saving to local store:', err);
  }
  return localStore.addRequisition(reqData);
}

/**
 * Fetch Camp Resource Requisitions
 */
export async function fetchRequisitions({ campId = null, volunteerId = null, status = null } = {}) {
  try {
    const query = new URLSearchParams();
    if (campId) query.set('campId', campId);
    if (volunteerId) query.set('volunteerId', volunteerId);
    if (status) query.set('status', status);
    const res = await fetch(`${API_BASE}/requisitions?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        localStore.requisitions = json.data;
        localStore.save('requisitions');
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network requisition fetch failed, using local store:', err);
  }
  let reqs = [...localStore.requisitions];
  if (campId) reqs = reqs.filter(r => r.campId === campId);
  if (volunteerId) reqs = reqs.filter(r => r.volunteerId === volunteerId);
  if (status) reqs = reqs.filter(r => r.status === status);
  return reqs;
}

/**
 * Approve / Update Requisition Status
 */
export async function updateRequisitionAction(id, { status, notes }) {
  // 1. Optimistically update localStore right away so any sync UI immediately reflects the new status
  const localReq = localStore.updateRequisition(id, { status, notes });

  // 2. Transmit to server API
  try {
    const res = await fetch(`${API_BASE}/requisitions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        const idx = localStore.requisitions.findIndex(r => r.id === id);
        if (idx !== -1) {
          localStore.requisitions[idx] = json.data;
        }
        localStore.save('requisitions');
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Network requisition update failed, using local store:', err);
  }
  return localReq;
}

/**
 * Fetch Active Unacknowledged Notifications for Real-Time Popups
 */
export async function fetchActiveNotifications({ role = 'all', volunteerId = null } = {}) {
  try {
    const query = new URLSearchParams();
    if (role) query.set('role', role);
    if (volunteerId) query.set('volunteerId', volunteerId);
    const res = await fetch(`${API_BASE}/notifications?${query.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    // offline
  }
  return localStore.notifications.filter(n => !n.acknowledged);
}

/**
 * Acknowledge Notification
 */
export async function acknowledgeNotificationAction(id) {
  try {
    await fetch(`${API_BASE}/notifications/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  } catch (err) {
    // offline
  }
  const notif = localStore.notifications.find(n => n.id === id);
  if (notif) notif.acknowledged = true;
  return true;
}

