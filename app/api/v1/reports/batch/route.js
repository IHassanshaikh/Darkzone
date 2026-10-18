import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';
import { haversineDistance } from '@/src/shared/allocation';

export async function POST(request) {
  const body = await request.json();
  const { gatewayId, reports: incomingReports = [] } = body;

  if (!Array.isArray(incomingReports)) {
    return NextResponse.json({ error: 'reports array is required' }, { status: 400 });
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

    const exists = db.reports.some(r => r.id === rep.id || r.clientId === rep.id);
    if (exists || db.syncLedger.has(rep.id)) {
      duplicates++;
      continue;
    }

    // Assign nearest area if lat/lng available
    let targetAreaId = 'area-c';
    if (rep.lat && rep.lng) {
      let minDist = Infinity;
      for (const a of db.areas) {
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

    db.reports.unshift(saved);
    db.syncLedger.add(rep.id);
    accepted++;

    const a = db.areas.find(ar => ar.id === targetAreaId);
    if (a) a.actualReports = (a.actualReports || 0) + 1;
  }

  db.logActivity('mesh_batch', `Batch mesh upload via ${gatewayId}: ${accepted} accepted, ${duplicates} duplicates, ${rejected} rejected.`);
  return NextResponse.json({ accepted, duplicates, rejected });
}
