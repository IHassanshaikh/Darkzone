import React, { createContext, useContext, useState, useEffect } from 'react';
import initialAreas from '../data/mock/areas.json';
import initialCamps from '../data/mock/camps.json';
import initialVolunteers from '../data/mock/volunteers.json';
import initialDuties from '../data/mock/duties.json';
import initialReports from '../data/mock/reports.json';
import { assessAreas } from '../lib/darkZone.js';
import { buildPriorityList } from '../lib/priority.js';
import { computeSuggestions } from '../lib/allocation.js';
import { enqueue, subscribeToQueue, getPendingCount } from '../lib/offlineQueue.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Roles: 'admin' (Rescue Coordinator / Admin) | 'volunteer' (Field Volunteer)
  const [role, setRole] = useState('admin');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isDemoData, setIsDemoData] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Entities
  const [areas, setAreas] = useState(() => assessAreas(initialAreas));
  const [camps, setCamps] = useState(initialCamps);
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [duties, setDuties] = useState(initialDuties);
  const [reports, setReports] = useState(initialReports);
  const [activityLog, setActivityLog] = useState([
    {
      id: 'act-01',
      action: 'sendFieldTeam',
      details: 'Dispatched Aisha Raza, Sana Mahmood to Area C (Dark Zone survey)',
      time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-02',
      action: 'updateDutyStatus',
      details: 'Duty d-01 status updated to in_progress',
      time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'act-03',
      action: 'approveTransfer',
      details: 'Approved transfer of 30 medicine from camp-a to camp-b',
      time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ]);

  const logActivity = (action, details) => {
    setActivityLog((prev) => [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action,
        details,
        time: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 50));
  };

  // Listen to network changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep pendingSyncCount in sync with the offline queue
  useEffect(() => {
    // Seed initial count
    getPendingCount().then(setPendingSyncCount);
    // Subscribe to future changes
    const unsub = subscribeToQueue(setPendingSyncCount);
    return unsub;
  }, []);

  // Computed state
  const priorityList = buildPriorityList(areas, camps);
  const allocationSuggestions = computeSuggestions(camps);

  const activeDarkZonesCount = areas.filter(a => a.assessment?.isDarkZone).length;
  const criticalShortagesCount = camps.reduce((acc, c) => {
    const shortages = Object.entries(c.need || {}).filter(([item, needVal]) => {
      const stockVal = (c.stock || {})[item] || 0;
      return (needVal - stockVal) > 0 && (needVal - stockVal) / needVal >= 0.7;
    });
    return acc + shortages.length;
  }, 0);
  const activeVolunteersCount = volunteers.filter(v => v.status === 'on_duty' || v.status === 'available').length;
  const inTransitDeliveriesCount = duties.filter(d => d.type === 'delivery' && d.status === 'in_progress').length;

  const toggleRole = () => {
    setRole(prev => prev === 'admin' ? 'volunteer' : 'admin');
  };

  const sendFieldTeam = (areaId, volunteerIds = [], note = '') => {
    const newDuties = volunteerIds.map((vId, idx) => ({
      id: `d-${Date.now()}-${idx + 1}`,
      volunteerId: vId,
      type: 'verification',
      fromCampId: null,
      toAreaOrCampId: areaId,
      item: null,
      quantity: null,
      status: 'assigned',
      note,
      createdAt: new Date().toISOString(),
    }));

    setDuties(prev => [...newDuties, ...prev]);

    setVolunteers(prev => prev.map(v => volunteerIds.includes(v.id) ? { ...v, status: 'on_duty' } : v));

    setAreas(prev => prev.map(a => {
      if (a.id === areaId) {
        return {
          ...a,
          verification: 'team_sent',
          verificationNote: note,
          assignedVolunteerIds: volunteerIds,
          verifiedAt: new Date().toISOString(),
        };
      }
      return a;
    }));

    logActivity('sendFieldTeam', `Dispatched ${volunteerIds.length} volunteer(s) to ${areaId}${note ? `: "${note}"` : ''}`);

    return newDuties;
  };

  const updateAreaVerification = (areaId, outcome, note) => {
    setAreas(prev => prev.map(a => {
      if (a.id === areaId) {
        return {
          ...a,
          verification: outcome,
          verificationNote: note,
          verifiedAt: new Date().toISOString(),
        };
      }
      return a;
    }));

    logActivity('verifyArea', `Area ${areaId} verification updated to ${outcome}${note ? `: "${note}"` : ''}`);
  };

  const updateDutyStatus = (dutyId, status) => {
    // Always apply optimistically to local state
    setDuties(prev => prev.map(d => {
      if (d.id === dutyId) {
        return { ...d, status, updatedAt: new Date().toISOString() };
      }
      return d;
    }));

    logActivity('updateDutyStatus', `Duty ${dutyId} status changed to ${status}`);

    // If offline, queue the update for later sync
    if (!isOnline) {
      enqueue('duty_status', { dutyId, status }).catch(() => {});
    }
  };

  const updateVolunteerStatus = (volunteerId, status) => {
    setVolunteers(prev => prev.map(v => {
      if (v.id === volunteerId) {
        return { ...v, status };
      }
      return v;
    }));
  };

  const addReport = (newReport) => {
    const reportObj = {
      ...newReport,
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString(),
      label: 'Suggested',
    };

    // Always apply optimistically to local state
    setReports(prev => [reportObj, ...prev]);

    // Increment actualReports for the area and re-assess
    if (newReport.areaId) {
      setAreas(prev => {
        const updated = prev.map(a => {
          if (a.id === newReport.areaId) {
            return {
              ...a,
              actualReports: (a.actualReports || 0) + 1,
              lastReportAt: new Date().toISOString(),
            };
          }
          return a;
        });
        return assessAreas(updated);
      });
    }

    // If offline, queue the report for later sync
    if (!isOnline) {
      enqueue('report', reportObj).catch(() => {});
    }
  };

  const approveAllocation = (suggestion, volunteerId = 'v-03') => {
    const newDuty = {
      id: `d-${Date.now()}`,
      volunteerId,
      type: 'delivery',
      fromCampId: suggestion.fromCampId,
      toAreaOrCampId: suggestion.toCampId,
      item: suggestion.item,
      quantity: suggestion.quantity,
      status: 'assigned',
      createdAt: new Date().toISOString(),
    };
    setDuties(prev => [newDuty, ...prev]);

    logActivity('approveTransfer', `Approved transfer of ${suggestion.quantity} ${suggestion.item} from ${suggestion.fromCampId} to ${suggestion.toCampId}`);

    return newDuty;
  };

  const value = {
    role,
    setRole,
    toggleRole,
    isOnline,
    setIsOnline,
    isDemoData,
    setIsDemoData,
    pendingSyncCount,
    setPendingSyncCount,
    areas,
    setAreas,
    camps,
    setCamps,
    volunteers,
    setVolunteers,
    duties,
    setDuties,
    reports,
    setReports,
    activityLog,
    priorityList,
    allocationSuggestions,
    summaryStats: {
      activeDarkZones: activeDarkZonesCount,
      criticalShortages: criticalShortagesCount,
      volunteersActive: activeVolunteersCount,
      deliveriesInTransit: inTransitDeliveriesCount,
    },
    updateAreaVerification,
    verifyArea: updateAreaVerification,
    sendFieldTeam,
    updateDutyStatus,
    updateVolunteerStatus,
    addReport,
    approveAllocation,
    approveTransfer: approveAllocation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
