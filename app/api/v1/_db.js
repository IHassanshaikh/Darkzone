/**
 * ReliefOS + DARK ZONE: Unified In-Memory Database for Next.js Route Handlers
 * Seeded from mock JSON files; provides persistent state during server runtime.
 * Supports cross-role wireable dispatches: Citizen SOS -> Volunteer Duties & Alerts -> Camp Requisitions -> Admin Approvals.
 */

import initialAreas from '@/src/data/mock/areas.json';
import initialCamps from '@/src/data/mock/camps.json';
import initialVolunteers from '@/src/data/mock/volunteers.json';
import initialDuties from '@/src/data/mock/duties.json';
import initialReports from '@/src/data/mock/reports.json';

class ServerDB {
  constructor() {
    this.areas = JSON.parse(JSON.stringify(initialAreas));
    this.camps = JSON.parse(JSON.stringify(initialCamps));
    this.volunteers = JSON.parse(JSON.stringify(initialVolunteers));
    this.duties = JSON.parse(JSON.stringify(initialDuties));
    this.reports = JSON.parse(JSON.stringify(initialReports));
    this.syncLedger = new Set();

    // Citizen-Volunteer Direct Messages
    this.messages = [
      {
        id: 'msg-seed-1',
        sender: 'user',
        senderName: 'Citizen (Khanpur Valley)',
        recipientId: 'vol-1',
        recipientName: 'Sara Khan',
        text: 'Water entered ground floor, emergency boat requested for 4 citizens.',
        category: 'Rescue Needed',
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'relayed_hq',
        hopRoute: 'Your Phone -> Peer Mobile (14m) -> Sara Khan -> HQ',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg-seed-2',
        sender: 'volunteer',
        senderName: 'Sara Khan (Volunteer)',
        recipientId: 'user',
        recipientName: 'Citizen (Khanpur Valley)',
        text: 'Copy that! Received your packet via 2-hop mobile relay. Rescue boat en route from Camp 3.',
        category: 'Rescue Confirmation',
        timestamp: new Date(Date.now() - 3300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
        createdAt: new Date(Date.now() - 3300000).toISOString()
      }
    ];

    // Field Resource Requisitions (Volunteer -> Camp Manager / Admin)
    this.requisitions = [
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
        status: 'pending', // 'pending' | 'approved' | 'rejected' | 'fulfilled'
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    // Real-Time Notification Broadcast Queue (Popups on Screen)
    this.notifications = [
      {
        id: 'notif-seed-1',
        type: 'sos_message',
        title: 'Emergency SOS Incoming',
        message: 'Citizen in Area C reported ground floor flooding (+3ft). Assigned to Scout team.',
        targetRole: 'all',
        targetVolunteerId: 'vol-1',
        link: '/volunteer',
        acknowledged: false,
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];

    this.activityLog = [
      { id: 1, kind: 'system', message: 'ReliefOS Next.js API Route Handlers active.', timestamp: new Date().toISOString(), label: null },
      { id: 2, kind: 'dark_zone', message: 'Potential Dark Zone flagged in Delta Sector 9 (Area C) based on 98% reporting silence.', timestamp: new Date().toISOString(), label: 'Suggested' },
      { id: 3, kind: 'shortage', message: 'Critical water shortage detected at Camp B (Coastal School). Deficit: 160L.', timestamp: new Date().toISOString(), label: 'Suggested' }
    ];

    // Load persisted data from disk if available
    this.loadFromDisk();
  }

  saveToDisk() {
    try {
      const fs = require('fs');
      const path = require('path');
      const runtimeDir = path.join(process.cwd(), '.runtime');
      if (!fs.existsSync(runtimeDir)) fs.mkdirSync(runtimeDir, { recursive: true });
      const dbFile = path.join(runtimeDir, 'db_live_state.json');
      const data = {
        messages: this.messages,
        requisitions: this.requisitions,
        duties: this.duties,
        camps: this.camps,
        reports: this.reports,
        notifications: this.notifications,
        activityLog: this.activityLog
      };
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      // Ignore if write restricted
    }
  }

  loadFromDisk() {
    try {
      const fs = require('fs');
      const path = require('path');
      const runtimeFile = path.join(process.cwd(), '.runtime', 'db_live_state.json');
      const seedFile = path.join(process.cwd(), 'src', 'data', 'db_live_state.json');
      const dbFile = fs.existsSync(runtimeFile) ? runtimeFile : fs.existsSync(seedFile) ? seedFile : null;
      if (dbFile && fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) this.messages = parsed.messages;
        if (Array.isArray(parsed.requisitions) && parsed.requisitions.length > 0) this.requisitions = parsed.requisitions;
        if (Array.isArray(parsed.duties) && parsed.duties.length > 0) this.duties = parsed.duties;
        if (Array.isArray(parsed.camps) && parsed.camps.length > 0) this.camps = parsed.camps;
        if (Array.isArray(parsed.reports) && parsed.reports.length > 0) this.reports = parsed.reports;
        if (Array.isArray(parsed.notifications)) this.notifications = parsed.notifications;
      }
    } catch (err) {
      // Ignore if load fails
    }
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

  // Add Citizen SOS Message & auto-generate volunteer duty & notification
  addMessage(messageData) {
    const msg = {
      id: messageData.id || `msg-${Date.now()}`,
      sender: messageData.sender || 'user',
      senderName: messageData.senderName || 'Resident',
      recipientId: messageData.recipientId || 'vol-1',
      recipientName: messageData.recipientName || 'Volunteer',
      text: messageData.text,
      category: messageData.category || 'Emergency',
      hopRoute: messageData.hopRoute || 'Direct Cellular / Mesh',
      status: messageData.status || 'delivered',
      timestamp: messageData.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    this.messages.unshift(msg);

    // Auto-create assigned duty & broadcast emergency popup across screens
    if (msg.sender === 'user' || msg.sender === 'citizen') {
      const dutyId = `duty-sos-${Date.now()}`;
      const newDuty = {
        id: dutyId,
        volunteerId: msg.recipientId || 'vol-1',
        volunteerName: msg.recipientName || 'Sara Khan',
        title: `EMERGENCY DISPATCH: ${msg.category || 'CITIZEN SOS'}`,
        location: 'Area C (Delta Sector)',
        areaId: 'area-c',
        status: 'assigned', // 'assigned' | 'in_progress' | 'done'
        priority: 'critical',
        notes: `Distress text: "${msg.text}". Route: ${msg.hopRoute}`,
        type: 'rescue',
        createdAt: new Date().toISOString()
      };
      this.duties.unshift(newDuty);

      // Create high-priority notification popup (visible to all volunteers and command)
      this.broadcastNotification({
        type: 'sos_message',
        title: `EMERGENCY SOS // ${(msg.category || 'CITIZEN SOS').toUpperCase()}`,
        message: `From ${msg.senderName}: "${msg.text}" (Routed to ${msg.recipientName || 'Sara Khan'})`,
        targetRole: 'all',
        targetRoles: ['all', 'volunteer', 'admin', 'coordinator'],
        targetVolunteerId: msg.recipientId || null,
        link: '/volunteer',
        meta: { messageId: msg.id, dutyId: newDuty.id }
      });

      this.logActivity(
        'citizen_sos',
        `Citizen SOS dispatched to ${msg.recipientName || 'Field Volunteer'}: "${msg.text.substring(0, 50)}..."`,
        'Urgent'
      );
    }

    this.saveToDisk();
    return msg;
  }

  // Add Volunteer Resource Requisition
  addRequisition(reqData) {
    const req = {
      id: reqData.id || `req-${Date.now()}`,
      volunteerId: reqData.volunteerId || 'vol-3',
      volunteerName: reqData.volunteerName || 'Volunteer',
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

    // Broadcast popup notification to Camp Manager and Admin
    this.broadcastNotification({
      type: 'resource_requisition',
      title: 'NEW RESOURCE REQUISITION',
      message: `${req.volunteerName} requested supplies for ${req.campName}: ${req.items.map(i => `${i.quantity} ${i.item}`).join(', ')}`,
      targetRole: 'camp_manager',
      link: '/camp-manager',
      meta: { requisitionId: req.id }
    });

    this.logActivity(
      'requisition',
      `Volunteer ${req.volunteerName} requested supplies from ${req.campName} (${req.priority.toUpperCase()})`,
      'Suggested'
    );

    this.saveToDisk();
    return req;
  }

  // Update / Approve Requisition
  updateRequisition(id, updates) {
    const req = this.requisitions.find(r => r.id === id);
    if (!req) return null;
    Object.assign(req, updates, { updatedAt: new Date().toISOString() });

    if (updates.status === 'approved') {
      // Deduct stock from camp if applicable or queue delivery
      const targetCamp = this.camps.find(c => c.id === req.campId);
      if (targetCamp && targetCamp.items && req.items) {
        req.items.forEach(reqItem => {
          const targetName = (reqItem.item || reqItem.name || '').toLowerCase();
          const campItem = targetCamp.items.find(i => (i.item || i.name || '').toLowerCase() === targetName);
          if (campItem && campItem.stock !== undefined) {
            campItem.stock = Math.max(0, campItem.stock - (Number(reqItem.quantity) || 0));
          }
        });
      }

      // Create a delivery duty
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

      // Notify Volunteer that requisition was approved
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

      this.logActivity(
        'approval',
        `Requisition ${req.id} APPROVED by Camp Operations for ${req.volunteerName}.`,
        'Confirmed'
      );
    }

    this.saveToDisk();
    return req;
  }

  // Broadcast Notification Popup to UI clients
  broadcastNotification(notif) {
    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: notif.type || 'alert',
      title: notif.title || 'System Alert',
      message: notif.message,
      targetRole: notif.targetRole || 'all',
      targetRoles: notif.targetRoles || (notif.targetRole ? [notif.targetRole] : ['all']),
      targetVolunteerId: notif.targetVolunteerId || null,
      link: notif.link || '/',
      acknowledged: false,
      timestamp: new Date().toISOString(),
      meta: notif.meta || {}
    };
    this.notifications.unshift(newNotif);
    if (this.notifications.length > 100) this.notifications.pop();
    return newNotif;
  }

  // Get unacknowledged notifications for a client
  getNotifications(role = 'all', volunteerId = null) {
    return this.notifications.filter(n => {
      if (n.acknowledged) return false;
      if (role === 'all' || !role) return true;
      if (n.targetRole === 'all') return true;
      if (Array.isArray(n.targetRoles)) {
        if (n.targetRoles.includes('all') || n.targetRoles.includes(role)) return true;
      }
      if (n.targetRole === role) return true;
      if (volunteerId && n.targetVolunteerId === volunteerId) return true;
      // Citizen SOS alerts must show on Home (coordinator/admin) and on Volunteer screens
      if (n.type === 'sos_message') return true;
      // Requisition alerts show on Camp Manager, Admin, and Coordinator (Home)
      if (n.type === 'resource_requisition' && (role === 'camp_manager' || role === 'admin' || role === 'coordinator')) return true;
      return false;
    });
  }

  acknowledgeNotification(id) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.acknowledged = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }
}

const globalForDB = global;
export const db = globalForDB._reliefos_db || new ServerDB();
if (process.env.NODE_ENV !== 'production') globalForDB._reliefos_db = db;
