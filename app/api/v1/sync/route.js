import { NextResponse } from 'next/server';
import { db } from '@/app/api/v1/_db';

export async function POST(request) {
  const body = await request.json();
  const { items = [] } = body;
  let processed = 0;

  for (const item of items) {
    if (item.clientId && db.syncLedger.has(item.clientId)) {
      continue;
    }

    if (item.type === 'duty_status') {
      const d = db.duties.find(duty => duty.id === item.payload.dutyId);
      if (d) {
        d.status = item.payload.status;
        d.updatedAt = item.timestamp || new Date().toISOString();
      }
      processed++;
    } else if (item.type === 'report') {
      db.reports.unshift(item.payload);
      processed++;
    }

    if (item.clientId) db.syncLedger.add(item.clientId);
  }

  return NextResponse.json({ ok: true, processedCount: processed });
}
