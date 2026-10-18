/**
 * ReliefOS + DARK ZONE: Unified In-Memory Database for Next.js Route Handlers
 * Seeded from mock JSON files; provides persistent state during server runtime.
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
    this.activityLog = [
      { id: 1, kind: 'system', message: 'ReliefOS Next.js API Route Handlers active.', timestamp: new Date().toISOString(), label: null },
      { id: 2, kind: 'dark_zone', message: 'Potential Dark Zone flagged in Delta Sector 9 (Area C) based on 98% reporting silence.', timestamp: new Date().toISOString(), label: 'Suggested' },
      { id: 3, kind: 'shortage', message: 'Critical water shortage detected at Camp B (Coastal School). Deficit: 160L.', timestamp: new Date().toISOString(), label: 'Suggested' }
    ];
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
}

const globalForDB = global;
export const db = globalForDB._reliefos_db || new ServerDB();
if (process.env.NODE_ENV !== 'production') globalForDB._reliefos_db = db;
