import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { evaluateDarkZone } from '@/src/shared/darkZone';

export async function GET() {
  let activeDarkZones = 0;
  let highRiskAreas = 0;
  for (const a of db.areas) {
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

  for (const c of db.camps) {
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
  for (const v of db.volunteers) {
    volunteersByStatus[v.status] = (volunteersByStatus[v.status] || 0) + 1;
  }

  const dutiesByStatus = { assigned: 0, in_progress: 0, done: 0 };
  const deliveriesByStatus = { Pending: 0, 'In transit': 0, Delivered: 0 };

  for (const d of db.duties) {
    dutiesByStatus[d.status] = (dutiesByStatus[d.status] || 0) + 1;
    if (d.type === 'delivery') {
      if (d.status === 'assigned') deliveriesByStatus.Pending++;
      else if (d.status === 'in_progress') deliveriesByStatus['In transit']++;
      else if (d.status === 'done') deliveriesByStatus.Delivered++;
    }
  }

  const pendingVerifications = db.areas.filter(a => a.verification === 'team_sent').length;

  return NextResponse.json({
    data: {
      totalAreas: db.areas.length,
      activeDarkZones,
      highRiskAreas,
      criticalShortages,
      camps: db.camps.length,
      occupancy: {
        occupied: totalOccupied,
        capacity: totalCapacity,
        percentage: totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0
      },
      reports: db.reports.length,
      pendingVerifications,
      volunteersByStatus,
      dutiesByStatus,
      deliveriesByStatus,
      stockVsNeed,
      recentActivity: db.activityLog.slice(0, 10),
      dataAsOf: new Date().toLocaleTimeString()
    },
    meta: {}
  });
}
