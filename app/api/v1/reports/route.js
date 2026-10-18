import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function GET() {
  return NextResponse.json({ data: db.reports, meta: {} });
}

export async function POST(request) {
  const body = await request.json();
  const { text, areaId, source = 'web', clientId, extracted } = body;

  if (!text) {
    return NextResponse.json({ error: { code: 'MISSING_TEXT', message: 'Report text is required' } }, { status: 400 });
  }

  if (clientId && db.syncLedger.has(clientId)) {
    return NextResponse.json({ data: { message: 'Already processed', clientId }, meta: {} });
  }

  const newReport = {
    id: `rep-${Date.now()}`,
    text,
    areaId: areaId || 'area-c',
    source,
    label: 'Suggested',
    extracted: extracted || null,
    clientId: clientId || null,
    createdAt: new Date().toISOString()
  };

  db.reports.unshift(newReport);
  if (clientId) db.syncLedger.add(clientId);

  const matchedArea = db.areas.find(a => a.id === newReport.areaId);
  if (matchedArea) {
    matchedArea.actualReports = (matchedArea.actualReports || 0) + 1;
    matchedArea.lastReportAt = newReport.createdAt;
  }

  db.logActivity('report', `Emergency distress report logged for ${matchedArea ? matchedArea.name : 'Sector'} (${source}).`);
  return NextResponse.json({ data: newReport, meta: {} }, { status: 201 });
}
